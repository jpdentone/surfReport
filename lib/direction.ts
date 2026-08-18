const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']

/** Grados (0-360, convencion meteorologica: de donde viene) -> punto cardinal en espanol. */
export function toCardinal(deg: number): string {
  const idx = Math.round(deg / 22.5) % 16
  return CARDINALS[idx]
}
