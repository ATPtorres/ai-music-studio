import { parseProject, saveProject } from './persistence'
import type { MusicProject } from '../models/project'

const LIBRARY_KEY = 'ai-music-studio:library:v1'
type Store = Pick<Storage, 'getItem' | 'setItem'>
export interface SavedProject { project: MusicProject; versions: { name: string; project: MusicProject }[] }
export function readLibrary(storage: Pick<Storage, 'getItem'>): SavedProject[] {
  const raw = storage.getItem(LIBRARY_KEY)
  if (!raw) return []
  const data: unknown = JSON.parse(raw)
  if (!Array.isArray(data) || data.length > 30) throw new Error('No se pudo leer la biblioteca. Exporta una copia del proyecto antes de continuar.')
  return data.map(item => {
    if (!item || !Array.isArray(item.versions) || item.versions.length > 5) throw new Error('Biblioteca no válida; se conserva la copia existente.')
    return { project: parseProject(JSON.stringify(item.project)), versions: item.versions.map((v: { name: string; project: unknown }) => {
      if (typeof v.name !== 'string') throw new Error('Versión no válida.')
      return { name: v.name, project: parseProject(JSON.stringify(v.project)) }
    }) }
  })
}
export function archiveProject(storage: Store, project: MusicProject, checkpoint = false) {
  project = parseProject(JSON.stringify(project))
  const entries = readLibrary(storage)
  const previous = entries.find(entry => entry.project.id === project.id)
  const versions = checkpoint ? [{ name: new Date().toLocaleString('es'), project }, ...(previous?.versions ?? [])].slice(0, 5) : previous?.versions ?? []
  const next = [{ project, versions }, ...entries.filter(entry => entry.project.id !== project.id)]
  if (next.length > 30) throw new Error('La biblioteca admite 30 proyectos. Exporta tus canciones antes de liberar espacio en el navegador.')
  storage.setItem(LIBRARY_KEY, JSON.stringify(next))
}
export function saveWorkspace(storage: Store, project: MusicProject) {
  // Archive first: if storage is full or corrupted, switching never overwrites the active copy.
  archiveProject(storage, project)
  saveProject(storage, project)
}
