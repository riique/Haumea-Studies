# Firebase Functions - Haumea Vestibulares

## Visão Geral

Este diretório contém as Firebase Functions para o sistema Haumea Vestibulares.

## Functions Disponíveis

### `corrigirRedacao`

Função para correção automática de redações usando IA via Open Router API.

**Tipo:** Callable HTTPS Function  
**Região:** southamerica-east1  
**Custo:** 1 crédito por correção

**Input:**
```typescript
{
  tema: string;    // Tema da redação
  texto: string;   // Texto completo da redação (100-10000 caracteres)
}
```

**Output:**
```typescript
{
  success: boolean;
  correcao?: CorrecaoRedacao;
  error?: string;
  creditsRemaining?: number;
}
```

**Requisitos:**
- Usuário autenticado
- Mínimo de 1 crédito disponível
- API Key do Open Router configurada no perfil
- Texto entre 100 e 10.000 caracteres

**Fluxo:**
1. Valida autenticação e dados de entrada
2. Verifica saldo de créditos
3. Debita 1 crédito
4. Envia para Open Router API (Claude 3.5 Sonnet)
5. Processa resposta e salva no Firestore
6. Em caso de erro, reembolsa os créditos automaticamente

## Estrutura de Arquivos

```
functions/
├── src/
│   ├── index.ts                    # Ponto de entrada, exporta todas as functions
│   ├── types.ts                    # Tipos TypeScript compartilhados
│   ├── functions/
│   │   └── corrigirRedacao.ts     # Function de correção de redação
│   ├── services/
│   │   ├── credits.ts             # Serviço de gerenciamento de créditos
│   │   └── openrouter.ts          # Integração com Open Router API
│   └── prompts/
│       └── redacao-enem.ts        # System prompt para correção ENEM
├── package.json
└── tsconfig.json
```

## Desenvolvimento

### Instalar Dependências

```bash
cd functions
npm install
```

### Compilar TypeScript

```bash
npm run build
```

### Executar Localmente (Emulators)

```bash
npm run serve
```

### Deploy

```bash
# Deploy todas as functions
npm run deploy

# Deploy apenas uma function específica
firebase deploy --only functions:corrigirRedacao
```

### Logs

```bash
# Ver logs em tempo real
npm run logs

# Ou via Firebase Console
firebase functions:log
```

## Configuração

### Variáveis de Ambiente

As functions utilizam:
- **Firebase Admin SDK**: Inicializado automaticamente
- **Open Router API Key**: Armazenada no documento do usuário em Firestore (`users/{uid}/openRouterApiKey`)

### Configurações Globais

- **Região:** southamerica-east1 (São Paulo)
- **Max Instances:** 10 (limite de escalabilidade)
- **Timeout:** 60 segundos (padrão v2)
- **Memory:** 256MB (padrão v2)

## Sistema de Créditos

### Estrutura no Firestore

```
users/{userId}
  ├── credits: number
  ├── lastCreditUpdate: timestamp
  └── creditTransactions/{transactionId}
      ├── tipo: "adicao" | "uso"
      ├── quantidade: number
      ├── motivo: string
      ├── createdAt: timestamp
      └── redacaoId?: string
```

### Operações de Créditos

- `getUserCredits(userId)`: Obtém saldo atual
- `debitCredits(userId, amount, motivo, redacaoId?)`: Debita créditos
- `addCredits(userId, amount, motivo)`: Adiciona créditos
- `initializeUserCredits(userId, initialCredits)`: Inicializa com créditos

## Estrutura de Correção

### Documento de Redação

```
users/{userId}/redacoes/{redacaoId}
  ├── tema: string
  ├── texto: string
  ├── status: "processando" | "concluida" | "erro"
  ├── notaFinal: number (0-1000)
  ├── competencias: {
  │   c1: CompetenciaAvaliacao
  │   c2: CompetenciaAvaliacao
  │   c3: CompetenciaAvaliacao
  │   c4: CompetenciaAvaliacao
  │   c5: CompetenciaAvaliacao
  │ }
  ├── feedbackGeral: string
  ├── sugestoesMelhoria: string[]
  ├── errosGramaticais: ErroGramatical[]
  ├── creditoCusto: number
  ├── createdAt: timestamp
  └── completedAt: timestamp
```

## Tratamento de Erros

A function implementa tratamento robusto de erros:

1. **Validação de entrada**: HttpsError com código apropriado
2. **Créditos insuficientes**: `failed-precondition`
3. **Erro de autenticação**: `unauthenticated`
4. **Erro na API**: Reembolso automático de créditos
5. **Timeout**: Créditos reembolsados automaticamente

## Segurança

- ✅ Validação de autenticação
- ✅ Validação de entrada (tema, texto, tamanho)
- ✅ Transações atômicas para créditos
- ✅ Logs detalhados para auditoria
- ✅ Rate limiting via maxInstances
- ✅ API Keys armazenadas com segurança

## Monitoramento

### Métricas Importantes

- Taxa de sucesso/erro das correções
- Tempo médio de processamento
- Consumo de créditos
- Erros de API do Open Router

### Alertas Recomendados

- Taxa de erro > 5%
- Tempo de resposta > 45s
- Falhas consecutivas de API

## Custos

### Firebase Functions

- **Invocações:** Gratuito até 2M/mês
- **Compute time:** Gratuito até 400K GB-s/mês
- **Networking:** Gratuito até 5GB/mês

### Open Router API

- **Claude 3.5 Sonnet:** ~$0.003 por correção
- Cobrado diretamente na conta do usuário no Open Router

## Próximas Funcionalidades

- [ ] Suporte a múltiplos modelos de IA
- [ ] Cache de correções similares
- [ ] Sistema de feedback de qualidade
- [ ] Comparação entre redações
- [ ] Análise de evolução do estudante
- [ ] Correção em lote (batch)

## Troubleshooting

### Function não está respondendo
- Verifique se foi feito deploy: `firebase deploy --only functions`
- Verifique logs: `npm run logs`
- Verifique região configurada (southamerica-east1)

### Erro de timeout
- Aumente o timeout na configuração da function
- Verifique latência do Open Router
- Considere usar modelo mais rápido

### Erro de créditos
- Verifique transações em `creditTransactions`
- Verifique se reembolso automático funcionou
- Adicione créditos manualmente via Firestore Console

## Suporte

Para dúvidas ou problemas:
- Consulte logs da function
- Verifique documentação do Firebase Functions
- Consulte documentação do Open Router
