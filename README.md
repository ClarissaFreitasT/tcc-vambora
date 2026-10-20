# Vambora

Monorepositório com dois projetos npm independentes (não há workspace npm na raiz):

- `frontend/`: React 18, Vite 8, React Router 6 com `BrowserRouter`, Tailwind e Three.js. Entrada: `src/main.jsx`. Scripts: `dev`, `build`, `preview`, `lint`, `test`.
- `backend/`: JavaScript ESM, Express 5, Prisma 7.10.1 com adaptador MariaDB para MySQL, JWT Bearer. Entrada: `src/server.js`; aplicação: `src/app.js`. Scripts: `dev`, `start`, `test`, `test:watch`, `test:coverage`.
- `backend/prisma/`: schema e oito migrations. Cliente gerado em `backend/generated/prisma/`, não versionado.
- Upload de fotos separado na branch local `feature/upload-fotos`, preservada a partir do commit `12017b4`. A `main` publica texto, categorias e roteiros vinculados, sem receber arquivos. Schema, migrations e arquivos antigos foram preservados; fotos de publicações não são exibidas nesta versão.

Use Node **24.11.1** (ou patch de segurança compatível da série 24, atualizando os arquivos `.node-version`). Os manifests aceitam `>=24.11.0 <25`. Os lockfiles devem acompanhar os manifests no Git.

## Deploy

Situação: **PRONTO COM PENDÊNCIAS**. As configurações de deploy estão preparadas, mas faltam as URLs reais, credenciais e validação do MySQL e teste integrado. Não publique a build de auditoria: ela usa uma origem `.invalid` exclusivamente para testar a compilação. Gere uma nova build com a API real.

### Frontend — Hostinger / Apache

Diretório: `frontend`. Instale com `npm ci` (ou `npm install` para desenvolvimento). Copie `.env.production.example` para `.env.production` e preencha **apenas**:

```dotenv
VITE_API_URL=<URL HTTPS real do Web Service Render, sem barra final>
```

O valor deve ser a origem da API, sem `/health`, sem subpasta e sem credenciais. Não use os sinais `< >` no valor real. O build falha se estiver vazio, for HTTP ou localhost. Variáveis `VITE_*` são públicas e incorporadas durante a compilação; Apache não lê `.env.production`.

- Public path / Vite `base`: `/tecti/2026/gpec01/`, em `vite.config.js`.
- `BrowserRouter basename`: `import.meta.env.BASE_URL`, resolvido para o mesmo caminho.
- Favicon, textura do globo e compartilhamento de perfil respeitam a base.
- Chamadas de API usam `VITE_API_URL`. Fotos de perfil e capas de roteiros por URL continuam funcionando.
- `public/.htaccess` é copiado para `dist/.htaccess`. Apache precisa de `mod_rewrite` e permissão de override para as diretivas do arquivo. O preview do Vite não executa `.htaccess`; confirme no servidor.

```bash
cd frontend
npm ci
npm run build
npm run preview
```

Preview: `http://localhost:4173/tecti/2026/gpec01/`.

> Transfira o CONTEÚDO da pasta `dist` para a pasta correspondente ao projeto no servidor Apache.

No FileZilla, abra `frontend/dist` localmente. No servidor, abra a pasta que corresponde à URL `/tecti/2026/gpec01/` dentro da raiz pública do domínio real (confirme a raiz no painel; o caminho físico não foi informado). Envie `index.html`, `assets/`, `textures/`, `favicon.svg`, `icons.svg` e `.htaccess`, incluindo arquivos ocultos. Não crie uma pasta `dist` no destino. Não envie `.env`, fontes, `node_modules`, backend, banco ou documentação de auditoria.

Conteúdo de `.htaccess`:

