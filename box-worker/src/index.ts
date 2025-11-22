import { Elysia, t, NotFoundError } from 'elysia'
import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { productRoutes } from './product'
import { brandRoutes } from './brand'
import { PRODUCT_CATEGORIES } from './types'
import { env } from 'cloudflare:workers'

const app = new Elysia({
  aot: false,
  normalize: false,
})
  .use(cors())

  // Set up OpenAPI documentation
  .use(openapi({
    documentation: {
      // Set version manaully to this, see: https://github.com/hey-api/openapi-ts/issues/2459
      openapi: '3.1.0',
      info: {
        title: 'Product Box API',
        version: '1.0.0',
        description: 'API for managing a collection of products with ratings and reviews',
      },
      servers: [
        { url: 'http://localhost:8787', description: 'Local Development Server' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'password',
            description: 'Enter your API password',
          },
        },
      },
    },
  }))

  // Use product routes plugin
  .use(productRoutes)

  // Use brand routes plugin
  .use(brandRoutes)

  // GET /categories - List all valid product categories
  .get('/categories', () => {
    return {
      categories: [...PRODUCT_CATEGORIES],
      count: PRODUCT_CATEGORIES.length,
    }
  }, {
    response: {
      200: t.Object({
        categories: t.Array(t.String()),
        count: t.Number(),
      }),
    },
    detail: {
      description: 'List all valid product categories',
      tags: ['Categories'],
    },
  })

  // GET /images/* - Serve images from R2 bucket (supports nested paths)
  .get('/images/*', async ({ params }) => {
    // Get the full path after /images/
    const key = params['*']

    // Get object from R2
    const object = await env.BUCKET.get(key)

    if (!object) {
      throw new NotFoundError(`Image '${key}' not found`)
    }

    // Return the image with appropriate headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  }, {
    params: t.Object({
      '*': t.String(),
    }),
    detail: {
      description: 'Serve an image from R2 storage (supports nested paths like products/image.png)',
      tags: ['Images'],
    },
  })

export default app.compile()
