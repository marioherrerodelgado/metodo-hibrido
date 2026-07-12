# Método Híbrido — Estado del proyecto (13 jul 2026)

## Dónde está cada cosa

La app se ha reescrito en **Next.js dentro de `web/`**. La app antigua (estática)
sigue en la raíz (`index.html`, `app.js`, `admin.html`, `timer.html`,
`shoe-finder.html`, `landing.html`) **sin tocar**: sigue funcionando y sirviendo
mientras terminamos la migración. Cuando la nueva esté desplegada y probada,
podemos borrarla.

Documentación de la app nueva: **`web/README.md`**.

## Qué hace la app nueva

- Landing pública, registro/login (email y Google) y test inicial saltable.
- Calendario del mes + competiciones.
- **Mapa de carga corporal**: al marcar un entreno como hecho, el cuerpo se
  colorea con la carga acumulada de la semana (azul → amarillo → rojo). Las
  zonas se infieren del texto del WOD.
- Buscador por texto, deporte y zona corporal.
- **Generador de WODs con IA** que respeta tu material, tu nivel y las zonas que
  llevas al rojo.
- Cargas (1RM estimado) y skills.
- **Test de zapatillas rehecho**: motor de scoring ponderado. Siete perfiles
  distintos dan siete recomendaciones distintas, cada una con su porqué. Ya no
  devuelve siempre lo mismo.
- **Timer WOD** rediseñado: AMRAP, EMOM, Tabata, For Time.
- Backend unificado con roles (atleta / coach / admin).
- Carga masiva de WODs por CSV en el panel del coach.

Fuera: la **reserva de clases** (Wodbuster). El **objetivo deportivo** se queda.

## Lo que hace falta de tu parte (no lo puedo hacer yo)

1. **Clave de la IA.** Crea una API key en console.anthropic.com y ponla como
   `ANTHROPIC_API_KEY` (en `web/.env.local` para local, y en las variables de
   entorno del hosting para producción). Sin ella la app funciona entera, pero el
   botón "Crear entrenamiento con IA" avisa de que no está configurado. **Es lo
   único que no he podido probar de punta a punta.**

2. **Hazte admin.** Consola de Firebase → Firestore → colección `users` → tu
   documento → cambia `role` a `"admin"`. Hasta que lo hagas, `/admin` no te deja
   entrar. Después ya puedes ascender a quien quieras desde la propia app.

3. **Activa Google** como proveedor de acceso en Firebase → Authentication →
   Sign-in method. El botón "Continuar con Google" ya está puesto, pero fallará
   hasta que lo habilites.

4. **Despliega las reglas** de Firestore: `firebase deploy --only firestore:rules`
   (están en `web/firestore.rules`). Impiden que un atleta se ascienda solo a
   coach editando su documento desde el navegador.

5. **El icono es un placeholder** (las letras "MH"). Si tienes logo de verdad,
   dímelo y lo pongo (`web/scripts/gen-icons.ts`).

## Decisiones que he tomado por mi cuenta

- **Next.js 16 + React 19 + Tailwind 4 + Firebase**, en `web/`, sin tocar la app
  vieja. Así puedes comparar y volver atrás si algo no te convence.
- **Diseño oscuro, monocromo, con el color reservado para el dato** (deporte,
  intensidad, carga). El estilo Nike de las capturas: tipografía condensada
  enorme, botones en píldora blanca, cero adornos.
- **Firebase se queda** (proyecto `elmetodohibrido`): tus WODs y competiciones ya
  están ahí y no hay razón para migrarlos.
- **El calendario de competiciones 2026 sigue en el código** como respaldo, igual
  que en la app vieja, para que la pestaña no salga vacía.

## Ramas

Todo el trabajo está en la rama **`next-app`**. La rama `main` no se ha tocado.
