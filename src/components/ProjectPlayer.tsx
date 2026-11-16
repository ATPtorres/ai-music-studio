import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, Square, Volume2 } from 'lucide-react'
import type { MusicProject } from '../models/project'
import { TrackPlayer, type PreviewTrack } from '../audio/TrackPlayer'
import type { PlaybackState } from '../audio/ChordPlayer'
import { projectPreview } from '../audio/projectPreview'
import './project-player.css'

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
export default function ProjectPlayer({ project, update }: { project: MusicProject; update: (change: Partial<MusicProject>) => void }) {
  const panel = useRef<HTMLElement | null>(null)
  const engine = useRef<TrackPlayer | null>(null)
  const [state, setState] = useState<PlaybackState>('stopped')
  const [starting, setStarting] = useState(false)
  const [volume, setVolume] = useState(70)
  const [beat, setBeat] = useState(0)
  const [message, setMessage] = useState('')
  const [tempoDraft, setTempoDraft] = useState<string | null>(null)
  useEffect(() => {
    if (!panel.current || typeof ResizeObserver === 'undefined') return
    const measure = () => document.documentElement.style.setProperty('--project-player-height', `${panel.current?.getBoundingClientRect().height ?? 100}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(panel.current); measure()
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--project-player-height') }
  }, [])
  const preview = useMemo(() => {
    try { return { ...projectPreview(project), error: '' } }
    catch (error) { return { tracks: [], end: 0, mode: 'Proyecto', error: error instanceof Error ? error.message : 'No se pudo preparar el audio.' } }
  }, [project])
  // Stable musical data: renaming, lyrics, tempo and mix edits do not restart playback.
  const score = JSON.stringify(preview.tracks.map(t => ({ id: t.id, kind: t.kind, sound: t.sound, notes: t.notes, volume: 0, muted: false })))
  const mix = JSON.stringify(preview.tracks.map(t => ({ id: t.id, volume: t.volume, muted: t.muted })))
  useEffect(() => {
    const player = new TrackPlayer(next => { setState(next); setBeat(player.getBeat()) })
    engine.current = player
    return () => { player.dispose(); engine.current = null }
  }, [])
  useEffect(() => { engine.current?.configure(JSON.parse(score) as PreviewTrack[], 100, preview.end) }, [score, preview.end, project.id])
  useEffect(() => { engine.current?.setTempo(project.parameters.bpm) }, [project.parameters.bpm, score, preview.end, project.id])
  useEffect(() => {
    for (const track of JSON.parse(mix) as { id: string; volume: number; muted: boolean }[]) engine.current?.setMix(track.id, track.volume * volume / 100, track.muted)
  }, [mix, volume, score, preview.end, project.id])
  useEffect(() => {
    if (state !== 'playing') return
    const timer = window.setInterval(() => setBeat(engine.current?.getBeat() ?? 0), 200)
    return () => window.clearInterval(timer)
  }, [state])
  const play = async () => {
    setStarting(true); setMessage('')
    try { await engine.current?.play() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo iniciar el audio.') }
    finally { setStarting(false) }
  }
  const saveTempo = () => {
    if (tempoDraft === null) return
    const bpm = Number(tempoDraft)
    setTempoDraft(null)
    if (!Number.isInteger(bpm) || bpm < 30 || bpm > 300) { setMessage('Usa un tempo entero entre 30 y 300 BPM.'); return }
    setMessage(''); update({ parameters: { ...project.parameters, bpm } })
  }
  const available = preview.tracks.some(t => t.notes.length)
  return <section ref={panel} className="project-player" aria-label="Reproductor del proyecto">
    <div className="project-player-info"><strong title={project.name}>{project.name}</strong><span>{preview.mode} · {state === 'playing' ? 'Reproduciendo' : state === 'paused' ? 'En pausa' : available ? 'Listo para escuchar' : 'Genera una pista para escuchar'}</span></div>
    <div className="project-player-buttons">
      <button className="button primary" aria-label={state === 'playing' ? 'Pausar proyecto' : state === 'paused' ? 'Reanudar proyecto' : 'Reproducir proyecto'} disabled={!available || !!preview.error || starting} onClick={() => state === 'playing' ? engine.current?.pause() : void play()}>{state === 'playing' ? <Pause size={20}/> : <Play size={20}/>}</button>
      <button className="button secondary" aria-label="Detener proyecto" onClick={() => engine.current?.stop()}><Square size={17}/></button>
    </div>
    <span className="project-player-time" aria-label="Tiempo de reproducción">{clock(beat * 60 / project.parameters.bpm)} / {clock(preview.end * 60 / project.parameters.bpm)}</span>
    <label className="project-player-volume"><Volume2 size={17} aria-hidden="true"/><input aria-label="Volumen del reproductor" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))}/><span>{volume}%</span></label>
    <label className="project-player-tempo">BPM<input aria-label="Tempo del proyecto" type="number" min="30" max="300" value={tempoDraft ?? project.parameters.bpm} onChange={e => setTempoDraft(e.target.value)} onBlur={saveTempo} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}/></label>
    {(preview.error || message) && <p className="project-player-message" role="status">{preview.error || message}</p>}
  </section>
}
