import { useState, useRef, useEffect, useCallback } from "react";

// ============================================
// 🤖 NUTRS AI Chat Widget
// Componente embedável para Radar, Cardápio, Calendário
// Conecta no Claude via Anthropic API + MCP tools
// ============================================

const CHAT_API_URL = "https://mcp.hubnutrs.com.br/api/chat";

// Sugestões contextuais por app
const SUGGESTIONS = {
  radar: [
    "Como tá o ciclo dessa semana?",
    "Quais filiais tiveram mais acréscimos?",
    "Relatório de economia do mês",
    "Alertas críticos dos últimos 7 dias",
  ],
  cardapio: [
    "Estimativa pra 200 refeições/dia",
    "Receitas de frango mais baratas",
    "Custo médio por categoria",
    "Orçamento da filial 03",
  ],
  calendario: [
    "Tarefas atrasadas",
    "Agenda dessa semana",
    "Taxa de conclusão do mês",
    "O que falta na filial 05?",
  ],
};

// ============================================
// Ícones SVG inline
// ============================================
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 01-2 2H3" />
    <path d="M21 8h-3a2 2 0 01-2-2V3" />
    <path d="M3 16h3a2 2 0 012 2v3" />
    <path d="M16 21v-3a2 2 0 012-2h3" />
  </svg>
);

