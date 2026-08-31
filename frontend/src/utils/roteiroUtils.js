export function getActivitySuggestions({ destino = '', estiloViajante = '', orcamento = '', periodo = '' } = {}) {
  const normalizedDestino = destino.toLowerCase()
  const normalizedEstilo = estiloViajante.toLowerCase()
  const normalizedPeriodo = periodo.toLowerCase()
  const budget = orcamento.toLowerCase()

  const baseSuggestions = [
    'Passeio de barco',
    'Museu de arte',
    'Mercado municipal',
    'Parque',
    'Praia',
    'Mirante'
  ]

  if (normalizedDestino.includes('noronha') || normalizedDestino.includes('praia')) {
    baseSuggestions.unshift('Praia da Baía dos Porcos', 'Snorkeling')
  }

  if (normalizedEstilo.includes('natureza') || normalizedEstilo.includes('trilha')) {
    baseSuggestions.unshift('Trilha leve', 'Cachoeira')
  }

  if (normalizedEstilo.includes('cultural') || normalizedEstilo.includes('gastron')) {
    baseSuggestions.unshift('Tour gastronômico', 'Galeria local')
  }

  if (budget.includes('econ') || budget.includes('moderado')) {
    baseSuggestions.push('Mercado local')
  } else {
    baseSuggestions.push('Experiência premium')
  }

  if (normalizedPeriodo.includes('manhã') || normalizedPeriodo.includes('morning')) {
    baseSuggestions.unshift('Café da manhã local')
  }

  if (normalizedPeriodo.includes('tarde') || normalizedPeriodo.includes('afternoon')) {
    baseSuggestions.unshift('Roda de sunset')
  }

  if (normalizedPeriodo.includes('noite') || normalizedPeriodo.includes('night')) {
    baseSuggestions.unshift('Rooftop com vista')
  }

  return [...new Set(baseSuggestions)].slice(0, 8)
}

export function replaceActivityInRoteiro(roteiro, dayNumber, actionIndex, replacement) {
  if (!roteiro || !Array.isArray(roteiro.dias)) return roteiro

  const next = JSON.parse(JSON.stringify(roteiro))
  const day = next.dias.find((item) => item.numero === dayNumber)

  if (day && Array.isArray(day.acoes)) {
    day.acoes[actionIndex] = replacement
  }

  return next
}
