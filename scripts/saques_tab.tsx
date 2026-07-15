// ============================================================
// SAQUES TAB - Complete PSBT Withdrawal Flow
// Destination is IMMUTABLE: bc1qwwgdhzdgy97ysqqtd9z7rwv76fwktg0w4tvwf8
// Signing: Server-side via @noble/secp256k1
// ============================================================

type SaquesStep = "idle" | "creating" | "review" | "signing" | "sign-error" | "broadcasting" | "done" | "broadcast-error";

interface SaquesState {
  step: SaquesStep;
  amountBtc: string;
  psbtBase64: string;
  feeSats: number;
  inputCount: number;
  sendAmount: number;
  changeAmount: number;
  selectedUTXOs: { txid: string; vout: number; value: number }[];
  signedTxHex: string;
  txid: string;
  txSize: number;
  errorMsg: string;
  hasKey: boolean;
}

function SaquesTab() {
  const { copiedId, copy } = useCopyToClipboard();
  const [state, setState] = useState<SaquesState>({
    step: "idle", amountBtc: "1.00000000", psbtBase64: "", feeSats: 0,
    inputCount: 0, sendAmount: 0, changeAmount: 0, selectedUTXOs: [],
    signedTxHex: "", txid: "", txSize: 0, errorMsg: "", hasKey: false,
  });
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/withdraw");
        const data = await res.json();
        setState(s => ({ ...s, hasKey: data.hasPrivateKey }));
      } catch { /* silent */ }
      finally { setInitLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    const btc = parseFloat(state.amountBtc);
    if (isNaN(btc) || btc <= 0) return;
    const sats = Math.round(btc * 100000000);
    setState(s => ({ ...s, step: "creating", errorMsg: "" }));
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", amount: sats }),
      });
      const data = await res.json();
      if (data.error) {
        setState(s => ({ ...s, step: "idle", errorMsg: data.detail }));
      } else {
        setState(s => ({
          ...s, step: "review", psbtBase64: data.psbtBase64, feeSats: data.feeSats,
          inputCount: data.inputCount, sendAmount: data.sendAmount,
          changeAmount: data.changeAmount, selectedUTXOs: data.selectedUTXOs,
        }));
      }
    } catch (e) {
      setState(s => ({ ...s, step: "idle", errorMsg: e instanceof Error ? e.message : "Network error" }));
    }
  };

  const handleSign = async () => {
    setState(s => ({ ...s, step: "signing", errorMsg: "" }));
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign", psbt: state.psbtBase64 }),
      });
      const data = await res.json();
      if (data.error) {
        setState(s => ({ ...s, step: "sign-error", errorMsg: data.detail }));
      } else {
        setState(s => ({
          ...s, step: "done", signedTxHex: data.txHex, txid: data.txid, txSize: data.txSize,
        }));
      }
    } catch (e) {
      setState(s => ({ ...s, step: "sign-error", errorMsg: e instanceof Error ? e.message : "Network error" }));
    }
  };

  const handleSignAndBroadcast = async () => {
    setState(s => ({ ...s, step: "signing", errorMsg: "" }));
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign-and-broadcast", psbt: state.psbtBase64 }),
      });
      const data = await res.json();
      if (data.error) {
        if (data.signedTxHex) {
          setState(s => ({ ...s, step: "broadcast-error", signedTxHex: data.signedTxHex, txid: data.txid, errorMsg: data.detail }));
        } else {
          setState(s => ({ ...s, step: "sign-error", errorMsg: data.detail }));
        }
      } else {
        setState(s => ({
          ...s, step: "done", signedTxHex: data.txHex, txid: data.txid, txSize: data.txSize,
          feeSats: data.feeSats, sendAmount: data.sendAmount, changeAmount: data.changeAmount,
        }));
      }
    } catch (e) {
      setState(s => ({ ...s, step: "sign-error", errorMsg: e instanceof Error ? e.message : "Network error" }));
    }
  };

  const handleBroadcastManual = async () => {
    if (!state.signedTxHex) return;
    setState(s => ({ ...s, step: "broadcasting", errorMsg: "" }));
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast", hex: state.signedTxHex }),
      });
      const data = await res.json();
      if (data.success) {
        setState(s => ({ ...s, step: "done", txid: data.txid }));
      } else {
        setState(s => ({ ...s, step: "broadcast-error", errorMsg: data.error }));
      }
    } catch (e) {
      setState(s => ({ ...s, step: "broadcast-error", errorMsg: e instanceof Error ? e.message : "Broadcast failed" }));
    }
  };

  const reset = () => setState({
    step: "idle", amountBtc: "1.00000000", psbtBase64: "", feeSats: 0,
    inputCount: 0, sendAmount: 0, changeAmount: 0, selectedUTXOs: [],
    signedTxHex: "", txid: "", txSize: 0, errorMsg: "", hasKey: state.hasKey,
  });

  const isLoading = ["creating", "signing", "broadcasting"].includes(state.step);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e01b24] to-[#f7931a] flex items-center justify-center text-lg text-white shadow-lg shadow-[#e01b24]/20">{'\u{1F6E2}\uFE0F'}</div>
          <div>
            <h2 className="text-white font-bold text-sm">Saques / Retiradas</h2>
            <p className="text-[#555] text-[10px]">PSBT {'\u00B7'} Server-Side Signing {'\u00B7'} Mainnet Broadcast</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state.hasKey ? (
            <span className="px-2.5 py-1 bg-[#06d6a0]/10 text-[#06d6a0] text-[10px] rounded-lg font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06d6a0] animate-live-pulse" />Key Loaded
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-[#e01b24]/10 text-[#e01b24] text-[10px] rounded-lg font-bold">No Key</span>
          )}
        </div>
      </div>

      {/* Immutable Destination */}
      <StaggerItem index={0}>
        <div className="bg-gradient-to-r from-[#e01b24]/10 via-[#1a1a1b] to-[#f0b90b]/10 border border-[#e01b24]/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-[#e01b24] flex-shrink-0 mt-1.5 animate-live-pulse" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white text-xs font-bold">Destino Imutavel</p>
                <span className="px-2 py-0.5 bg-[#e01b24]/20 text-[#e01b24] text-[9px] rounded font-bold">LOCKED</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1a1a1b] rounded-lg p-2.5">
                <code className="text-[#f0b90b] text-xs font-mono flex-1 break-all select-all">{BINANCE_BTC_ADDRESS}</code>
                <CopyButton id="saques-dest" text={BINANCE_BTC_ADDRESS} onCopy={copy} copiedId={copiedId} />
              </div>
              <p className="text-[9px] text-[#e01b24]/80 mt-1.5 font-medium">TODOS os saques sao roteados para este endereco via PSBT. Nao e possivel alterar o destino.</p>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Step Indicator */}
      {state.step !== "idle" && (
        <div className="flex items-center gap-1 bg-[#272729] rounded-xl p-2 border border-[#343536]">
          {(["idle", "creating", "review", "signing", "done"] as const).map((s, i) => {
            const order = ["idle", "creating", "review", "signing", "done"] as const;
            const currentIdx = order.indexOf(state.step as SaquesStep);
            const isActive = i <= currentIdx;
            const isDone = i < currentIdx;
            const labels = ["1. Amount", "2. Review", "3. Sign", "4. Done"];
            return (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-colors ${
                    isDone ? "bg-[#06d6a0] text-black" : isActive ? "bg-[#f7931a] text-black" : "bg-[#343536] text-[#555]"
                  }`}>{isDone ? "\u2713" : i + 1}</span>
                  <span className={`text-[9px] font-medium hidden sm:inline transition-colors ${isActive ? "text-white" : "text-[#555]"}`}>{labels[i]}</span>
                </div>
                {i < 3 && <span className={`w-3 h-px flex-shrink-0 ${isActive ? "bg-[#f7931a]/50" : "bg-[#343536]"}`} />}
              </div>
            );
          })}
        </div>
      )}

      {/* IDLE: Amount Form */}
      {state.step === "idle" && (
        <StaggerItem index={1}>
          <div className="bg-[#272729] rounded-xl border border-[#343536] p-4 space-y-4" style={{ animation: "fade-in-up 0.3s ease-out" }}>
            <p className="text-white text-sm font-bold">Quanto enviar para Custodia?</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#1a1a1b] rounded-lg border border-[#343536] focus-within:border-[#f7931a] transition-colors">
                <input type="text" value={state.amountBtc} onChange={e => setState(s => ({ ...s, amountBtc: e.target.value }))}
                  className="w-full bg-transparent px-3 py-3 text-white text-lg font-mono tabular-nums outline-none" placeholder="0.00000000" />
              </div>
              <span className="text-lg text-[#f7931a] font-bold">BTC</span>
            </div>
            <div className="flex gap-2">
              {[0.1, 0.5, 1, 2, 5, 10].map(a => (
                <button key={a} onClick={() => setState(s => ({ ...s, amountBtc: a.toFixed(8) }))}
                  className={`px-3 py-1.5 text-[10px] rounded-lg cursor-pointer transition-all font-medium ${
                    parseFloat(state.amountBtc) === a ? "bg-[#f7931a] text-black shadow-sm" : "bg-[#1a1a1b] text-[#888] hover:text-white hover:bg-[#343536] border border-[#343536]"
                  }`}>{a}</button>
              ))}
            </div>
            <div className="bg-[#1a1a1b] rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-[10px]"><span className="text-[#888]">Saldo disponivel</span><span className="text-white font-mono">{PRIMARY_BTC_BALANCE} BTC</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-[#888]">Taxa estimada (25 sat/vB)</span><span className="text-[#888] font-mono">~{((2 * 148 + 34 + 31 + 10) * 25 / 100000000).toFixed(8)} BTC</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-[#888]">Tipo de input</span><span className="text-[#888]">P2PKH (legacy)</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-[#888]">Tipo de output</span><span className="text-[#06d6a0]">P2WPKH (bc1q / native segwit)</span></div>
            </div>
            {state.errorMsg && (
              <div className="bg-[#e01b24]/10 border border-[#e01b24]/20 rounded-lg p-3">
                <p className="text-[#e01b24] text-xs font-bold">Erro</p>
                <p className="text-[10px] text-[#888] mt-0.5 font-mono break-all">{state.errorMsg}</p>
              </div>
            )}
            {!state.hasKey && (
              <div className="bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-lg p-3">
                <p className="text-[#fbbf24] text-xs font-bold">Chave Privada Nao Configurada</p>
                <p className="text-[10px] text-[#888] mt-1">Defina PRIMARY_PRIVATE_KEY_WIF em .env.local no servidor para ativar a assinatura automatica.</p>
              </div>
            )}
            <button onClick={handleCreate}
              disabled={isLoading || !state.amountBtc || parseFloat(state.amountBtc) <= 0}
              className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[#f7931a] to-[#e01b24] text-white hover:shadow-lg hover:shadow-[#f7931a]/20 active:scale-[0.98]">
              {isLoading ? (<span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando PSBT...</span>) : "Criar PSBT de Retirada"}
            </button>
          </div>
        </StaggerItem>
      )}

      {/* REVIEW */}
      {state.step === "review" && (
        <StaggerItem index={1}>
          <div className="bg-[#272729] rounded-xl border border-[#06d6a0]/20 p-4 space-y-4" style={{ animation: "fade-in-up 0.3s ease-out" }}>
            <div className="bg-[#06d6a0]/5 border border-[#06d6a0]/20 rounded-lg p-3">
              <p className="text-[#06d6a0] text-xs font-bold">PSBT Criado com Sucesso</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                <div><p className="text-[9px] text-[#888]">Inputs (UTXOs)</p><p className="text-white text-sm font-bold tabular-nums">{state.inputCount}</p></div>
                <div><p className="text-[9px] text-[#888]">Taxa</p><p className="text-white text-sm font-bold tabular-nums">{(state.feeSats / 100000000).toFixed(8)} BTC</p></div>
                <div><p className="text-[9px] text-[#888]">Enviar</p><p className="text-[#f7931a] text-sm font-bold tabular-nums">{(state.sendAmount / 100000000).toFixed(8)} BTC</p></div>
                <div><p className="text-[9px] text-[#888]">Troco</p><p className="text-white text-sm font-bold tabular-nums">{(state.changeAmount / 100000000).toFixed(8)} BTC</p></div>
              </div>
            </div>
            <details className="bg-[#1a1a1b] rounded-lg overflow-hidden">
              <summary className="px-3 py-2 text-[10px] text-[#888] cursor-pointer hover:text-white transition-colors font-medium">UTXOs Selecionados ({state.selectedUTXOs.length})</summary>
              <div className="px-3 pb-3 space-y-1 max-h-28 overflow-y-auto">
                {state.selectedUTXOs.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] font-mono bg-[#272729] rounded px-2 py-1.5">
                    <span className="text-[#555] w-4">{i + 1}.</span>
                    <span className="text-[#888] truncate flex-1">{u.txid.slice(0, 16)}...:{u.vout}</span>
                    <span className="text-[#f7931a] font-medium">{satToDisplay(u.value)}</span>
                  </div>
                ))}
              </div>
            </details>
            <div>
              <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">PSBT (Base64)</p>
              <div className="bg-[#1a1a1b] rounded-lg p-3 relative group">
                <textarea readOnly value={state.psbtBase64} className="w-full bg-transparent text-[#f0b90b] text-[9px] font-mono resize-none outline-none h-20" />
                <CopyButton id="saques-psbt" text={state.psbtBase64} onCopy={copy} copiedId={copiedId} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#343536] text-[#888] hover:text-white hover:bg-[#555] transition-colors">Cancelar</button>
              {state.hasKey ? (
                <button onClick={handleSignAndBroadcast} className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-gradient-to-r from-[#06d6a0] to-[#06d6a0]/80 text-black hover:shadow-lg hover:shadow-[#06d6a0]/20 active:scale-[0.98] transition-all">Assinar e Enviar</button>
              ) : (
                <button onClick={handleSign} className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-gradient-to-r from-[#fbbf24] to-[#f7931a] text-black hover:shadow-lg hover:shadow-[#f7931a]/20 active:scale-[0.98] transition-all">Sign Server-Side</button>
              )}
            </div>
          </div>
        </StaggerItem>
      )}

      {/* LOADING STATES */}
      {(state.step === "signing" || state.step === "creating" || state.step === "broadcasting") && (
        <StaggerItem index={1}>
          <div className="bg-[#272729] rounded-xl border border-[#f7931a]/30 p-8 text-center" style={{ animation: "fade-in-up 0.3s ease-out" }}>
            <div className="w-10 h-10 border-3 border-[#f7931a]/30 border-t-[#f7931a] rounded-full animate-spin mx-auto" />
            <p className="text-white text-sm font-bold mt-4">
              {state.step === "creating" ? "Construindo PSBT..." : state.step === "signing" ? "Assinando transacao..." : "Broadcasting na mainnet..."}
            </p>
            <p className="text-[#888] text-[10px] mt-1">Aguarde, processando criptografia ECDSA</p>
          </div>
        </StaggerItem>
      )}

      {/* ERROR STATES */}
      {(state.step === "sign-error" || state.step === "broadcast-error") && (
        <StaggerItem index={1}>
          <div className="bg-[#e01b24]/5 border border-[#e01b24]/30 rounded-xl p-5" style={{ animation: "fade-in-up 0.3s ease-out" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{'\u26A0\uFE0F'}</span>
              <p className="text-[#e01b24] text-sm font-bold">{state.step === "sign-error" ? "Falha na Assinatura" : "Falha no Broadcast"}</p>
            </div>
            <div className="bg-[#1a1a1b] rounded-lg p-3">
              <p className="text-[10px] text-[#888] font-mono break-all">{state.errorMsg}</p>
            </div>
            {state.signedTxHex && (
              <div className="mt-3">
                <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">TX Assinada (fallback)</p>
                <div className="bg-[#1a1a1b] rounded-lg p-3 relative group">
                  <textarea readOnly value={state.signedTxHex} className="w-full bg-transparent text-[#f0b90b] text-[9px] font-mono resize-none outline-none h-20" />
                  <CopyButton id="saques-fallback-tx" text={state.signedTxHex} onCopy={copy} copiedId={copiedId} />
                </div>
                <button onClick={handleBroadcastManual} className="w-full mt-2 py-2 rounded-xl text-xs font-bold cursor-pointer bg-[#f7931a]/10 text-[#f7931a] hover:bg-[#f7931a]/20 border border-[#f7931a]/30 transition-colors">Tentar Broadcast Manual</button>
              </div>
            )}
            <button onClick={reset} className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#343536] text-[#888] hover:text-white transition-colors">Voltar ao Inicio</button>
          </div>
        </StaggerItem>
      )}

      {/* DONE */}
      {state.step === "done" && (
        <StaggerItem index={1}>
          <div className="bg-[#06d6a0]/5 border border-[#06d6a0]/30 rounded-2xl p-6 text-center" style={{ animation: "fade-in-up 0.4s ease-out" }}>
            <span className="text-5xl block mb-4">{'\u2705'}</span>
            <p className="text-[#06d6a0] text-lg font-bold">Transacao Enviada</p>
            <p className="text-white text-xs mt-1">{state.sendAmount > 0 ? (state.sendAmount / 100000000).toFixed(8) : ""} BTC para Custodia Binance</p>
            {state.txid && (
              <div className="bg-[#1a1a1b] rounded-lg p-3 mt-5">
                <p className="text-[9px] text-[#888] uppercase">Transaction ID</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[#06d6a0] text-xs font-mono break-all flex-1">{state.txid}</code>
                  <CopyButton id="saques-txid" text={state.txid} onCopy={copy} copiedId={copiedId} />
                </div>
              </div>
            )}
            {state.txSize > 0 && (
              <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-[#888]">
                <span>{state.txSize} bytes</span><span>&middot;</span>
                <span>Fee: {(state.feeSats / 100000000).toFixed(8)} BTC</span><span>&middot;</span>
                <span>{state.inputCount} inputs</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mt-4">
              <a href={`https://blockstream.info/tx/${state.txid}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#3b82f6] hover:text-[#06d6a0] transition-colors underline">Blockstream</a>
              <span className="text-[#555]">&middot;</span>
              <a href={`https://mempool.space/tx/${state.txid}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#3b82f6] hover:text-[#06d6a0] transition-colors underline">Mempool.space</a>
            </div>
            <button onClick={reset} className="mt-5 px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-[#343536] text-white hover:bg-[#555] transition-colors">Novo Saque</button>
          </div>
        </StaggerItem>
      )}

      {/* Security Info */}
      <StaggerItem index={2}>
        <div className="bg-[#343536]/20 rounded-lg p-3 border border-[#343536]/30">
          <div className="flex items-start gap-2">
            <span className="text-[#fbbf24] text-xs mt-0.5">{'\u{1F512}'}</span>
            <div className="text-[10px] text-[#666] leading-relaxed space-y-1">
              <p>Todas as transacoes sao assinadas server-side via ECDSA (secp256k1) com low-S normalization.</p>
              <p>A chave privada WIF esta em .env.local (server-only) e nunca e enviada ao navegador.</p>
              <p>O destino e imutavel: {BINANCE_BTC_ADDRESS.slice(0, 12)}...{BINANCE_BTC_ADDRESS.slice(-8)}</p>
            </div>
          </div>
        </div>
      </StaggerItem>
    </div>
  );
}
