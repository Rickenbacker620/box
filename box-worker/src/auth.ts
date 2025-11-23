import { Elysia, status } from 'elysia'
import { env } from 'cloudflare:workers'

// Authentication plugin - validates Bearer token
// Using 'scoped' to apply to parent, current instance and descendants
export const auth = new Elysia({ name: 'auth' })
  .onBeforeHandle({ as: 'scoped' }, ({ request }) => {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const expectedPassword = env.AUTH_TOKEN

    if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
      return status(401, 'Invalid or missing authentication token')
    }
  })
