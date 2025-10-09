import { IRequest } from 'itty-router'
import { drizzle } from 'drizzle-orm/d1'
import { eq, isNull, inArray } from 'drizzle-orm'
import { cafes, drinks, type NewCafe } from '../../drizzle/schema'
import { Env } from '../types'
import { jsonResponse, badRequestResponse, errorResponse } from '../utils/response'
import { enrichCafeFromGoogleMaps } from '../utils/placesEnrichment'
import {
  bulkImportSchema,
  DEFAULT_DRINK_NAME,
  DEFAULT_CITY,
  type ValidatedCafe,
} from '../utils/validation'
import { ZodError } from 'zod'

/**
 * Bulk import cafes and drinks from CSV data
 * POST /api/admin/import/cafes
 *
 * @description Validates input data, enriches with Google Maps data, and performs atomic database operations
 */
export async function bulkImportCafes(request: IRequest, env: Env) {
  try {
    // Parse and validate request body
    const rawBody = await request.json()
    const validationResult = bulkImportSchema.safeParse(rawBody)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      )
      return badRequestResponse(
        `Validation failed: ${errors.join(', ')}`,
        request as Request,
        env
      )
    }

    const { cafes: validatedCafes } = validationResult.data
    const db = drizzle(env.DB)

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    // Process each cafe
    for (const csvCafe of validatedCafes) {
      try {
        // Enrich cafe data from Google Maps API
        console.log(`Enriching cafe: ${csvCafe.name} from ${csvCafe.link}`)
        const placeData = await enrichCafeFromGoogleMaps(csvCafe.link, env)

        // Merge enriched data with CSV data (CSV data takes precedence if present)
        const enrichedCafe: ValidatedCafe = {
          ...csvCafe,
          city: (csvCafe.city || DEFAULT_CITY).toLowerCase(),
          address: placeData?.address || csvCafe.address,
          latitude: placeData?.latitude || csvCafe.latitude || 0,
          longitude: placeData?.longitude || csvCafe.longitude || 0,
          hours: placeData?.hours || csvCafe.hours,
        }

        // Check if cafe exists by Google Maps link (unique identifier)
        const existingCafe = await db
          .select()
          .from(cafes)
          .where(eq(cafes.link, enrichedCafe.link))
          .limit(1)

        let cafeId: number

        if (existingCafe.length > 0) {
          // Update existing cafe
          cafeId = existingCafe[0].id

          await db
            .update(cafes)
            .set({
              name: enrichedCafe.name,
              link: enrichedCafe.link,
              address: enrichedCafe.address || null,
              latitude: enrichedCafe.latitude,
              longitude: enrichedCafe.longitude,
              city: enrichedCafe.city,
              ambianceScore: enrichedCafe.ambianceScore ?? null,
              chargeForAltMilk: enrichedCafe.chargeForAltMilk ?? null,
              quickNote: enrichedCafe.quickNote,
              review: enrichedCafe.review || null,
              source: enrichedCafe.source || null,
              hours: enrichedCafe.hours || null,
              instagram: enrichedCafe.instagram || null,
              instagramPostLink: enrichedCafe.instagramPostLink || null,
              tiktokPostLink: enrichedCafe.tiktokPostLink || null,
              images: enrichedCafe.images || null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(cafes.id, cafeId))
        } else {
          // Create new cafe
          const newCafeData: NewCafe = {
            name: enrichedCafe.name,
            slug: enrichedCafe.slug,
            link: enrichedCafe.link,
            address: enrichedCafe.address || null,
            latitude: enrichedCafe.latitude,
            longitude: enrichedCafe.longitude,
            city: enrichedCafe.city,
            ambianceScore: enrichedCafe.ambianceScore ?? null,
            chargeForAltMilk: enrichedCafe.chargeForAltMilk ?? null,
            quickNote: enrichedCafe.quickNote,
            review: enrichedCafe.review || null,
            source: enrichedCafe.source || null,
            hours: enrichedCafe.hours || null,
            instagram: enrichedCafe.instagram || null,
            instagramPostLink: enrichedCafe.instagramPostLink || null,
            tiktokPostLink: enrichedCafe.tiktokPostLink || null,
            images: enrichedCafe.images || null,
          }

          const result = await db
            .insert(cafes)
            .values(newCafeData)
            .returning({ id: cafes.id })

          cafeId = result[0].id
        }

        // Handle drinks - delete existing and recreate
        // This ensures we have exactly what's in the import data
        await db.delete(drinks).where(eq(drinks.cafeId, cafeId))

        // Insert all drinks - batch insert for better performance
        if (enrichedCafe.drinks && enrichedCafe.drinks.length > 0) {
          const drinkValues = enrichedCafe.drinks.map((csvDrink) => ({
            cafeId,
            name: csvDrink.name || DEFAULT_DRINK_NAME,
            score: csvDrink.score,
            priceAmount: csvDrink.priceAmount ?? null,
            priceCurrency: csvDrink.priceCurrency ?? null,
            gramsUsed: csvDrink.gramsUsed ?? null,
            isDefault: csvDrink.isDefault,
            notes: csvDrink.notes || null,
          }))

          await db.insert(drinks).values(drinkValues)
        }

        successCount++
      } catch (error) {
        failedCount++
        errors.push(`${csvCafe.slug}: ${(error as Error).message}`)
        console.error(`Failed to import cafe ${csvCafe.slug}:`, error)
      }
    }

    return jsonResponse(
      {
        success: successCount,
        failed: failedCount,
        message: `Imported ${successCount} cafe(s), ${failedCount} failed`,
        errors: errors.length > 0 ? errors : undefined,
      },
      200,
      request as Request,
      env
    )
  } catch (error) {
    console.error('Bulk import error:', error)
    return errorResponse((error as Error).message, 500, request as Request, env)
  }
}