```apache
Options -MultiViews
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /tecti/2026/gpec01/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

Se o caminho mudar, altere `base` e `RewriteBase` juntos e refaça o build. O basename acompanha a base automaticamente. Não use `base: "./"`.

### Backend — Render

Preencha manualmente no painel, após revisar e enviar as alterações ao GitHub:

```text
Service Type: Web Service
Repository: https://github.com/ClarissaFreitasT/tcc-vambora
Branch: main (branch identificada; confirme que é a branch de produção)
Root Directory: backend
Runtime: Node
Build Command: npm ci --include=dev && npx prisma generate
Start Command: npm start
Health Check Path: /health
Auto Deploy: desabilitado no primeiro deploy; habilitar após validar produção e revisar migrations
```

Node é selecionado por `backend/.node-version` (24.11.1). Não há compilação TypeScript do backend. `prisma.config.ts` é carregado pelo Prisma CLI. O build inclui devDependencies para disponibilizar o CLI e gera o cliente; não aplica migrations. O start usa Node, sem nodemon, escuta em `0.0.0.0` e lê `process.env.PORT`. **Não crie PORT manualmente no Render**.

Variáveis do Render:

```dotenv
NODE_ENV=production
DATABASE_URL=<URL MySQL fornecida pelo administrador do banco>
JWT_SECRET=<chave aleatória exclusiva, pelo menos 32 caracteres>
FRONTEND_URL=<origem HTTPS real da Hostinger, sem /tecti/2026/gpec01/>
JWT_EXPIRES_IN=1d
```

`JWT_EXPIRES_IN` é opcional: padrão `1d`. A `main` não recebe uploads e não exige disco persistente nem `UPLOAD_DIR`. `POST /publicacoes` aceita JSON; multipart retorna 415.

CORS usa a origem exata, pois o cabeçalho Origin contém protocolo, domínio e porta, **nunca subpasta**. A autenticação existente usa `Authorization: Bearer`, não cookies; não é necessário `credentials: true`. Ferramentas sem Origin e health checks continuam aceitos. CORS não substitui autorização.

O servidor só escuta após `SELECT 1`; banco indisponível causa saída com código 1 e mensagem sem credenciais. `GET /health` responde `{"status":"ok"}` sem consultar banco. Isso é liveness, não comprovação contínua de acesso ao MySQL. SIGTERM/SIGINT encerram conexões de modo controlado.

Referências oficiais: [fluxo de deploy](https://render.com/docs/deploys), [MySQL no Prisma 7](https://docs.prisma.io/docs/orm/v7/core-concepts/supported-databases/mysql).

### Banco

Biblioteca: Prisma Client + `@prisma/adapter-mariadb`. MySQL externo; não é hospedado por este repositório. **`DATABASE_URL` é a única configuração de conexão**, usada tanto pelo runtime quanto pelo CLI. As antigas `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD` e `DATABASE_NAME` não são mais usadas.

Formato (substitua todos os marcadores; encode usuário/senha com caracteres especiais):

```text
mysql://USUARIO:SENHA_URL_ENCODED@HOST:PORTA/BANCO
```

Para TLS acrescente `?sslaccept=strict`. Para CA privada acrescente também `&sslcert=/caminho/absoluto/ca.pem`, apontando para um arquivo seguro existente no ambiente de execução. O código verifica o certificado e não aceita `accept_invalid_certs`. Na execução local do CLI, use o caminho local do mesmo certificado. TLS é configurável conforme o provedor; use conexão criptografada no banco externo. Não acrescente parâmetros extras sem adaptar e testar a configuração.

São necessários: host externo acessível pelo Render, porta, banco existente, usuário, senha, política TLS/CA e liberação de rede para o serviço e para a máquina que aplicará migrations. A conta de aplicação deve ter somente permissões necessárias; migrations precisam de permissões de DDL. Não use a conta root em produção.

Oito migrations versionadas:

1. `20260527113453_init`
2. `20260903193553_removendo_orcamento_perfil`
3. `20260930120000_add_user_role`
4. `20261009120000_add_username_unique`
5. `20261015120000_add_data_nascimento`
6. `20261015150000_add_social_community`
7. `20261016120000_expand_community`
8. `20261019100000_add_roteiro_image`

**A segunda remove `usuarios.orcamento_perfil`.** Preserve backup e revise as migrations pendentes em banco com dados. Nenhuma migration foi alterada ou aplicada nesta auditoria. O schema foi validado estaticamente; aplicação SQL e drift ainda precisam ser verificados no banco real. Não há script de seed; a migration de comunidade insere as categorias Dicas, Roteiros e Destinos.

Execute manualmente, na pasta `backend`, com as variáveis do banco correto configuradas em um ambiente controlado:

```bash
npm ci --include=dev
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
```

`migrate status` pode retornar código não zero ao informar migrations pendentes. Revise antes de continuar. Para banco existente sem histórico Prisma, faça comparação e baseline específico antes de aplicar; não marque migrations como aplicadas sem conferir o schema. Não use reset, recriação de banco ou `db push` como fluxo de produção. Não acople migrations ao start.

## Instruções para fazer o deploy

A numeração abaixo mantém os ambientes separados. Dependências obrigatórias: prepare o banco (ambiente 4) antes de iniciar Render (3); publique e teste Render (3) antes de gerar/enviar o frontend final (2).

### Ambiente 1 — Desenvolvimento local

1. Instale Node 24.11.1. Na raiz, execute:

```powershell
Copy-Item backend/.env.example backend/.env
```

2. Preencha `backend/.env`: `NODE_ENV=development`, `PORT=3000`, `FRONTEND_URL=http://localhost:5173`, `DATABASE_URL` do seu MySQL e `JWT_SECRET` aleatória. `JWT_EXPIRES_IN=1d` é opcional. Gere sua chave localmente com:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

