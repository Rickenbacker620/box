import { Elysia, t, NotFoundError } from 'elysia'
import { eq, and, gte } from 'drizzle-orm'
import { getDb, products, brands } from './db'
import { env } from 'cloudflare:workers'

// Elysia TypeBox schemas for validation
const productSchema = t.Object({
  id: t.String(),
  name: t.String(),
  brand: t.String(),
  category: t.String(),
  rating: t.Number(),
  comment: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
})

const queryParamsSchema = t.Object({
  brand: t.Optional(t.String()),
  category: t.Optional(t.String()),
  minRating: t.Optional(t.String()),
})

const productIdParamSchema = t.Object({
  id: t.String({
    minLength: 1,
    error: 'Product ID is required',
  }),
})

const productListResponseSchema = t.Object({
  products: t.Array(productSchema),
})

const errorResponseSchema = t.Object({
  error: t.String(),
})

// Helper function to get brand ID by name
async function getBrandIdByName(db: ReturnType<typeof getDb>, brandName: string): Promise<string | null> {
  // Check if brand exists by name
  const existing = await db
    .select()
    .from(brands)
    .where(eq(brands.name, brandName))
    .get()

  return existing?.id || null
}

// Product routes plugin
export const productRoutes = new Elysia({ prefix: '/products' })
// GET /products - List all products with optional filtering
  .get('/', async ({ query }) => {
    const { brand, category, minRating } = query
    const db = getDb(env.DB)

    // Build filter conditions
    const conditions = []
    if (brand) {
      // Look up brand by name
      const brandId = await getBrandIdByName(db, brand)
      if (brandId) {
        conditions.push(eq(products.brandId, brandId))
      }
    }
    if (category) {
      conditions.push(eq(products.category, category))
    }
    if (minRating) {
      conditions.push(gte(products.rating, parseInt(minRating)))
    }

    // Execute query with filters and join with brands
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        brand: brands.name,
        category: products.category,
        rating: products.rating,
        comment: products.comment,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(products.name)
      .all()

    return {
      products: results.map(r => ({
        ...r,
        brand: r.brand!,
      })),
    }
  }, {
    query: queryParamsSchema,
    response: {
      200: productListResponseSchema,
    },
    detail: {
      description: 'List all products with optional filtering by brand, category, or minimum rating',
      tags: ['Products'],
    },
  })

// GET /products/:id - Get a specific product by ID (slug)
  .get('/:id', async ({ params }) => {
    const { id } = params
    const db = getDb(env.DB)

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        brand: brands.name,
        category: products.category,
        rating: products.rating,
        comment: products.comment,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .where(eq(products.id, id))
      .get()

    if (!result) {
      throw new NotFoundError(`Product '${id}' not found`)
    }

    return {
      ...result,
      brand: result.brand!,
    }
  }, {
    params: productIdParamSchema,
    response: {
      200: productSchema,
      404: errorResponseSchema,
    },
    detail: {
      description: 'Get a specific product by its ID (slug format)',
      tags: ['Products'],
    },
  })
