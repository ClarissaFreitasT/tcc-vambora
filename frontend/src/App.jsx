const destinations = [
  {
    title: 'Lisboa',
    country: 'Portugal',
    category: 'City Escape',
    rating: '4.9',
    description: 'Passeios a pé, gastronomia local e rooftop views no coração de Lisboa.',
    image:
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Ilhas Maldivas',
    country: 'Maldives',
    category: 'Luxury Retreat',
    rating: '4.8',
    description: 'Resorts sobre a água, mergulho privativo e praias com areia branca.',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Patagônia',
    country: 'Argentina',
    category: 'Nature & Trek',
    rating: '4.9',
    description: 'Trilhas glaciares, mirantes épicos e contacto profundo com a natureza.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Kyoto',
    country: 'Japão',
    category: 'Culture Journey',
    rating: '4.8',
    description: 'Templos ancestrais, cerimônias de chá e bairros com charme histórico.',
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
  }
]

const communityStories = [
  {
    name: 'Sofia',
    headline: 'Um roteiro de experiência local em Lisboa',
    image:
      'https://images.unsplash.com/photo-1519817650390-64a93db5112b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'João',
    headline: 'Trilha exclusiva na Patagônia com guia especializado',
    image:
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Mariana',
    headline: 'Fotografia, gastronomia e descobertas em Kyoto',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  }
]

const profileHighlights = [
  {
    label: 'Viagens concluídas',
    value: '24'
  },
  {
    label: 'Roteiros ativos',
    value: '6'
  },
  {
    label: 'Destinos favoritos',
    value: '12'
  }
]

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './components/Navbar'

function App() {
  const navigate = useNavigate()
  const [roteiros, setRoteiros] = useState([])
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/roteiros')
      .then((r) => r.json())
      .then(setRoteiros)
      .catch(() => setRoteiros([]))

    fetch('http://localhost:3000/usuarios')
      .then((r) => r.json())
      .then(setUsuarios)
      .catch(() => setUsuarios([]))
  }, [])

  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <main className="site-shell">
      <Navbar />
      <motion.section className="hero-section" initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5 }}>
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Planeje · Conecte · Compartilhe</span>
            <h1>Ferramenta e comunidade para planejar suas viagens.</h1>
            <p>
              Crie roteiros personalizados, organize por dias e atividades, e compartilhe experiências com outros viajantes.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/roteiros')}>Explorar roteiros</button>
              <button className="btn btn-secondary" onClick={() => navigate('/comunidade')}>Explorar comunidade</button>
              <button className="btn btn-primary" onClick={() => navigate('/roteiros/novo')}>Criar Roteiro</button>
            </div>
            <div className="hero-pill-grid">
              <div className="pill-card">
                <strong>60+</strong>
                <span>destinos selecionados</span>
              </div>
              <div className="pill-card">
                <strong>95%</strong>
                <span>de aprovação entre viajantes</span>
              </div>
              <div className="pill-card">
                <strong>20k+</strong>
                <span>experiências compartilhadas</span>
              </div>
            </div>
          </div>

          <div className="hero-media">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
              alt="Casal em viagem na praia"
            />
            <div className="hero-overlay" />
            <div className="hero-media-signal">
              <span>Curadoria premium</span>
              <strong>Destino em destaque</strong>
            </div>
          </div>
          </div>
        </motion.section>

      <section className="section section-destinos fade-in">
        <div className="container section-heading">
          <div>
            <span className="eyebrow">Destinos em destaque</span>
            <h2>Roteiros públicos e destaques</h2>
          </div>
          <button className="btn btn-secondary btn-outline" onClick={() => navigate('/roteiros')}>Ver todos</button>
        </div>
        <div className="container card-grid destination-grid">
          {roteiros.slice(0, 8).map((r) => (
            <motion.article layout whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }} className="card destination-card" key={r.id}>
              <div className="card-media">
                <img src={r.imagem || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.destino || r.titulo)}`} alt={r.titulo} />
                <div className="card-media-overlay" />
                <div className="destination-tag">
                  <span>{r.destino}</span>
                  <span className="rating">{r.orcamento || '-'}</span>
                </div>
              </div>
              <div className="card-content">
                <p className="destination-location">
                  {r.titulo}
                </p>
                <p>{r.descricao}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section section-community fade-in">
        <div className="container section-heading">
          <div>
            <span className="eyebrow">Comunidade</span>
            <h2>Histórias reais de viajantes</h2>
          </div>
        </div>
        <div className="container community-grid">
          {usuarios.slice(0, 9).map((u) => (
            <motion.article key={u.id} className="card community-card" whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }}>
              <div className="community-media">
                <img src={u.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome || 'Viajante')}`} alt={u.nome} />
              </div>
              <div className="community-copy">
                <p className="eyebrow">{u.nome}</p>
                <h3>{u.bio || 'Compartilhou experiências recentemente'}</h3>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section section-profile fade-in">
        <div className="container profile-shell card">
          <div className="profile-cover">
            <img
              src="https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80"
              alt="Foto de viagem como cover"
            />
            <div className="profile-cover-overlay" />
          </div>
          <div className="profile-main">
            <div className="profile-avatar">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
                alt="Avatar do perfil"
              />
            </div>
            <div className="profile-intro">
              <span className="eyebrow">Perfil</span>
              <h2>Design de perfil moderno para viajantes que buscam experiências memoráveis.</h2>
              <p>
                Painel de visuais limpos, estatísticas organizadas e histórico de viagens com foco na sua próxima inspiração.
              </p>
            </div>
          </div>

          <div className="profile-stats">
            {profileHighlights.map((item) => (
              <div className="profile-stat" key={item.label}>
                <span>{item.value}</span>
                <p>{item.label}</p>
              </div>
            ))}
          </div>

          <div className="profile-gallery">
            <div className="profile-thumb">
              <img
                src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80"
                alt="Viagem paradisíaca"
              />
            </div>
            <div className="profile-thumb">
              <img
                src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=80"
                alt="Trilha de montanha"
              />
            </div>
            <div className="profile-thumb">
              <img
                src="https://images.unsplash.com/photo-1519817650390-64a93db5112b?auto=format&fit=crop&w=1000&q=80"
                alt="Experiência urbana"
              />
            </div>
          </div>

          <div className="loading-skeleton">
            <div className="skeleton-line skeleton-short" />
            <div className="skeleton-line" />
          </div>
        </div>
      </section>

      <footer className="footer container fade-in">
        <p>Vambora — Plataforma premium de turismo inspirada por experiências selecionadas.</p>
      </footer>
    </main>
  )
}

export default App