3. `frontend/.env.development` já contém `VITE_API_URL=http://localhost:3000`. Para outra porta, crie `.env.development.local` com o valor correto. Não coloque segredos no frontend.
4. Inicie o MySQL local e revise/aplique as migrations de desenvolvimento conforme a seção Banco (sem reset). Em um terminal:

```bash
cd backend
npm ci --include=dev
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm test -- --runInBand
npm start
```

5. Em outro terminal:

```bash
cd frontend
npm ci
npm test -- --runInBand
npm run lint
npm run dev
```

6. Abra `http://localhost:5173/tecti/2026/gpec01/`. Teste a API em `http://localhost:3000/health` e `http://localhost:3000/roteiros/publicos`. O segundo endpoint precisa de banco e schema prontos. Cadastro (maior de 18 anos), login e criação/leitura de roteiro devem funcionar antes de prosseguir.
7. Revise as alterações, alertas de dependências e arquivos ignorados. Faça commit/push manualmente quando estiver satisfeito; nenhum foi feito nesta tarefa.

### Ambiente 2 — Hostinger / Apache

1. Só gere a build final após obter e testar a URL pública do ambiente 3.
2. Na pasta `frontend`, copie `.env.production.example` para `.env.production` e preencha `VITE_API_URL` com a origem HTTPS real do Render.
3. Confirme `base=/tecti/2026/gpec01/`, basename herdado de `BASE_URL` e o `.htaccess` mostrado acima.
4. Execute `npm ci`, `npm run build`, `npm run preview`; teste no caminho do preview. Inspecione `dist/index.html`: assets devem começar com `/tecti/2026/gpec01/assets/`.
5. Abra `frontend/dist` no FileZilla e envie seu conteúdo para a pasta pública correspondente a `/tecti/2026/gpec01/`. Envie também `.htaccess`. Não envie a pasta `dist` como um nível adicional nem arquivos de configuração/segredos/fontes.
6. Teste na origem real da Hostinger: `/tecti/2026/gpec01/`, `/tecti/2026/gpec01/login`, `/tecti/2026/gpec01/roteiros/publicos` e `/tecti/2026/gpec01/explorar`. Cole uma rota interna diretamente na barra do navegador e atualize com F5. Verifique também a textura do globo e o link compartilhado do perfil.

### Ambiente 3 — Render

1. Prepare o banco no ambiente 4, com backup/revisão quando existente.
2. Configure exatamente os campos e variáveis da subseção Backend — Render. Confirme que o código atualizado está no GitHub.
3. Mantenha Auto Deploy desabilitado inicialmente. `FRONTEND_URL` deve apontar à origem real da Hostinger, mesmo que o frontend ainda não tenha sido enviado. Não configure PORT.
4. Execute as migrations manualmente no ambiente controlado, antes do deploy da versão correspondente. O build gera Prisma Client; não aplica SQL.
5. Faça o deploy manual pelo painel. Consulte os logs e teste `<URL_REAL_RENDER>/health`, depois `<URL_REAL_RENDER>/roteiros/publicos`. A primeira deve retornar status ok e a segunda JSON com dados ou lista vazia, sem erro 500.
6. Copie a URL pública para o frontend e retorne ao ambiente 2. Habilite Auto Deploy apenas depois dos testes e com um processo de revisão de migrations.

