import { createLyricsHandler } from '../server/lyrics'
import { vercelInvocation } from '../server/vercel'

// Vercel entrega el cuerpo sin analizar y la IP en `x-real-ip`; la ruta
// `/.netlify/functions/lyrics` llega aquí mediante la reescritura de `vercel.json`.
// `maxDuration` 30 s cubre los 25 s del manejador por encima del déficit por
// defecto del plan Hobby (10 s), sin alcanzar su máximo de 60 s.
export const config = { runtime: 'nodejs', maxDuration: 30 }

export default {
  fetch(request: Request): Promise<Response> {
    const { env, context } = vercelInvocation(request)
    return createLyricsHandler({ env, fetcher: fetch, now: Date.now })(request, context)
  },
}
