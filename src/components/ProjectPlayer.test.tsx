// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { createProject } from '../models/project'

const mock = vi.hoisted(() => ({ configure: vi.fn(), setTempo: vi.fn(), setMix: vi.fn(), dispose: vi.fn(), play: vi.fn() }))
vi.mock('../audio/TrackPlayer', () => ({ TrackPlayer: class {
  private report: (state: string) => void
  constructor(report: (state: string) => void) { this.report = report }
  configure = mock.configure
  setTempo = mock.setTempo
  setMix = mock.setMix
  dispose = mock.dispose
  getBeat = () => 2
  async play() { mock.play(); this.report('playing') }
  pause() { this.report('paused') }
  stop() { this.report('stopped') }
} }))
import ProjectPlayer from './ProjectPlayer'

describe('reproductor persistente', () => {
  it('pausa/reanuda y conserva el motor ante cambios de nombre, mezcla o tempo', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.clearAllMocks()
    const container = document.createElement('div')
    const root = createRoot(container)
    const project = createProject()
    project.tracks = [{ id: 'lead', name: 'Lead', kind: 'melody', channel: 0, volume: 0.5, muted: false, chords: [], notes: [{ pitch: 60, start: 0, duration: 4, velocity: 90 }] }]
    const update = vi.fn()
    try {
      await act(async () => root.render(<ProjectPlayer project={project} update={update}/>))
      expect(mock.setMix).toHaveBeenLastCalledWith('lead', 0.35, false)
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Reproducir proyecto"]')!.click())
      expect(container.textContent).toContain('Reproduciendo')
      await act(async () => root.render(<ProjectPlayer project={{ ...project, name: 'Renombrado', parameters: { ...project.parameters, bpm: 120 } }} update={update}/>))
      expect(mock.configure).toHaveBeenCalledTimes(1)
      expect(mock.setTempo).toHaveBeenLastCalledWith(120)
      expect(container.textContent).toContain('Reproduciendo')
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Pausar proyecto"]')!.click())
      expect(container.textContent).toContain('En pausa')
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Reanudar proyecto"]')!.click())
      expect(mock.play).toHaveBeenCalledTimes(2)
    } finally { await act(async () => root.unmount()); vi.unstubAllGlobals() }
    expect(mock.dispose).toHaveBeenCalledOnce()
  })
})
