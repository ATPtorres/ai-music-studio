import { createAgentHandler } from './agent'
import { reserveQuota } from './lyrics'

type Environment = Record<string, string | undefined>
export function createDeployedAgent(env: Environment, fetcher: typeof fetch = fetch) {
  const handler = createAgentHandler({ env: { ...env, LLM_FALLBACK_MODEL: '' }, fetcher, attempts: 1, timeoutMs: 20_000 })
  return async (request: Request, context: { ip?: string }) => {
    const respond = (status: number, message: string, extra = {}) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store', ...extra } })
    try {
      const origins = [env.URL, env.DEPLOY_PRIME_URL].filter(Boolean).map(url => new URL(url!).origin)
      const origin = request.headers.get('origin')
      if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && !origins.includes(origin))) return respond(403, 'Esta solicitud debe realizarse desde el estudio.')
      if (!['GET', 'POST'].includes(request.method)) return respond(405, 'Usa GET o POST.', { Allow: 'GET, POST' })
      let quotaReady = false
      try { const redis = new URL(env.UPSTASH_REDIS_REST_URL ?? ''); quotaReady = redis.protocol === 'https:' && redis.hostname.endsWith('.upstash.io') && !!env.UPSTASH_REDIS_REST_TOKEN } catch { /* Missing configuration keeps remote AI disabled. */ }
      if (!quotaReady) {
        if (request.method === 'GET') return Response.json({ configured: false, model: '', endpoint: '', hint: 'La asistencia remota aún no está activada. Puedes seguir usando los generadores locales.' })
        return respond(503, 'La asistencia remota aún no está activada.')
      }
      if (request.method === 'POST') {
        if (!origin || !origins.includes(origin) || !context.ip) return respond(403, 'No se pudo validar el origen de la solicitud.')
        if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return respond(415, 'Envía una solicitud JSON.')
        await reserveQuota(context.ip, { env, fetcher, now: Date.now }, request.signal, 'agent')
      }
      return await handler(request)
    } catch (error) {
      const failure = error as { status?: number; retryAfter?: number }
      return respond(failure.status === 429 ? 429 : 503, failure.status === 429 ? 'Se alcanzó el límite de IA. Inténtalo más tarde.' : 'La asistencia no está disponible temporalmente.', failure.retryAfter ? { 'Retry-After': String(failure.retryAfter) } : {})
    }
  }
}
