// Shared types and constants for the application

// Product categories as a const array for type safety
export const PRODUCT_CATEGORIES = [
  'food',
  'snack',
  'ice-cream',
  'drink',
  'fragrance',
  'personal-care',
  'beauty',
  'household',
  'electronics',
  'other',
] as const

// TypeScript type derived from the array
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]

// Helper function to check if a string is a valid category
export function isValidCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory)
}
