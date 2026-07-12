# Método Híbrido — webapp

Next.js 16 (App Router) + React 19 + Tailwind 4 + Firebase (Auth y Firestore).
Sustituye a la app estática que vive en la raíz del repo (`index.html`, `app.js`,
`admin.html`…), que se ha dejado intacta y sigue funcionando mientras migramos.

## Arrancar

```bash
cd web
npm install
cp .env.example .env.local   # solo hace falta si quieres el generador con IA
npm run dev                  # http://localhost:3000
```

La app arranca sin `.env.local`: la configuración de Firebase (que es pública por
diseño) está por defecto en `src/lib/firebase.ts` apuntando al proyecto actual
`elmetodohibrido`. Lo único que necesita una variable de entorno es la IA.

## Qué hay

| Ruta | Qué es |
| --- | --- |
| `/` | Landing pública para registrarse |
| `/login`, `/registro` | Acceso con email/contraseña o Google |
| `/onboarding` | Test inicial (6 pasos, saltable en cualquier momento) |
| `/hoy` | Entrenos del día, tira de la semana, resumen de carga |
| `/calendario` | Mes completo + competiciones |
| `/buscar` | Búsqueda por texto/deporte/zona corporal + generador con IA |
| `/cuerpo` | Mapa de carga muscular, kilos/1RM y skills |
| `/perfil` | Objetivo deportivo, herramientas, comunidad, cerrar sesión |
| `/herramientas/timer` | Timer WOD (AMRAP, EMOM, Tabata, For Time) |
| `/herramientas/zapatillas` | Test de zapatillas con motor de scoring real |
| `/admin` | Panel de coach: publicar entrenos y gestionar roles |
| `/api/generar-wod` | Ruta de servidor que llama a Claude (Opus 4.8) |

## Cómo funciona el mapa de carga

`src/lib/muscles.ts` mapea el texto del entrenamiento a zonas corporales: cada
movimiento conocido ("thruster", "kettlebell swing", "tirada larga"…) aporta sus
grupos musculares con un peso. Cuando marcas un entreno como hecho se guarda en
`users/{uid}/sessions` con esas zonas, y el cuerpo de `/cuerpo` se pinta con la
carga acumulada de la semana: azul (suave) → amarillo (cargado) → rojo (muy
cargado).

Ese mismo dato retroalimenta a la IA: si tienes una zona en rojo, el generador la
esquiva al proponerte trabajo.

## Modelo de datos (Firestore)

```
users/{uid}                     perfil + role (athlete|coach|admin) + onboarding
users/{uid}/sessions/{id}       entrenos marcados como hechos
users/{uid}/lifts/{id}          marcas de fuerza (movimiento, peso, reps, fecha)
users/{uid}/meta/skills         skills desbloqueados
wods/{id}                       entrenamientos (compatible con la app antigua)
competiciones/{id}              carreras y eventos
```

Un WOD sin `ownerId` es del plan del box y lo ve todo el mundo. Uno con `ownerId`
es personal (lo generó la IA para ese atleta) y solo lo ve su dueño.

## Roles

El rol vive en `users/{uid}.role`. Las reglas de `firestore.rules` impiden que un
atleta se cambie el rol a sí mismo, así que el primer admin hay que ponerlo a mano
en la consola de Firebase (Firestore → `users` → tu documento → `role: "admin"`).
A partir de ahí puedes ascender a quien quieras desde `/admin`.

## Despliegue

```bash
npm run build
```

Cualquier host con soporte de Node vale (Vercel es el camino corto). Recuerda
poner `ANTHROPIC_API_KEY` en las variables de entorno del proyecto, nunca en el
código.

Reglas de Firestore: `firebase deploy --only firestore:rules`.
