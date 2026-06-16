const body = {
  nome: `TesteBack ${Date.now()}`,
  email: `teste_back_${Date.now()}@example.com`,
  senhaHash: 'senha123',
  fotoUrl: 'https://ui-avatars.com/api/?name=TesteBack',
  bio: 'Teste',
  personalidade: 'AVENTUREIRA',
  orcamentoPerfil: 'R$ 2.500'
}

try {
  const res = await fetch('http://localhost:3000/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  console.log('status', res.status)
  const text = await res.text()
  console.log(text)
} catch (error) {
  console.error('fetch error', error)
}
