import { cafes } from '../db';

/**
 * Standardized cafe selection object for consistent field selection across routes.
 * This ensures all cafe queries select the same fields and reduces duplication.
 * Note: Excludes 'id' field to avoid conflicts when joining with other tables.
 */
export const cafeSelection = {
  name: cafes.name,
  slug: cafes.slug,
  city: cafes.city,
  latitude: cafes.latitude,
  longitude: cafes.longitude,
  ambianceScore: cafes.ambianceScore,
  quickNote: cafes.quickNote,
  instagram: cafes.instagram,
  images: cafes.images,
  link: cafes.link,
  address: cafes.address,
  userRatingAvg: cafes.userRatingAvg,
  userRatingCount: cafes.userRatingCount,
} as const;

/**
 * Type representing the selected cafe fields from cafeSelection.
 * Use this type for type safety when working with selected cafe data.
 */
export type CafeSelection = typeof cafeSelection;

/**
 * Helper function to transform raw cafe selection result into a properly typed cafe object.
 * This ensures consistent transformation across the application.
 * @param row - The row containing cafe fields from cafeSelection
 * @param cafeId - The cafe ID (from the main table, e.g., userListItems.cafeId)
 */
export function transformCafeSelection(row: Record<string, any>, cafeId: number): CafeSelection & { id: number } {
  return {
    id: cafeId,
    name: row.name,
    slug: row.slug,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    ambianceScore: row.ambianceScore,
    quickNote: row.quickNote,
    instagram: row.instagram,
    images: row.images,
    link: row.link,
    address: row.address,
    userRatingAvg: row.userRatingAvg,
    userRatingCount: row.userRatingCount,
  };
}
