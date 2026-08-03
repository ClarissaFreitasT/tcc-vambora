# 📊 Relatório de Análise do Projeto

## 1. 🏗️ Identificação e visão geral

- **Nome do projeto:** VAMBORA / tcc-vambora
- **Objetivo identificado:** Planejar viagens por meio de roteiros, criação de perfis de viajantes e visualização de comunidade.
- **Problema que o sistema pretende resolver:** Auxiliar usuários a descobrir, criar e compartilhar roteiros de viagem. A formulação formal do problema não foi encontrada em documentação própria.
- **Funcionalidades do MVP descritas:** NÃO IDENTIFICADO em README ou documento de escopo. Funcionalidades inferidas pelo código: cadastro/listagem de usuários, criação/listagem/edição/exclusão de roteiros, criação de dias e itens de roteiro, páginas de roteiros, comunidade e perfil.
- **Tecnologias principais:**
  - Node.js
  - Express
  - Prisma ORM
  - MySQL/MariaDB
  - React
  - Vite
  - Tailwind CSS
  - Jest
  - Supertest
- **Linguagens utilizadas:**
  - JavaScript
  - SQL
  - Prisma Schema
  - CSS

### Evidências consultadas

- `backend/package.json` — scripts Node/Express e dependências `express`, `@prisma/client`, `@prisma/adapter-mariadb`, `dotenv`, `jest`, `supertest`.
- `frontend/package.json` — projeto React/Vite com `react`, `react-dom`, `react-router-dom`, `framer-motion` e Tailwind em dependências de desenvolvimento.
- `backend/prisma/schema.prisma` — models do domínio de usuários, roteiros, dias, itens, favoritos, categorias e reviews.
- `backend/src/app.js` — servidor Express com rotas `/roteiros`, `/dias`, `/itens` e `/usuarios`.
- `frontend/src/App.jsx` e `frontend/src/pages/*.jsx` — interface VAMBORA com chamadas `fetch` para o backend.
- `frontend/vite.config.js` — proxy local para rotas do backend.

## 2. 📂 Organização do repositório

```text
tcc-vambora/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── __tests__/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   ├── prisma.config.ts
│   ├── TESTES.md
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── __tests__/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── README.md
├── package-lock.json
└── PROMPT_ANALISE_REPOSITORIO_AV2_PIS.md
```

### Responsabilidade das pastas

- `backend` — API Node.js/Express, configuração Prisma, migrations e testes de rotas.
- `backend/src/routes` — definição dos endpoints HTTP.
- `backend/src/controllers` — recebimento das requisições, validações básicas e respostas JSON.
- `backend/src/models` — funções de acesso ao banco usando Prisma Client.
- `backend/prisma` — schema Prisma e migration SQL.
- `frontend` — aplicação React/Vite.
- `frontend/src/pages` — páginas de roteiros, detalhes, criação de roteiro, comunidade e perfil.
- `frontend/src/components` — componente de navegação.

### Análise da organização

- Separação entre frontend e backend: adequada.
- Nomes de pastas e arquivos: parcialmente consistentes; há mistura de padrões como `roteiroRoutes.js` e `users.routes.js`, mas a estrutura geral é compreensível.
- Arquivos de configuração: presentes para backend, Prisma, Jest, Vite, Tailwind, PostCSS e ESLint.
- Organização mínima do projeto: atende à etapa inicial, com separação por camadas no backend e por páginas/componentes no frontend.

## 3. 📘 README e documentação inicial

**Localização:** `backend/README.md` e `frontend/README.md`

| Item esperado | Situação | Evidência |
|---|---|---|
| Nome do projeto | Parcial | `frontend/src/App.jsx` e `frontend/src/components/Navbar.jsx` exibem “VAMBORA”; `frontend/README.md` contém apenas texto padrão “React + Vite”. |
| Problema que o sistema resolve | Não atende | `backend/README.md` está vazio; `frontend/README.md` não descreve o projeto. |
| Objetivo do projeto | Parcial | Objetivo aparece indiretamente em textos da interface em `frontend/src/App.jsx`, não em documentação. |
| Funcionalidades do MVP | Não atende | Não há lista documentada do MVP nos READMEs. |
| Tecnologias utilizadas | Parcial | `frontend/README.md` menciona React/Vite de forma genérica; tecnologias reais aparecem em `package.json`. |
| Instruções para execução local | Parcial | `frontend/README.md` é genérico; `backend/TESTES.md` mostra comandos de teste, mas não há instrução completa do projeto. |
| Divisão entre frontend, backend e banco | Não atende | Não há documentação inicial explicando a divisão. |

