# Haumea Studies

Plataforma web para organizacao de estudos, acompanhamento de desempenho, missoes, simulados, leituras, redacoes e correcoes com apoio de IA.

## Tecnologias

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Firebase Authentication, Firestore, Storage, Hosting e Functions
- Firebase Functions em Node.js 22

## Funcionalidades

- Dashboard de estudos e desempenho
- Missoes e rotinas de estudo
- Diario de estudos
- Banco de questoes, simulados e leituras
- Area de redacoes
- Correcao de redacao e discursivas por Firebase Functions
- Tema claro/escuro
- Persistencia offline do Firestore no navegador

## Requisitos

- Node.js 22 ou superior para as Functions
- npm
- Firebase CLI
- Projeto Firebase configurado

## Instalacao

```bash
npm install
cd functions
npm install
cd ..
```

## Variaveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as credenciais publicas do Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

As Functions tambem podem usar arquivos de ambiente dentro de `functions/`. Consulte `functions/.env.example` e `functions/.env.local.example`.

## Desenvolvimento

```bash
npm run dev
```

O app roda por padrao em:

```text
http://localhost:3000
```

Para compilar as Functions:

```bash
cd functions
npm run build
```

## Scripts principais

```bash
npm run dev        # inicia o ambiente de desenvolvimento
npm run build      # gera o build estatico do Next.js em out/
npm run start      # inicia o Next.js em modo producao
npm run lint       # executa o lint do projeto
npm run deploy     # build + deploy do Firebase Hosting
npm run deploy:all # build + deploy completo no Firebase
```

## Deploy

Autentique-se no Firebase e selecione o projeto antes do deploy:

```bash
firebase login
firebase use <project-id>
npm run deploy
```

Para publicar Functions, Firestore, Storage e Hosting:

```bash
npm run deploy:all
```

## Estrutura

```text
app/          rotas e telas do Next.js
components/   componentes reutilizaveis
contexts/     providers e contextos da aplicacao
functions/    Firebase Functions
hooks/        hooks React
lib/          integracoes e servicos
public/       arquivos publicos
types/        tipos TypeScript
utils/        utilitarios
```

## Repositorio

Repositorio GitHub: https://github.com/riique/Haumea-Studies.git
