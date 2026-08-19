#!/usr/bin/env python3
"""
Refresca la tabla de mareas del Callao desde DIHIDRONAV.

DIHIDRONAV (Marina de Guerra del Peru) no publica constituyentes armonicas
—son propietarias— pero si publica un PDF mensual con las pleamares y
bajamares ya calculadas. Este script lo baja, lo parsea y lo ACUMULA en
data/tides-callao.json sin perder los meses ya guardados.

IMPORTANTE: el endpoint ignora cualquier parametro de mes/año (probado
2026-08-18: ?mes=09, /09/2026, etc. devuelven el mismo PDF byte a byte).
Siempre trae el MES CORRIENTE. Por eso hay que correrlo una vez por mes —
de eso se encarga .github/workflows/refresh-tides.yml.

Uso:  python3 scripts/refresh_tides.py
Dep:  pip install pypdf
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

URL = "https://www.dhn.mil.pe/portal/pdf-tabla-marea/CALLAO"
OUT = Path(__file__).resolve().parent.parent / "data" / "tides-callao.json"

MESES = {
    "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SET": 9, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12,
}

DIA_RE = re.compile(r"^(\d{2})\s+([A-ZÁÉÍÓÚ]{3})\.?\s+(\d{4})$")


def descargar() -> bytes:
    req = urllib.request.Request(URL, headers={"User-Agent": "surfReport/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def parsear(pdf_bytes: bytes) -> list[dict]:
    from pypdf import PdfReader
    import io

    texto = "\n".join(p.extract_text() or "" for p in PdfReader(io.BytesIO(pdf_bytes)).pages)
    lineas = [l.strip() for l in texto.split("\n") if l.strip()]

    extremos: list[dict] = []
    i = 0
    while i < len(lineas) - 2:
        m = DIA_RE.match(lineas[i])
        if not m:
            i += 1
            continue
        dia, mes_txt, anio = int(m.group(1)), m.group(2), int(m.group(3))
        mes = MESES.get(mes_txt)
        if not mes:
            raise SystemExit(f"Mes desconocido en el PDF: {mes_txt!r}")

        horas = lineas[i + 1].split()
        # Las alturas vienen como "20 cm 96 cm 35 cm 68 cm" -> tomar 1 de cada 2
        crudo = lineas[i + 2].split()
        alturas = crudo[0::2]

        for h, a in zip(horas, alturas):
            if h == "-" or a == "-":
                continue
            hh, mm = h.split(":")
            extremos.append({
                "time": f"{anio}-{mes:02d}-{dia:02d}T{hh}:{mm}:00-05:00",
                "heightCm": int(a),
            })
        i += 3

    if not extremos:
        raise SystemExit("No se extrajo ningun extremo — cambio el formato del PDF?")
    return extremos


def main() -> int:
    nuevos = parsear(descargar())

    previos = []
    if OUT.exists():
        previos = json.loads(OUT.read_text()).get("extremes", [])

    # merge: los nuevos pisan a los previos con el mismo timestamp
    por_tiempo = {e["time"]: e for e in previos}
    por_tiempo.update({e["time"]: e for e in nuevos})
    todos = sorted(por_tiempo.values(), key=lambda e: e["time"])

    meses = sorted({e["time"][:7] for e in todos})
    OUT.write_text(json.dumps({
        "station": "Callao",
        "source": "DIHIDRONAV (Marina de Guerra del Peru) - www.dhn.mil.pe",
        "note": (
            "Pleamares/bajamares oficiales, NO constituyentes armonicas "
            "(DIHIDRONAV no las publica). lib/tide.ts interpola entre estos "
            "puntos. Refrescar con scripts/refresh_tides.py — el endpoint solo "
            "devuelve el mes corriente."
        ),
        "months": meses,
        "extremes": todos,
    }, indent=2, ensure_ascii=False) + "\n")

    agregados = len(todos) - len(previos)
    print(f"meses cubiertos: {', '.join(meses)}")
    print(f"extremos totales: {len(todos)} ({agregados:+d})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