### Histórico de commits e participação

- Histórico disponível para análise: Sim.
- Participação dos integrantes identificável: Parcial.
- Evidências: `git log --max-count=20` mostra commits de autores como `clarissa`, `EA - Lívia De Souza Silva`, `hfcosta` e `livias`, com mensagens relacionadas a frontend, Prisma, banco e testes. A análise do repositório não comprova a participação completa de todos os integrantes nem a divisão formal de tarefas.

> Não foi atribuída autoria individual além da existência de nomes no histórico local.

### Professor como colaborador

**Situação:** NÃO VERIFICÁVEL PELO REPOSITÓRIO

## 4. ⚙️ Backend

- **Localização:** `backend`
- **Linguagem:** JavaScript
- **Framework principal:** Express
- **Arquivo de inicialização:** `backend/src/server.js`
- **Servidor configurado:** Sim

### Estrutura identificada

- `backend/src/app.js` — cria o app Express, habilita JSON e registra rotas.
- `backend/src/server.js` — conecta o Prisma ao banco e inicia o servidor na porta configurada.
- `backend/src/config/prisma.js` — configura Prisma Client com adapter MariaDB e variáveis de ambiente.
- `backend/src/routes/*.js` — define endpoints por recurso.
- `backend/src/controllers/*.js` — executa validações básicas e chama models.
- `backend/src/models/*.js` — executa operações Prisma.

### Organização interna

- Rotas: existentes para usuários, roteiros, dias e itens.
- Controllers: existentes e usados pelas rotas.
- Services: NÃO IDENTIFICADO.
- Middlewares: apenas `express.json()` identificado em `backend/src/app.js`.
- Configuração do banco: presente em `backend/src/config/prisma.js`, `backend/prisma.config.ts` e `backend/prisma/schema.prisma`.
- Validações: básicas em controllers de usuários, roteiros, dias e itens.
- Tratamento de erros: parcial; há tratamento em criação de roteiro e retornos 400/404/409, mas não há middleware global de erro.

### Funcionalidades implementadas

- Listar usuários — Evidência: `backend/src/routes/users.routes.js`, `backend/src/controllers/users.controller.js`, `backend/src/models/users.model.js`.
- Obter usuário por ID — Evidência: `backend/src/routes/users.routes.js`, `backend/src/models/users.model.js`.
- Criar usuário — Evidência: `backend/src/controllers/users.controller.js`, `backend/src/models/users.model.js`.
- Listar roteiros — Evidência: `backend/src/routes/roteiroRoutes.js`, `backend/src/models/roteiro.model.js`.
- Obter roteiro por ID — Evidência: `backend/src/controllers/roteiroController.js`, `backend/src/models/roteiro.model.js`.
- Criar roteiro — Evidência: `backend/src/controllers/roteiroController.js`, `backend/src/models/roteiro.model.js`.
- Atualizar roteiro — Evidência: `backend/src/routes/roteiroRoutes.js`, `backend/src/models/roteiro.model.js`.
- Excluir roteiro — Evidência: `backend/src/routes/roteiroRoutes.js`, `backend/src/models/roteiro.model.js`.
- Criar dia de roteiro — Evidência: `backend/src/routes/dia.routes.js`, `backend/src/models/dia.model.js`.
- Criar item de roteiro — Evidência: `backend/src/routes/item.routes.js`, `backend/src/models/item.model.js`.

### Fluxo das requisições

```text
requisição → rota Express → controller → model → Prisma Client → banco de dados → resposta JSON
```

