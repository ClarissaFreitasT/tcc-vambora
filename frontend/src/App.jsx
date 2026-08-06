import { useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ImageFallback from './components/ImageFallback'
import HeroBlobs from './components/HeroBlobs'
import { motion } from 'framer-motion'

const categories = [
  { label: 'Cultural', image: 'https://images.unsplash.com/photo-1526318472351-c75fcf07052a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Praia', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Natureza', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Gastronômico', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Aventura', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Histórico', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Mochilão', image: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Vida Noturna', image: 'https://images.unsplash.com/photo-1483723608457-7a44b3c6c2d8?auto=format&fit=crop&w=1200&q=80' }
]

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

  return (
    <main className="site-shell">
      <Navbar />

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <ImageFallback src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80" alt="Praia" className="h-full w-full object-cover" />
        </div>
        <HeroBlobs className="pointer-events-none absolute -top-8 left-0 right-0 z-10 h-[420px] w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center py-24 px-6 text-center z-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full rounded-[28px] bg-white/95 p-12 shadow-lg">
            <h1 className="text-4xl font-black text-slate-900">Planeje sua próxima viagem</h1>
            <p className="mt-4 max-w-2xl mx-auto text-slate-700">
              Crie roteiros totalmente personalizados com sugestões automáticas para cada dia da viagem.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button className="btn-primary" onClick={() => navigate('/roteiros/novo')}>Criar roteiro</button>
              <button className="btn-secondary" onClick={() => navigate('/comunidade')}>Ver comunidade</button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Categories */}
      <section className="container mx-auto px-6 py-20">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Categorias</p>
          <h2 className="mt-2 text-3xl font-black text-[#0F172A]">Explore por tipo de viagem</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <motion.div key={cat.label} className="group overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-sm transition hover:shadow-lg" whileHover={{ scale: 1.02 }}>
              <div className="aspect-[4/3] overflow-hidden">
                <ImageFallback src={cat.image} alt={cat.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-[#0F172A]">{cat.label}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Destinos populares */}
      <section className="container mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Destinos populares</p>
          <h2 className="mt-2 text-3xl font-black text-[#0F172A]">Os destinos que inspiram</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinos.map((d) => (
            <motion.div key={d.id} className="overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-sm transition hover:shadow-lg" whileHover={{ y: -4 }}>
              <div className="aspect-[5/4] overflow-hidden">
                <ImageFallback src={d.image} alt={d.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#0F172A]">{d.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roteiros em destaque */}
      <section className="container mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Roteiros em destaque</p>
          <h2 className="mt-2 text-3xl font-black text-[#0F172A]">Explore roteiros selecionados</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {destaque.map((r) => (
            <motion.div key={r.id} className="card overflow-hidden" whileHover={{ scale: 1.02 }}>
              <div className="aspect-[4/3] overflow-hidden">
                <ImageFallback src={r.image} alt={r.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#0F172A]">{r.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Por que escolher */}
      <section className="container mx-auto px-6 py-16">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Por que escolher o VAMBORA</p>
          <h2 className="mt-2 text-3xl font-black text-[#0F172A]">Tudo que você precisa para planejar</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-8 transition hover:scale-[1.02] hover:shadow-lg">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-[#0F172A]">{f.title}</h3>
              <p className="mt-3 text-[#64748B]">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comunidade */}
      <section className="container mx-auto px-6 py-16">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Nossa comunidade</p>
          <h2 className="mt-2 text-3xl font-black text-[#0F172A]">Publicações recentes</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {comunidade.map((post) => (
            <motion.div key={post.id} className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-sm" whileHover={{ y: -4 }}>
              <div className="flex items-center gap-3">
                <ImageFallback src={post.avatar} alt={post.nome} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-[#0F172A]">{post.nome}</p>
                  <p className="text-sm text-[#64748B]">{post.dias} dias · {post.destino}</p>
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-[12px]">
                <ImageFallback src={post.mini} alt="miniatura" className="h-40 w-full object-cover" />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-[#64748B]">
                <div>❤️ {post.curtidas} · 💬 {post.comentarios}</div>
                <button className="btn-secondary" onClick={() => navigate('/roteiros')}>Ver roteiro</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-4">
            <div>
              <p className="text-xl font-black text-[#0F172A]">✈️ VAMBORA</p>
              <p className="mt-4 text-[#64748B]">Planeje suas viagens dos sonhos com roteiros curados pela comunidade.</p>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">Produto</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Roteiros</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Comunidade</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Sobre</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">Recursos</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Blog</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Suporte</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Contato</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">Legal</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Privacidade</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Termos</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-[#E2E8F0] pt-8 text-center">
            <p className="text-[#64748B]">© 2026 VAMBORA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
