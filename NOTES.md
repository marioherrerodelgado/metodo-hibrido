# Metodo App - Estado del Proyecto (24 Mar 2026)

## Archivos clave
- `index.html`
- `styles.css`
- `app.js`
- `timer.html`
- `favicon.svg`
- `admin.html`

## Cambios ya hechos
- Se separo la app en:
  - `index.html` (estructura)
  - `styles.css` (estilos)
  - `app.js` (logica)
- Barra inferior y overlays corregidos para evitar elementos tapados.
- Navegacion `Hoy` mejorada:
  - Al abrir, va a hoy.
  - Si vienes de `Mes/Competiciones/Mi Box`, al pulsar `Hoy` vuelve al dia actual.
- Cabecera y filtros en vista principal fijados arriba (`sticky`) para que siempre se vean durante el scroll.
- Popup de `Mes` ajustado:
  - Se cierra al navegar a `Hoy`, `Competiciones`, `Mi Box`.
  - Boton `Mes` funciona como toggle (abrir/cerrar).
- Textos corruptos por codificacion arreglados (acentos y caracteres especiales).
- Favicon añadido:
  - `<head>` de `index.html`
  - Tambien en bloque de `Mi Box`.
- Seccion `Mi Box` ampliada:
  - `Timer WOD` (enlace a `timer.html`)
  - `Reservar clases` (intento abrir Wodbuster + fallback web)
  - `Equipate` (camisetas y sudaderas)
  - `Soporte del centro` (direccion editable)
- `timer.html` creado como archivo separado, estilo alineado con la app.
- Parser de `admin.html` mejorado para CSV:
  - Limpia BOM en cabeceras
  - Normaliza claves
  - Acepta fechas `YYYY-MM-DD`, `DD/MM/YYYY` y numericas de Excel

## Pendiente recomendado
- Poner direccion real del centro en `Mi Box`.
- Confirmar URL/scheme final de Wodbuster para iOS/Android.
- Si se desea, conectar `Equipate` con tienda real (links o checkout).
- Revisar codificacion UTF-8 de todos los archivos (sin caracteres raros).

## Excel/CSV
- El import de WODs en admin acepta `.xlsx` y `.csv`.
- Archivo generado con estilo parecido al ejemplo:
  - `wods_marzo_abril_estilo_happy_athlete.xlsx`
- CSV de entrenos creado:
  - `wods_marzo_abril_solo_entrenos.csv`

## Nota para retomar en otro PC
1. Clonar este repo.
2. Abrir carpeta del proyecto.
3. Revisar este `NOTES.md`.
4. Seguir desde los archivos clave listados arriba.
