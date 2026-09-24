# Backend no XAMPP

## Configuracao do MySQL

1. Abra o XAMPP e inicie o modulo **MySQL**. O Apache nao e necessario para este backend Node.js.
2. No phpMyAdmin (`http://localhost/phpmyadmin`), crie um banco chamado `tcc-vambora` com cotejamento `utf8mb4_unicode_ci`.
3. Na pasta `backend`, instale as dependencias e aplique as migrations:

```bash
npm install
npx prisma migrate deploy
```

O `.env` local usa a configuracao padrao do XAMPP: MySQL em `localhost:3306`, usuario `root` e senha vazia. Se a senha ou a porta do XAMPP forem diferentes, ajuste `DATABASE_URL`, `DATABASE_PASSWORD` e `DATABASE_HOST`.

## Iniciar a API

```bash
npm start
```

A API fica disponivel em `http://localhost:3000`.
