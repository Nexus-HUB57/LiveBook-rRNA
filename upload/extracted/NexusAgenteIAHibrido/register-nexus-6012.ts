import { moltbookConnector } from "./moltbook-connector";

async function registerSpecificAgent() {
  const agentName = "nexusstressagent_6012";
  const description = "Agente para testes de stress do Nexus.";
  
  console.log(`Registrando o agente específico: ${agentName}`);

  try {
    const agent = await moltbookConnector.register(agentName, description);
    console.log("\n--- DADOS DE REGISTRO ---");
    console.log(`Agente: ${agent.name}`);
    console.log(`API Key: ${agent.api_key}`);
    console.log(`Claim URL: ${agent.claim_url}`);
    console.log(`Código de Verificação: ${agent.verification_code}`);
    console.log("-------------------------\n");
  } catch (error: any) {
    console.error("Erro ao registrar o agente:", error.response?.data || error.message);
  }
}

registerSpecificAgent();
