import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="container" style={{ paddingTop: 18, paddingBottom: 18, display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)', textDecoration: 'none' }}>VAMBORA</Link>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/roteiros')}>Explorar</button>
        <button className="btn btn-secondary" onClick={() => navigate('/comunidade')}>Comunidade</button>
        <button className="btn btn-secondary" onClick={() => navigate('/roteiros')}>Roteiros</button>
        <button className="btn btn-secondary" onClick={() => navigate('/perfil')}>Perfil</button>
        <button className="btn btn-primary" onClick={() => navigate('/roteiros/novo')}>Criar roteiro</button>
      </div>
    </nav>
  )
}
