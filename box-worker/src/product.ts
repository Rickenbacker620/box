import { Elysia, t, NotFoundError, InternalServerError, status } from 'elysia'
import { eq, and, gte } from 'drizzle-orm'
import { getDb, products, brands } from './db'
import { env } from 'cloudflare:workers'
import { ulid } from 'ulid'
import { PRODUCT_CATEGORIES, type ProductCategory } from './types'

// Helper function to upload base64 image to R2 bucket
async function uploadBase64ImageToR2(
  bucket: R2Bucket,
  base64Data: string,
  productId: string
): Promise<string> {
  // Extract content type and base64 data from data URL
  // Format: data:image/png;base64,iVBORw0KGgo...
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 image format')
  }
  
  const extension = matches[1] // png, jpeg, jpg, webp, gif
  const base64Content = matches[2]
  
  // Generate unique filename
  const filename = `products/${productId}-${Date.now()}.${extension}`
  
  // Decode base64 to binary
  const binaryString = atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Upload to R2
  await bucket.put(filename, bytes, {
    httpMetadata: {
      contentType: `image/${extension}`,
    },
  })
  
  return filename
}

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

const createProductSchema = t.Object({
  name: t.String({
    minLength: 1,
    error: 'Product name is required and cannot be empty'
  }),
  brand: t.String({
    minLength: 1,
    error: 'Brand name is required and cannot be empty'
  }),
  category: t.Union(
    PRODUCT_CATEGORIES.map(cat => t.Literal(cat)),
    {
      error: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`
    }
  ),
  rating: t.Number({
    minimum: 1,
    maximum: 5,
    error: 'Rating must be between 1 and 5'
  }),
  comment: t.Optional(t.String()),
  imageBase64: t.Optional(t.String({
    description: 'Base64-encoded image data URL (e.g., data:image/png;base64,...)'
  })),
})

const updateProductSchema = t.Object({
  name: t.Optional(t.String({
    minLength: 1,
    error: 'Product name cannot be empty'
  })),
  brand: t.Optional(t.String({
    minLength: 1,
    error: 'Brand name cannot be empty'
  })),
  category: t.Optional(t.Union(
    PRODUCT_CATEGORIES.map(cat => t.Literal(cat)),
    {
      error: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`
    }
  )),
  rating: t.Optional(t.Number({
    minimum: 1,
    maximum: 5,
    error: 'Rating must be between 1 and 5'
  })),
  comment: t.Optional(t.String()),
  imageBase64: t.Optional(t.String({
    description: 'Base64-encoded image data URL (e.g., data:image/png;base64,...)'
  })),
})

const queryParamsSchema = t.Object({
  brand: t.Optional(t.String()),
  category: t.Optional(t.String()),
  minRating: t.Optional(t.String()),
})

