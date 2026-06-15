# Testes Automatizados - Rotas de Usuários

## 📋 Descrição

Este documento descreve os testes automatizados implementados para as rotas de usuários da API.

## 🧪 Estrutura dos Testes

Os testes estão localizados em `src/__tests__/users.test.js` e cobrem todas as rotas de usuários:

### Rotas Testadas

#### 1. **GET /usuarios**

- ✅ Lista todos os usuários com sucesso
- ✅ Retorna lista vazia quando não há usuários

#### 2. **GET /usuarios/:id**

- ✅ Retorna um usuário específico com sucesso
- ✅ Retorna erro 404 quando usuário não é encontrado

#### 3. **POST /usuarios**

- ✅ Cria usuário com dados completos
- ✅ Cria usuário apenas com dados obrigatórios
- ✅ Retorna erro 400 quando nome não é fornecido
- ✅ Retorna erro 400 quando email não é fornecido
- ✅ Retorna erro 400 quando senha não é fornecida
- ✅ Retorna erro 409 quando email já está cadastrado

## 🚀 Como Executar os Testes

### Executar todos os testes

```bash
npm test
```

### Executar testes em modo watch (re-executa ao salvar)

```bash
npm run test:watch
```

### Executar testes com cobertura de código

```bash
npm run test:coverage
```

## 🛠️ Tecnologias Utilizadas

- **Jest**: Framework de testes
- **Supertest**: Biblioteca para testar APIs HTTP
- **Mocks**: Os testes usam mocks do Prisma para não depender do banco de dados

## 📊 Cobertura de Testes

Os testes cobrem:

- ✅ Casos de sucesso
- ✅ Casos de erro (validação, recursos não encontrados, conflitos)
- ✅ Todas as rotas do controller de usuários
- ✅ Validações de campos obrigatórios

## 📝 Observações

- Os testes não dependem de banco de dados real (usam mocks)
- Cada teste é isolado e não afeta os outros
- Os mocks são limpos após cada teste
