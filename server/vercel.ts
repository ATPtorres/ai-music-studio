import { env } from 'node:process'

type Environment = Record<string, string | undefined>
export interface VercelInvocation { env: Environment; context: { ip?: string } }

/**
 * Traduce una invocación de Vercel al contrato `{ env, context }` de los manejadores.
 *
 * - `host` es el dominio con el que el proxy de Vercel enrutó la petición (conserva el
 *   dominio personalizado), de modo que `URL` describe el origen del propio sitio igual
 *   que `URL`/`DEPLOY_PRIME_URL` en Netlify. Sin `host` no se admite ningún origen.
 * - `x-real-ip` la fija el proxy de Vercel; la cuota nunca depende de una cabecera de
 *   reenvío enviada por el cliente.
 */
export function vercelInvocation(request: Request): VercelInvocation {
  const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host')
  const proto = request.headers.get('x-forwarded-proto') === 'http' ? 'http' : 'https'
  const url = host ? `${proto}://${host}` : undefined
  const ip = request.headers.get('x-real-ip')?.split(',')[0].trim() ?? ''
  return { env: { ...env, ...(url ? { URL: url } : {}) }, context: { ip: ip || undefined } }
}
