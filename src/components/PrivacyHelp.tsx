export default function PrivacyHelp() {
  return <section className="privacy-help" aria-label="Privacidad y ayuda">
    <h2>Privacidad y ayuda</h2>
    <h3>Tu trabajo se guarda en este dispositivo</h3><p>Las canciones, notas, letras y versiones se conservan en el almacenamiento de este navegador. No hay sincronización entre dispositivos. Borrar los datos del sitio elimina esas copias: exporta tus proyectos JSON como respaldo.</p>
    <h3>Cuándo se envían datos a la inteligencia artificial</h3><p>Los generadores musicales funcionan localmente. Si activas el agente, se envían al proveedor configurado tu petición, el historial reciente de esa conversación y un resumen del proyecto: nombre, parámetros, tema y referencias, nombres de pistas y secciones, símbolos de acordes y cantidades de notas y letras. No se envían audio, archivos MIDI ni el texto completo de las letras guardadas. Las peticiones que escribas sí se envían completas.</p><p>El asistente de letras explica sus datos y solicita consentimiento antes de cada sesión. La disponibilidad, conservación y tratamiento remoto dependen del proveedor de IA y de su cuenta. Las claves se mantienen en el servidor.</p>
    <h3>Si algo falla</h3><p>Exporta primero una copia JSON. Si el audio no empieza, pulsa reproducir y comprueba el volumen del navegador. Si falla la IA, puedes continuar componiendo con los generadores locales. Si el almacenamiento se llena, exporta tus canciones antes de gestionar los datos del sitio.</p>
    <p><a href="https://github.com/ATPtorres/ai-music-studio./issues" target="_blank" rel="noreferrer">Informar de un problema o solicitar ayuda en GitHub</a>. Evita publicar claves, letras privadas o archivos personales en un informe público.</p>
  </section>
}
