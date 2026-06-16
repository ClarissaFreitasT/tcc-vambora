import { useEffect, useState } from 'react'

export default function Perfil() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    // tentativa simples: buscar primeiro usuário disponível
    fetch('http://localhost:3000/usuarios')
      .then((r) => r.json())
      .then((list) => setUsuario(list && list[0] ? list[0] : null))
      .catch(() => setUsuario(null))
  }, [])

  if (!usuario) return <main className="container" style={{ paddingBlock: 40 }}>Carregando perfil...</main>

  return (
    <main className="container" style={{ paddingBlock: 40 }}>
      <h2>{usuario.nome}</h2>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: 999, overflow: 'hidden' }}>
          <img src={usuario.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome)}`} alt={usuario.nome} />
        </div>
        <div>
          <p style={{ color: 'var(--text-secondary)' }}>{usuario.bio}</p>
          <p style={{ color: 'var(--text-secondary)' }}>Personalidade: {usuario.personalidade}</p>
          <p style={{ color: 'var(--text-secondary)' }}>Orçamento: {usuario.orcamentoPerfil}</p>
        </div>
      </div>
    </main>
  )
}