O fluxo está completo para usuários, roteiros, criação de dias e criação de itens. Para favoritos, categorias e reviews, o schema existe, mas não foram encontradas rotas/controllers/models implementando operações desses recursos.

## 5. 🗄️ Banco de dados e Prisma ORM

- **Tipo de banco:** MySQL/MariaDB
- **ORM:** Prisma
- **Configuração principal:** `backend/src/config/prisma.js` e `backend/prisma.config.ts`
- **Schema Prisma:** `backend/prisma/schema.prisma`
- **Migrations:** Sim
- **Localização das migrations:** `backend/prisma/migrations/20260527113453_init/migration.sql`

### Models ou entidades identificadas

- `Usuario` — usuário do sistema; campos principais: `id`, `nome`, `email`, `senhaHash`, `fotoUrl`, `bio`, `personalidade`, `orcamentoPerfil`, `criadoEm`.
- `Roteiro` — roteiro de viagem; campos principais: `id`, `usuarioId`, `titulo`, `descricao`, `destino`, `orcamento`, `publico`, `criadoEm`.
- `DiaDoRoteiro` — dia associado a um roteiro; campos principais: `id`, `roteiroId`, `numeroDia`, `titulo`.
- `ItemDoRoteiro` — item dentro de um dia; campos principais: `id`, `diaId`, `titulo`, `descricao`, `localNome`, `custoEstimado`, `horarioInicio`, `ordem`.
- `Favorito` — associação entre usuário e roteiro favoritado.
- `Categoria` — categoria de roteiro.
- `RoteiroCategoria` — tabela associativa entre roteiro e categoria.
- `Review` — avaliação de roteiro por usuário.

### Modelagem

| Elemento | Situação | Evidência |
|---|---|---|
| Models principais definidos | Atende | `backend/prisma/schema.prisma` |
| Chaves primárias | Atende | `backend/prisma/schema.prisma` define `@id` e chave composta em `RoteiroCategoria`. |
| Chaves estrangeiras e relações | Atende | `backend/prisma/schema.prisma` e migration SQL definem relações entre usuários, roteiros, dias, itens, favoritos, categorias e reviews. |
| Campos coerentes com o domínio | Atende | `backend/prisma/schema.prisma` contém campos ligados a viagens, roteiros, orçamento, personalidade e comunidade. |
| Prisma Client utilizado no backend | Atende | `backend/src/config/prisma.js` e models em `backend/src/models/*.js`. |
| Operação real de banco em rota/controller | Atende | Rotas chamam controllers, controllers chamam models, models usam Prisma. |

### Operações Prisma encontradas

- `findMany`, `findUnique` ou equivalente: `backend/src/models/users.model.js`, `backend/src/models/roteiro.model.js`, `backend/src/models/dia.model.js`.
- `create`: `backend/src/models/users.model.js`, `backend/src/models/roteiro.model.js`, `backend/src/models/dia.model.js`, `backend/src/models/item.model.js`.
- `update`: `backend/src/models/roteiro.model.js`.
- `delete`: `backend/src/models/roteiro.model.js`.
- Outras operações: `prisma.$connect()` e `prisma.$disconnect()` em `backend/src/server.js`.

### Banco no servidor de produção

Há configuração por variáveis de ambiente em `backend/.env.example`, `backend/prisma.config.ts` e `backend/src/config/prisma.js`. O histórico local contém mensagem de commit relacionada a banco em produção, mas isso não comprova criação efetiva nem funcionamento em servidor.

**Situação:** PARCIALMENTE EVIDENCIADO

## 6. 🌐 Rotas da API e arquivo do Insomnia

### Rotas encontradas no backend

