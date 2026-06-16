import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PERGUNTAS_PERSONALIDADE = [
  {
    id: 1,
    pergunta: 'Qual é seu estilo de viagem preferido?',
    opcoes: ['Aventura e trilhas', 'Cultura e história', 'Relaxamento e praia', 'Cidade e gastronomia']
  },
  {
    id: 2,
    pergunta: 'Quanto tempo costuma ficar em uma viagem?',
    opcoes: ['Fim de semana (2-3 dias)', 'Uma semana', 'Duas ou mais semanas', 'Viagens longas (mês+)']
  },
  {
    id: 3,
    pergunta: 'Qual é seu orçamento médio por viagem?',
    opcoes: ['Até R$ 1.000', 'R$ 1.000 a R$ 2.500', 'R$ 2.500 a R$ 5.000', 'Acima de R$ 5.000']
  },
  {
    id: 4,
    pergunta: 'Você prefere viajar sozinho ou em grupo?',
    opcoes: ['Sozinho', 'Com um companheiro', 'Com grupo pequeno (2-4)', 'Com grupo maior (5+)']
  },
  {
    id: 5,
    pergunta: 'Como você gosta de se locomover?',
    opcoes: ['Carro alugado', 'Transporte público', 'A pé ou bicicleta', 'Voos internacionais']
  }
]

export default function Perfil() {
  const navigate = useNavigate()
  const [stage, setStage] = useState('registro') // 'registro' ou 'questionario'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [respostas, setRespostas] = useState({})
  const [status, setStatus] = useState(null)
  const [currentPergunta, setCurrentPergunta] = useState(0)

  function calcularIdade(dataNascimentoStr) {
    const hoje = new Date()
    const dataNasc = new Date(dataNascimentoStr)
    let idade = hoje.getFullYear() - dataNasc.getFullYear()
    const mes = hoje.getMonth() - dataNasc.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
      idade--
    }
    return idade
  }

  function handleContinuar(e) {
    e.preventDefault()

    if (!nome.trim() || !email.trim() || !dataNascimento) {
      setStatus('✗ Preencha todos os campos.')
      return
    }

    if (!email.includes('@')) {
      setStatus('✗ Email inválido.')
      return
    }

    const idade = calcularIdade(dataNascimento)
    if (idade < 18) {
      setStatus('✗ Você precisa ter 18 anos ou mais para se registrar.')
      return
    }

    setStatus(null)
    setStage('questionario')
  }

  function handleResposta(opcao) {
    setRespostas((prev) => ({
      ...prev,
      [PERGUNTAS_PERSONALIDADE[currentPergunta].id]: opcao
    }))

    if (currentPergunta < PERGUNTAS_PERSONALIDADE.length - 1) {
      setCurrentPergunta(currentPergunta + 1)
    }
  }

  async function handleFinalizarQuestionario() {
    setStatus('Salvando perfil...')

    const personalizacao = Object.values(respostas).join(', ')

    try {
      const response = await fetch('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senhaHash: 'senha123',
          fotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}`,
          bio: 'Viajante apaixonado por novas experiências.',
          personalidade: personalizacao,
          orcamentoPerfil: 'R$ 2.500'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('✓ Perfil criado com sucesso!')
        setTimeout(() => navigate('/'), 1500)
      } else {
        setStatus(`✗ Erro ao criar perfil: ${data.erro || 'Tente novamente.'}`)
      }
    } catch (error) {
      setStatus('✗ Erro de conexão com o servidor.')
    }
  }

  return (
    <main className="container mx-auto px-4 py-16 lg:px-8">
      {stage === 'registro' ? (
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Crie sua conta</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">Bem-vindo ao Vambora!</h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Crie seu perfil para começar a planejar suas viagens. Responderemos algumas perguntas para personalizar suas recomendações.
              </p>
            </div>

            {status ? (
              <p className={`rounded-3xl p-4 text-sm font-medium ${status.includes('✓') ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                {status}
              </p>
            ) : null}

            <form className="card space-y-6 p-8" onSubmit={handleContinuar}>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Nome completo
                <input
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Email
                <input
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Data de nascimento
                <input
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  required
                />
              </label>
              <button className="btn-primary w-full" type="submit">
                Continuar
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Questionário de personalidade</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">Conhecendo seu estilo de viagem</h1>
              <p className="mt-3 text-slate-600">
                Progresso: {currentPergunta + 1} de {PERGUNTAS_PERSONALIDADE.length}
              </p>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${((currentPergunta + 1) / PERGUNTAS_PERSONALIDADE.length) * 100}%`
                  }}
                />
              </div>
            </div>

            {status ? (
              <p className={`rounded-3xl p-4 text-sm font-medium ${status.includes('✓') ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                {status}
              </p>
            ) : null}

            <div className="card space-y-6 p-8">
              <h2 className="text-2xl font-semibold text-slate-900">
                {PERGUNTAS_PERSONALIDADE[currentPergunta].pergunta}
              </h2>
              <div className="space-y-3">
                {PERGUNTAS_PERSONALIDADE[currentPergunta].opcoes.map((opcao) => (
                  <button
                    key={opcao}
                    className={`w-full rounded-3xl border-2 p-4 text-left transition ${
                      respostas[PERGUNTAS_PERSONALIDADE[currentPergunta].id] === opcao
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                    onClick={() => handleResposta(opcao)}
                  >
                    <p className="font-medium text-slate-900">{opcao}</p>
                  </button>
                ))}
              </div>

              {currentPergunta === PERGUNTAS_PERSONALIDADE.length - 1 && respostas[PERGUNTAS_PERSONALIDADE[currentPergunta].id] ? (
                <button className="btn-primary w-full" onClick={handleFinalizarQuestionario}>
                  Finalizar e criar perfil
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
