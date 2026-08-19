# surfReport Lima

App personal de reporte de surf para Lima, Perú. Recomienda a qué playa ir según
las condiciones — con un score único (tamaño + orden de la ola) y etiquetas de
nivel aparte, para que sirva tanto para decidir un pico de avanzado como para
elegir la playa de la escuela de surf de los chicos.

- Contexto y decisiones de arquitectura → [`CLAUDE.md`](CLAUDE.md)
- Hoja de ruta y hallazgos de las APIs → [`docs/PLAN.md`](docs/PLAN.md)
- Conocimiento local por playa → [`docs/SPOTS.md`](docs/SPOTS.md)

## Desarrollo

```bash
npm install
npm run dev   # http://localhost:3010
```

```bash
npm test
```

## Mareas

Las mareas salen de los PDFs oficiales de DIHIDRONAV, que solo publican el mes
corriente. `.github/workflows/refresh-tides.yml` baja y acumula el nuevo mes el
día 1, automáticamente. Para forzarlo a mano:

```bash
pip install pypdf && python3 scripts/refresh_tides.py
```

Si falta el mes, la app sigue funcionando: el score ignora la marea y lo avisa.

## Deploy

Vercel conectado directo al repo de GitHub — despliega solo en cada push a
`main`. No hay workflow de deploy porque sería redundante.

Estado: en desarrollo activo.
