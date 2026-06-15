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

function App() {
  return (
    <main className="site-shell">
      <section className="hero-section fade-in">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Inspire-se para a próxima jornada</span>
            <h1>Viagens premium com roteiros locais, elegantes e inesquecíveis.</h1>
            <p>
              Planeje viagens com curadoria, atividades exclusivas e suporte em cada etapa. Sua próxima aventura começa aqui, com design de experiência pensado para exploradores exigentes.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary">Explorar roteiros</button>
              <button className="btn btn-secondary">Ver destinos</button>
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
      </section>

      <section className="section section-destinos fade-in">
        <div className="container section-heading">
          <div>
            <span className="eyebrow">Destinos em destaque</span>
            <h2>Experiências selecionadas para a sua próxima viagem</h2>
          </div>
          <button className="btn btn-secondary btn-outline">Ver todos</button>
        </div>

        <div className="container card-grid destination-grid">
          {destinations.map((destination) => (
            <article className="card destination-card" key={destination.title}>
              <div className="card-media">
                <img src={destination.image} alt={destination.title} />
                <div className="card-media-overlay" />
                <div className="destination-tag">
                  <span>{destination.category}</span>
                  <span className="rating">{destination.rating}</span>
                </div>
              </div>
              <div className="card-content">
                <p className="destination-location">
                  {destination.title}, <span>{destination.country}</span>
                </p>
                <p>{destination.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-community fade-in">
        <div className="container section-heading">
          <div>
            <span className="eyebrow">Comunidade</span>
            <h2>Histórias reais de viagens e roteiros de exploradores</h2>
          </div>
        </div>

        <div className="container community-grid">
          {communityStories.map((story) => (
            <article className="card community-card" key={story.name}>
              <div className="community-media">
                <img src={story.image} alt={story.name} />
              </div>
              <div className="community-copy">
                <p className="eyebrow">{story.name}</p>
                <h3>{story.headline}</h3>
              </div>
            </article>
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