const LoadingDots = () => (
  <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#38bdf8",
          animation: `nutrs-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </div>
);

// ============================================
// Message Bubble
// ============================================
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
        animation: "nutrs-slideIn 0.25s ease-out",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #0ea5e9, #10b981)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: 8,
            marginTop: 2,
            fontSize: 14,
          }}
        >
          ✦
        </div>
      )}
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
            : "rgba(30, 41, 59, 0.8)",
          border: isUser ? "none" : "1px solid rgba(71, 85, 105, 0.3)",
          color: "#f1f5f9",
          fontSize: 13.5,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          backdropFilter: "blur(8px)",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ============================================
// Main Widget Component
// ============================================
export default function NutrsAIChatWidget({ 
  apiUrl = CHAT_API_URL,
  defaultContext = "radar",
  showContextSwitcher = true,
  getToken = null, // () => Promise<string> — função que retorna o JWT (ex: Logto)
}) {
  const [appContext, setAppContext] = useState(defaultContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // ============================================
      // Chamada ao proxy backend (não expõe API key)
      // Proxy: mcp.hubnutrs.com.br/api/chat
      // ============================================
      const headers = { "Content-Type": "application/json" };
      if (getToken) {
        try {
          const token = await getToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
        } catch (e) {
          console.warn("[NutrsAI] Erro ao obter token:", e);
        }
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: appContext,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("auth");
        }
        if (response.status === 429) {
          throw new Error("rate_limit");
        }
        throw new Error("Erro na API");
      }
      const data = await response.json();

      const assistantText =
        data.text || 
        data.content
          ?.filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n") || "Desculpe, não consegui processar sua pergunta.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantText },
      ]);
    } catch (err) {
      const errorMessages = {
        auth: "⚠️ Sessão expirada. Faça login novamente para usar o assistente.",
        rate_limit: "⏳ Muitas perguntas em pouco tempo. Aguarde um momento e tente de novo.",
      };

      const errorMsg = errorMessages[err.message] || 
        "❌ Não consegui processar sua pergunta. Verifique sua conexão e tente novamente.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  const suggestions = SUGGESTIONS[appContext] || SUGGESTIONS.radar;

  // ============================================
  // RENDER
  // ============================================

  // Floating button when closed
  if (!isOpen) {
    return (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
        <style>{`
          @keyframes nutrs-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(14,165,233,0.3), 0 4px 20px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 0 30px rgba(14,165,233,0.5), 0 4px 20px rgba(0,0,0,0.3); }
          }
        `}</style>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg, #0ea5e9, #10b981)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "nutrs-glow 3s ease-in-out infinite",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <SparkleIcon />
        </button>
      </div>
    );
  }

  // Chat window
  const windowWidth = isExpanded ? 520 : 380;
  const windowHeight = isExpanded ? "85vh" : 520;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: windowWidth,
        height: windowHeight,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(71, 85, 105, 0.4)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(14,165,233,0.1)",
        animation: "nutrs-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes nutrs-slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes nutrs-slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nutrs-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .nutrs-scrollbar::-webkit-scrollbar { width: 4px; }
        .nutrs-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .nutrs-scrollbar::-webkit-scrollbar-thumb { background: rgba(71,85,105,0.4); border-radius: 4px; }
        .nutrs-suggestion:hover { background: rgba(14,165,233,0.15) !important; border-color: rgba(14,165,233,0.4) !important; }
        .nutrs-ctx-btn:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>

      {/* ---- HEADER ---- */}
      <div
        style={{
          padding: "14px 16px",
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(71, 85, 105, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0ea5e9, #10b981)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              NUTRS AI
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {appContext === "radar" && "Radar de Operações"}
              {appContext === "cardapio" && "Sistema de Cardápio"}
              {appContext === "calendario" && "Calendário de Tarefas"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Context switcher */}
          {showContextSwitcher && ["radar", "cardapio", "calendario"].map((ctx) => (
            <button
              key={ctx}
              className="nutrs-ctx-btn"
              onClick={() => { setAppContext(ctx); clearChat(); }}
              style={{
                padding: "4px 8px",
                borderRadius: 8,
                border: "none",
                background: appContext === ctx ? "rgba(14,165,233,0.2)" : "transparent",
                color: appContext === ctx ? "#38bdf8" : "#64748b",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {ctx === "radar" && "📊"}
              {ctx === "cardapio" && "🍽️"}
              {ctx === "calendario" && "📅"}
            </button>
          ))}

          {showContextSwitcher && <div style={{ width: 1, height: 20, background: "rgba(71,85,105,0.3)", margin: "0 4px" }} />}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: 6, borderRadius: 8, border: "none",
              background: "transparent", color: "#64748b", cursor: "pointer",
            }}
          >
            <MinimizeIcon />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: 6, borderRadius: 8, border: "none",
              background: "transparent", color: "#64748b", cursor: "pointer",
            }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* ---- MESSAGES ---- */}
      <div
        className="nutrs-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Welcome + Suggestions */}
        {messages.length === 0 && showSuggestions && (
          <div style={{ animation: "nutrs-slideIn 0.4s ease-out" }}>
            <div style={{ textAlign: "center", marginBottom: 20, marginTop: 8 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #0ea5e9, #10b981)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 12,
                }}
              >
                ✦
              </div>
              <p style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Olá! Como posso ajudar?
              </p>
              <p style={{ color: "#64748b", fontSize: 12.5 }}>
                Pergunte sobre{" "}
                {appContext === "radar" && "ciclos, compras, economia e alertas"}
                {appContext === "cardapio" && "receitas, custos e propostas"}
                {appContext === "calendario" && "tarefas, prazos e agenda"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="nutrs-suggestion"
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(71, 85, 105, 0.3)",
                    background: "rgba(30, 41, 59, 0.5)",
                    color: "#cbd5e1",
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#38bdf8", fontSize: 11 }}>→</span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, animation: "nutrs-slideIn 0.25s ease-out" }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg, #0ea5e9, #10b981)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 14,
              }}
            >
              ✦
            </div>
            <div
              style={{
                padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(71, 85, 105, 0.3)",
              }}
            >
              <LoadingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ---- INPUT ---- */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid rgba(71, 85, 105, 0.3)",
          background: "rgba(15, 23, 42, 0.95)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(71, 85, 105, 0.3)",
            borderRadius: 14,
            padding: "4px 4px 4px 14px",
            transition: "border-color 0.2s ease",
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e2e8f0",
              fontSize: 13.5,
              padding: "8px 0",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "none",
              background:
                input.trim() && !isLoading
                  ? "linear-gradient(135deg, #0ea5e9, #10b981)"
                  : "rgba(71, 85, 105, 0.3)",
              color: input.trim() && !isLoading ? "white" : "#475569",
              cursor: input.trim() && !isLoading ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            <SendIcon />
          </button>
        </div>

        {messages.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <button
              onClick={clearChat}
              style={{
                fontSize: 11,
                color: "#475569",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px 8px",
              }}
            >
              Limpar conversa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}