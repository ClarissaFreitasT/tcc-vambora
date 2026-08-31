import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ImageFallback from './components/ImageFallback'
import HeroBlobs from './components/HeroBlobs'
import { motion } from 'framer-motion'

const categories = [
  { label: 'Praia', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', span: 'lg:col-span-1' },
  { label: 'Natureza', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', span: 'lg:col-span-1' },
  { label: 'Cultural', image: 'https://images.unsplash.com/photo-1526318472351-c75fcf07052a?auto=format&fit=crop&w=1200&q=80', span: 'lg:col-span-1' },
  { label: 'Gastronômico', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', span: 'lg:col-span-1' },
  { label: 'Aventura', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', span: 'lg:col-span-1' },
  { label: 'Histórico', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', span: 'lg:col-span-1' }
]

const destinationCatalog = {
  Praia: [
    { name: 'Fernando de Noronha', region: 'Pernambuco', description: 'Praias intocadas, mergulho e paisagens naturais.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Jericoacoara', region: 'Ceará', description: 'Dunas, pôr do sol e um clima de desconexão.', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Maragogi', region: 'Alagoas', description: 'Recifes de corais e mar cristalino.', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80' }
  ],
  Natureza: [
    { name: 'Chapada Diamantina', region: 'Bahia', description: 'Cachoeiras, trilhas e mirantes impressionantes.', image: 'https://images.unsplash.com/photo-1500534285749-7cff9e0f2b1d?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Bonito', region: 'Mato Grosso do Sul', description: 'Rios transparentes e natureza exuberante.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Amazônia', region: 'Amazonas', description: 'Floresta, rios e biodiversidade única.', image: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1200&q=80' }
  ],
  Cultural: [
    { name: 'Lisboa', region: 'Portugal', description: 'Azulejos, miradouros e uma energia urbana acolhedora.', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Roma', region: 'Itália', description: 'História, arte e ruas cheias de personalidade.', image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Kyoto', region: 'Japão', description: 'Templos, jardins e uma atmosfera serena.', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80' }
  ],
  Gastronômico: [
    { name: 'São Paulo', region: 'Brasil', description: 'Restaurantes premiados e mercados cheios de sabor.', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Belo Horizonte', region: 'Brasil', description: 'Café, comida mineira e um clima acolhedor.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Napóles', region: 'Itália', description: 'Pizza, ruas animadas e uma cultura vibrante.', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' }
  ],
  Aventura: [
    { name: 'Chapada dos Veadeiros', region: 'Goiás', description: 'Cachoeiras, trilhas e paisagens de tirar o fôlego.', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Patagônia', region: 'Chile', description: 'Montanhas, lagos e experiências de alto impacto.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Interlaken', region: 'Suíça', description: 'Montanhas, trekking e aventuras ao ar livre.', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80' }
  ],
  Histórico: [
    { name: 'Machu Picchu', region: 'Peru', description: 'Patrimônio histórico e vistas inesquecíveis.', image: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Athens', region: 'Grécia', description: 'Ruínas clássicas e um contexto histórico marcante.', image: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Cusco', region: 'Peru', description: 'Cidade histórica com forte presença cultural.', image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80' }
  ]
}

const destinos = [
  { id: 'lisboa', title: 'Lisboa', image: 'https://images.unsplash.com/photo-1503820503912-1b9b1b6f3b7b?auto=format&fit=crop&w=1400&q=80' },
  { id: 'noronha', title: 'Fernando de Noronha', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80' },
  { id: 'chapada', title: 'Chapada Diamantina', image: 'https://images.unsplash.com/photo-1500534285749-7cff9e0f2b1d?auto=format&fit=crop&w=1400&q=80' },
  { id: 'gramado', title: 'Gramado', image: 'https://images.unsplash.com/photo-1526481280693-3ce3b41b5ae5?auto=format&fit=crop&w=1400&q=80' }
]

const destaque = [
  { id: 'noronha', title: 'Fernando de Noronha', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80' },
  { id: 'gramado', title: 'Gramado', image: 'https://images.unsplash.com/photo-1526481280693-3ce3b41b5ae5?auto=format&fit=crop&w=1400&q=80' },
  { id: 'chapada', title: 'Chapada Diamantina', image: 'https://images.unsplash.com/photo-1500534285749-7cff9e0f2b1d?auto=format&fit=crop&w=1400&q=80' },
  { id: 'rio', title: 'Rio de Janeiro', image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1400&q=80' },
  { id: 'jericoacoara', title: 'Jericoacoara', image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1400&q=80' }
]

const features = [
  { icon: '🗺️', title: 'Roteiros inteligentes', description: 'Sugestões diárias personalizadas conforme seu perfil.' },
  { icon: '📅', title: 'Planejamento flexível', description: 'Adapte horários e atividades com facilidade.' },
  { icon: '🤝', title: 'Compartilhe com a comunidade', description: 'Decida se seu roteiro será público ou privado.' }
]

const comunidade = [
  { id: 1, nome: 'Ana Silva', destino: 'Lisboa', dias: 7, curtidas: 245, comentarios: 31, avatar: 'https://i.pravatar.cc/120?img=32', mini: 'https://images.unsplash.com/photo-1503820503912-1b9b1b6f3b7b?auto=format&fit=crop&w=600&q=80' },
  { id: 2, nome: 'Lucas Oliveira', destino: 'Fernando de Noronha', dias: 5, curtidas: 198, comentarios: 18, avatar: 'https://i.pravatar.cc/120?img=12', mini: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 3, nome: 'Mariana Costa', destino: 'Gramado', dias: 6, curtidas: 310, comentarios: 42, avatar: 'https://i.pravatar.cc/120?img=47', mini: 'https://images.unsplash.com/photo-1526481280693-3ce3b41b5ae5?auto=format&fit=crop&w=600&q=80' },
  { id: 4, nome: 'Rafael Souza', destino: 'Japão', dias: 10, curtidas: 521, comentarios: 77, avatar: 'https://i.pravatar.cc/120?img=5', mini: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80' }
]

export default function App() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('Praia')
  const [selectedDestination, setSelectedDestination] = useState(null)

  const availableDestinations = destinationCatalog[activeCategory] || []
  const continueDisabled = !selectedDestination

  const selectedSummary = useMemo(() => {
    if (!selectedDestination) return 'Escolha um destino para continuar.'
    return `Destino selecionado: ${selectedDestination.name}`
  }, [selectedDestination])

  function selectCategory(label) {
    setActiveCategory(label)
  }

  function handleSelectDestination(destination) {
    setSelectedDestination(destination)
  }

  return (
    <main className="site-shell relative overflow-hidden">
      <Navbar />

      <header className="relative isolate overflow-hidden">
        <motion.div
          initial={{ scale: 1.03, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <ImageFallback src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80" alt="Praia" className="h-full w-full object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.72)_0%,rgba(2,6,23,0.36)_45%,rgba(2,6,23,0.14)_100%)]" />
        <HeroBlobs className="pointer-events-none absolute inset-0 z-10 opacity-80" />
        <div className="relative mx-auto flex min-h-[84vh] max-w-7xl items-center justify-center px-6 py-24 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="w-full max-w-2xl rounded-[32px] border border-white/20 bg-white/12 p-7 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-100">Nova geração de roteiros</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
              Planeje viagens inesquecíveis com um roteiro inteligente.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-200">
              Monte um roteiro personalizado com base no seu estilo, orçamento e destino.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary transition duration-250 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(37,99,235,0.25)]" onClick={() => navigate('/roteiros/novo')}>Criar roteiro</button>
              <button className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate('/comunidade')}>Explorar comunidade</button>
            </div>
          </motion.div>
        </div>
      </header>

      <section className="container py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Categorias</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Escolha uma categoria e descubra destinos</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-600">Explore destinos realistas por tema e selecione aquele que combina com sua próxima viagem.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.label

            return (
              <motion.button
                key={cat.label}
                type="button"
                onClick={() => selectCategory(cat.label)}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className={`group relative overflow-hidden rounded-[28px] border text-left shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition duration-250 ${isActive ? 'border-[#2563EB] bg-blue-50 shadow-[0_20px_60px_rgba(37,99,235,0.16)]' : 'border-slate-200 bg-white hover:border-[#93c5fd]'}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ImageFallback src={cat.image} alt={cat.label} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
                </div>
                <div className="p-5">
                  <p className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${isActive ? 'border-[#2563EB] bg-white text-[#2563EB]' : 'border-white/30 bg-white/80 text-slate-900'}`}>
                    {cat.label}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">Descubra destinos inspirados em {cat.label.toLowerCase()}.</p>
                </div>
              </motion.button>
            )
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Destinos para {activeCategory}</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Sugestões compatíveis</h3>
            </div>
            <p className="text-sm text-slate-600">Clique em um destino para selecioná-lo.</p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {availableDestinations.map((destination) => {
              const selected = selectedDestination?.name === destination.name

              return (
                <motion.article key={destination.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className={`overflow-hidden rounded-[24px] border bg-slate-50 shadow-sm transition duration-250 ${selected ? 'border-[#2563EB] bg-blue-50 shadow-[0_14px_40px_rgba(37,99,235,0.14)]' : 'border-slate-200'}`}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <ImageFallback src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{destination.name}</h4>
                        <p className="mt-1 text-sm text-slate-600">{destination.region}</p>
                      </div>
                      {selected ? <span className="rounded-full bg-[#2563EB] px-2.5 py-1 text-xs font-semibold text-white">✓</span> : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{destination.description}</p>
                    <button className={`mt-5 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition duration-250 ${selected ? 'bg-[#2563EB] text-white' : 'bg-white text-slate-800 hover:bg-slate-100'}`} onClick={() => handleSelectDestination(destination)}>
                      {selected ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </motion.div>

        <div className="mt-8 flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">{selectedSummary}</p>
          <button className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none" disabled={continueDisabled} onClick={() => navigate('/roteiros')}>
            Continuar
          </button>
        </div>
      </section>

      <section className="container py-6 lg:py-10">
        <div className="rounded-[36px] border border-slate-200 bg-white/85 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Destinos populares</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Cidades e paisagens que inspiram a próxima saída</h2>
              <p className="mt-4 max-w-2xl text-slate-600">A combinação entre mar, natureza, cultura e gastronomia transforma cada destino num convite à descoberta.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {destinos.map((destino) => (
                <motion.div key={destino.id} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50" whileHover={{ y: -4 }}>
                  <div className="aspect-[5/4] overflow-hidden">
                    <ImageFallback src={destino.image} alt={destino.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{destino.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Roteiros em destaque</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Itinerários prontos para ganhar vida</h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/roteiros')}>Ver todos</button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {destaque.slice(0, 3).map((roteiro, index) => (
            <motion.article key={roteiro.id} className={`overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.08)] ${index === 1 ? 'lg:-translate-y-4' : ''}`} whileHover={{ y: -6, scale: 1.01 }}>
              <div className="aspect-[5/4] overflow-hidden">
                <ImageFallback src={roteiro.image} alt={roteiro.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#2563EB]">Curadoria premium</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{roteiro.title}</h3>
                <p className="mt-3 text-sm text-slate-600">Ideal para quem quer um balance perfeito entre descanso, cultura e impacto visual.</p>
                <button className="mt-5 btn-secondary" onClick={() => navigate('/roteiros')}>Abrir roteiro</button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="container py-6 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Por que escolher</p>
            <h2 className="mt-3 text-3xl font-black">Uma plataforma que parece inteligente desde o primeiro clique</h2>
            <p className="mt-4 max-w-xl text-slate-300">Toda interação foi pensada para transmitir clareza, fluidez e sensação premium, sem perder a personalidade do produto.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-[20px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-2xl">{feature.icon}</div>
                  <h3 className="mt-3 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Comunidade</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">Viagens compartilhadas por exploradores reais</h2>
            <div className="mt-6 space-y-4">
              {comunidade.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                  <ImageFallback src={post.avatar} alt={post.nome} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{post.nome}</p>
                    <p className="text-sm text-slate-600">{post.destino} · {post.dias} dias</p>
                  </div>
                  <button className="btn-secondary px-4 py-2" onClick={() => navigate('/roteiros')}>Ver</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80 py-12 lg:py-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-4">
            <div>
              <p className="text-xl font-black text-slate-900">✈️ VAMBORA</p>
              <p className="mt-4 text-slate-600">Planeje suas viagens dos sonhos com roteiros curados pela comunidade.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Produto</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Roteiros</a></li>
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Comunidade</a></li>
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Sobre</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Recursos</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Blog</a></li>
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Suporte</a></li>
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Contato</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Legal</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Privacidade</a></li>
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Termos</a></li>
                <li><a href="#" className="text-slate-600 transition hover:text-[#2563EB]">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-200 pt-8 text-center">
            <p className="text-slate-500">© 2026 VAMBORA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
