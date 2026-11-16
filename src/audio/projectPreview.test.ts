import { describe, expect, it } from 'vitest'
import { createProject, type MusicTrack } from '../models/project'
import { projectPreview } from './projectPreview'

const track = (id: string, duration: number): MusicTrack => ({ id, name: id, kind: 'melody', channel: 0, muted: false, volume: 0.6, chords: [], notes: [{ pitch: 60, start: 0, duration, velocity: 90 }] })
describe('escucha global', () => {
  it('repite las pistas cortas hasta el final común sin modificar el proyecto', () => {
    const project = createProject()
    project.tracks = [track('long', 8), track('short', 4)]
    const preview = projectPreview(project)
    expect(preview.end).toBe(8)
    expect(preview.tracks[1].notes.map(n => n.start)).toEqual([0, 4])
    expect(project.tracks[1].notes).toHaveLength(1)
  })
  it('respeta silencios y pistas vinculadas cuando hay estructura', () => {
    const project = createProject()
    project.tracks = [track('lead', 4)]
    project.sections = [{ id: 'intro', name: 'Intro', bars: 1, trackIds: [], lyrics: '' }, { id: 'verse', name: 'Verso', bars: 1, trackIds: ['lead'], lyrics: '' }]
    const preview = projectPreview(project)
    expect(preview.mode).toBe('Arreglo')
    expect(preview.tracks[0].notes[0].start).toBe(4)
    expect(preview.end).toBe(8)
  })
  it('deja el proyecto vacío sin audio', () => {
    expect(projectPreview(createProject())).toMatchObject({ tracks: [], end: 0 })
  })
})
