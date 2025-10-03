import { IRequest } from 'itty-router'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { cafes, drinks } from '../../drizzle/schema'
import { Env } from '../types'
import { jsonResponse, badRequestResponse, errorResponse } from '../utils/response'
import { enrichCafeFromGoogleMaps } from '../utils/placesEnrichment'

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
  name?: string | null // Optional - defaults to "Iced Matcha Latte"
  score: number // Required
  priceAmount?: number | null // Optional
  priceCurrency?: string | null // Optional
  gramsUsed?: number | null
  isDefault: boolean
  notes?: string | null
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
        // Enrich cafe data from Google Maps API
        console.log(`Enriching cafe: ${csvCafe.name} from ${csvCafe.link}`);
        const placeData = await enrichCafeFromGoogleMaps(csvCafe.link, env);

        // Merge enriched data with CSV data (CSV data takes precedence if present)
        const enrichedCafe = {
          ...csvCafe,
          city: (csvCafe.city || 'toronto').toLowerCase(), // Normalize to lowercase
          address: placeData?.address || csvCafe.address,
          latitude: placeData?.latitude || csvCafe.latitude || 0,
          longitude: placeData?.longitude || csvCafe.longitude || 0,
          hours: placeData?.hours || csvCafe.hours,
        };

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
          const result = await db
            .insert(cafes)
            .values({
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
            })
            .returning({ id: cafes.id })

          cafeId = result[0].id
        }

        // Handle drinks - delete existing and recreate
        // This ensures we have exactly what's in the CSV
        await db.delete(drinks).where(eq(drinks.cafeId, cafeId))

        // Insert all drinks from CSV
        if (enrichedCafe.drinks && enrichedCafe.drinks.length > 0) {
          for (const csvDrink of enrichedCafe.drinks) {
            await db.insert(drinks).values({
              cafeId,
              name: csvDrink.name || 'Iced Matcha Latte', // Default if not provided
              score: csvDrink.score,
              priceAmount: csvDrink.priceAmount ?? null,
              priceCurrency: csvDrink.priceCurrency ?? null,
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
