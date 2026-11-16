// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { createProject } from '../../models/project'
const fake = vi.hoisted(() => ({ run: vi.fn() }))
vi.mock('../../agent/agentLoop', () => ({ runAgent: fake.run, AgentError: class extends Error {} }))
import AgentWorkbench from './AgentWorkbench'

describe('consentimiento del agente', () => {
  it('no permite enviar ejemplos sin aceptación y no contacta al modelo solo al aceptarla', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ configured: true, model: 'test', endpoint: 'provider.example', hint: '' })))
    const container = document.createElement('div'), root = createRoot(container)
    try {
      await act(async () => root.render(<AgentWorkbench project={createProject()} replace={vi.fn()} saveStatus="Guardado"/>))
      const example = container.querySelector<HTMLButtonElement>('.agent-example')!
      expect(example.disabled).toBe(true)
      expect(container.querySelector<HTMLTextAreaElement>('textarea')!.disabled).toBe(true)
      await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
      expect(example.disabled).toBe(false)
      expect(fake.run).not.toHaveBeenCalled()
      await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
      expect(example.disabled).toBe(true)
    } finally { await act(async () => root.unmount()); vi.unstubAllGlobals() }
  })
})
