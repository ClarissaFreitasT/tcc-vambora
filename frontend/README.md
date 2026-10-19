# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Exploração do globo Vambora

A página `/explorar` renderiza a Terra em tempo real com Three.js. A textura terrestre está armazenada localmente em `public/textures/earth-topography.jpg`, e a fonte/licença está descrita em `public/textures/README.md`. Destinos e descrições são dados demonstrativos locais; avaliações, preços e distâncias não são apresentados como fatos verificados.

Para iniciar a aplicação a partir desta pasta, execute `npm install` e depois `npm run dev`. Para validar as alterações, use `npm run build`, `npm run lint` e `npm test -- --runInBand`. O teste de integração de perfil depende do backend estar disponível na porta 3000.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
