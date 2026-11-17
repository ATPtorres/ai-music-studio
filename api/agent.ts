import { createDeployedAgent } from '../server/deployedAgent'
import { vercelInvocation } from '../server/vercel'

// Vercel enruta `/api/agent` a esta función Node con la API Web estándar, el mismo
// contrato que `netlify/functions/agent.ts`: origen del propio sitio e IP del proxy.
// `maxDuration` 30 s cubre los 20 s del proveedor + cuota por encima del déficit
// por defecto del plan Hobby (10 s), sin alcanzar su máximo de 60 s.
export const config = { runtime: 'nodejs', maxDuration: 30 }

export default {
  fetch(request: Request): Promise<Response> {
    const { env, context } = vercelInvocation(request)
    return createDeployedAgent(env)(request, context)
  },
}
