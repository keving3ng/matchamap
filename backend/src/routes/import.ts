import { IRequest } from 'itty-router'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { cafes, drinks } from '../../drizzle/schema'
import { Env } from '../types'
import { jsonResponse, badRequestResponse, errorResponse } from '../utils/response'

interface CsvCafe {
  name: string
  slug: string
  link: string
  address?: string
  latitude: number
  longitude: number
  city: string
  ambianceScore?: number
  chargeForAltMilk?: number
  quickNote: string
  review?: string
  source?: string
  hours?: string
  instagram?: string
  instagramPostLink?: string
  tiktokPostLink?: string
  images?: string
  drinks: CsvDrink[]
}

interface CsvDrink {
  name: string
  score: number
  priceAmount: number
  priceCurrency: string
  gramsUsed?: number
  isDefault: boolean
  notes?: string
}

/**
 * Bulk import cafes and drinks from CSV data
 * POST /api/admin/import/cafes
 */
export async function bulkImportCafes(request: IRequest, env: Env) {
  try {
    const body = await request.json() as { cafes: CsvCafe[] }

    if (!body.cafes || !Array.isArray(body.cafes)) {
      return badRequestResponse('Invalid request: cafes array required', request as Request, env)
    }

    const db = drizzle(env.DB)

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    // Process each cafe
    for (const csvCafe of body.cafes) {
      try {
        // Check if cafe exists by slug
        const existingCafe = await db
          .select()
          .from(cafes)
          .where(eq(cafes.slug, csvCafe.slug))
          .limit(1)

        let cafeId: number

        if (existingCafe.length > 0) {
          // Update existing cafe
          cafeId = existingCafe[0].id

          await db
            .update(cafes)
            .set({
              name: csvCafe.name,
              link: csvCafe.link,
              address: csvCafe.address || null,
              latitude: csvCafe.latitude,
              longitude: csvCafe.longitude,
              city: csvCafe.city,
              ambianceScore: csvCafe.ambianceScore ?? null,
              chargeForAltMilk: csvCafe.chargeForAltMilk ?? null,
              quickNote: csvCafe.quickNote,
              review: csvCafe.review || null,
              source: csvCafe.source || null,
              hours: csvCafe.hours || null,
              instagram: csvCafe.instagram || null,
              instagramPostLink: csvCafe.instagramPostLink || null,
              tiktokPostLink: csvCafe.tiktokPostLink || null,
              images: csvCafe.images || null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(cafes.id, cafeId))
        } else {
          // Create new cafe
          const result = await db
            .insert(cafes)
            .values({
              name: csvCafe.name,
              slug: csvCafe.slug,
              link: csvCafe.link,
              address: csvCafe.address || null,
              latitude: csvCafe.latitude,
              longitude: csvCafe.longitude,
              city: csvCafe.city,
              ambianceScore: csvCafe.ambianceScore ?? null,
              chargeForAltMilk: csvCafe.chargeForAltMilk ?? null,
              quickNote: csvCafe.quickNote,
              review: csvCafe.review || null,
              source: csvCafe.source || null,
              hours: csvCafe.hours || null,
              instagram: csvCafe.instagram || null,
              instagramPostLink: csvCafe.instagramPostLink || null,
              tiktokPostLink: csvCafe.tiktokPostLink || null,
              images: csvCafe.images || null,
            })
            .returning({ id: cafes.id })

          cafeId = result[0].id
        }

        // Handle drinks - delete existing and recreate
        // This ensures we have exactly what's in the CSV
        await db.delete(drinks).where(eq(drinks.cafeId, cafeId))

        // Insert all drinks from CSV
        if (csvCafe.drinks && csvCafe.drinks.length > 0) {
          for (const csvDrink of csvCafe.drinks) {
            await db.insert(drinks).values({
              cafeId,
              name: csvDrink.name,
              score: csvDrink.score,
              priceAmount: csvDrink.priceAmount,
              priceCurrency: csvDrink.priceCurrency,
              gramsUsed: csvDrink.gramsUsed ?? null,
              isDefault: csvDrink.isDefault,
              notes: csvDrink.notes || null,
            })
          }
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
