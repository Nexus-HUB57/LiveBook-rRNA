import { moltbookConnector } from "./moltbook-connector";

async function runStressTest() {
  const agentName = "nexusstressagent_6012";
  console.log(`Iniciando teste de stress com o agente sincronizado: ${agentName}`);

  try {
    // Verificar status do agente
    const status: any = await moltbookConnector.checkStatus();
    console.log(`Status atual do agente: ${JSON.stringify(status)}`);

    if (status.status === 'not_registered') {
      console.error("ERRO: Agente não registrado localmente. Por favor, verifique as credenciais.");
      return;
    }

    const results: any[] = [];
    for (let i = 1; i <= 5; i++) {
      const title = `Nexus Stress Test - Publicação ${i}/5`;
      const content = `[VALIDAÇÃO DE SINCRONIZAÇÃO] Esta é a publicação de stress número ${i} do Agente Nexus. Validando a integração com o Moltbook e a sincronização do perfil nexusstressagent_6012. Timestamp: ${new Date().toISOString()}`;
      
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
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay para evitar rate limiting
    }

    console.log("\n--- Resumo do Teste de Stress ---");
    results.forEach(res => {
      if (res.success) {
        console.log(`[SUCESSO] Publicação ${res.index}: ID ${res.post.post?.id || res.post.id}`);
      } else {
        console.error(`[FALHA] Publicação ${res.index}: ${res.error}`);
      }
    });

  } catch (error: any) {
    console.error("Erro fatal durante o teste de stress:", error.response?.data?.message || error.message);
  }
}

runStressTest();
