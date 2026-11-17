# GitHub, Netlify y Vercel

La Fase 1 se desarrolla localmente. No se crea un repositorio remoto ni se publica automáticamente. Un repositorio Git local puede inicializarse sin subir archivos; verifica `git status` y secretos antes de hacer commit.

## GitHub

1. Crear un repositorio vacío en tu cuenta, sin añadir otro README.
2. Desde esta carpeta, si aún no existe Git:

```sh
git init
git add .
git commit -m "Foundation for AI Music Studio"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ai-music-studio.git
git push -u origin main
```

Los valores TU_USUARIO y el nombre remoto son ejemplos: sustituirlos. Autenticarse mediante GitHub CLI/gestor de credenciales; no pegar tokens en archivos o URLs. `package-lock.json` debe subirse, `node_modules`, `dist` y `.env` no.

## Netlify

1. Crear o usar una cuenta en el plan Free; verificar límites y requisitos actuales.
2. Importar un proyecto existente desde GitHub y autorizar solo el repositorio necesario.
3. Rama de producción `main`, comando `npm run build`, directorio `dist`, Node 22; `netlify.toml` contiene esta configuración.
4. Revisar el deploy y abrir la URL asignada. Navegación es estado local; no requiere reescritura SPA en esta fase.
5. Probar cambios de parámetros, recarga, exportación e importación tanto en desktop como móvil. Cada origen tiene almacenamiento independiente: localhost y el dominio Netlify no comparten proyectos; trasladar mediante JSON.

El editor local hasta Fase 5 no requiere variables. La asistencia Gemini usa `netlify/functions/lyrics.ts` y requiere `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` exclusivamente en el servidor. Sin cuotas persistentes el endpoint se bloquea. Nunca usar `VITE_`, Git o archivos públicos para secretos. Consulta [activación, límites y validación pendiente](phase5.md).

## Vercel

1. Importar el repositorio desde GitHub en Vercel. `vercel.json` fija el build `npm run build`, la salida `dist` y las cabeceras equivalentes a las de `netlify.toml`; Vercel ignora `netlify.toml` y `netlify/functions`.
2. Las funciones viven en `api/` y reutilizan los mismos manejadores `Request`/`Response`: `api/agent.ts` atiende `/api/agent` y una reescritura de `vercel.json` conduce `/.netlify/functions/lyrics` a `api/lyrics.ts`, de modo que el navegador sigue llamando a la misma ruta que en Netlify.
3. En Settings → Environment Variables (Production y Preview) configurar `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`, y para el agente `LLM_BASE_URL`, `LLM_MODEL` y `LLM_API_KEY`. Nunca usar prefijo `VITE_`. Sin cuotas persistentes los endpoints se bloquean igual que en Netlify.
4. El origen permitido se deriva en cada invocación de las cabeceras `host` y `x-forwarded-proto`, que el proxy de Vercel fija con el dominio visitado, y la cuota usa la IP de `x-real-ip`. No hace falta definir `URL` ni `DEPLOY_PRIME_URL`.
5. Abrir la URL asignada y comprobar la portada, la exportación MIDI/JSON y `GET /api/agent`, que informa si la IA está configurada. La navegación es estado local: no se requiere reescritura SPA.

El plan Hobby admite funciones de hasta 300 s, por encima de los 25 s máximos de los endpoints. Cada origen (localhost, preview y producción) tiene almacenamiento independiente: traslada el proyecto exportando JSON.

## Desarrollo local y producción

`npm run dev` ofrece recarga en desarrollo. `npm run build` genera archivos estáticos en dist. `npm run preview` revisa esa compilación. No servir la raíz del repositorio públicamente con Apache; desplegar solo dist. Las cabeceras de netlify.toml las aplica Netlify y las de vercel.json las aplica Vercel, no Vite ni Apache.

Si se agotan los créditos gratuitos, revisar el panel y esperar la renovación o ajustar consumo; no habilitar pagos para mantener el objetivo de costo cero. No hay garantía de disponibilidad ilimitada.
