import { useEffect, useMemo, useRef, useState } from 'react'
import GlobeCanvas from '../components/GlobeCanvas'
import ImageFallback from '../components/ImageFallback'
import { categoriasDestino, destinosGlobo } from '../data/destinosGlobo'
import { hasValidCoordinates, normalizePlaceSearch } from '../utils/globe'
import './Explorar.css'

export default function Explorar() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState(null)
  const [routeIds, setRouteIds] = useState([])
  const [autoRotate, setAutoRotate] = useState(true)
  const [globeStatus, setGlobeStatus] = useState('loading')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const globeControls = useRef(null)

  const validDestinations = useMemo(() => destinosGlobo.filter(hasValidCoordinates), [])
  const visibleDestinations = useMemo(() => validDestinations.filter((destination) => !category || destination.categoria === category), [category, validDestinations])
  const suggestions = useMemo(() => {
    const term = normalizePlaceSearch(query)
    if (!term) return []
    return validDestinations.filter((destination) => normalizePlaceSearch(`${destination.nome} ${destination.pais}`).includes(term)).slice(0, 5)
  }, [query, validDestinations])
  const routeDestinations = routeIds.map((id) => validDestinations.find((destination) => destination.id === id)).filter(Boolean)

  useEffect(() => {
    if (!selected) return undefined
    function handleEscape(event) {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selected])

  function selectDestination(destination) {
    setSelected(destination)
    setQuery(destination.nome)
    setSuggestionsOpen(false)
    setAutoRotate(false)
  }

  function toggleRoute(destination) {
    setRouteIds((current) => current.includes(destination.id)
      ? current.filter((id) => id !== destination.id)
      : [...current, destination.id])
  }

  function submitSearch(event) {
    event.preventDefault()
    if (suggestions[0]) selectDestination(suggestions[0])
  }

  return (
    <main className="explore-page">
      <section className="explore-intro">
        <div>
          <p className="explore-eyebrow">VAMBORA · MAPA-MÚNDI</p>
          <h1>O mundo está <span>à sua espera.</span></h1>
          <p className="explore-lede">Gire o globo, descubra lugares e conecte os destinos da sua próxima viagem.</p>
        </div>
        <div className="explore-count"><strong>{visibleDestinations.length.toString().padStart(2, '0')}</strong><span>destinos<br />para explorar</span></div>
      </section>

      <section className="explore-layout" aria-label="Exploração de destinos no globo">
        <div className="globe-column">
          <div className="globe-toolbar">
            <form className="globe-search" role="search" onSubmit={submitSearch}>
              <span aria-hidden="true">⌕</span>
              <label className="sr-only" htmlFor="globe-search">Buscar cidade ou país</label>
              <input id="globe-search" value={query} placeholder="Busque uma cidade ou país" autoComplete="off" aria-autocomplete="list" aria-expanded={suggestionsOpen && Boolean(query)} aria-controls="globe-suggestions" onFocus={() => setSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)} onChange={(event) => { setQuery(event.target.value); setSuggestionsOpen(true) }} onKeyDown={(event) => { if (event.key === 'Escape') setSuggestionsOpen(false) }} />
              {query ? <button type="button" aria-label="Limpar pesquisa" className="search-clear" onClick={() => { setQuery(''); setSuggestionsOpen(false) }}>×</button> : null}
              {suggestionsOpen && query ? <div id="globe-suggestions" className="globe-suggestions" role="listbox" aria-label="Sugestões de destinos">{suggestions.length ? suggestions.map((destination) => <button type="button" role="option" aria-selected={selected?.id === destination.id} key={destination.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectDestination(destination)}><span className="suggestion-pin">⌖</span><span><strong>{destination.nome}</strong><small>{destination.pais}</small></span><span aria-hidden="true">↗</span></button>) : <p>Nenhum destino encontrado.</p>}</div> : null}
            </form>
            <div className="category-filters" aria-label="Filtrar destinos por categoria">
              <button type="button" className={!category ? 'active' : ''} onClick={() => setCategory('')}>Todos</button>
              {categoriasDestino.map((item) => <button type="button" className={category === item.id ? 'active' : ''} key={item.id} onClick={() => setCategory(category === item.id ? '' : item.id)}><span aria-hidden="true">{item.icone}</span>{item.nome}</button>)}
            </div>
          </div>

          <div className="globe-card">
            <div className="globe-starfield" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <div className="globe-heading"><span className="live-dot" /> EXPLORE O PLANETA <span className="globe-heading-right">DADOS DE DEMONSTRAÇÃO</span></div>
            <div className="globe-ambient" aria-hidden="true" />
            <GlobeCanvas destinations={visibleDestinations} allDestinations={validDestinations} selectedDestinationId={selected?.id} routeDestinationIds={routeIds} autoRotate={autoRotate} onSelectDestination={selectDestination} onStatus={setGlobeStatus} controlsRef={globeControls} />
            {globeStatus !== 'ready' ? <div className={`globe-status ${globeStatus === 'loading' ? '' : 'warning'}`} role={globeStatus === 'loading' ? 'status' : 'alert'}>{globeStatus === 'loading' ? <><span className="loading-orbit" />Carregando textura terrestre…</> : globeStatus}</div> : null}
            <div className="globe-controls" aria-label="Controles do globo">
              <button type="button" aria-label="Aproximar globo" onClick={() => globeControls.current?.zoom(-0.65)}>＋</button>
              <button type="button" aria-label="Afastar globo" onClick={() => globeControls.current?.zoom(0.65)}>−</button>
              <span />
              <button type="button" aria-label="Voltar à visão global" onClick={() => { setSelected(null); setQuery(''); globeControls.current?.reset() }}>◎</button>
            </div>
            <div className="globe-caption"><span>Arraste para girar</span><span>Scroll para aproximar</span></div>
            <button type="button" className={`rotation-toggle ${autoRotate ? 'is-on' : ''}`} aria-pressed={autoRotate} onClick={() => setAutoRotate((current) => !current)}><span>{autoRotate ? 'Ⅱ' : '▶'}</span>{autoRotate ? 'Pausar rotação' : 'Retomar rotação'}</button>
            {routeDestinations.length ? <div className="route-legend"><span /> Rota visual · {routeDestinations.length} locais</div> : null}
          </div>
          <p className="globe-disclaimer">Arcos representam conexões geográficas; não indicam rotas aéreas comerciais.</p>
        </div>

        <aside className="destination-panel" aria-label="Destinos e detalhes">
          {selected ? <div className="selected-destination">
            <div className="detail-image-wrap"><ImageFallback src={selected.imagem} alt={`Paisagem de ${selected.nome}`} className="detail-image" /><span className="demo-badge">DESTINO EM DESTAQUE</span></div>
            <div className="detail-body">
              <p className="detail-category">{categoriasDestino.find((item) => item.id === selected.categoria)?.nome || 'Destino'}</p>
              <h2>{selected.nome}</h2><p className="detail-country">{selected.pais}</p>
              <p className="detail-description">{selected.descricao}</p>
              <div className="coordinates"><span>COORDENADAS</span><strong>{selected.latitude.toFixed(4)}°, {selected.longitude.toFixed(4)}°</strong></div>
              <div className="detail-actions"><button type="button" className="route-button" onClick={() => toggleRoute(selected)}>{routeIds.includes(selected.id) ? '✓ Na sua rota' : '＋ Adicionar à rota'}</button><button type="button" className="recenter-button" aria-label={`Centralizar ${selected.nome} no globo`} onClick={() => globeControls.current?.focus(selected)}>◎</button></div>
              <button type="button" className="close-detail" onClick={() => setSelected(null)}>Fechar detalhes <span aria-hidden="true">×</span></button>
            </div>
          </div> : <div className="panel-empty"><span className="empty-icon">⌖</span><p className="panel-overline">UM PLANETA DE POSSIBILIDADES</p><h2>Escolha seu próximo destino.</h2><p>Selecione um marcador no globo ou explore a lista de lugares para ver detalhes.</p></div>}

          <div className="destination-list-section">
            <div className="list-heading"><div><p className="panel-overline">CURADORIA VAMBORA</p><h3>Destinos em destaque</h3></div><span>{visibleDestinations.length}</span></div>
            {visibleDestinations.length ? <ul className="destination-list">{visibleDestinations.map((destination) => <li key={destination.id}><button type="button" className={selected?.id === destination.id ? 'destination-list-item chosen' : 'destination-list-item'} onClick={() => selectDestination(destination)}><span className={`list-marker marker-${destination.categoria}`} aria-hidden="true">⌖</span><span className="list-copy"><strong>{destination.nome}</strong><small>{destination.pais}</small></span><span className="list-arrow" aria-hidden="true">↗</span></button></li>)}</ul> : <p className="list-empty">Nenhum destino nesta categoria.</p>}
          </div>

          {routeDestinations.length ? <div className="route-card"><div className="list-heading"><div><p className="panel-overline">PLANEJAMENTO VISUAL</p><h3>Sua conexão</h3></div><button type="button" aria-label="Limpar rota" onClick={() => setRouteIds([])}>Limpar</button></div><ol>{routeDestinations.map((destination, index) => <li key={destination.id}><span className="route-number">{index + 1}</span><span>{destination.nome}</span><button type="button" aria-label={`Remover ${destination.nome} da rota`} onClick={() => toggleRoute(destination)}>×</button></li>)}</ol><p>Conexão geográfica ilustrativa, sem cálculo de distância ou disponibilidade de transporte.</p></div> : <div className="route-hint"><span aria-hidden="true">⌁</span><p>Monte uma rota visual: selecione um destino e adicione-o à conexão.</p></div>}
        </aside>
      </section>
      <footer className="explore-footer"><span>✈ VAMBORA</span><p>Locais e descrições em caráter demonstrativo. Sem avaliações, preços ou horários inventados.</p></footer>
    </main>
  )
}
