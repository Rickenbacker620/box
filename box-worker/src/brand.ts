import { Elysia, t } from 'elysia'
import { getDb, brands } from './db'
import { env } from 'cloudflare:workers'

// Elysia TypeBox schemas for validation
const brandSchema = t.Object({
  id: t.String(),
  name: t.String(),
})

const brandListResponseSchema = t.Object({
  brands: t.Array(brandSchema),
})

// Brand routes plugin
export const brandRoutes = new Elysia({ prefix: '/brands' })
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
      200: brandListResponseSchema,
    },
    detail: {
      description: 'List all brands ordered by name',
      tags: ['Brands'],
    },
  })
