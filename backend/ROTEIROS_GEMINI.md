# Roteiros com Gemini

O fluxo está em `/roteiros/ia/novo` no frontend. Usuários autenticados informam cidades em ordem, pessoas e datas; recebem uma prévia privada e continuam em `/planejamentos-ia/:id`. O chat só aparece após a primeira versão válida. A primeira confirmação cria o roteiro; confirmações posteriores atualizam o mesmo roteiro. Uma proposta nunca publica o roteiro automaticamente.

## Configuração

Na pasta `backend`, instale as dependências com `npm ci`. Configure em `.env`, ou nas variáveis do serviço Render:

```dotenv
GEMINI_API_KEY=<chave da Gemini Developer API>
GEMINI_MODEL=<identificador de um modelo disponível com saída JSON estruturada>
GEMINI_LIMITE_HORA=20
```

Não adicione essas variáveis ao frontend ou use o prefixo `VITE_`. A ausência de chave ou modelo desabilita somente a geração por IA, com resposta HTTP 503; roteiros manuais continuam funcionando após a migration. Nenhum modelo é escolhido silenciosamente pelo código. Consulte os modelos disponíveis na sua conta e a [documentação de saídas estruturadas](https://ai.google.dev/gemini-api/docs/structured-output).

A implementação usa `@google/genai`, `models.generateContent`, JSON Schema, timeout de 60 segundos e uma única tentativa por chamada. Não usa pesquisa na web, reservas, mapas nem estimativas de preço. O limite de uso é uma janela móvel de uma hora contabilizada no banco, inclusive para chamadas que falharam. Excluir uma conversa não apaga os registros de consumo.

## Banco e deploy

A migration `20261028120000_add_planejamento_ia` adiciona metadados opcionais e revisão aos roteiros, cidade principal aos dias e tabelas de planejamentos, mensagens, propostas e operações. Não modifica migrations anteriores nem apaga dados existentes.

Antes de iniciar esta versão da API, aponte `DATABASE_URL` para o banco de desenvolvimento escolhido e execute na pasta `backend`:

```bash
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npm test -- --runInBand
```

Em produção, revise as migrations pendentes e aplique-as pelo processo de deploy já documentado no README da raiz. A aplicação não executa migrations durante o start. Gere/publice o frontend depois do backend atualizado. Campos antigos continuam compatíveis com roteiros manuais e cópias; cópias carregam os dados de viagem, mas não a conversa.

## API

Todos os endpoints usam `Authorization: Bearer <token>` e validam o proprietário. Leituras públicas de roteiros não incluem conversas nem propostas.

| Método e caminho | Comportamento |
| --- | --- |
| `POST /planejamentos-ia` | Gera e persiste uma prévia, sem criar roteiro |
| `GET /planejamentos-ia` | Lista os planejamentos do usuário |
| `GET /planejamentos-ia/:id` | Retorna mensagens, proposta pendente e roteiro confirmado |
| `POST /planejamentos-ia/:id/mensagens` | Refina proposta pendente ou roteiro salvo |
| `POST /planejamentos-ia/:id/propostas/:propostaId/aplicar` | Confirma a proposta em uma transação |
| `POST /planejamentos-ia/:id/propostas/:propostaId/descartar` | Descarta sem alterar o roteiro |
| `DELETE /planejamentos-ia/:id` | Exclui a conversa, preservando o roteiro confirmado |

Exemplo do corpo de criação:

```json
{
  "operacaoId": "b3295a46-aebe-4828-b277-201b9b3216e6",
  "cidades": [
    { "nome": "Lisboa", "regiao": "Lisboa", "pais": "Portugal" },
    { "nome": "Porto", "regiao": "Porto", "pais": "Portugal" }
  ],
  "pessoas": 2,
  "dataIda": "2027-01-01",
  "dataVolta": "2027-01-05"
}
```

Mensagens recebem `{ "operacaoId": "novo-identificador-unico", "mensagem": "Mais passeios ao ar livre" }`. O mesmo identificador deve ser reutilizado ao reenviar um pedido cujo resultado de rede seja incerto. Reutilizar com conteúdo diferente retorna 409. Uma falha definitiva exige novo identificador; quando disponível, o erro retorna `planejamentoId` para recuperar o estado e `novaTentativa: true`. O frontend preserva o identificador na tentativa de rede enquanto a página permanece aberta.

Confirmação usa o ID da proposta persistida, nunca aceita um roteiro arbitrário no corpo. A mesma proposta aplicada novamente não cria cópias. Durante uma geração, confirmação, descarte e exclusão retornam 409. O bloqueio expira após 90 segundos para permitir recuperação caso o processo seja interrompido; uma resposta atrasada não pode substituir uma geração mais recente.

## Validação, conflitos e contexto

- Datas civis `YYYY-MM-DD`, sem conversão de fuso, com ida e volta inclusivas. De 1 a 30 dias, 1 a 10 cidades distintas, pelo menos um dia por cidade e de 1 a 50 pessoas.
- Cidades têm nome, região e país. Cada dia aponta para uma cidade principal; a sequência deve ser não decrescente. Dias de deslocamento são atribuídos à chegada.
- A proposta contém roteiro completo e de 1 a 12 atividades por dia, com horário local `HH:mm` ou `null`. O servidor valida limites, contagem, ordem, campos e horários antes de salvar.
- O Gemini recebe dados da viagem, roteiro atual, proposta pendente válida e últimas 20 mensagens. Dados de cadastro, tokens e credenciais não são enviados. O histórico completo permanece privado no banco.
- Mudanças manuais incrementam a revisão do roteiro, inclusive em dias e atividades. A aplicação da proposta faz comparação de revisão e retorna 409 se houver edição posterior. Um novo pedido usa o roteiro atual e ignora a proposta obsoleta como base.
- Perguntas sem proposta preservam a prévia atual. Falhas do provedor ou da validação não substituem a prévia nem o roteiro. A gravação do roteiro completo é atômica; falha na criação de um dia/atividade reverte a confirmação inteira.
- Logs do provedor contêm somente modelo, duração, total de tokens informado e categoria de resultado. Não contêm prompts, respostas completas ou chave.

## Verificação

Backend: testes de validação, adaptador Gemini simulado, ciclo de vida com transações simuladas, propriedade, limites, idempotência, descarte, falhas, revisão manual e regressões existentes. Frontend: utilitários e testes do formulário/chat em DOM simulado, além de lint e build.

Para o teste integrado real, use conta de teste em banco de desenvolvimento: gere uma viagem com duas cidades, refine antes de salvar, confirme, peça novo ajuste, descarte, recarregue, confirme outra alteração e abra o roteiro salvo. Depois edite manualmente uma atividade com uma proposta pendente e confira que a confirmação é recusada até gerar nova proposta.

Na implementação inicial, schema e cliente Prisma foram validados/gerados, mas a migration não foi aplicada ao banco remoto configurado. A chave e o modelo Gemini não estavam configurados. Portanto, execução SQL no banco de desenvolvimento e chamadas reais ao provedor permanecem pendentes até a configuração desse ambiente.
