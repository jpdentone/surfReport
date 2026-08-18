/**
 * Frase en lenguaje llano a partir de los mismos datos que ya alimentan el
 * score — para alguien que nunca leyo un reporte de surf, "grande y
 * ordenada" dice mas que "periodo 9.95s".
 */
export function plainSummary(breaking: number, period: number, windSpeed: number): string {
  const size =
    breaking < 0.4 ? 'chica' : breaking < 0.8 ? 'media' : breaking < 1.5 ? 'grande' : 'muy grande'

  const order = period >= 13 ? 'ordenada' : period >= 10 ? 'algo ordenada' : 'picada'

  let phrase = `${size} y ${order}`
  if (windSpeed > 25) phrase += ', con viento'

  return phrase.charAt(0).toUpperCase() + phrase.slice(1)
}
