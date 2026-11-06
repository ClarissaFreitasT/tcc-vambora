import { createHash } from "node:crypto";

// Namespace exclusivo da demonstração; IDs estáveis permitem repetir a seed.
export function demoId(key) {
  const hex = createHash("sha256").update(`vambora:demo:v1:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export const demoEmail = "demo@vambora.example";
export const demoPassword = "VamboraDemo2026!";
export const notice = "Conteúdo fictício para demonstração. Valores e experiências são ilustrativos, não são cotações nem recomendações verificadas.";

export const people = [
  ["demo", "Viajante Demo", "TRANQUILA", "Conta de demonstração do Vambora. Explore, salve roteiros e participe da comunidade!"],
  ["marina", "Marina Horizonte", "CULTURAL", "Personagem fictícia apaixonada por arquitetura, museus e cafés."],
  ["caio", "Caio Trilhas", "AVENTUREIRA", "Personagem fictício que gosta de caminhadas e paisagens ao ar livre."],
  ["luiza", "Luiza Marés", "TRANQUILA", "Personagem fictícia que prefere praias, livros e viagens sem pressa."],
  ["rafael", "Rafael Sabores", "FESTEIRA", "Personagem fictício interessado em gastronomia e música."],
  ["bia", "Bia Caminhos", "CULTURAL", "Personagem fictícia que coleciona histórias de cidades e viagens."],
].map(([key, nome, personalidade, bio]) => ({
  id: demoId(`user:${key}`), key, nome, personalidade, bio,
  email: key === "demo" ? demoEmail : `${key}@vambora.example`,
  username: key === "demo" ? "vambora.demo" : `demo.${key}`,
}));

// Fotografias ilustrativas; não representam os personagens ou os passeios.
const beach = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
const mountains = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80";
const city = "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80";

export const routes = [
  { key: "paraty", owner: "demo", titulo: "Paraty sem pressa — demo", destino: "Paraty, RJ", orcamento: 950, imagemUrl: beach, categoria: "Cultura", publico: true,
    descricao: "Uma escapada para caminhar pelo centro, conhecer ateliês e reservar tempo para descansar.",
    days: [["Centro e sabores", "Passeio pelo centro histórico", "Almoço regional", "Visita a ateliês"], ["Mar e descanso", "Caminhada na orla", "Pausa para almoço", "Fim de tarde junto ao cais"]] },
  { key: "chapada", owner: "caio", titulo: "Chapada dos Veadeiros em três dias — demo", destino: "Alto Paraíso de Goiás, GO", orcamento: 1450, imagemUrl: mountains, categoria: "Aventura", publico: true,
    descricao: "Planejamento ilustrativo para quem gosta de natureza. Acesso, clima e necessidade de guia devem ser confirmados antes de uma viagem real.",
    days: [["Chegada tranquila", "Chegada e acomodação", "Almoço na vila", "Reconhecimento dos arredores"], ["Dia de natureza", "Encontro com guia local", "Piquenique planejado", "Retorno e descanso"], ["Despedida da serra", "Caminhada leve", "Almoço de despedida", "Organização do retorno"]] },
  { key: "salvador", owner: "rafael", titulo: "Cores e sabores de Salvador — demo", destino: "Salvador, BA", orcamento: 1200, imagemUrl: city, categoria: "Gastronomia", publico: true,
    descricao: "História, culinária e espaços para aproveitar a cidade no próprio ritmo.",
    days: [["Centro histórico", "Caminhada pelo Pelourinho", "Almoço de sabores baianos", "Visita a espaços culturais"], ["Perto do mar", "Passeio pela Barra", "Almoço e descanso", "Pôr do sol na orla"], ["Memórias da viagem", "Feira de artesanato", "Café de despedida", "Retorno"]] },
  { key: "floripa", owner: "luiza", titulo: "Florianópolis: descanso à beira-mar — demo", destino: "Florianópolis, SC", orcamento: 1100, imagemUrl: beach, categoria: "Praia", publico: true,
    descricao: "Dois dias com poucas atividades e tempo livre entre cada passeio.",
    days: [["Primeiro encontro com a ilha", "Café da manhã na lagoa", "Almoço próximo à hospedagem", "Tarde livre na praia"], ["Passeios leves", "Caminhada na orla", "Almoço regional", "Tempo livre e retorno"]] },
  { key: "ouropreto", owner: "marina", titulo: "Arte e história em Ouro Preto — demo", destino: "Ouro Preto, MG", orcamento: 850, imagemUrl: city, categoria: "Cultura", publico: true,
    descricao: "Um fim de semana cultural com pausas entre as ladeiras e visitas.",
    days: [["Histórias do centro", "Caminhada pela Praça Tiradentes", "Almoço mineiro", "Visita a museu"], ["Arte e lembranças", "Visita a ateliês", "Almoço no centro", "Café e despedida"]] },
  { key: "curitiba", owner: "bia", titulo: "Curitiba entre parques e cafés — demo", destino: "Curitiba, PR", orcamento: 780, imagemUrl: mountains, categoria: "Natureza", publico: true,
    descricao: "Um roteiro urbano ilustrativo com áreas verdes e intervalos para conversar.",
    days: [["Jardins e cidade", "Passeio pelo Jardim Botânico", "Almoço no centro", "Café e livraria"], ["Parques e memórias", "Passeio em parque urbano", "Almoço de despedida", "Organização do retorno"]] },
  { key: "rascunho", owner: "demo", titulo: "Minha próxima viagem — rascunho demo", destino: "São Paulo, SP", orcamento: 600, imagemUrl: city, categoria: "Cultura", publico: false,
    descricao: "Roteiro privado da conta de demonstração, pronto para exercitar edição e publicação.",
    days: [["Ideias para o sábado", "Escolher um museu", "Reservar tempo para almoço", "Passeio por uma livraria"]] },
];

export const postTexts = [
  "Preparei um roteiro de dois dias em Paraty com pausas entre os passeios. Qual atividade vocês acrescentariam?",
  "Meu planejamento de natureza está pronto! Deixei intervalos para descanso e para conferir as condições dos passeios antes de sair.",
  "Neste roteiro de Salvador, a gastronomia ganhou espaço entre os passeios culturais. Como vocês organizam as refeições nas viagens?",
  "Uma viagem tranquila também pode ter um roteiro: poucas atividades por dia e bastante tempo livre perto do mar.",
  "Montei um fim de semana de arte e história em Ouro Preto. Minha dica de planejamento é agrupar passeios próximos e prever pausas.",
  "Parques e cafés foram o ponto de partida deste roteiro de Curitiba. Salvei algumas ideias para adaptar em outra oportunidade.",
];
