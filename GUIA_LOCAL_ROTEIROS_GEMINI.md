# Configurar e testar os roteiros com Gemini localmente

Este guia usa Windows, PowerShell e MySQL/MariaDB local pelo XAMPP. Os comandos partem deste projeto: `D:\Dev\tcc-2026\3TIB\tcc-vambora`. Se ele estiver em outro diretório, ajuste os caminhos.

Você pode executar os testes automatizados sem chave do Gemini nem banco disponível. Para testar a funcionalidade pelo navegador, são necessários banco com migrations aplicadas, chave válida e modelo configurado.

## 1. Conferir os pré-requisitos

- Node.js da série 24, compatível com `>=24.11.0 <25`; o projeto foi validado com 24.11.1.
- npm, instalado junto com o Node.js.
- Git.
- XAMPP com MySQL/MariaDB, ou outra instalação local compatível.
- Conta com acesso ao Google AI Studio e à Gemini API.

Abra o PowerShell:

```powershell
Set-Location D:\Dev\tcc-2026\3TIB\tcc-vambora
node --version
npm --version
git branch --show-current
git status --short
```

A implementação está na branch `feature/roteiros-gemini`. Se estiver em outra branch, preserve suas alterações antes de trocar:

```powershell
git switch feature/roteiros-gemini
```

## 2. Criar um banco exclusivo para desenvolvimento

1. Abra o painel do XAMPP e inicie **MySQL**.
2. Para usar o phpMyAdmin, inicie também **Apache** e abra `http://localhost/phpmyadmin`.
3. Na aba SQL, execute:

```sql
CREATE DATABASE IF NOT EXISTS vambora_dev
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

O Apache é necessário apenas para o phpMyAdmin neste procedimento. O frontend usa Vite, e a API usa Node.js.

Anote a porta e as credenciais do seu banco local. O exemplo deste guia usa porta `3306`. Use uma conta local com permissão para criar e alterar tabelas em `vambora_dev`, pois as migrations precisam dessas permissões.

**A configuração encontrada durante a implementação apontava para um banco remoto. Troque a `DATABASE_URL` para o banco local antes de executar migrations.** Não é necessário copiar dados do banco remoto: as migrations preparam um banco vazio, e você criará um usuário de teste pela interface.

## 3. Preparar o backend

Na raiz do projeto:

```powershell
Set-Location D:\Dev\tcc-2026\3TIB\tcc-vambora\backend
npm ci
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
```

Se `.env` já existir, edite-o sem substituí-lo pelo arquivo de exemplo. Preencha:

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="mysql://SEU_USUARIO:SUA_SENHA@127.0.0.1:3306/vambora_dev"
JWT_SECRET="SUA_CHAVE_ALEATORIA"
JWT_EXPIRES_IN=1d
GEMINI_API_KEY="SUA_CHAVE_GEMINI"
GEMINI_MODEL="IDENTIFICADOR_DO_MODELO"
GEMINI_LIMITE_HORA=20
```

Os valores em maiúsculas são marcadores: substitua-os. Se a conta local não tiver senha, o formato da conexão é `mysql://SEU_USUARIO@127.0.0.1:3306/vambora_dev`. Caracteres especiais no usuário ou senha da URL precisam de codificação percentual; por exemplo, `@` vira `%40`.

