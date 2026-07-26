// Shared constants for the application

export const PRODUCT_CATEGORIES = [
  "food",
  "snack",
  "ice-cream",
  "drink",
  "fragrance",
  "personal-care",
  "beauty",
  "household",
  "electronics",
  "instant",
  "yogurt",
  "other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
