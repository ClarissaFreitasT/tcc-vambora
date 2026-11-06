# Dados de demonstração

Execute na pasta `backend`, com as dependências instaladas, o Prisma Client gerado e as migrations aplicadas ao banco configurado em `DATABASE_URL`:

```sh
npm run seed:demo
```

Também disponível por `npx prisma db seed`. Não executa migrations, não limpa tabelas e não precisa do servidor HTTP ligado. Usa a mesma conexão e as mesmas opções TLS do backend.

## Conta para apresentação

- E-mail: `demo@vambora.example`
- Username: `vambora.demo`
- Senha inicial: `VamboraDemo2026!`
- Permissão: `USER` (sem acesso administrativo).

Para definir outra senha inicial, configure `DEMO_PASSWORD` no ambiente antes da primeira execução. Reexecutar a seed não redefine senhas nem sobrescreve registros existentes. Os outros cinco personagens usam uma senha aleatória não divulgada. Os endereços `.example` são fictícios.

## Conteúdo

São 6 personagens, 6 roteiros públicos e 1 privado, 15 dias com 45 atividades, 6 publicações vinculadas a roteiros, 12 comentários/respostas, 18 avaliações, 18 curtidas de roteiros, 18 curtidas de publicações, 18 salvos de cada tipo e 10 relações de seguidores. As categorias existentes são reutilizadas pelo nome.

A conta demo tem um roteiro público de Paraty e um rascunho privado de São Paulo, além de publicações, comentários, salvos e pessoas seguidas. Isso permite apresentar edição, duplicação, filtros, feed, perfil e interações.

Os conteúdos identificam explicitamente seu caráter fictício. Orçamentos, horários, relatos e avaliações não são dados turísticos verificados. As fotos externas do Unsplash são ilustrativas e dependem de internet; os perfis usam os avatares padrão do site.

## Reexecução

IDs estáveis e chaves únicas evitam duplicações. A seed é aditiva: preserva dados reais e alterações feitas durante a apresentação; pode recriar interações da demo que tenham sido removidas. Toda a carga ocorre em uma transação. Conflitos de e-mail/username com uma conta fora da seed interrompem a carga sem assumir essa conta. Não existe comando de limpeza automática.

Depois da carga, entre com o e-mail acima e confira Home, Comunidade, Roteiros públicos e Perfil. A build do frontend não precisa ser refeita por causa dos dados: eles são consultados na API.

Para conferir as quantidades da carga inicial e o hash da senha, execute `npm run seed:demo:verify`. Esse comando é somente leitura e espera os dados originais da seed; pode falhar legitimamente após alterações realizadas durante a demonstração.