### Ambiente 4 — Banco de dados de produção

1. Obtenha host, porta, nome do banco, usuário, senha e requisitos de TLS/CA do provedor. Garanta conectividade externa e backups.
2. Configure a URL codificada em `DATABASE_URL` no Render e na sessão controlada que executará o Prisma CLI. Certificado privado precisa existir nos dois ambientes, com caminhos próprios.
3. Revise as oito migrations, especialmente a remoção de `orcamento_perfil`. Em banco existente, compare histórico/schema e faça backup antes de qualquer aplicação.
4. Execute `npx prisma migrate status`, depois `npx prisma migrate deploy` após a revisão, e novamente `npx prisma migrate status`. Não há seed separado para executar.
5. Não altere o banco durante o build/start. Teste a API com `/roteiros/publicos`, cadastro/login e gravação/leitura de dados de teste. `/health` sozinho não valida banco.

### Ambiente 5 — Teste integrado final

1. Abra a página inicial na subpasta real; confira CSS, imagens, favicon e globo.
2. Acesse uma rota interna diretamente, atualize e confirme ausência de 404.
3. No Network, confirme que chamadas vão ao Render por HTTPS, sem localhost ou origem Apache para a API.
4. Cadastre um usuário de teste adulto, faça login, recarregue e confira a sessão.
5. Crie um roteiro com dias/itens; leia, atualize, publique e confira a listagem pública.
6. Teste salvar/curtir/avaliar e o compartilhamento de perfil na subpasta.
7. Publique texto na comunidade, selecione categorias e vincule um roteiro público. Confirme que não existe opção de anexar arquivos.
8. Teste exclusão somente dos registros de teste, quando disponível e autorizado.
9. Confira Console, Network (incluindo preflight OPTIONS) e logs do Render. Não compartilhe tokens ou senhas capturados nos logs.

## Validação desta auditoria

- `npm install` e `npm ci --include=dev`: passaram nos dois projetos; lockfiles atualizados com correções compatíveis de segurança.
- `npm run build`: passou com origem HTTPS fictícia `.invalid` usada somente na auditoria, pois a URL Render não foi fornecida. `dist/` foi criada e assets conferidos.
- Preview HTTP: 200 para início, login, roteiros públicos, CSS, JS, favicon e textura. Não equivale a teste visual de navegador nem execução de regras Apache.
- Testes: frontend 29/29; backend 73/73 (incluindo health, CORS e configuração MySQL/TLS). Testes de modelos usam mocks; não provam conexão real.
- Lint frontend: passou.
- Prisma 7.10.1: generate e validate passaram; oito migrations inspecionadas, nenhuma aplicada.
- API real em porta temporária: `/health` 200, preflight 204, origem permitida ecoada, outra origem sem liberação CORS.
- `npm start` com MySQL deliberadamente indisponível: saída 1, sem expor string de conexão. Start com MySQL funcional ainda pendente.
- Imports relativos auditados contra nomes exatos, sem divergência de caixa. Execução Linux não foi realizada; Docker não estava disponível.
- Sem credenciais reais identificadas nos arquivos versionados inspecionados. O histórico de nomes de arquivos não mostrou `.env` real; a busca não é garantia de ausência em todo o histórico. Se algum segredo antigo for identificado, revogue/rotacione; remover o arquivo não basta.
- Auditoria npm após correções: backend runtime 0; frontend runtime 2 moderadas (React Router). Totais incluindo ferramentas: backend 22 (19 moderadas, 3 altas), frontend 28 (23 moderadas, 5 altas). Não foi aplicado `--force`: as sugestões incluem migrações de React Router/Tailwind ou downgrade de ferramentas. Revise esses alertas antes da liberação; SSR não é usado, mas o alerta de redirecionamento do Router merece revisão específica.
- Aviso não bloqueante: chunk do globo ~556 kB minificado; já é carregado sob demanda. Sem refatoração estética.

Nenhum deploy, FTP, commit, push, reset ou alteração de dados foi realizado.
