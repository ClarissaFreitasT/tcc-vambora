import { getActivitySuggestions, replaceActivityInRoteiro } from '../utils/roteiroUtils.js'

describe('roteiroUtils', () => {
  it('returns contextual suggestions for a coastal destination in the morning', () => {
    const suggestions = getActivitySuggestions({
      destino: 'Fernando de Noronha',
      estiloViajante: 'Praia e relax',
      orcamento: 'Conforto',
      periodo: 'Manhã'
    })

    expect(suggestions).toEqual(expect.arrayContaining(['Passeio de barco', 'Praia da Baía dos Porcos']))
  })

  it('replaces only the selected activity in the target day', () => {
    const roteiro = {
      dias: [
        {
          numero: 1,
          acoes: ['Café da manhã', 'Museu', 'Praia']
        }
      ]
    }

    const updated = replaceActivityInRoteiro(roteiro, 1, 1, 'Mercado local')

    expect(updated.dias[0].acoes[0]).toBe('Café da manhã')
    expect(updated.dias[0].acoes[1]).toBe('Mercado local')
    expect(updated.dias[0].acoes[2]).toBe('Praia')
  })
})
