describe('Perfil front-end integration', () => {
  async function postUsuario(body) {
    const frontendUrl = 'http://localhost:5173/usuarios'
    const backendUrl = 'http://localhost:3000/usuarios'

    try {
      return await fetch(frontendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    } catch (error) {
      return await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }
  }

  it('should create a user through the frontend proxy or backend', async () => {
    const body = {
      nome: `Teste Front ${Date.now()}`,
      email: `teste_front_${Date.now()}@example.com`,
      senhaHash: 'senha123',
      fotoUrl: 'https://ui-avatars.com/api/?name=Teste',
      bio: 'Teste',
      personalidade: 'AVENTUREIRA',
      orcamentoPerfil: 2500
    }

    const response = await postUsuario(body)

    expect(response.status).toBeGreaterThanOrEqual(200)
    expect(response.status).toBeLessThan(500)

    const data = await response.json()
    expect(data).toHaveProperty('mensagem', 'Usuário criado com sucesso')
    expect(data).toHaveProperty('usuario')
    expect(data.usuario).toHaveProperty('email', body.email)
  })
})