| Método | Endpoint | Arquivo | Operação realizada | Usa Prisma |
|---|---|---|---|---|
| GET | `/` | `backend/src/app.js` | Retorna texto de teste da API | Não |
| GET | `/usuarios` | `backend/src/routes/users.routes.js` | Lista usuários | Sim |
| GET | `/usuarios/:id` | `backend/src/routes/users.routes.js` | Busca usuário por ID | Sim |
| POST | `/usuarios` | `backend/src/routes/users.routes.js` | Cria usuário | Sim |
| GET | `/roteiros` | `backend/src/routes/roteiroRoutes.js` | Lista roteiros | Sim |
| GET | `/roteiros/:id` | `backend/src/routes/roteiroRoutes.js` | Busca roteiro por ID | Sim |
| POST | `/roteiros` | `backend/src/routes/roteiroRoutes.js` | Cria roteiro | Sim |
| PATCH | `/roteiros/:id` | `backend/src/routes/roteiroRoutes.js` | Atualiza roteiro | Sim |
| DELETE | `/roteiros/:id` | `backend/src/routes/roteiroRoutes.js` | Exclui roteiro | Sim |
| POST | `/dias` | `backend/src/routes/dia.routes.js` | Cria dia de roteiro | Sim |
| POST | `/itens` | `backend/src/routes/item.routes.js` | Cria item de roteiro | Sim |

### Adequação das rotas

As rotas usam métodos HTTP coerentes para listagem, criação, atualização e exclusão. A organização por recursos é clara para usuários, roteiros, dias e itens. Há parâmetros em rotas de detalhe, edição e exclusão. O backend recebe JSON via `express.json()` e responde em JSON nos controllers principais. A cobertura ainda é parcial em relação ao domínio modelado, pois favoritos, categorias e reviews existem no banco, mas não possuem endpoints identificados.

### Arquivo exportado do Insomnia

- **Arquivo encontrado:** NÃO IDENTIFICADO
- **Formato:** NÃO IDENTIFICADO
- **Rotas organizadas por funcionalidade:** Não
- **Nomes claros nas requisições:** Não
- **Exemplos de corpo JSON:** Não
- **Parâmetros e variáveis configurados:** Não
- **Compatibilidade com as rotas do backend:** Não

Não foi encontrado arquivo de exportação do Insomnia. A busca por termos relacionados a Insomnia encontrou somente o próprio prompt de análise.

## 7. 🎨 Frontend

- **Localização:** `frontend`
- **Framework:** React
- **Linguagem:** JavaScript
- **Ferramenta de criação/build:** Vite
- **Tailwind CSS:** Configurado e utilizado
- **Roteamento:** `react-router-dom`

### Arquivos principais

- `frontend/src/main.jsx` — inicializa React e define rotas da SPA.
- `frontend/src/App.jsx` — página inicial com hero, listagem resumida de roteiros e comunidade.
- `frontend/src/index.css` — importa Tailwind e define estilos globais/componentes.
- `frontend/tailwind.config.js` — configura conteúdo monitorado e tema Tailwind.
- `frontend/vite.config.js` — configura React plugin e proxy para backend.
- `frontend/src/components/Navbar.jsx` — navegação principal.

### Páginas e componentes

- `frontend/src/pages/Roteiros.jsx` — lista roteiros obtidos de `/roteiros`.
- `frontend/src/pages/NovoRoteiro.jsx` — cria usuário automático quando necessário e envia roteiro para `/roteiros`.
- `frontend/src/pages/RoteiroDetalhes.jsx` — busca, edita e exclui roteiro por ID.
- `frontend/src/pages/Comunidade.jsx` — lista usuários obtidos de `/usuarios`.
- `frontend/src/pages/Perfil.jsx` — fluxo de registro/questionário e envio de usuário para `/usuarios`.
- `frontend/src/components/Navbar.jsx` — links para rotas principais.

### Análise do desenvolvimento inicial

| Elemento | Situação | Evidência |
|---|---|---|
| Projeto React iniciado | Atende | `frontend/package.json`, `frontend/src/main.jsx` |
| Uso de JavaScript | Atende | Arquivos `.jsx` e `.js` em `frontend/src` |
| Tailwind configurado ou utilizado | Atende | `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/index.css` |
| Telas principais iniciadas | Atende | `frontend/src/pages/*.jsx` |
| Componentes organizados | Parcial | `frontend/src/components/Navbar.jsx`; a maior parte da UI está nas páginas. |
| Navegação entre páginas | Atende | `frontend/src/main.jsx` e `Navbar.jsx` usam `react-router-dom`. |
| Tela conectada ou preparada para API | Atende | `fetch` em `App.jsx`, `Roteiros.jsx`, `NovoRoteiro.jsx`, `RoteiroDetalhes.jsx`, `Comunidade.jsx`, `Perfil.jsx`. |

