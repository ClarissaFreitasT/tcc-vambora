const mockRoteiros = [
  {
    id: 'roteiro-1',
    titulo: 'Fim de semana em Lisboa',
    destino: 'Lisboa',
    duracao: 4,
    orcamento: 'Moderado',
    publico: true,
    estiloViajante: 'Cultural e gastronômico',
    usuario: {
      nome: 'Ana Souza',
      perfil: 'Aventureira tranquila'
    },
    dias: [
      {
        numero: 1,
        periodo: 'Manhã',
        lugar: 'Alfama',
        horario: '09:00 - 12:00',
        acoes: [
          'Caminhar pelas ruelas do bairro histórico',
          'Visitar a Sé de Lisboa',
          'Tomar um pastel de nata na confeitaria local'
        ],
        sugestoes: [
          'Explorar o Miradouro de Santa Luzia',
          'Subir no bonde 28 para passeio clássico',
          'Parar no Museu do Fado'
        ]
      },
      {
        numero: 2,
        periodo: 'Tarde',
        lugar: 'Belém',
        horario: '13:30 - 17:30',
        acoes: [
          'Visitar a Torre de Belém',
          'Conhecer o Mosteiro dos Jerónimos',
          'Provar os famosos pastéis de Belém'
        ],
        sugestoes: [
          'Passear pelo Jardim da Praça do Império',
          'Ir ao MAAT - museu de arte, arquitetura e tecnologia',
          'Fazer um cruzeiro no rio Tejo ao entardecer'
        ]
      },
      {
        numero: 3,
        periodo: 'Noite',
        lugar: 'Bairro Alto',
        horario: '19:00 - 22:30',
        acoes: [
          'Jantar em restaurante de bacalhau',
          'Ouvir fado em casa de show',
          'Tomar um drink em rooftop'
        ],
        sugestoes: [
          'Experimentar petiscos portugueses no Mercado da Ribeira',
          'Fazer um tour de bares por Cais do Sodré',
          'Assistir pôr do sol no Miradouro de São Pedro de Alcântara'
        ]
      }
    ]
  },
  {
    id: 'roteiro-2',
    titulo: 'Aventura em Chapada Diamantina',
    destino: 'Chapada Diamantina',
    duracao: 5,
    orcamento: 'Econômico',
    publico: false,
    estiloViajante: 'Natureza e trilhas',
    usuario: {
      nome: 'João Pereira',
      perfil: 'Trilheiro'
    },
    dias: [
      {
        numero: 1,
        periodo: 'Manhã',
        lugar: 'Morro do Pai Inácio',
        horario: '08:00 - 12:00',
        acoes: [
          'Subir ao topo do Morro do Pai Inácio',
          'Fazer fotos do mirante',
          'Caminhar pela trilha local'
        ],
        sugestoes: [
          'Explorar o Parque e fazer piquenique',
          'Visitar a Gruta da Lapa Doce',
          'Relaxar na Cachoeira da Fumaça'
        ]
      },
      {
        numero: 2,
        periodo: 'Tarde',
        lugar: 'Poço Encantado',
        horario: '13:30 - 17:00',
        acoes: [
          'Mergulhar nas águas cristalinas',
          'Observar a luz azul subaquática',
          'Fazer trilha leve na área'
        ],
        sugestoes: [
          'Visitar o Poço Azul',
          'Fazer rafting leve no Rio',
          'Explorar cavernas próximas'
        ]
      },
      {
        numero: 3,
        periodo: 'Noite',
        lugar: 'Vale do Capão',
        horario: '18:00 - 22:00',
        acoes: [
          'Jantar em restaurante rústico',
          'Planejar trilha do dia seguinte',
          'Observar o céu estrelado'
        ],
        sugestoes: [
          'Participar de roda de conversa com viajantes',
          'Fazer yoga ao ar livre',
          'Conhecer a cachoeira do Riachinho'
        ]
      }
    ]
  },
  {
    id: 'roteiro-3',
    titulo: 'Imersão urbana em São Paulo',
    destino: 'São Paulo',
    duracao: 3,
    orcamento: 'Conforto',
    publico: true,
    estiloViajante: 'Urbano e gastronômico',
    usuario: {
      nome: 'Mariana Lima',
      perfil: 'Exploradora urbana'
    },
    dias: [
      {
        numero: 1,
        periodo: 'Manhã',
        lugar: 'Avenida Paulista',
        horario: '09:00 - 12:00',
        acoes: [
          'Visitar MASP',
          'Passear no Parque Trianon',
          'Tomar café em cafeteria trendy'
        ],
        sugestoes: [
          'Conhecer o Instituto Moreira Salles',
          'Fazer tour guiado pelo MASP',
          'Visitar a Japan House'
        ]
      },
      {
        numero: 2,
        periodo: 'Tarde',
        lugar: 'Vila Madalena',
        horario: '13:30 - 17:30',
        acoes: [
          'Explorar grafites da Beco do Batman',
          'Almoçar em food hall',
          'Visitar galerias de arte locais'
        ],
        sugestoes: [
          'Ir ao Museu da Imagem e do Som',
          'Fazer aula rápida de street-art',
          'Provar cervejas artesanais'
        ]
      },
      {
        numero: 3,
        periodo: 'Noite',
        lugar: 'Jardins',
        horario: '18:00 - 22:30',
        acoes: [
          'Jantar em restaurante sofisticado',
          'Passear pela Rua Oscar Freire',
          'Tomar um drink em bar de coquetelaria'
        ],
        sugestoes: [
          'Ir ao Teatro Municipal',
          'Experimentar uma casa de sushi premium',
          'Fazer uma roda de samba'
        ]
      }
    ]
  }
]

export function getMockRoteiros() {
  return mockRoteiros
}

export function getMockRoteiroById(id) {
  return mockRoteiros.find((roteiro) => roteiro.id === id) || null
}

export default mockRoteiros
