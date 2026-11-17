import { afterEach, describe, expect, it, vi } from 'vitest'
import agent from '../api/agent'
import lyrics from '../api/lyrics'
import { vercelInvocation } from './vercel'

describe('Adaptador de invocación de Vercel', () => {
  afterEach(() => vi.unstubAllEnvs())
  const req = (headers: Record<string, string>) => new Request('https://estudio.test/api/lyrics', { headers })

  it('construye el origen del propio sitio y usa la IP que fija el proxy', () => {
    const { env, context } = vercelInvocation(req({ host: 'estudio.test', 'x-forwarded-proto': 'https', 'x-real-ip': '203.0.113.7' }))
    expect(env.URL).toBe('https://estudio.test')
    expect(context.ip).toBe('203.0.113.7')
  })

  it('prefiere el host de enrutado y solo admite http o https', () => {
    const externo = vercelInvocation(req({ host: 'estudio.test', 'x-forwarded-host': 'otro.test', 'x-forwarded-proto': 'ftp' }))
    expect(externo.env.URL).toBe('https://estudio.test')
    const local = vercelInvocation(req({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))
    expect(local.env.URL).toBe('http://localhost:3000')
  })

  it('sin host conserva el origen configurado y sin IP deja la cuota bloqueada', () => {
    vi.stubEnv('URL', 'https://configurado.test')
    const { env, context } = vercelInvocation(new Request('https://estudio.test/api/lyrics'))
    expect(env.URL).toBe('https://configurado.test')
    expect(context.ip).toBeUndefined()
  })

  it('toma la primera IP de una lista y descarta valores vacíos', () => {
    expect(vercelInvocation(req({ host: 'estudio.test', 'x-real-ip': '203.0.113.9, 10.0.0.1' })).context.ip).toBe('203.0.113.9')
    expect(vercelInvocation(req({ host: 'estudio.test', 'x-real-ip': '  ' })).context.ip).toBeUndefined()
  })

  it('expone api/ como manejadores fetch con el mismo contrato que Netlify', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const estado = await agent.fetch(new Request('http://estudio.test/api/agent', { headers: { host: 'estudio.test', 'x-real-ip': '203.0.113.7' } }))
    expect(estado.status).toBe(200)
    expect(await estado.json()).toMatchObject({ configured: false, model: '' })
    const ajeno = await lyrics.fetch(new Request('http://otro.test/api/lyrics', {
      method: 'POST',
      headers: { host: 'estudio.test', 'x-real-ip': '203.0.113.7', 'content-type': 'application/json', 'x-lyrics-request': '1', origin: 'https://otro.test', 'sec-fetch-site': 'cross-site' },
    }))
    expect(ajeno.status).toBe(403)
    expect(await ajeno.json()).toEqual({ error: 'origin_not_allowed' })
  })
})