## 8. 🔗 Conexão entre frontend e backend

- **Tipo de comunicação:** REST
- **Cliente HTTP:** Fetch
- **Arquivo de configuração da API:** `frontend/vite.config.js`
- **URL base:** proxy local para `http://localhost:3000` em `frontend/vite.config.js`
- **Variáveis de ambiente:** `backend/.env.example` e `backend/.env` encontrados; conteúdo sensível do `.env` não foi exposto.
- **CORS no backend:** Ausente
- **Proxy no frontend:** Configurado

### Endpoints consumidos pelo frontend

| Endpoint | Método | Componente ou página | Finalidade | Compatível com o backend |
|---|---|---|---|---|
| `/roteiros` | GET | `frontend/src/App.jsx` | Contar e listar roteiros na página inicial | Sim |
| `/usuarios` | GET | `frontend/src/App.jsx` | Contar e listar usuários na página inicial | Sim |
| `/roteiros` | GET | `frontend/src/pages/Roteiros.jsx` | Listar roteiros | Sim |
| `/usuarios` | GET | `frontend/src/pages/NovoRoteiro.jsx` | Buscar usuário existente para vincular roteiro | Sim |
| `/usuarios` | POST | `frontend/src/pages/NovoRoteiro.jsx` | Criar usuário automático de teste | Parcial |
| `/roteiros` | POST | `frontend/src/pages/NovoRoteiro.jsx` | Criar roteiro | Sim |
| `/roteiros/:id` | GET | `frontend/src/pages/RoteiroDetalhes.jsx` | Carregar detalhe do roteiro | Sim |
| `/roteiros/:id` | PATCH | `frontend/src/pages/RoteiroDetalhes.jsx` | Editar roteiro | Sim |
| `/roteiros/:id` | DELETE | `frontend/src/pages/RoteiroDetalhes.jsx` | Excluir roteiro | Sim |
| `/usuarios` | GET | `frontend/src/pages/Comunidade.jsx` | Listar comunidade | Sim |
| `/usuarios` | POST | `frontend/src/pages/Perfil.jsx` | Criar perfil de usuário | Sim |

### Fluxos comprovados

- A página inicial consome `/roteiros` e `/usuarios` para exibir contadores e cards.
- A tela de roteiros consome `GET /roteiros`.
- A tela de novo roteiro busca/cria usuário e envia `POST /roteiros`.
- A tela de detalhes usa `GET`, `PATCH` e `DELETE` em `/roteiros/:id`.
- A tela de comunidade lista dados de `GET /usuarios`.
- A tela de perfil envia `POST /usuarios`.

### Estado da integração

**Classificação:** Atende.

Há comunicação identificável e coerente entre frontend e backend por `fetch`, com proxy configurado no Vite. A integração depende de o frontend ser executado via Vite para usar o proxy, pois o backend não possui CORS configurado.

## 9. ✅ O que já está implementado

### Backend

- Servidor Express com rotas registradas.
- Rotas de usuários com listagem, detalhe e criação.
- Rotas de roteiros com listagem, detalhe, criação, atualização e exclusão.
- Rotas de criação de dias e itens.
- Testes automatizados de rotas com Jest/Supertest e mocks.

### Banco de dados

- Schema Prisma com entidades principais do domínio.
- Migration SQL inicial criando tabelas, índices, chaves primárias e chaves estrangeiras.
- Prisma Client configurado no backend.

### Frontend

- Aplicação React/Vite iniciada.
- Tailwind configurado e usado.
- Rotas SPA configuradas.
- Páginas de início, roteiros, novo roteiro, detalhe, comunidade e perfil.

### Integração

