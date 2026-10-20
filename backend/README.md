# Backend no XAMPP

## Configuracao do MySQL

1. Abra o XAMPP e inicie o modulo **MySQL**. O Apache nao e necessario para este backend Node.js.
2. No phpMyAdmin (`http://localhost/phpmyadmin`), crie um banco chamado `tcc-vambora` com cotejamento `utf8mb4_unicode_ci`.
3. Na pasta `backend`, instale as dependencias e aplique as migrations:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

Copie `.env.example` para `.env` e preencha `DATABASE_URL` com os dados do seu MySQL local e `JWT_SECRET` com uma chave aleatória. Host, porta, usuário, senha e banco são lidos da mesma URL pelo Prisma CLI e pela aplicação. Consulte o README da raiz para TLS e produção.

## Iniciar a API

```bash
npm start
```

A API fica disponivel em `http://localhost:3000`.

## Comunidade

A migration `20261016120000_expand_community` adiciona categorias/fotos às
publicações, salvamentos e denúncias. Aplique-a com `npx prisma migrate deploy`
e regenere o cliente com `npx prisma generate` dentro da pasta `backend`.

As fotos são aceitas em JPG, PNG, WebP e GIF, até 8 MB cada e 8 por publicação.
O conteúdo é validado pelo formato real, guardado em `backend/uploads/community`
e servido em `/uploads/community`. Preserve essa pasta em backups e use um volume
persistente se a API for executada em contêiner ou hospedagem efêmera.

## Home e busca de roteiros

A migration `20261019100000_add_roteiro_image` adiciona a URL opcional da
fotografia de capa do roteiro (`imagem_url`). Aplique as migrations pendentes
com `npx prisma migrate deploy` e regenere o cliente Prisma. A API valida URLs
HTTP/HTTPS com até 500 caracteres; a interface usa a imagem padrão do Vambora
quando o campo estiver vazio ou a imagem não carregar.

`GET /roteiros/publicos` aceita `destino`, `termo`, `orcamentoMin`,
`orcamentoMax`, `dias`, `avaliacaoMin` e `categorias=id1,id2`. Os filtros são
combinados; várias categorias usam correspondência OR. Roteiros sem avaliações
continuam elegíveis ao filtro de nota mínima e são sinalizados no frontend.
`GET /roteiros/populares?limit=4` ordena por combinação de curtidas, avaliações,
nota média, cópias derivadas do roteiro e recência; só classifica como popular
roteiro com ao menos uma curtida, avaliação ou cópia. Roteiros restantes podem
ser exibidos separadamente como recentes.

Rotas adicionais da Comunidade:

- `GET /publicacoes/categorias` — categorias disponíveis para posts e filtros.
- `GET /publicacoes/timeline?limit=12&cursor=...&categorias=id1,id2` — feed
  público cursor-paginado; múltiplas categorias usam correspondência OR.
- `GET /publicacoes/feed?limit=12&cursor=...&categorias=id1,id2` — feed de
  seguindo (inclui as próprias publicações do usuário).
- `POST /publicacoes` — criação JSON ou multipart; campos multipart `texto`,
  `roteiroId` (opcional), `categoriaIds` (JSON em string) e múltiplos `fotos`.
- `GET /publicacoes/:id/curtidas`, `POST|DELETE /publicacoes/:id/salvar` —
  consulta de curtidas e salvamento de publicação autenticado.
- `GET /publicacoes/salvas` — conteúdo salvo do usuário autenticado.
- `POST /publicacoes/:id/denunciar` — recebe `motivo` e `detalhe` opcional;
  cada pessoa pode denunciar uma publicação uma única vez.
- `GET /publicacoes/admin/denuncias` — consulta administrativa, exclusiva de
  contas `ADMIN`. Ao excluir uma publicação, a denúncia permanece sem o conteúdo
  excluído, para preservar o registro administrativo sem manter a publicação.
- `PATCH /publicacoes/admin/denuncias/:denunciaId` — muda o estado para `ABERTA`,
  `EM_ANALISE` ou `TRATADA`, também exclusivo de `ADMIN`.
- `DELETE /publicacoes/:id` — exclusão definitiva pelo próprio autor; curtidas,
  comentários, fotos e salvamentos são removidos por cascata, sem excluir o
  roteiro associado.

O feed **Explorar** pagina pela recência e aplica um pequeno ajuste de relevância
por curtidas/comentários dentro de cada lote. O feed **Seguindo** permanece em
ordem estritamente cronológica.

## Papeis de usuario

Novas contas e contas existentes recebem o papel `USER` por padrao. O cadastro
nao aceita papel enviado pelo cliente. Para promover uma conta, um operador com
acesso administrativo ao banco deve executar uma alteracao direta, usando o
email exato da conta:

```sql
UPDATE usuarios SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Nao exponha essa operacao em uma rota publica nem conceda acesso SQL a usuarios
comuns. `GET /usuarios` retorna apenas campos de perfil público para visitantes
e usuários comuns; com token de `ADMIN`, retorna a listagem administrativa,
também sem incluir `senhaHash`.

## Deploy

Consulte o [guia de deploy na raiz](../README.md#deploy) para a configuração exata do Render, Node 24.11.1, geração do Prisma Client, TLS, disco persistente, CORS e migrations manuais. A configuração de conexão atual usa somente `DATABASE_URL`.