Para gerar o valor de `JWT_SECRET`, execute e copie o resultado para o `.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

A chave JWT e a chave Gemini são valores diferentes. Não coloque nenhuma delas no frontend nem publique o `.env` no Git.

## 4. Obter a chave e escolher o modelo Gemini

1. Abra o [Google AI Studio](https://aistudio.google.com/) e entre com sua conta.
2. Acesse a área de chaves de API e use **Create API key** para criar uma chave vinculada ao projeto desejado. O procedimento oficial está em [Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key).
3. Copie a chave para `GEMINI_API_KEY` em `backend/.env`.
4. Escolha um modelo de texto disponível para sua conta que suporte saída JSON estruturada. Consulte o [catálogo de modelos](https://ai.google.dev/gemini-api/docs/models) e a [documentação de saída estruturada](https://ai.google.dev/gemini-api/docs/structured-output).
5. Copie o identificador técnico do modelo, não seu nome de apresentação, para `GEMINI_MODEL`. Ele deve ser aceito pela operação `models.generateContent` do SDK `@google/genai`.

O projeto não define um modelo padrão. Deixar chave ou modelo vazios faz a geração retornar indisponibilidade. O uso real segue as cotas e condições da sua conta; confira o projeto selecionado no AI Studio antes dos testes.

Após alterar `.env`, reinicie o backend: encerre com `Ctrl+C` e execute `npm run dev` novamente.

## 5. Aplicar as migrations no banco local

Ainda em `backend`, confira o destino efetivo da conexão sem imprimir usuário ou senha:

```powershell
node --input-type=module -e "import 'dotenv/config'; const u = new URL(process.env.DATABASE_URL); console.log({host:u.hostname, porta:u.port || '3306', banco:u.pathname.slice(1)});"
```

O resultado esperado é host `127.0.0.1` ou `localhost`, porta do MySQL local e banco `vambora_dev`. Variáveis definidas no terminal podem ter precedência sobre `.env`; se aparecer outro destino, corrija antes de continuar.

Execute cada comando e confira seu resultado:

```powershell
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npx prisma migrate status
```

O primeiro `migrate status` pode terminar com código diferente de zero porque existem migrations pendentes em um banco novo. Nesse caso, confira a lista e prossiga com `migrate deploy`. Erros de conexão ou autenticação precisam ser resolvidos antes.

Ao final, as migrations devem estar em dia, incluindo `20261028120000_add_planejamento_ia`. Essa migration acrescenta os dados da viagem, revisão do roteiro e tabelas de planejamentos, mensagens, propostas e operações.

Não use `prisma migrate reset` ou `prisma db push` neste procedimento. A API não aplica migrations automaticamente ao iniciar.

## 6. Executar os testes automatizados

Estes testes simulam o Gemini e o acesso ao banco: não consomem a chave, não exigem MySQL ativo e não comprovam a integração real.

Backend:

```powershell
Set-Location D:\Dev\tcc-2026\3TIB\tcc-vambora\backend
npm ci
npm test -- --runInBand
```

Frontend:

```powershell
Set-Location D:\Dev\tcc-2026\3TIB\tcc-vambora\frontend
npm ci
npm test -- --runInBand
npm run lint
```

Na entrega inicial, passaram **112 testes de backend e 39 de frontend**. Essa contagem pode mudar conforme o projeto evoluir; o critério é não haver testes falhando.

## 7. Iniciar a API e o frontend

Mantenha dois terminais abertos.

**Terminal 1 — backend:**

```powershell
Set-Location D:\Dev\tcc-2026\3TIB\tcc-vambora\backend
npm run dev
```

Resultado esperado: `API escutando na porta 3000`. O servidor só inicia após conseguir conectar ao MySQL.

**Terminal 2 — frontend:**

Confirme que `frontend/.env.development` contém:

```dotenv
VITE_API_URL=http://localhost:3000
```

Se precisar sobrescrever a configuração somente na sua máquina, use `frontend/.env.development.local` com essa variável. Confira também se já existe uma configuração local apontando para outra API.

```powershell
Set-Location D:\Dev\tcc-2026\3TIB\tcc-vambora\frontend
npm run dev -- --port 5173 --strictPort
```

Abra:

- Aplicação: `http://localhost:5173/tecti/2026/gpec01/`
- Criação com IA: `http://localhost:5173/tecti/2026/gpec01/roteiros/ia/novo`
- Health da API: `http://localhost:3000/health`

O health deve retornar `{"status":"ok"}`. Ele indica que a API está ativa, mas não testa a chave Gemini nem todas as tabelas do banco.

Use `localhost` ao abrir o frontend, de acordo com `FRONTEND_URL`. A opção `--strictPort` evita o Vite mudar silenciosamente de porta e causar erro de CORS.