- Proxy Vite para `/roteiros`, `/usuarios`, `/dias` e `/itens`.
- Chamadas `fetch` para endpoints existentes do backend.
- Fluxos de listagem, criação, edição e exclusão de roteiros conectados ao backend.

## 10. 🚧 O que está incompleto ou em desenvolvimento

- README/documentação do projeto incompleta.
  - **Evidência:** `backend/README.md`, `frontend/README.md`
  - **Estado observado:** backend sem conteúdo; frontend com documentação padrão do Vite, sem descrição do projeto, MVP ou execução completa.

- Arquivo exportado do Insomnia ausente.
  - **Evidência:** busca por termos `insomnia`, `_type`, `request_group` e `workspace`
  - **Estado observado:** nenhum arquivo de exportação encontrado.

- Recursos modelados sem rotas implementadas.
  - **Evidência:** `backend/prisma/schema.prisma`
  - **Estado observado:** `Favorito`, `Categoria`, `RoteiroCategoria` e `Review` existem no schema, mas não foram encontradas rotas/controllers/models correspondentes.

- CORS não configurado no backend.
  - **Evidência:** `backend/src/app.js`
  - **Estado observado:** há `express.json()`, mas não há middleware de CORS; a integração local depende do proxy do Vite.

- Algumas validações são apenas básicas.
  - **Evidência:** `backend/src/controllers/*.js`
  - **Estado observado:** existem validações de obrigatoriedade em pontos principais, mas não há validação centralizada nem tratamento global de erros.

- Comprovação de banco em produção não conclusiva.
  - **Evidência:** `backend/.env.example`, `backend/src/config/prisma.js`, histórico local de commits
  - **Estado observado:** há preparação de conexão, mas a criação/funcionamento do banco em servidor não é comprovável apenas pelo repositório.

## 11. 📦 Dependências principais

### Backend

| Dependência | Versão | Finalidade identificada |
|---|---:|---|
| `express` | `^5.2.1` | Servidor HTTP e rotas da API |
| `@prisma/client` | `^7.8.0` | Cliente ORM para acesso ao banco |
| `@prisma/adapter-mariadb` | `^7.8.0` | Adapter Prisma para MariaDB |
| `dotenv` | `^17.4.2` | Carregamento de variáveis de ambiente |
| `jest` | `^30.4.2` | Testes automatizados |
| `supertest` | `^7.2.2` | Testes HTTP da API |

Dependências de desenvolvimento:

| Dependência | Versão | Finalidade identificada |
|---|---:|---|
| `nodemon` | `^3.1.14` | Reinício automático do servidor em desenvolvimento |
| `prisma` | `^7.8.0` | CLI e gerenciamento do Prisma |

### Frontend

| Dependência | Versão | Finalidade identificada |
|---|---:|---|
| `react` | `^18.3.1` | Biblioteca principal de UI |
| `react-dom` | `^18.3.1` | Renderização React no navegador |
| `react-router-dom` | `^6.14.1` | Roteamento SPA |
| `framer-motion` | `^10.12.16` | Animações na interface |

Dependências de desenvolvimento:

| Dependência | Versão | Finalidade identificada |
|---|---:|---|
| `@vitejs/plugin-react` | `^6.0.1` | Plugin React para Vite |
| `vite` | `^8.0.12` | Build/dev server |
| `tailwindcss` | `^3.4.5` | Framework CSS utilitário |
| `postcss` | `^8.4.35` | Processamento CSS |
| `autoprefixer` | `^10.4.19` | Prefixos CSS |
| `eslint` | `^10.3.0` | Lint |
| `jest` | `^30.4.2` | Testes |

## 12. 🧭 Arquitetura e padrões identificados

- **Arquitetura predominante:** camadas simples no backend, com rotas, controllers e models.
- **Separação de responsabilidades:** adequada para etapa inicial; rotas direcionam para controllers, controllers validam e chamam models, models acessam Prisma.
- **Padrões identificados:** Express Router por recurso, funções assíncronas em controllers/models, Prisma como camada de persistência, SPA React com páginas e roteamento via `react-router-dom`.
- **Consistência entre os módulos:** parcial; a estrutura é coerente, mas há variação de nomenclatura entre arquivos e alguns models do banco ainda não possuem endpoints.

