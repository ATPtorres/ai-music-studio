// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { createProject } from '../models/project'
import { archiveProject, readLibrary } from '../services/projectLibrary'
import ProjectLibrary from './ProjectLibrary'

describe('biblioteca visible', () => {
  it('duplica con otro identificador y restaura una versión conservando la canción actual', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const data = new Map<string, string>()
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v) } }
    vi.stubGlobal('localStorage', storage)
    const original = createProject(), replace = vi.fn()
    archiveProject(storage, original, true)
    const container = document.createElement('div'), root = createRoot(container)
    const click = async (label: string) => act(async () => { [...container.querySelectorAll('button')].find(b => b.textContent === label)!.click() })
    try {
      await act(async () => root.render(<ProjectLibrary project={original} replace={replace}/>))
      await click('Duplicar canción')
      const copy = replace.mock.calls[0][0]
      expect(copy.id).not.toBe(original.id)
      expect(readLibrary(storage)).toHaveLength(2)
      const edited = { ...original, name: 'Edición actual' }
      archiveProject(storage, edited)
      await act(async () => root.render(<ProjectLibrary project={edited} replace={replace}/>))
      await click('Restaurar versión 1')
      expect(replace.mock.calls.at(-1)?.[0].name).toBe(original.name)
      expect(readLibrary(storage).find(e => e.project.id === original.id)?.versions[0].project.name).toBe('Edición actual')
    } finally { await act(async () => root.unmount()); vi.unstubAllGlobals() }
  })
})
