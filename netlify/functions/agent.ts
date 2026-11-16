import { env } from 'node:process'
import { createDeployedAgent } from '../../server/deployedAgent'

export default createDeployedAgent(env)
export const config = { path: '/api/agent' }
