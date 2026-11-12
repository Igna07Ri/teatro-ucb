# Teatro UCB

## Desarrollo

Instala las dependencias con `npm install` y ejecuta `npm run dev`. Para generar
la versión de producción, usa `npm run build`.

La reserva combina tres componentes: Vue permite elegir una función/horario,
React dibuja el mapa de butacas y Angular presenta el resumen y confirma la
reserva. Cada horario tiene un ID independiente y sus butacas confirmadas se
guardan por separado en `localStorage`.

## Publicación en GitHub Pages

El workflow de GitHub Actions publica automáticamente `dist` cuando se actualiza
la rama `main`. En el repositorio, abre **Settings → Pages** y selecciona
**GitHub Actions** como fuente de publicación. La URL del fork será
`https://<usuario>.github.io/teatro-ucb/`.
