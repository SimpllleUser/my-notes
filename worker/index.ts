import type { Env } from './env'
import { handleMcp } from './mcp'

const encoder = new TextEncoder()

/** Порівняння сталого часу через дайджести (довжина токена не витікає). */
async function tokenMatches(received: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(received)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  return crypto.subtle.timingSafeEqual(a, b)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname !== '/mcp') return env.ASSETS.fetch(request)

    if (!env.MCP_TOKEN) return new Response('MCP_TOKEN is not configured', { status: 503 })
    const bearer = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1] ?? ''
    if (!(await tokenMatches(bearer, env.MCP_TOKEN))) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer realm="my-notes"' },
      })
    }

    return handleMcp(request, env)
  },
} satisfies ExportedHandler<Env>
