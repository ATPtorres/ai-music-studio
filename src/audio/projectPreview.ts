import type { MusicProject } from '../models/project'
import { renderArrangement, sourceClip } from '../arrangement/render'

export function projectPreview(project: MusicProject) {
  if (project.sections.length) return { ...renderArrangement(project), mode: 'Arreglo' }
  const clips = project.tracks.map(track => ({ track, clip: sourceClip(track, project.parameters.timeSignature) }))
  const end = Math.max(0, ...clips.map(({ clip }) => clip.period))
  let count = 0
  const tracks = clips.map(({ track, clip }) => {
    const notes = []
    if (clip.period > 0) for (let offset = 0; offset < end; offset += clip.period) for (const note of clip.notes) {
      if (offset + note.start >= end) continue
      notes.push({ ...note, start: offset + note.start, duration: Math.min(note.duration, end - offset - note.start) })
      if (++count > 15000) throw new Error('La escucha admite hasta 15000 notas.')
    }
    return { ...track, notes }
  })
  if (tracks.length > 16) throw new Error('La escucha admite hasta 16 pistas.')
  return { tracks, end, mode: 'Pistas juntas' }
}
