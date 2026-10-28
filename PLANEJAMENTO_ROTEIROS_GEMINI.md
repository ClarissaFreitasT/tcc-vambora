# Criação e ajuste de roteiros com Gemini

## Registro de execução — 28/10/2026

- Implementação criada na branch `feature/roteiros-gemini`: formulário, geração, prévia, chat, confirmação/descarte, persistência e controle de revisão.
- Migration aditiva `20261028120000_add_planejamento_ia` criada; schema validado e cliente Prisma gerado.
- Validação automatizada: 112 testes de backend e 39 de frontend aprovados; lint, build e verificação de whitespace aprovados.
- Pendente de ambiente: aplicar a migration em um banco de desenvolvimento identificado, configurar `GEMINI_API_KEY` e `GEMINI_MODEL` e testar a integração real. O banco configurado era remoto e não foi alterado.
- Instruções de configuração e operação: [backend/ROTEIROS_GEMINI.md](backend/ROTEIROS_GEMINI.md).

O plano original aprovado está preservado abaixo.

## Resumo

Adicionar um fluxo de criação com IA, mantendo a criação manual existente. O usuário informa cidades em ordem, quantidade de pessoas e datas de ida e volta. O Gemini distribui os dias entre as cidades e sugere atividades e deslocamentos.

A primeira versão aparece como prévia e libera o chat. O usuário pode pedir ajustes antes de salvar. Depois de salvo, qualquer alteração sugerida exige confirmação antes de substituir o roteiro.

**Branch:** criar `feature/roteiros-gemini` a partir da `main` local no início da implementação. O repositório estava sem alterações durante a elaboração do plano; nenhuma branch foi criada durante o planejamento.

## Experiência e regras do produto

- Adicionar a opção **“Criar com IA”** junto à criação manual, acessível somente a usuários autenticados.
- Formulário com lista ordenada de cidades, identificadas por nome, estado/região e país; permitir adicionar, remover e reordenar. Solicitar quantidade de pessoas e datas.
- Contar ida e volta como dias da viagem, inclusive quando forem a mesma data. Gerar programação mais leve nos dias inicial e final, pois horários de chegada e partida não serão solicitados.
- Seguir a ordem informada e atribuir uma cidade principal a cada dia. Em dias de deslocamento, usar a cidade de chegada como principal e descrever o trajeto nas atividades. A soma dos dias por cidade deve corresponder exatamente à duração da viagem.
- Mostrar resumo da distribuição, datas, atividades diárias e sugestões de deslocamento. Sem reservas, consulta de disponibilidade ou preços em tempo real; custos permanecerão vazios nesta versão.
- Liberar o chat após a primeira geração válida. Ele poderá alterar atividades, distribuição, cidades, datas e quantidade de pessoas quando solicitado.
- Mostrar a proposta completa e um resumo das mudanças, destacando alterações nos dados da viagem. Antes do primeiro salvamento, usar **“Salvar roteiro”**; depois, **“Aplicar alterações”** e **“Descartar proposta”**.
- Novos pedidos refinam a proposta pendente, quando existir; caso contrário, partem do roteiro salvo. Descartar uma proposta faz o próximo pedido partir novamente da versão salva.
- Persistir prévia, propostas e conversa para retomada. Prévias ficam em uma seção separada de planejamentos em andamento; só versões confirmadas entram em “Meus roteiros”, inicialmente privadas.
- Em telas pequenas, apresentar roteiro e chat em abas. Exibir estados de geração, envio, falha e nova tentativa, preservando o conteúdo anterior.

## Implementação e interfaces

### Integração com Gemini

