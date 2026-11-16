# Revisión de experiencia — 16 de noviembre de 2026

## Cambios

- Biblioteca local de hasta 30 canciones; duplicación, apertura, exportación y cinco puntos de restauración por canción. El proyecto activo anterior se conserva antes de cambiar. Restaurar guarda previamente la última edición del destino. Los datos antiguos de un solo proyecto se incorporan al primer guardado.
- Si la biblioteca está corrupta o el almacenamiento se llena, se informa del error y no se cambia el proyecto abierto. Las copias JSON siguen siendo necesarias: no hay sincronización entre dispositivos ni entre pestañas.
- Recorrido inicial hacia acordes, bajo y batería. El botón principal abre el generador de acordes. Se eliminaron afirmaciones generales de funcionamiento sin API y mensajes de herramientas «en desarrollo» que ya funcionan.
- Privacidad y ayuda accesibles desde el pie, con almacenamiento, datos enviados al proveedor, límites y enlace a informes de problemas.
- El agente requiere consentimiento explícito antes de habilitar peticiones o ejemplos. Se reinicia al cambiar de canción. La explicación incluye conversación y resumen musical, incluidos tema y referencias.
- Reproductor persistente y siete ilustraciones originales optimizadas incorporados a la versión publicable. Un único propietario del transporte evita reproducciones superpuestas, incluso con permisos de audio pendientes. El espacio inferior sigue la altura real del reproductor.
- Cinco accesos móviles en una fila; textos secundarios más legibles y movimiento reducido conservado.
- Motor de audio y pantallas en paquetes separados. Entrada principal de producción: 373,32 kB, 114,54 kB gzip. Esto no es una medición de velocidad percibida; el reproductor también descarga sus dependencias. Caché larga solo para recursos con hash en `/assets/`, revalidación de HTML y respuestas API sin caché.
- Función Netlify en `/api/agent`, origen permitido, IP de contexto, cuotas atómicas Upstash separadas de letras y cancelación propagada al proveedor. En producción: un intento, sin modelo alternativo y 20 s por llamada. La IA queda desactivada si falta la configuración de cuotas.

## Comprobaciones

- `npm run build`, `npm run lint` y TypeScript correctos. Quedan dos avisos de anotaciones de optimización de Zod; no impiden compilar.
- 229 pruebas en 38 archivos, incluidas conservación de canciones, cuota o corrupción de almacenamiento, duplicación, respaldo previo al restaurar, consentimiento, coordinación del transporte y tempo en vivo.
- Compilación de producción servida en `127.0.0.1:4173`, origen de prueba independiente del proyecto del usuario en `5173`: crear acordes desde la portada, reproducir mientras se navega, pausar, guardar versión, duplicar, recargar, abrir y restaurar. La restauración conservó un punto anterior adicional.
- Portada, proyectos y agente comprobados a 320 y 390 px: sin desbordamiento horizontal, cinco accesos en una sola fila; reproductor de 164,5 y 118,5 px respectivamente. Espacio inferior reservado según su altura real. Revisadas también las vistas de escritorio y privacidad.
- Adaptador Netlify empaquetado con esbuild para Node 22 e invocado sin credenciales: ruta `/api/agent`, estado de configuración desactivado. Pruebas con proveedor y cuota simulados verifican origen, agotamiento y respuesta válida. Ruta y forma Request/Context contrastadas con [documentación oficial de Netlify](https://docs.netlify.com/build/functions/configuration/).

## Activación y límites de lo verificado

La función está preparada en el repositorio, pero no se ha realizado un despliegue ni se han provisionado cuentas o credenciales remotas. En Netlify se requieren `LLM_MODEL`, `LLM_API_KEY`, `LLM_BASE_URL`, `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` de servidor; las variables de origen las proporciona la plataforma. No se publican archivos `.env` ni claves.

Faltan mediciones de rendimiento con tráfico/red reales, comprobaciones en Safari/iOS y teléfonos físicos y una auditoría con lectores de pantalla. No se afirma certificación de accesibilidad ni disponibilidad del proveedor. Las pruebas de audio automatizadas usan simulación; la interfaz de producción inició el transporte y mantuvo su estado al navegar, sin evaluación subjetiva del sonido en este pase.