# 13. 📝 Avaliação conforme os critérios da AV2

## Regras de pontuação

A pontuação abaixo considera somente evidências encontradas no repositório. Itens dependentes de apresentação, GitHub remoto, professor como colaborador ou banco em produção foram marcados como não verificáveis quando não há comprovação local.

## Quadro avaliativo

| Critério | Valor máximo | Nota atribuída | Evidências e justificativa |
|---|---:|---:|---|
| Organização do repositório, README e professor como colaborador | 1,5 | 0,8 | Estrutura frontend/backend está adequada e organizada; READMEs são ausentes/incompletos; professor como colaborador é NÃO VERIFICÁVEL PELO REPOSITÓRIO. |
| Banco de dados criado e coerente com o MVP | 2,0 | 1,7 | Schema e migration MySQL/MariaDB existem com entidades coerentes com roteiros de viagem; banco em produção não é comprovável pelo repositório. |
| Arquivo exportado do Insomnia com as rotas organizadas | 1,5 | 0,0 | Arquivo exportado do Insomnia NÃO IDENTIFICADO. |
| Backend iniciado com integração ao banco usando Prisma ORM | 2,0 | 1,8 | Express, Prisma Client, models e rotas com operações reais de banco identificadas; tratamento de erros e cobertura de recursos ainda parciais. |
| Frontend iniciado em React, JavaScript e Tailwind | 1,5 | 1,4 | React/Vite em JavaScript, Tailwind configurado e páginas principais iniciadas; componentização ainda parcial. |
| Conexão inicial entre frontend e backend | 1,0 | 0,9 | `fetch` consome rotas reais e proxy Vite aponta para o backend; ausência de CORS limita acesso direto fora do proxy. |
| Clareza na apresentação e divisão de tarefas do grupo | 0,5 | NÃO VERIFICÁVEL | Há histórico local de commits com autores variados, mas a divisão formal de tarefas e clareza da apresentação dependem de verificação externa. |
| **Total verificável no repositório** | **10,0** | **6,6** | Soma dos itens com pontuação verificável local, sem converter o item de apresentação em zero. |

### Observação sobre o total

- **Pontuação obtida nos itens verificáveis:** 6,6
- **Pontos dependentes de apresentação ou verificação externa:** 0,5
- **Nota máxima que pode ser confirmada apenas pelo repositório:** 9,5

O item de clareza na apresentação e divisão de tarefas deve ser definido pelo professor com base em apresentação oral, evidências externas ou documentação complementar.

## 14. 📌 Síntese por critério

### 14.1 Organização do repositório e README — máximo 1,5

- **Situação:** Parcial
- **Evidências:** `backend`, `frontend`, `backend/README.md`, `frontend/README.md`, `git log`
- **Aspectos comprovados:** separação clara entre frontend e backend, configurações presentes e histórico local disponível.
- **Aspectos ausentes:** README completo com nome, problema, objetivo, MVP, tecnologias e execução local.
- **Aspectos não verificáveis:** professor como colaborador.
- **Nota sugerida:** 0,8/1,5

### 14.2 Banco de dados e coerência com o MVP — máximo 2,0

- **Situação:** Atende parcialmente
- **Evidências:** `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260527113453_init/migration.sql`
- **Models/tabelas principais:** usuários, roteiros, dias de roteiro, itens, favoritos, categorias e reviews.
- **Coerência com o MVP:** coerente com um sistema de criação e compartilhamento de roteiros de viagem; MVP formal não está documentado.
- **Criação no servidor de produção:** Não verificável.
- **Nota sugerida:** 1,7/2,0

### 14.3 Insomnia e organização das rotas — máximo 1,5

- **Situação:** Não atende
- **Evidências:** busca no repositório por termos de Insomnia/exportação.
- **Organização das requisições:** NÃO IDENTIFICADO.
- **Compatibilidade com o backend:** NÃO IDENTIFICADO.
- **Nota sugerida:** 0,0/1,5

### 14.4 Backend com Prisma ORM — máximo 2,0

