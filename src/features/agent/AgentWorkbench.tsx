import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowUp, Bot, Check, Loader2, Sparkles, Undo2, Wrench, X } from 'lucide-react'
import type { MusicProject } from '../../models/project'
import { AgentError, runAgent } from '../../agent/agentLoop'
import './agent.css'

interface Props {
  project: MusicProject
  replace: (project: MusicProject) => void
  saveStatus: string
}

interface UiMessage {
  id: number
  role: 'user' | 'assistant' | 'step' | 'system' | 'error'
  text: string
  ok?: boolean
}

interface AgentStatus {
  configured: boolean
  model: string
  endpoint: string
  hint: string
}

const examples = [
  'Crea una base indie pop nostálgica en La menor a 90 BPM: acordes, melodía, bajo y batería.',
  'Genera una estructura con fraseo de 8 compases y luego añade una batería funk.',
  'Cambia el proyecto a Do mayor, 110 BPM y genera una progresión de 8 compases.',
  'Haz una variación de la melodía sin tocar el ritmo.',
]

export default function AgentWorkbench({ project, replace, saveStatus }: Props) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [snapshot, setSnapshot] = useState<MusicProject | null>(null)
  const history = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])
  const controller = useRef<AbortController | null>(null)
  const run = useRef(0)
  const messageId = useRef(0)
  const transcript = useRef<HTMLDivElement>(null)
  const nextId = () => ++messageId.current

  useEffect(() => {
    const abort = new AbortController()
    fetch('/api/agent', { signal: abort.signal })
      .then(response => response.ok ? response.json() as Promise<AgentStatus> : Promise.reject(new Error('sin proxy')))
      .then(setStatus)
      .catch(() => { if (!abort.signal.aborted) setStatus({ configured: false, model: '', endpoint: '', hint: 'No se pudo conectar con la asistencia. Inténtalo más tarde o continúa con los generadores locales.' }) })
    return () => abort.abort()
  }, [])
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight }) }, [messages])
  useEffect(() => () => { run.current++; controller.current?.abort() }, [])

  const send = async (text: string) => {
    const value = text.trim()
    if (!value || busy || !status?.configured || !consent) return
    const currentRun = ++run.current
    const abort = new AbortController()
    controller.current = abort
    setBusy(true)
    setInput('')
    setSnapshot(project)
    setMessages(current => [...current, { id: nextId(), role: 'user', text: value }])
    let modified = false
    try {
      const result = await runAgent({
        project, history: history.current, input: value, signal: abort.signal,
        onProject: next => { modified = true; replace(next) },
        onStep: step => setMessages(current => [...current, { id: nextId(), role: 'step', text: step.label, ok: step.ok }]),
      })
      if (abort.signal.aborted || currentRun !== run.current) return
      history.current = [...history.current, { role: 'user' as const, content: value }, { role: 'assistant' as const, content: result.text }].slice(-8)
      setMessages(current => [...current, { id: nextId(), role: 'assistant', text: result.text }])
    } catch (error) {
      if (abort.signal.aborted || currentRun !== run.current) return
      const detail = error instanceof AgentError ? error.message : 'No se pudo completar la operación.'
      const note = modified
        ? ' Algunos cambios ya se aplicaron al proyecto: usa «Deshacer último cambio» si quieres volver atrás.'
        : ' El proyecto no se ha modificado.'
      if (!modified) setSnapshot(null)
      setMessages(current => [...current, { id: nextId(), role: 'error', text: `${detail}${note}` }])
    } finally {
      if (controller.current === abort) controller.current = null
      if (currentRun === run.current) setBusy(false)
    }
  }

  const stop = () => { controller.current?.abort(); setBusy(false) }
  const undo = () => {
    if (!snapshot) return
    replace(snapshot)
    setSnapshot(null)
    history.current = []
    setMessages(current => [...current, { id: nextId(), role: 'system', text: 'Cambios deshechos. El proyecto volvió al estado anterior a la última petición.' }])
  }

  const ready = Boolean(status?.configured)
  const canSend = ready && consent
  return <section className="agent-workbench" aria-label="Agente de composición">
    <p className="agent-save" role="status">{saveStatus}</p>
    <div className="agent-intro">
      <span className="icon-box purple"><Bot size={25}/></span>
      <div>
        <div className="eyebrow">AGENTE DE COMPOSICIÓN</div>
        <h2>Pídelo en palabras. El proyecto se actualiza.</h2>
        <p>El modelo elige herramientas locales para generar acordes, líneas, batería y estructura. Con tu permiso, se envían al proveedor la conversación y un resumen del proyecto para elegir las herramientas. El audio y los archivos MIDI se quedan en tu navegador.</p>
      </div>
      <span className={`agent-state ${ready ? 'ready' : 'off'}`}><span className="status-dot"/>{ready ? `Conectado · ${status?.model}` : 'Sin configurar'}</span>
    </div>

    {status && !ready && <div className="agent-setup" role="status">
      <div className="agent-setup-title"><AlertTriangle size={18}/><strong>Asistencia remota no disponible</strong></div>
      <p>La conexión de IA aún no está disponible en este estudio.</p>

      <p className="agent-muted">La asistencia necesita estar activada en el servidor por quien administra el estudio. Puedes seguir usando los generadores locales.</p>
    </div>}

    {ready && <div className="agent-consent"><p>Proveedor: {status?.endpoint}. Se enviarán tu petición, la conversación reciente y un resumen con nombres, parámetros, tema, referencias, acordes y cantidades de notas y letras. No se envían audio ni letras guardadas completas. El tratamiento remoto depende del proveedor.</p><label><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)}/>Acepto enviar estos datos al proveedor para esta sesión del agente.</label></div>}
    <div className="agent-chat" ref={transcript} aria-live="polite">
      {messages.length === 0 && <div className="agent-empty">
        <Sparkles size={20}/>
        <p>¿Qué quieres construir? Por ejemplo:</p>
        <div className="agent-examples">{examples.map(example => <button key={example} className="agent-example" disabled={!canSend || busy} onClick={() => void send(example)}>{example}</button>)}</div>
        <small>El agente trabaja sobre el proyecto abierto. Puedes deshacer la última petición.</small>
      </div>}
      {messages.map(message => message.role === 'step'
        ? <div key={message.id} className={`agent-step ${message.ok === false ? 'failed' : ''}`}>{message.ok === false ? <X size={13}/> : <Wrench size={13}/>}<span>{message.text}</span></div>
        : <div key={message.id} className={`agent-bubble ${message.role}`}><span className="agent-role">{message.role === 'user' ? 'Tú' : message.role === 'assistant' ? 'Agente' : message.role === 'error' ? 'Error' : 'Sistema'}</span><p>{message.text}</p>{message.role === 'assistant' && <Check size={13} className="agent-check"/>}</div>)}
      {busy && <div className="agent-step"><Loader2 size={13} className="agent-spin"/><span>Pensando…</span></div>}
    </div>

    <div className="agent-composer">
      <label htmlFor="agent-input">Tu petición</label>
      <textarea id="agent-input" value={input} maxLength={2000} rows={3} disabled={busy || !canSend} placeholder={ready ? 'Ej.: crea una balada en Re menor a 70 BPM con piano, bajo y batería suave…' : 'Configura el agente para escribir aquí…'} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(input) } }}/>
      <div className="agent-actions">
        <span className="agent-hint">Enter envía · Mayús+Enter salta línea</span>
        {busy && <button className="button secondary" onClick={stop}><X size={15}/>Detener</button>}
        {snapshot && !busy && <button className="button secondary" onClick={undo}><Undo2 size={15}/>Deshacer último cambio</button>}
        <button className="button primary" disabled={!canSend || busy || !input.trim()} onClick={() => void send(input)}><ArrowUp size={15}/>Enviar</button>
      </div>
    </div>

    <div className="detail-panel agent-note">
      <Wrench size={20}/>
      <div><h2>Cómo funciona</h2><p>El modelo no genera audio ni MIDI directamente: elige entre herramientas verificadas (<code>generate_chords</code>, <code>generate_line</code>, <code>generate_drums</code>, <code>generate_structure</code>…) que ya existían en el estudio. Así los resultados siguen siendo válidos, editables y exportables a MIDI.</p></div>
    </div>
  </section>
}
