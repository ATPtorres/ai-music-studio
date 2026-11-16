import { describe, expect, it, vi } from 'vitest'
import { createDeployedAgent } from './deployedAgent'
const env = { URL: 'https://studio.example', LLM_MODEL: 'test', LLM_API_KEY: 'secret-test', UPSTASH_REDIS_REST_URL: 'https://quota.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'quota-test' }
const request = (origin = env.URL) => new Request(`${env.URL}/api/agent`, { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Hola' }] }) })
describe('agente publicado', () => {
  it('bloquea otros orígenes sin consumir cuota ni contactar al modelo', async () => {
    const fetcher = vi.fn<typeof fetch>()
    expect((await createDeployedAgent(env, fetcher)(request('https://other.example'), { ip: '1' })).status).toBe(403)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('reserva cuota persistente antes del modelo y no expone claves', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ result: 0 })).mockResolvedValueOnce(Response.json({ choices: [{ message: { role: 'assistant', content: 'Hola' } }] }))
    const result = await createDeployedAgent(env, fetcher)(request(), { ip: '1' })
    expect(result.status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(String(fetcher.mock.calls[0][1]?.body)).toContain('agent:v1:')
    expect(await result.text()).not.toContain('secret-test')
  })
  it('se desactiva sin cuota y rechaza solicitudes al agotarla', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: 1 }))
    expect((await createDeployedAgent(env, fetcher)(request(), { ip: '1' })).status).toBe(429)
    expect(fetcher).toHaveBeenCalledTimes(1)
    const result = await createDeployedAgent({ ...env, UPSTASH_REDIS_REST_TOKEN: '' }, fetcher)(new Request(`${env.URL}/api/agent`), {})
    expect(await result.json()).toMatchObject({ configured: false })
  })
})
