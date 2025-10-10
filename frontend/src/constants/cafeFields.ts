/**
 * Cafe field configuration constants
 * 
 * Defines which fields are optional and how they should be labeled
 * in admin UI components like the missing fields indicator.
 */

export interface OptionalCafeField {
  key: string
  label: string
}

/**
 * Optional cafe fields that are checked for completeness
 * 
 * Note: 'source' field is excluded from completeness checks
 * as specified in the requirements
 */
export const OPTIONAL_CAFE_FIELDS: OptionalCafeField[] = [
  { key: 'address', label: 'Address' },
  { key: 'review', label: 'Review' },
  { key: 'hours', label: 'Hours' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'instagramPostLink', label: 'Instagram Post' },
  { key: 'tiktokPostLink', label: 'TikTok Post' },
  { key: 'images', label: 'Images' },
  { key: 'ambianceScore', label: 'Ambiance Score' },
  { key: 'chargeForAltMilk', label: 'Alt Milk Pricing' },
] as const