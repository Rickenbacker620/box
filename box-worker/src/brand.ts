import { Elysia, t, NotFoundError, InternalServerError, status } from 'elysia'
import { eq } from 'drizzle-orm'
import { getDb, brands, products } from './db'
import { env } from 'cloudflare:workers'
import slugify from 'slugify'

// Elysia TypeBox schemas for validation
const brandSchema = t.Object({
  id: t.String(),
  name: t.String(),
})

const createBrandSchema = t.Object({
  name: t.String({
    minLength: 1,
    error: 'Brand name is required and cannot be empty'
  }),
})

const brandIdParamSchema = t.Object({
  id: t.String({
    minLength: 1,
    error: 'Brand ID is required'
  }),
})

const brandListResponseSchema = t.Object({
  brands: t.Array(brandSchema),
})

const errorResponseSchema = t.Object({
  error: t.String(),
})

// Helper function to convert name to slug format using slugify library
function nameToSlug(name: string): string {
  return slugify(name, {
    lower: true,      // Convert to lowercase
    strict: true,     // Remove special characters
    trim: true        // Trim whitespace
  })
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

// Brand routes plugin with authentication
export const brandRoutes = new Elysia({ prefix: '/brands' })
  .use(auth)
    // GET /brands - List all brands
    .get('/', async () => {
      const db = getDb(env.DB)

      // Execute query to get all brands
      const results = await db
        .select({
          id: brands.id,
          name: brands.name,
        })
        .from(brands)
        .orderBy(brands.name)
        .all()

      return {
        brands: results,
      }
    }, {
      response: {
        200: brandListResponseSchema
      },
      detail: {
        description: 'List all brands ordered by name',
        tags: ['Brands'],
        security: [{ bearerAuth: [] }]
      }
    })

    // POST /brands - Create a new brand
    .post('/', async ({ body }) => {
      const db = getDb(env.DB)

      // Generate ID from brand name
      const id = nameToSlug(body.name)

      // Check if ID already exists
      const existing = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.id, id))
        .get()

      if (existing) {
        return status(409, `Brand with ID '${id}' already exists`)
      }

      try {
        // Insert new brand
        await db.insert(brands).values({
          id,
          name: body.name,
        })

        // Return the created brand
        const created = await db
          .select({
            id: brands.id,
            name: brands.name,
          })
          .from(brands)
          .where(eq(brands.id, id))
          .get()

        return created!
      } catch (err) {
        throw new InternalServerError('Failed to create brand')
      }
    }, {
      body: createBrandSchema,
      response: {
        201: brandSchema,
        400: errorResponseSchema,
        409: t.Object({
          error: t.String(),
          existingId: t.Optional(t.String())
        })
      },
      detail: {
        description: 'Create a new brand with a name. The ID is automatically generated from the brand name.',
        tags: ['Brands'],
      }
    })

    // DELETE /brands/:id - Delete a brand
    .delete('/:id', async ({ params }) => {
      const { id } = params
      const db = getDb(env.DB)

      // Check if brand exists
      const existing = await db
        .select({
          id: brands.id,
          name: brands.name,
        })
        .from(brands)
        .where(eq(brands.id, id))
        .get()

      if (!existing) {
        throw new NotFoundError(`Brand '${id}' not found`)
      }

      // Check if brand has associated products
      const associatedProducts = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.brandId, id))
        .all()

      if (associatedProducts.length > 0) {
        return status(409, {
          error: `Cannot delete brand '${id}' because it has ${associatedProducts.length} associated product(s)`,
          productCount: associatedProducts.length
        })
      }

      try {
        // Delete the brand
        await db
          .delete(brands)
          .where(eq(brands.id, id))

        return {
          message: 'Brand deleted',
          deleted: existing
        }
      } catch (err) {
        throw new InternalServerError('Failed to delete brand')
      }
    }, {
      params: brandIdParamSchema,
      response: {
        200: t.Object({
          message: t.String(),
          deleted: brandSchema,
        }),
        404: errorResponseSchema,
        409: t.Object({
          error: t.String(),
          productCount: t.Optional(t.Number())
        })
      },
      detail: {
        description: 'Delete a brand by its ID. Cannot delete brands with associated products.',
        tags: ['Brands'],
      }
    })