# Haumea Studies

Planeje o que estudar, registre o que fez e transforme erros em próximas ações — tudo em um único painel para vestibulares.

Haumea Studies é uma plataforma web de organização e prática. Ela reúne missões, diário, conteúdo programático, simulados, leituras, redações e ferramentas de IA para correção e interrogatório ativo.

## Da rotina ao diagnóstico

- **Planeje:** crie missões semanais e recorrentes, organize matérias e acompanhe provas.
- **Execute:** use cronômetro, conteúdo programático, leituras e exercícios de matemática.
- **Registre:** salve questões, simulados, redações e entradas do diário.
- **Analise:** acompanhe desempenho por matéria, erros e evolução em gráficos.
- **Revise:** retome erros e interrogatórios com repetição espaçada.
- **Receba apoio:** transcreva questões e solicite correções e explicações por IA.

## Recursos confirmados

- Dashboard com métricas, contagem regressiva de exames e visão de desempenho.
- Missões com drag and drop, cronômetro e rotinas recorrentes.
- Diário de bordo.
- Banco de questões, simulados e análise de erros.
- Leituras com progresso, capítulos, notas e dossiês.
- Redações e correção por critérios de ENEM, Fuvest, Unicamp, Unesp, ITA ou banca personalizada.
- Correção de respostas discursivas.
- Interrogatório com perguntas abertas ou de múltipla escolha, áudio, avaliação e revisões.
- Haumea Math com exercícios, fórmulas, histórico e caderno de erros.
- Tema claro e escuro.
- Persistência offline do Firestore no navegador.
- Exportação de gráficos e resultados para imagem ou PDF em módulos compatíveis.

As funções de IA usam modelos acessados pelo OpenRouter. Respostas automáticas podem conter erros e devem ser revisadas, especialmente em correções avaliativas.

## Tecnologias

- Next.js 15, React 18 e TypeScript
- Tailwind CSS, Framer Motion e Recharts
- Firebase Authentication, Firestore, Storage, Hosting e Functions
- Firebase Functions em Node.js 22
- OpenRouter para recursos de IA
- KaTeX para fórmulas matemáticas

## Requisitos

- Node.js 22 ou superior
- npm
- Firebase CLI
- Projeto Firebase com Authentication, Firestore, Storage, Functions e Hosting
- Chave OpenRouter para os recursos de IA

## Instalação

```bash
git clone https://github.com/riique/Haumea-Studies.git
cd Haumea-Studies
npm install
cd functions
npm install
cd ..
```

## Variáveis de ambiente

Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Para emular as Functions, copie o exemplo sem versionar a cópia:

```powershell
Copy-Item functions/.env.local.example functions/.env.local
```

Preencha:

```env
OPENROUTER_API_KEY=
```

Use uma chave separada para desenvolvimento, aplique limite de gastos e nunca exponha a chave no frontend.

## Desenvolvimento

Inicie a interface:

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

Compile as Functions:

```bash
cd functions
npm run build
```

Para um teste integrado, configure os emuladores Firebase de acordo com seu projeto antes de executar as chamadas protegidas.

## Build e deploy

O Next.js está configurado com exportação estática para `out/`:

```bash
npm run build
```

Publique somente o Hosting:

```bash
npm run deploy
```

Ou publique Hosting, Functions, regras e demais recursos configurados:

```bash
npm run deploy:all
```

Antes:

```bash
firebase login
firebase use <id-do-projeto>
```

## Segurança antes da produção

> **Atenção:** a regra genérica atual de `firestore.rules` contém `allow read, write: if true`. Ela torna ineficazes, na prática, as restrições mais específicas que aparecem depois. Não publique essa regra com dados reais.

Antes do deploy:

1. remova a permissão global;
2. valide que cada coleção exige autenticação e `uid` correspondente;
3. teste as regras com o Emulator Suite;
4. revise CORS e verificação de ID token nas Functions;
5. mantenha a chave OpenRouter somente no backend;
6. configure orçamento, rate limiting e alertas de uso;
7. revise retenção e exclusão de redações, áudios, imagens e diário.

As regras atuais do Storage restringem uploads em `questoes/{userId}` a imagens autenticadas de até 10 MB e negam os demais caminhos. Confirme se isso corresponde a todos os fluxos que pretende disponibilizar.

## Estrutura

```text
app/          rotas, páginas e módulos de estudo
components/   interface, gráficos, modais e navegação
contexts/     autenticação
functions/    correções, interrogatório, transcrição e integração com IA
hooks/        persistência e regras de domínio
lib/          Firebase, APIs e utilitários
types/        contratos de conteúdo, missões, provas e redações
utils/        manutenção de dados recorrentes
```

## Estado atual e limitações

- O projeto depende de configuração externa do Firebase e do OpenRouter.
- Correções de IA não são notas oficiais nem substituem professores ou bancas.
- Custos e disponibilidade variam conforme o modelo escolhido.
- Persistência offline exige cuidado com dispositivos compartilhados.
- O repositório contém documentos de planejamento; nem toda ideia descrita nesses arquivos representa uma função pronta.

## Contribuição

Abra uma issue com passos de reprodução e dados fictícios. Pull requests devem manter autenticação nas rotas de backend, evitar dados pessoais e incluir validação proporcional para regras, cálculos ou prompts alterados.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