Não é necessário executar `npm run build` para testar localmente. O build deste projeto exige uma origem HTTPS pública em `VITE_API_URL`, própria para produção, e rejeita localhost.

## 8. Cadastrar um usuário de teste

1. Na aplicação, abra o cadastro.
2. Cadastre uma conta de teste com data de nascimento de uma pessoa maior de 18 anos.
3. Faça login.
4. Abra **Meus roteiros** e confirme que a listagem carrega.

Se criou um banco vazio, contas existentes no banco remoto não estarão disponíveis localmente.

## 9. Testar geração, chat e confirmação

### A. Gerar uma viagem com duas cidades

Clique em **Criar com IA** e preencha:

| Campo | Valor de teste |
| --- | --- |
| Cidade 1 | Lisboa / Lisboa / Portugal |
| Cidade 2 | Porto / Porto / Portugal |
| Pessoas | 2 |
| Ida | 10/01/2027 |
| Volta | 15/01/2027 |

Clique em **Gerar roteiro com IA** e aguarde. Se essas datas já tiverem passado quando você executar o guia, use outras com o mesmo intervalo.

Confira:

- Existem seis dias de programação, contando ida e volta.
- Lisboa vem antes de Porto, e ambas recebem pelo menos um dia.
- A soma dos dias por cidade é seis.
- Há atividades e sugestão de deslocamento entre as cidades.
- A tela indica que a prévia aguarda confirmação e exibe o chat.
- A prévia aparece em **Planejamentos com IA**, mas ainda não é um roteiro confirmado.

### B. Refinar antes do primeiro salvamento

Envie no chat:

> Quero mais atividades ao ar livre e um ritmo mais tranquilo no primeiro dia.

Confira que a nova proposta mantém cidades, pessoas e datas e apresenta um resumo das mudanças. O roteiro ainda não deve ter sido criado na lista de roteiros confirmados.

### C. Salvar a primeira versão

Clique em **Salvar roteiro** e depois em **Abrir roteiro salvo**.

Confira título, datas, pessoas, dias e atividades. O roteiro deve começar privado. Volte pela opção **Ajustar com IA**, ou pela seção de planejamentos em **Meus roteiros**.

### D. Pedir mudança e descartar

Envie:

> Mude a quantidade de pessoas para 4.

A proposta deve destacar a mudança. Antes de confirmar, abra o roteiro salvo em outra aba: ele deve continuar com duas pessoas. Clique em **Descartar proposta** e confira que o roteiro continua igual.

### E. Aplicar uma alteração

Envie novamente o pedido de quatro pessoas e clique em **Aplicar alterações**. Atualize a aba do roteiro salvo: agora deve mostrar quatro pessoas, mantendo o mesmo ID/URL do roteiro.

### F. Retomar depois de sair

Atualize a página ou volte a **Meus roteiros → Planejamentos com IA**. A conversa e o roteiro confirmado devem continuar disponíveis. Se deixar uma proposta pendente, ela também deve ser recuperada.

## 10. Testar conflito com edição manual

1. No chat, peça outra mudança e deixe a proposta pendente.
2. Em outra aba, abra o roteiro salvo e edite o título de uma atividade manualmente.
3. Volte ao planejamento e clique em **Atualizar**.
4. A aplicação da proposta antiga deve ficar bloqueada com orientação para pedir uma proposta atualizada.
5. Envie: “Atualize a proposta considerando minha edição manual mais recente”.
6. Confira a nova prévia e aplique-a.

Se tentar aplicar sem atualizar a página, o servidor também deve recusar com HTTP 409. A edição manual não pode ser sobrescrita pela proposta antiga.

## 11. Testar validações e falhas

