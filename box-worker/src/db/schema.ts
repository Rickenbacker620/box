// Drizzle ORM schema for products and brands tables
// This replaces the raw SQL schema with type-safe TypeScript definitions

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { ulid } from 'ulid'

// Define the brands table schema
export const brands = sqliteTable(
  'brands',
  {
    // Primary key: ULID format
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    
    // Display name: "Frito-Lay", "Nongshim"
    name: text('name').notNull().unique(),
  },
  (table) => [
    // Index for name lookups
    index('idx_brands_name').on(table.name),
  ]
)

// Define the products table schema
export const products = sqliteTable(
  'products',
  {
    // Primary key: ULID format
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    
    // Display name: "Doritos Nacho Cheese"
    name: text('name').notNull(),
    
    // Foreign key to brands table (slug format)
    brandId: text('brand_id').notNull().references(() => brands.id),
    
    // Category: "Chips", "Instant Noodles", "Cookies", "Fragrance", etc.
    category: text('category').notNull(),
    
    // Rating: 1-5 scale (required)
    rating: integer('rating').notNull(),
    
    // Optional personal notes/thoughts
    comment: text('comment'),
    
    // Optional image URL for the product
    imageUrl: text('image_url'),
  },
  (table) => [
    // Indexes for query performance
    index('idx_products_brand_id').on(table.brandId),
    index('idx_products_category').on(table.category),
  ]
)

// Type inference for insert operations
export type InsertBrand = typeof brands.$inferInsert
export type SelectBrand = typeof brands.$inferSelect

export type InsertProduct = typeof products.$inferInsert
export type SelectProduct = typeof products.$inferSelect