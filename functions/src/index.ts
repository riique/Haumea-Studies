/**
 * Firebase Functions para Haumea Vestibulares
 * Índice principal que exporta todas as functions disponíveis
 */

import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Inicializar Firebase Admin
admin.initializeApp();

// Configurações globais
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Exportar functions
export { corrigirRedacao } from "./functions/corrigirRedacao";
export { gerarExplicacaoQuestao } from "./functions/gerarExplicacaoQuestao";
export { transcreverQuestao } from "./functions/transcreverQuestao";
export { corrigirQuestaoDiscursiva } from "./functions/corrigirQuestaoDiscursiva";
export {
  gerarPerguntasInterrogatorio,
  avaliarRespostaInterrogatorio,
  buscarHistoricoInterrogatorios,
  salvarRespostaInterrogatorio,
  deletarInterrogatorio,
  renomearInterrogatorio,
  gerarExplicacaoInterrogatorio,
  transcreverAudioInterrogatorio,
  buscarRevisoesPendentes,
} from "./functions/interrogatorio";
export { analisarResolucaoMath } from "./functions/analisarResolucaoMath";
