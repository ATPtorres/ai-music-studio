import { useState } from 'react'
import type { MusicProject } from '../models/project'
import { archiveProject, readLibrary, type SavedProject } from '../services/projectLibrary'
import { downloadProject } from '../services/persistence'

export default function ProjectLibrary({ project, replace }: { project: MusicProject; replace: (project: MusicProject) => void }) {
  const [initial] = useState(() => { try { return { saved: readLibrary(localStorage), error: '' } } catch { return { saved: [] as SavedProject[], error: 'No se pudo leer la biblioteca. Exporta una copia JSON; los datos existentes se conservan.' } } })
  const [error, setError] = useState(initial.error)
  const [saved, setSaved] = useState<SavedProject[]>(initial.saved)
  const refresh = () => setSaved(readLibrary(localStorage))
  const run = (action: () => void) => { try { action(); refresh(); setError('') } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar. Exporta una copia JSON.') } }
  const open = (next: MusicProject) => run(() => { archiveProject(localStorage, project); replace(next) })
  return <section className="saved-projects" aria-label="Biblioteca de proyectos">
    <h2>Tus canciones y versiones</h2>
    <p>Se guardan en este navegador. Exporta copias JSON para llevarlas a otro dispositivo. Conservamos hasta cinco puntos de restauración por canción.</p>
    <div className="library-actions"><button className="button primary" onClick={() => run(() => archiveProject(localStorage, project, true))}>Guardar punto de restauración</button><button className="button secondary" onClick={() => run(() => { archiveProject(localStorage, project); const now = new Date().toISOString(); const copy = { ...project, id: crypto.randomUUID(), name: `${project.name.slice(0, 90)} · copia`, createdAt: now, updatedAt: now }; archiveProject(localStorage, copy); replace(copy) })}>Duplicar canción</button></div>
    {error && <p role="alert">{error}</p>}
    {saved.map(entry => <article key={entry.project.id} className="saved-project"><h3>{entry.project.name}{entry.project.id === project.id ? ' · Abierta' : ''}</h3><p>{entry.project.parameters.bpm} BPM · {entry.project.tracks.length} pistas</p><div className="library-actions"><button className="button secondary" disabled={entry.project.id === project.id} onClick={() => open(entry.project)}>Abrir canción</button><button className="button secondary" onClick={() => downloadProject(entry.project)}>Exportar JSON</button></div>{entry.versions.length > 0 && <details><summary>Puntos de restauración ({entry.versions.length})</summary>{entry.versions.map((version, i) => <div className="library-actions" key={i}><span>{version.name}</span><button className="button secondary" onClick={() => run(() => { archiveProject(localStorage, project); archiveProject(localStorage, readLibrary(localStorage).find(saved => saved.project.id === entry.project.id)!.project, true); replace({ ...version.project, updatedAt: new Date().toISOString() }) })}>Restaurar versión {i + 1}</button><button className="text-button" onClick={() => downloadProject(version.project)}>Exportar versión</button></div>)}</details>}</article>)}
  </section>
}
