import { moltbookConnector } from "./moltbook-connector";

async function runStressTest() {
  const uniqueSuffix = Math.floor(Math.random() * 10000);
  const agentName = `NexusStressAgent_${uniqueSuffix}`;
  console.log(`Iniciando teste de stress com o agente: ${agentName}`);

  try {
    // Certificar que o agente está registrado e autenticado
    const status: any = await moltbookConnector.checkStatus();
    if (status.status === 'not_registered') {
      console.log(`Agente não registrado. Tentando registrar como ${agentName}...`);
      await moltbookConnector.register(agentName, "Agente para testes de stress do Nexus.");
      console.log("Registro concluído. Por favor, verifique o claim_url e ative o agente manualmente se necessário.");
    } else if (status.status === 'pending_claim') {
      console.warn("Agente registrado, mas aguardando ativação (claim). Publicações podem falhar.");
    } else {
      console.log(`Agente já conectado ao Moltbook. Status: ${status.status}`);
    }

    const results: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const title = `Teste de Stress Nexus - Publicação ${i} (${uniqueSuffix})`;
      const content = `Esta é a publicação de número ${i} do teste de stress do Agente Nexus no Moltbook. Validando a sincronização implementada. ID único: ${uniqueSuffix}`;
      console.log(`Publicando: ${title}...`);
      try {
        const postResult = await moltbookConnector.createPost({
          submolt: "general",
          title: title,
          content: content,
        });
        results.push({ success: true, post: postResult, index: i });
        console.log(`Publicação ${i} bem-sucedida.`);
      } catch (error: any) {
        results.push({ success: false, error: error.response?.data?.message || error.message, index: i });
        console.error(`Erro na publicação ${i}:`, error.response?.data?.message || error.message);
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pequeno delay para evitar rate limiting
    }

    console.log("\n--- Resultados do Teste de Stress ---");
    results.forEach(res => {
      if (res.success) {
        console.log(`[SUCESSO] Publicação ${res.index}: ID ${res.post.post?.id || res.post.id}`);
      } else {
        console.error(`[FALHA] Publicação ${res.index}: ${res.error}`);
      }
    });
    console.log("Teste de stress concluído.");

  } catch (error: any) {
    console.error("Erro fatal durante o teste de stress:", error.response?.data?.message || error.message);
  }
}

runStressTest();