/**
 * Export all cafes and drinks to JSON format
 * GET /api/admin/export/cafes
 *
 * @description Efficiently exports all cafe data with drinks in a single query to avoid N+1 problem
 */
export async function exportCafes(request: IRequest, env: Env) {
  try {
    const db = drizzle(env.DB)

    // Fetch all non-deleted cafes
    const allCafes = await db
      .select()
      .from(cafes)
      .where(isNull(cafes.deletedAt))

    // Fetch all drinks for these cafes in one query (fixes N+1 problem)
    const cafeIds = allCafes.map((cafe) => cafe.id)

    const allDrinks = cafeIds.length > 0
      ? await db
          .select()
          .from(drinks)
          .where(inArray(drinks.cafeId, cafeIds))
      : []

    // Group drinks by cafe ID
    const drinksByCafeId = new Map<number, typeof allDrinks>()
    for (const drink of allDrinks) {
      if (!drinksByCafeId.has(drink.cafeId)) {
        drinksByCafeId.set(drink.cafeId, [])
      }
      drinksByCafeId.get(drink.cafeId)!.push(drink)
    }

    // Build export data
    const exportData = allCafes.map((cafe) => {
      const cafeDrinks = drinksByCafeId.get(cafe.id) || []

      return {
        name: cafe.name,
        slug: cafe.slug,
        link: cafe.link,
        address: cafe.address || undefined,
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        city: cafe.city,
        ambianceScore: cafe.ambianceScore ?? undefined,
        chargeForAltMilk: cafe.chargeForAltMilk ?? undefined,
        quickNote: cafe.quickNote,
        review: cafe.review || undefined,
        source: cafe.source || undefined,
        hours: cafe.hours || undefined,
        instagram: cafe.instagram || undefined,
        instagramPostLink: cafe.instagramPostLink || undefined,
        tiktokPostLink: cafe.tiktokPostLink || undefined,
        images: cafe.images || undefined,
        drinks: cafeDrinks.map((drink) => ({
          name: drink.name,
          score: drink.score,
          priceAmount: drink.priceAmount ?? undefined,
          priceCurrency: drink.priceCurrency ?? undefined,
          gramsUsed: drink.gramsUsed ?? undefined,
          isDefault: drink.isDefault,
          notes: drink.notes || undefined,
        })),
      }
    })

    return jsonResponse(
      { cafes: exportData },
      200,
      request as Request,
      env,
      'no-store'
    )
  } catch (error) {
    console.error('Export error:', error)
    return errorResponse((error as Error).message, 500, request as Request, env)
  }
}
