# Verificação e Correção - Firestore

## 🔍 Problemas Encontrados

### 1. **Regras de Segurança Incorretas**
- ❌ As regras estavam configuradas para coleções no **nível raiz** (`/missions/{id}`)
- ✅ Corrigido para **subcoleções** (`/users/{uid}/missions/{id}`)

### 2. **Campo userId Não Salvo**
- ❌ Missões não estavam salvando o `userId`
- ✅ Adicionado `userId: user.uid` ao criar missões
- ✅ Adicionado `userId: user.uid` ao criar agendas semanais

### 3. **Campos Iniciais Faltando**
- ❌ Missões criadas sem `timeSpent` e `isTimerRunning`
- ✅ Adicionados valores padrão: `timeSpent: 0`, `isTimerRunning: false`

---

## ✅ Correções Aplicadas

### firestore.rules
Atualizadas as seguintes subcoleções:
- ✅ `/users/{userId}/missions/{missionId}`
- ✅ `/users/{userId}/redacoes/{redacaoId}`
- ✅ `/users/{userId}/contentPrograms/{programId}`
- ✅ `/users/{userId}/contentCategories/{categoryId}`
- ✅ `/users/{userId}/weeklySchedules/{scheduleId}`
- ✅ `/users/{userId}/journalEntries/{entryId}`

### hooks/useMissions.ts
- ✅ `addMission()`: Adicionado `userId`, `timeSpent`, `isTimerRunning`
- ✅ `saveWeeklySchedule()`: Adicionado `userId` ao criar documento

---

## 📊 Estrutura Esperada no Firestore

```
users/
├── {userId}/
│   ├── missions/
│   │   ├── {missionId}
│   │   │   ├── userId: string
│   │   │   ├── title: string
│   │   │   ├── subject: string
│   │   │   ├── dayOfWeek: string
│   │   │   ├── weekStartDate: string
│   │   │   ├── status: string
│   │   │   ├── description?: string
│   │   │   ├── timeSpent: number
│   │   │   ├── isTimerRunning: boolean
│   │   │   ├── timerStartedAt?: Timestamp
│   │   │   └── createdAt: Timestamp
│   │
│   ├── weeklySchedules/
│   │   ├── {scheduleId}
│   │   │   ├── userId: string
│   │   │   ├── weekStartDate: string
│   │   │   ├── content: string
│   │   │   ├── createdAt: Timestamp
│   │   │   └── updatedAt: Timestamp
│   │
│   ├── redacoes/
│   ├── contentPrograms/
│   ├── contentCategories/
│   └── journalEntries/
```

---

## 🚀 Próximos Passos

1. **Deploy das Regras**: Execute `firebase deploy --only firestore:rules`
2. **Teste de Salvamento**: Crie uma nova missão e verifique no Firestore
3. **Verificação de Dados Antigos**: Use o hook `useDiagnosis` para verificar dados em coleções antigas
4. **Migração (Opcional)**: Use `useMigration` para migrar dados antigos para a nova estrutura

---

## 🔧 Como Testar

### Verificar Dados Salvos
1. Abra o Firebase Console
2. Navegue até Firestore Database
3. Verifique a estrutura em `users/{seu-uid}/missions/`
4. Confirme que cada documento tem:
   - ✅ `userId`
   - ✅ `timeSpent`
   - ✅ `isTimerRunning`
   - ✅ Outros campos esperados

### Verificar Regras
1. No Firebase Console, vá para Firestore Rules
2. Confirme que as regras foram atualizadas
3. Teste a leitura/escrita de dados

---

## 📝 Notas Importantes

- As regras antigas para coleções no nível raiz foram **removidas**
- Todos os dados devem estar em **subcoleções** dentro de `/users/{uid}/`
- O campo `userId` é **obrigatório** para validação de segurança
- Se houver dados antigos em coleções raiz, use `useMigration` para migrar
