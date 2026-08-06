import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { addStoredRoteiro } from '../data/storage'

const travelStyles = [
  { label: 'Cultural', image: 'https://images.unsplash.com/photo-1517108720076-9b51b5d7c16b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Natureza', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Praia', image: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Gastronômico', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Aventureiro', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Histórico', image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Vida Noturna', image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Relaxamento', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80' }
]

const budgetOptions = [
  { label: 'Econômico', emoji: '💰' },
  { label: 'Intermediário', emoji: '💵' },
  { label: 'Luxo', emoji: '💎' }
]

const styleActions = {
  Cultural: [
    'Visitar um museu local',
    'Passeio por um centro histórico',
    'Conhecer uma exposição de arte',
    'Degustar pratos típicos em restaurante tradicional',
    'Assistir a uma apresentação cultural'
  ],
  Natureza: [
    'Trilha em um parque natural',
    'Visitar cascatas ou mirantes',
    'Passeio ao ar livre em reserva',
    'Observação de paisagens naturais',
    'Relaxar em área verde'
  ],
  Praia: [
    'Aproveitar a manhã na praia',
    'Praticar esportes aquáticos',
    'Relaxar em espreguiçadeira à beira-mar',
    'Tomar sol em praia tranquila',
    'Passeio de barco ao entardecer'
  ],
  Gastronômico: [
    'Almoçar em restaurante local',
    'Fazer tour por feiras gastronômicas',
    'Experimentar sobremesas típicas',
    'Participar de uma aula de culinária',
    'Jantar em um bistrô charmoso'
  ],
  Aventureiro: [
    'Praticar esportes radicais',
    'Descer em rafting ou tirolesa',
    'Explorar uma trilha mais desafiadora',
    'Fazer um passeio off-road',
    'Visitar paisagens inexploradas'
  ],
  Histórico: [
    'Visitar monumentos históricos',
    'Conhecer museus e palácios',
    'Fazer um tour guiado por ruínas',
    'Explorar tradições locais',
    'Descobrir histórias antigas'
  ],
  'Vida Noturna': [
    'Jantar em restaurante com vista',
    'Conferir um bar com música ao vivo',
    'Visitar uma casa noturna elegante',
    'Passear por ruas iluminadas',
    'Tomar um drink em rooftop'
  ],
  Relaxamento: [
    'Dia de spa ou massagem',
    'Relaxar em um lounge tranquilo',
    'Aproveitar piscina com vista',
    'Ler um livro em ambiente sereno',
    'Meditar perto da natureza'
  ]
}

function getSuggestionOptions(destino, styles, budget) {
  const base = styles.length > 0 ? styles : ['Cultural']
  return base.flatMap((style) => {
    const actions = styleActions[style] || []
    return actions.slice(0, 3).map((text) => `${text} em ${destino}`)
  })
}

function generateItinerary(destino, duracao, styles, budget) {
  const sanitized = destino.trim() || 'seu destino'
  const days = Math.max(1, Math.min(10, Number(duracao) || 1))
  const selected = Array.isArray(styles) && styles.length > 0 ? styles : ['Cultural']
  const activitiesPool = selected.flatMap((style) => styleActions[style] || [])
  const defaultPool = ['Visita ao ponto turístico principal', 'Almoço em restaurante típico', 'Passeio tranquilo pela cidade', 'Tempo livre para explorar', 'Relaxar em local agradável']
  const pool = activitiesPool.length > 0 ? activitiesPool : defaultPool

  return Array.from({ length: days }, (_, index) => {
    const day = index + 1
    const theme = selected[index % selected.length]
    const times = ['08:00', '10:30', '13:00', '15:30', '18:00']
    const dayTitle = day === 1 ? `Boas-vindas a ${sanitized}` : day === days ? `Último dia em ${sanitized}` : `Dia ${day} de descobertas`
    return {
      numero: day,
      title: dayTitle,
      description: `Atividades pensadas para um roteiro ${theme.toLowerCase()} e ${budget.toLowerCase()}.`,
      acoes: times.map((time, actionIndex) => ({
        time,
        label: pool[(day * 3 + actionIndex) % pool.length],
        icon: ['☕', '🏛', '🍽', '🌊', '🌅'][actionIndex % 5]
      })),
      sugestoes: getSuggestionOptions(sanitized, [theme], budget)
    }
  })
}

export default function NovoRoteiro() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [destino, setDestino] = useState('')
  const [duracao, setDuracao] = useState(3)
  const [selectedStyles, setSelectedStyles] = useState(['Praia'])
  const [orcamento, setOrcamento] = useState('Econômico')
  const [publico, setPublico] = useState(false)
  const [status, setStatus] = useState(null)
  const [itinerary, setItinerary] = useState([])
  const [replaceModal, setReplaceModal] = useState({ open: false, day: null, actionIndex: null, options: [], selected: null })

  useEffect(() => {
    if (step === 4) {
      setItinerary(generateItinerary(destino, duracao, selectedStyles, orcamento))
    }
  }, [step, destino, duracao, selectedStyles, orcamento])

  function handleNext() {
    if (step === 1) {
      if (!destino.trim()) {
        setStatus('Informe um destino para continuar.')
        return
      }
      if (!duracao || duracao < 1) {
        setStatus('Defina a quantidade de dias da viagem.')
        return
      }
    }

    if (step === 2 && selectedStyles.length === 0) {
      setStatus('Selecione pelo menos um estilo de viagem.')
      return
    }

    if (step === 3 && !orcamento) {
      setStatus('Escolha um orçamento para continuar.')
      return
    }

    setStatus(null)
    setStep((prev) => Math.min(4, prev + 1))
  }

  function handlePrev() {
    setStatus(null)
    setStep((prev) => Math.max(1, prev - 1))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (step < 4) {
      handleNext()
      return
    }

    if (!destino.trim()) {
      setStatus('Informe um destino antes de salvar o roteiro.')
      return
    }

    const newRoteiro = {
      id: `roteiro-${Date.now()}`,
      titulo: `Roteiro em ${destino}`,
      destino,
      duracao,
      orcamento,
      publico,
      estiloViajante: selectedStyles.join(' • '),
      createdAt: new Date().toISOString(),
      dias: itinerary
    }

    addStoredRoteiro(newRoteiro)
    navigate('/roteiros')
  }

  function openReplaceModal(dayNumber, actionIndex) {
    const day = itinerary.find((d) => d.numero === dayNumber)
    const period = day?.title || ''
    const options = getSuggestionOptions(destino, selectedStyles, orcamento).filter(Boolean)
    const unique = Array.from(new Set(options))
    setReplaceModal({ open: true, day: dayNumber, actionIndex, options: unique, selected: unique[0] || null })
  }

  function closeReplaceModal() {
    setReplaceModal({ open: false, day: null, actionIndex: null, options: [], selected: null })
  }

  function confirmReplace() {
    if (!replaceModal.selected) return
    setItinerary((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      const day = next.find((d) => d.numero === replaceModal.day)
      if (day) {
        const a = day.acoes[replaceModal.actionIndex]
        // action stored as object with time, label, icon
        if (typeof a === 'object') {
          day.acoes[replaceModal.actionIndex].label = replaceModal.selected
        } else {
          day.acoes[replaceModal.actionIndex] = replaceModal.selected
        }
      }
      return next
    })
    closeReplaceModal()
    setStatus('Ação substituída localmente.')
  }

  const stepTitles = ['Destino e dias', 'Estilo de viagem', 'Orçamento', 'Seu roteiro']

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-6xl flex-col justify-center gap-8">
        <div className="rounded-[36px] bg-white p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm uppercase tracking-[0.34em] text-[#0F4C81]">Criar novo roteiro</p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">Montar roteiro passo a passo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Escolha o destino e a duração, selecione seu estilo de viagem, defina o orçamento e confira o itinerário gerado por dia.
          </p>
        </div>

        <form className="rounded-[36px] bg-white p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)]" onSubmit={handleSubmit}>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#0F4C81]">Etapa {step}</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">{stepTitles[step - 1]}</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
              {step === 4 ? '100% concluído' : `${step * 25}% concluído`}
            </div>
          </div>

          {status ? (
            <div className="mb-8 rounded-[32px] bg-red-50 px-5 py-4 text-sm text-red-700">
              {status}
            </div>
          ) : null}

          {step === 1 && (
            <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Destino e dias</p>
              <h3 className="mt-4 text-3xl font-black text-slate-900">Para onde você quer ir?</h3>
              <p className="mt-3 text-sm text-slate-600">Defina o destino e a duração da viagem para iniciar seu roteiro.</p>

              <div className="mt-10 grid gap-6">
                <label className="grid gap-3 text-left text-sm text-slate-700">
                  Destino
                  <input
                    value={destino}
                    onChange={(event) => setDestino(event.target.value)}
                    placeholder="Por exemplo: Lisboa, Maldivas, Chapada Diamantina"
                    className="w-full rounded-[28px] border border-slate-300 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#0F4C81]"
                  />
                </label>
                <label className="grid gap-3 text-left text-sm text-slate-700">
                  Quantidade de dias
                  <input
                    type="number"
                    min={1}
                    value={duracao}
                    onChange={(event) => setDuracao(Number(event.target.value))}
                    className="w-full rounded-[28px] border border-slate-300 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#0F4C81]"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-8">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Qual é o seu estilo de viagem?</p>
                <p className="mt-3 text-sm text-slate-600">Selecione um ou mais estilos para personalizar suas atividades.</p>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-4">
                {travelStyles.map((style) => {
                  const active = selectedStyles.includes(style.label)
                  return (
                    <button
                      key={style.label}
                      type="button"
                      onClick={() => {
                        setSelectedStyles((current) =>
                          current.includes(style.label)
                            ? current.filter((item) => item !== style.label)
                            : [...current, style.label]
                        )
                      }}
                      className={`min-w-[220px] overflow-hidden rounded-[32px] border bg-white shadow-sm transition ${
                        active ? 'border-[#0F4C81] ring-2 ring-[#0F4C81]/25' : 'border-slate-200 hover:border-[#0F4C81]'
                      }`}
                    >
                      <div className="h-44 overflow-hidden bg-slate-200">
                        <img src={style.image} alt={style.label} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-5 text-center">
                        <p className="text-lg font-semibold text-slate-900">{style.label}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-8">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Qual é o seu orçamento?</p>
                <p className="mt-3 text-sm text-slate-600">Escolha uma opção para ajustar as sugestões do roteiro.</p>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-4">
                {budgetOptions.map((option) => {
                  const active = orcamento === option.label
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setOrcamento(option.label)}
                      className={`min-w-[220px] rounded-[32px] border bg-white p-6 text-left shadow-sm transition ${
                        active ? 'border-[#0F4C81] ring-2 ring-[#0F4C81]/25' : 'border-slate-200 hover:border-[#0F4C81]'
                      }`}
                    >
                      <div className="flex h-14 items-center justify-center rounded-[24px] bg-slate-100 text-4xl">
                        {option.emoji}
                      </div>
                      <div className="mt-5">
                        <p className="text-xl font-semibold text-slate-900">{option.label}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Seu roteiro está quase pronto</p>
                <p className="mt-3 text-sm text-slate-600">Desça para ver cada dia com atividades, horários e ícones.
                </p>
              </div>

              <div className="space-y-8">
                {itinerary.map((day) => (
                  <div key={day.numero} className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                    <div className="text-center">
                      <p className="text-sm uppercase tracking-[0.24em] text-[#0F4C81]">DIA {day.numero}</p>
                      <h3 className="mt-4 text-3xl font-black text-slate-900">{day.title}</h3>
                      <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">{day.description}</p>
                    </div>

                    <div className="mt-10 grid gap-4">
                      {day.acoes.map((action, actionIndex) => (
                        <motion.button
                          key={`${day.numero}-${action.time}-${actionIndex}`}
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-left shadow-sm"
                          onClick={() => openReplaceModal(day.numero, actionIndex)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#EFF6FF] text-2xl">
                              {action.icon}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{action.time}</p>
                              <p className="mt-2 text-sm text-slate-700">{action.label}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[#0F4C81]">Trocar</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[36px] border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Visibilidade</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-center gap-4 rounded-[28px] border px-5 py-4 transition ${publico ? 'border-[#0F4C81] bg-white shadow-sm' : 'border-slate-200 bg-slate-100'}`}>
                    <input type="radio" name="visibilidade" checked={publico} onChange={() => setPublico(true)} className="h-4 w-4 text-[#0F4C81]" />
                    <div>
                      <p className="font-semibold text-slate-900">Público</p>
                      <p className="text-sm text-slate-600">Compartilhe seu roteiro com a comunidade.</p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-4 rounded-[28px] border px-5 py-4 transition ${!publico ? 'border-[#0F4C81] bg-white shadow-sm' : 'border-slate-200 bg-slate-100'}`}>
                    <input type="radio" name="visibilidade" checked={!publico} onChange={() => setPublico(false)} className="h-4 w-4 text-[#0F4C81]" />
                    <div>
                      <p className="font-semibold text-slate-900">Privado</p>
                      <p className="text-sm text-slate-600">Mantenha seu roteiro apenas para você.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {step > 1 ? (
              <button type="button" className="btn-secondary" onClick={handlePrev}>
                Voltar
              </button>
            ) : null}
            <button type="button" className="btn-primary" onClick={handleNext}>
              {step < 4 ? 'Continuar' : 'Salvar roteiro'}
            </button>
          </div>
        </form>
      </div>
      {replaceModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeReplaceModal} />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold text-slate-900">Substituir atividade</h3>
            <p className="mt-2 text-sm text-slate-600">Escolha uma opção compatível com destino, estilo e orçamento.</p>

            <div className="mt-4 space-y-3 max-h-60 overflow-auto">
              {replaceModal.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                    replaceModal.selected === opt ? 'bg-slate-100 border border-slate-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="replaceOption"
                    checked={replaceModal.selected === opt}
                    onChange={() => setReplaceModal((prev) => ({ ...prev, selected: opt }))}
                    className="h-4 w-4 text-[#0F4C81]"
                  />
                  <div className="text-sm text-slate-800">{opt}</div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={closeReplaceModal}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={confirmReplace}>
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </main>
  )
}
