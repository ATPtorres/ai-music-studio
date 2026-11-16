import { describe, expect, it } from 'vitest'
import { createProject } from '../models/project'
import { archiveProject, readLibrary, saveWorkspace } from './projectLibrary'
import { loadProject } from './persistence'

function store() { const data = new Map<string, string>(); return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v) } } }
describe('biblioteca de canciones', () => {
  it('conserva canciones al cambiar de proyecto y limita las versiones a cinco', () => {
    const storage = store(), first = createProject(), second = createProject()
    saveWorkspace(storage, first); saveWorkspace(storage, second)
    expect(readLibrary(storage).map(e => e.project.id)).toEqual([second.id, first.id])
    expect(loadProject(storage)?.id).toBe(second.id)
    for (let i = 0; i < 7; i++) archiveProject(storage, { ...first, name: `Versión ${i}` }, true)
    const saved = readLibrary(storage)[0]
    expect(saved.versions).toHaveLength(5)
    expect(saved.versions[0].project.name).toBe('Versión 6')
    expect(saved.versions[4].project.name).toBe('Versión 2')
  })
  it('conserva la copia activa si la biblioteca está dañada o llena', () => {
    const storage = store(), first = createProject()
    saveWorkspace(storage, first)
    storage.data.set('ai-music-studio:library:v1', '{broken')
    expect(() => saveWorkspace(storage, createProject())).toThrow()
    expect(loadProject(storage)?.id).toBe(first.id)
    expect(() => archiveProject({ ...storage, getItem: () => null, setItem: () => { throw new Error('QuotaExceeded') } }, first)).toThrow('QuotaExceeded')
  })
})