| Cenário | Resultado esperado |
| --- | --- |
| Uma cidade, ida e volta na mesma data | Um dia de programação |
| Mais cidades que dias | Validação antes da geração |
| Volta anterior à ida, mais de 30 dias ou mais de 50 pessoas | Pedido recusado |
| Cidade sem nome, região ou país | Formulário solicita preenchimento |
| Fechar a página durante a geração e reabrir o planejamento | Usar **Atualizar** para recuperar o resultado |
| Descartar proposta | Roteiro confirmado preservado |
| Excluir planejamento depois de salvar | Conversa excluída, roteiro preservado |
| Acessar a URL do planejamento com outra conta | Acesso recusado sem exibir a conversa |

Para testar ausência de configuração, deixe `GEMINI_API_KEY` vazia temporariamente, reinicie a API e tente gerar. Deve aparecer indisponibilidade; a criação manual deve continuar funcionando. Depois restaure a chave e reinicie novamente.

Para testar o limite local de chamadas, configure temporariamente `GEMINI_LIMITE_HORA=1` e reinicie a API. Após uma tentativa, uma nova chamada com o mesmo usuário dentro de uma hora deve ser recusada. Tentativas anteriores nessa janela também contam. Ao terminar, restaure `20` e reinicie. As cotas do Google são independentes desse limite local.

## 12. Resolver problemas comuns

| Sintoma | O que conferir |
| --- | --- |
| Backend não conecta ao MySQL | Serviço ativo, porta, usuário, senha e banco em `DATABASE_URL` |
| Tabela ou coluna não existe | `prisma migrate status`, migrations aplicadas no mesmo banco da API e `prisma generate` |
| `JWT_SECRET` ausente | Preencher `backend/.env` e iniciar a API dentro da pasta `backend` |
| Erro de CORS | Frontend em `http://localhost:5173` e esse mesmo valor em `FRONTEND_URL`, sem subpasta |
| Frontend chama API remota | Conferir `.env.development`, `.env.development.local`, `.env.local` e variáveis do terminal; reiniciar o Vite |
| Porta ocupada | Encerrar a instância anterior com `Ctrl+C`; manter as portas alinhadas nos arquivos de ambiente |
| IA indisponível, HTTP 503 | Chave e modelo preenchidos, API reiniciada, modelo disponível, projeto/cotas e acesso de rede ao Google |
| HTTP 502 ao gerar | A resposta não passou na validação ou a tentativa falhou; tentar novamente e consultar o log do backend |
| HTTP 504 | A geração excedeu o prazo de 60 segundos; tentar novamente |
| HTTP 429 | Limite de chamadas do usuário atingido; aguardar a janela ou ajustar o limite local para os testes |
| HTTP 409 | Pedido em andamento ou proposta baseada em revisão antiga; atualizar o planejamento e seguir a mensagem exibida |
| Login deixou de funcionar após trocar o banco | Cadastrar usuário no banco local e fazer login novamente |

O log do Gemini informa modelo, duração, consumo de tokens quando disponível e categoria de resultado. Ele não registra a chave nem o conteúdo integral da conversa. No navegador, a aba **Network/Rede** mostra o código HTTP das chamadas; não compartilhe o cabeçalho `Authorization`.

## Checklist de conclusão

- [ ] `DATABASE_URL` aponta para o banco de desenvolvimento local.
- [ ] Todas as migrations estão aplicadas e o cliente Prisma foi gerado.
- [ ] Chave e modelo Gemini estão configurados somente no backend.
- [ ] API e frontend iniciam nas portas esperadas.
- [ ] Testes automatizados e lint passam.
- [ ] Geração com duas cidades produz a quantidade correta de dias.
- [ ] Chat apresenta propostas e só altera o roteiro após confirmação.
- [ ] Descarte e recarga preservam o estado esperado.
- [ ] Edição manual impede aplicação de proposta obsoleta.

Ao encerrar, pressione `Ctrl+C` nos terminais do frontend e backend. Os dados permanecem no banco local.

Detalhes técnicos dos endpoints e da persistência: [backend/ROTEIROS_GEMINI.md](backend/ROTEIROS_GEMINI.md). Plano original: [PLANEJAMENTO_ROTEIROS_GEMINI.md](PLANEJAMENTO_ROTEIROS_GEMINI.md).
