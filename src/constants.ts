// Shared constants for the application

export const PRODUCT_CATEGORIES = [
  "food",
  "snack",
  "ice-cream",
  "drink",
  "fragrance",
  "perfume",
  "personal-care",
  "shampoo",
  "body-wash",
  "beauty",
  "household",
  "electronics",
  "instant",
  "yogurt",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