- Criar serviço no Express usando `@google/genai`, com chave `GEMINI_API_KEY` exclusivamente no backend e modelo definido por `GEMINI_MODEL`.
- Usar saída JSON estruturada para resposta textual e proposta de roteiro, conforme a [documentação oficial do Gemini](https://ai.google.dev/gemini-api/docs/structured-output). Validar novamente no servidor estrutura, datas, cidades, distribuição e limites dos campos antes de persistir.
- Enviar dados da viagem, versão atual, proposta pendente e histórico recente. Não enviar dados de cadastro. Respostas de esclarecimento podem conter somente texto, sem substituir a proposta.
- Não usar streaming na primeira versão. Configurar timeout de 60 segundos, sem repetição automática de chamadas cobradas; oferecer nova tentativa ao usuário.
- Sem configuração do Gemini, manter a criação manual operacional e apresentar indisponibilidade no fluxo de IA.

### Persistência e compatibilidade

- Criar entidades Prisma para planejamento privado, mensagens e propostas, com proprietário, vínculo opcional ao roteiro, estado e datas. Armazenar cada proposta como documento JSON validado, sem criar tabelas de dias e atividades antes da confirmação.
- Acrescentar campos opcionais de datas, viajantes e cidades ordenadas ao roteiro; acrescentar cidade principal ao dia. Roteiros antigos continuam válidos.
- Ao confirmar, criar ou atualizar roteiro, dias e atividades em uma única transação. Manter título, descrição e o campo textual `destino` compatíveis com as telas e buscas existentes.
- Controlar a revisão do roteiro, incrementando-a também nas alterações manuais de dados, dias e atividades. Recusar com `409` a aplicação de proposta baseada em revisão anterior; orientar a gerar uma proposta atualizada.
- Duplicações copiam os dados da viagem, sem copiar conversa ou propostas. Histórico e planejamento nunca aparecem nas respostas públicas. Exclusão do roteiro remove seu planejamento vinculado.

### API autenticada

- `POST /planejamentos-ia`: recebe cidades ordenadas, pessoas e datas; gera e persiste a primeira prévia.
- `GET /planejamentos-ia` e `GET /planejamentos-ia/:id`: listam planejamentos do proprietário e recuperam conversa, proposta e vínculo com roteiro.
- `POST /planejamentos-ia/:id/mensagens`: recebe pedido textual e retorna resposta, com proposta opcional.
- `POST /planejamentos-ia/:id/propostas/:propostaId/aplicar`: confirma a proposta persistida e retorna o roteiro.
- `POST /planejamentos-ia/:id/propostas/:propostaId/descartar`: descarta a proposta pendente.
- `DELETE /planejamentos-ia/:id`: remove um planejamento; preserva um roteiro já confirmado.
- Validar propriedade em todos os endpoints. Usar identificador de operação para evitar duplicação em reenvios e permitir apenas uma geração simultânea por planejamento. Confirmações repetidas da mesma proposta não recriam dados.

## Validação e entrega

- Testar uma cidade, múltiplas cidades, viagem de um dia, virada de mês/ano e datas inválidas; conferir contagem inclusiva e sequência das cidades.
- Testar geração, refinamento antes de salvar, primeira confirmação, aplicação e descarte de ajustes, retomada após recarregar e mudança dos dados iniciais pelo chat.
- Testar acesso por outro usuário, respostas inválidas ou incompletas do Gemini, timeout, limite de uso, falha de persistência, requisições repetidas e conflito com edição manual.
- Verificar atomicidade da confirmação e regressões na criação manual, edição, duplicação, visualização pública e publicação de roteiros.
- Executar testes de backend e frontend, lint, build e validação Prisma. Testes automatizados usam Gemini simulado; complementar com teste real de geração e ajuste em ambiente de desenvolvimento.
- Criar migration aditiva e atualizar exemplos de ambiente e documentação de deploy. Aplicar a migration em desenvolvimento para testar; produção permanece uma etapa separada.
- Registrar duração, modelo, consumo informado pelo provedor e categoria de erro, sem registrar chave ou conteúdo integral das conversas.

## Premissas e padrões adotados

- Interface e respostas em português do Brasil; cidades nacionais e internacionais.
- Limites iniciais: até 10 cidades, 30 dias, 50 pessoas e 2.000 caracteres por mensagem; pelo menos um dia por cidade.
- Limite configurável inicial de 20 chamadas de IA por usuário por hora, contabilizado no banco.
- Contexto enviado ao Gemini: dados atuais, proposta pendente e últimas 20 mensagens; histórico completo preservado para consulta.
- O modelo será informado pela configuração do ambiente, sem dependência de um identificador fixo no código.
- Fora desta entrega: pesquisa na web, mapas, reservas, geração de imagens e chat sobre roteiros antigos criados manualmente.