- **Situação:** Atende
- **Evidências:** `backend/src/app.js`, `backend/src/server.js`, `backend/src/config/prisma.js`, `backend/src/models/*.js`
- **Servidor Node.js/Express:** configurado com rotas e porta.
- **Prisma configurado:** schema, migration, adapter MariaDB e client gerado usados no backend.
- **Operação no banco:** `findMany`, `findUnique`, `create`, `update` e `delete` encontrados.
- **Resposta em JSON:** controllers retornam JSON nas rotas principais.
- **Nota sugerida:** 1,8/2,0

### 14.5 Frontend com React, JavaScript e Tailwind — máximo 1,5

- **Situação:** Atende
- **Evidências:** `frontend/package.json`, `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/index.css`, `frontend/tailwind.config.js`
- **React iniciado:** sim, com Vite.
- **JavaScript:** sim, arquivos `.jsx` e `.js`.
- **Tailwind:** configurado e utilizado.
- **Telas e componentes:** páginas principais de roteiros, perfil, comunidade e navegação.
- **Nota sugerida:** 1,4/1,5

### 14.6 Conexão frontend-backend — máximo 1,0

- **Situação:** Atende
- **Evidências:** `frontend/vite.config.js`, `frontend/src/App.jsx`, `frontend/src/pages/*.jsx`, `backend/src/routes/*.js`
- **Fluxo identificado:** frontend usa `fetch` para endpoints REST existentes; proxy Vite redireciona para `http://localhost:3000`.
- **Compatibilidade das rotas e dados:** compatível na maioria dos fluxos de usuários e roteiros; depende do proxy em desenvolvimento.
- **Nota sugerida:** 0,9/1,0

### 14.7 Apresentação e divisão de tarefas — máximo 0,5

- **Situação:** Não verificável
- **Evidências no repositório:** histórico local de commits com autores variados; documentação formal de divisão de tarefas NÃO IDENTIFICADA.
- **O que precisa ser verificado na apresentação:** contribuição efetiva dos integrantes, divisão de responsabilidades e domínio técnico do que foi implementado.
- **Nota sugerida:** A DEFINIR/0,5

## 15. 🔍 Pontos para verificação durante a apresentação

- Demonstrar a execução de `GET /roteiros`, `POST /roteiros`, `PATCH /roteiros/:id` e `DELETE /roteiros/:id`.
- Demonstrar a criação de usuário via `POST /usuarios` e a listagem em `GET /usuarios`.
- Confirmar se o Prisma está conectado a um banco real e se a migration foi aplicada.
- Confirmar se existe banco em produção, pois isso não é comprovável apenas pelos arquivos.
- Mostrar o fluxo do frontend criando e listando roteiros por meio do proxy do Vite.
- Explicar por que as entidades `Favorito`, `Categoria` e `Review` foram modeladas, mas ainda não possuem rotas.
- Apresentar o arquivo exportado do Insomnia, caso exista fora do repositório analisado.
- Evidenciar a participação e divisão de tarefas dos integrantes.
- Verificar se o professor está como colaborador no repositório remoto.

## 16. 📋 Conclusão

O projeto apresenta uma estrutura inicial sólida para a etapa de desenvolvimento: há separação entre backend e frontend, API Express em camadas simples, Prisma configurado com schema e migration, frontend React/Vite com Tailwind e integração inicial via `fetch` e proxy.

As partes comprovadamente funcionais pelo código são as rotas de usuários, roteiros, criação de dias e itens, além de telas React que consomem endpoints do backend. O banco está modelado de forma coerente com o domínio de roteiros de viagem, embora a criação em servidor de produção não seja confirmável pelo repositório.

Os principais entregáveis não encontrados ou incompletos são a documentação inicial completa e o arquivo exportado do Insomnia. Também não há comprovação local da participação detalhada do grupo, da apresentação oral e do professor como colaborador.

Com base apenas nas evidências disponíveis no repositório, a nota sugerida nos itens verificáveis é **6,6/10,0**, com **0,5 ponto** dependente de apresentação ou verificação externa.