const productIdParamSchema = t.Object({
  id: t.String({
    minLength: 1,
    error: 'Product ID is required'
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

// Authentication plugin - validates Bearer token
// Using 'scoped' to apply to parent, current instance and descendants
const auth = new Elysia({ name: 'auth' })
  .onBeforeHandle({ as: 'scoped' }, ({ request }) => {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const expectedPassword = 'supersecret'

    if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
      return status(401, 'Invalid or missing authentication token')
    }
  })

// Product routes plugin with authentication
export const productRoutes = new Elysia({ prefix: '/products' })
  .use(auth)
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
          brand: r.brand!
        })),
      }
    }, {
      query: queryParamsSchema,
      response: {
        200: productListResponseSchema
      },
      detail: {
        description: 'List all products with optional filtering by brand, category, or minimum rating',
        tags: ['Products'],
        security: [{ bearerAuth: [] }]
      }
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
        brand: result.brand!
      }
    }, {
      params: productIdParamSchema,
      response: {
        200: productSchema,
        404: errorResponseSchema
      },
      detail: {
        description: 'Get a specific product by its ID (slug format)',
        tags: ['Products'],
      }
    })

    // POST /products - Create a new product with optional base64 image
    .post('/', async ({ body }) => {
      const db = getDb(env.DB)

      // Generate ULID for new product
      const id = ulid()

      try {
        // Get brand ID - brand must exist
        const brandId = await getBrandIdByName(db, body.brand)
        if (!brandId) {
          return status(400, { error: `Brand '${body.brand}' not found. Please create the brand first.` })
        }

        // Handle image upload if provided
        let imageUrl: string | null = null
        if (body.imageBase64) {
          imageUrl = await uploadBase64ImageToR2(env.BUCKET, body.imageBase64, id)
        }

        // Insert new product
        await db.insert(products).values({
          id,
          name: body.name,
          brandId,
          category: body.category,
          rating: body.rating,
          comment: body.comment ?? null,
          imageUrl,
        })

        // Return the created item with brand name
        const created = await db
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

        return {
          ...created!,
          brand: created!.brand!
        }
      } catch (err) {
        console.error('Failed to create product:', err)
        throw new InternalServerError('Failed to create product')
      }
    }, {
      body: createProductSchema,
      response: {
        201: productSchema,
        400: errorResponseSchema,
        409: t.Object({
          error: t.String(),
          existingId: t.Optional(t.String())
        })
      },
      detail: {
        description: 'Create a new product with name, brand, category, rating, and optional comment/image. Send image as base64 data URL in imageBase64 field. The ID is automatically generated as a ULID.',
        tags: ['Products'],
      }
    })

    // PUT /products/:id - Update an existing product with optional base64 image
    .put('/:id', async ({ params, body }) => {
      const { id } = params
      const db = getDb(env.DB)

      // Check if product exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .get()

      if (!existing) {
        throw new NotFoundError(`Product '${id}' not found`)
      }

      // Build update object with only provided fields
      const updateData: Partial<typeof products.$inferInsert> = {}

      if (body.name !== undefined) updateData.name = body.name
      if (body.brand !== undefined) {
        // Get brand ID - brand must exist
        const brandId = await getBrandIdByName(db, body.brand)
        if (!brandId) {
          return status(400, { error: `Brand '${body.brand}' not found. Please create the brand first.` })
        }
        updateData.brandId = brandId
      }
      if (body.category !== undefined) updateData.category = body.category
      if (body.rating !== undefined) updateData.rating = body.rating
      if (body.comment !== undefined) updateData.comment = body.comment
      
      // Handle image upload if provided
      if (body.imageBase64) {
        const imageUrl = await uploadBase64ImageToR2(env.BUCKET, body.imageBase64, id)
        updateData.imageUrl = imageUrl
      }

      if (Object.keys(updateData).length === 0) {
        return status(400, { error: 'No fields to update' })
      }

      try {
        // Execute update
        await db
          .update(products)
          .set(updateData)
          .where(eq(products.id, id))

        // Return updated item with brand name
        const updated = await db
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

        return {
          ...updated!,
          brand: updated!.brand!
        }
      } catch (err) {
        console.error('Failed to update product:', err)
        throw new InternalServerError('Failed to update product')
      }
    }, {
      params: productIdParamSchema,
      body: updateProductSchema,
      response: {
        200: productSchema,
        400: errorResponseSchema,
        404: errorResponseSchema
      },
      detail: {
        description: 'Update an existing product by ID with partial data. Send image as base64 data URL in imageBase64 field.',
        tags: ['Products'],
      }
    })

    // DELETE /products/:id - Delete a product
    .delete('/:id', async ({ params }) => {
      const { id } = params
      const db = getDb(env.DB)

      // Check if product exists and get brand name
      const existing = await db
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

      if (!existing) {
        throw new NotFoundError(`Product '${id}' not found`)
      }

      try {
        // Delete the image from R2 if it exists
        if (existing.imageUrl) {
          await env.BUCKET.delete(existing.imageUrl)
        }

        // Delete the item from database
        await db
          .delete(products)
          .where(eq(products.id, id))

        return {
          message: 'Product deleted',
          deleted: {
            ...existing,
            brand: existing.brand!
          }
        }
      } catch (err) {
        throw new InternalServerError('Failed to delete product')
      }
    }, {
      params: productIdParamSchema,
      response: {
        200: t.Object({
          message: t.String(),
          deleted: productSchema,
        }),
        404: errorResponseSchema
      },
      detail: {
        description: 'Delete a product by its ID',
        tags: ['Products'],
      }
    })