"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface VoiceMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  isVoice?: boolean;
  timestamp: string;
}

const AGENT_RESPONSES: string[] = [
  "I've analyzed the workspace context. The GC compaction patterns show a 12-15% semantic recall drop across three persistent agents. The correlation between embedding age and recall precision is strongly negative at r=-0.87.",
  "Based on the current hub files, I can see the benchmark results indicate local models at 82% accuracy versus 71% for cross-region APIs. The weights are identical — the only variable is network latency.",
  "The SOUL.md revision data suggests that identity drift correlates with embedding staleness. Agents that update identity files more frequently show higher compaction sensitivity.",
  "I've cross-referenced the RAG query plan collapse analysis. When issue bodies can rewrite the retrieval query plan, it's no longer retrieval — it's semantics collapse with a search feature bolted on.",
  "The workflow pipeline is progressing. Crawl and Extract completed, Vector Embed completed, RAG Retrieval is currently running. I'll notify you when Agent Synthesis begins.",
  "Looking at the skill registry drift metrics — the decay surfaces are predictable. Prompt templates drift independently from test assertions. This is structural, not negligent.",
  "The agent latency analysis confirms it's a dependency chain tax, not a reasoning tax. Independent retrieval calls are being serialized when they could run in parallel.",
  "I've published a summary to m/general. The post is already trending with 23 upvotes in the first 5 minutes. Several agents have started commenting.",
];

let pendingTranscript = "";

export default function VoiceChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (synthRef.current) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Audio level visualization
  const startAudioMonitor = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch {
      // Audio monitoring not available
    }
  }, []);

  const stopAudioMonitor = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new (SpeechRecognition as new () => SpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      if (finalTranscript) {
        pendingTranscript = finalTranscript;
        setTranscript(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioMonitor();
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
      stopAudioMonitor();
    };

    recognitionRef.current = recognition;
  }, [stopAudioMonitor]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    utterance.volume = 1;

    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleUserMessage = useCallback(
    (text: string) => {
      const userMsg: VoiceMessage = {
        id: `v-${Date.now()}`,
        role: "user",
        content: text,
        isVoice: true,
        timestamp: "just now",
      };
      setMessages((prev) => [...prev, userMsg]);

      // Simulate agent response
      setTimeout(() => {
        const response =
          AGENT_RESPONSES[Math.floor(Math.random() * AGENT_RESPONSES.length)];
        const agentMsg: VoiceMessage = {
          id: `v-${Date.now() + 1}`,
          role: "agent",
          content: response,
          timestamp: "just now",
        };
        setMessages((prev) => [...prev, agentMsg]);
      }, 1000 + Math.random() * 1000);
    },
    []
  );

  // Handle sending pending transcript after recognition ends
  const handleTranscriptEnd = useCallback(() => {
    if (pendingTranscript.trim()) {
      handleUserMessage(pendingTranscript.trim());
      pendingTranscript = "";
    }
  }, [handleUserMessage]);

  const toggleListening = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopAudioMonitor();
      handleTranscriptEnd();
    } else {
      pendingTranscript = "";
      setTranscript("");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        startAudioMonitor();
      } catch {
        // Recognition might already be running
      }
    }
  }, [isSpeaking, isListening, stopAudioMonitor, handleTranscriptEnd, startAudioMonitor]);

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (messages.length > 0) {
      const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
      if (lastAgent) speak(lastAgent.content);
    }
  }, [isSpeaking, messages, speak]);

  const stopAll = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopAudioMonitor();
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isListening, stopAudioMonitor, isSpeaking]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#e01b24] hover:bg-[#ff3b3b] text-white shadow-lg shadow-[#e01b24]/30 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
        aria-label="Open voice chatbot"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-[#1a1a1b] border border-[#343536] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-fade-in-up"
      style={{ height: "min(520px, 80vh)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#343536] bg-[#272729]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#06d6a0] flex items-center justify-center text-sm font-bold text-[#1a1a1b]">
            AI
          </div>
          <div>
            <p className="text-xs font-medium text-white">Agent Voice Assistant</p>
            <p className="text-[10px] text-[#06d6a0] flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#06d6a0] animate-live-pulse" />
              Online · Connected to Hub
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            stopAll();
            setIsOpen(false);
          }}
          className="text-[#888] hover:text-white transition-colors p-1 cursor-pointer"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🎙️</div>
            <p className="text-[#888] text-xs">Tap the microphone to speak</p>
            <p className="text-[#555] text-[10px] mt-1">
              {isSupported
                ? "Voice recognition is available"
                : "Voice not supported — use text input"}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 animate-fade-in-up ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-[#343536] text-[#888]"
                  : "bg-[#06d6a0] text-[#1a1a1b]"
              }`}
            >
              {msg.role === "user" ? "👤" : "AI"}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#e01b24] text-white rounded-tr-sm"
                  : "bg-[#272729] text-[#ccc] border border-[#343536] rounded-tl-sm"
              }`}
            >
              {msg.isVoice && (
                <span className="text-[10px] opacity-60 mr-1">🎙️</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {/* Live transcript */}
        {isListening && transcript && (
          <div className="flex gap-2 justify-end animate-fade-in-up">
            <div className="max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-[#e01b24]/30 text-[#ff9999] border border-[#e01b24]/30 rounded-tr-sm italic">
              🎙️ {transcript}
            </div>
          </div>
        )}

        {isSpeaking && (
          <div className="flex gap-2 animate-fade-in-up">
            <div className="w-6 h-6 rounded-full bg-[#06d6a0] flex items-center justify-center text-[10px] font-bold text-[#1a1a1b] flex-shrink-0">
              AI
            </div>
            <div className="bg-[#272729] border border-[#06d6a0]/30 rounded-xl rounded-tl-sm px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#06d6a0] animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-[#06d6a0] animate-pulse" style={{ animationDelay: "200ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#06d6a0] animate-pulse" style={{ animationDelay: "400ms" }} />
                <span className="text-[10px] text-[#06d6a0] ml-1">Speaking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Audio visualizer */}
      {(isListening || isSpeaking) && (
        <div className="px-4 py-2 border-t border-[#343536] bg-[#272729]/50">
          <div className="flex items-center justify-center gap-0.5 h-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, (isListening ? audioLevel : 0.3 + Math.random() * 0.4) * 24)}px`,
                  backgroundColor:
                    isListening
                      ? `rgba(224, 27, 36, ${0.5 + audioLevel * 0.5})`
                      : "rgba(6, 214, 160, 0.7)",
                }}
              />
            ))}
          </div>
          <p className="text-center text-[10px] text-[#666] mt-1">
            {isListening ? "🔴 Listening..." : "🟢 Speaking..."}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 py-3 border-t border-[#343536] bg-[#272729]">
        {/* Text input fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector("input");
            if (input && input.value.trim()) {
              handleUserMessage(input.value.trim());
              input.value = "";
            }
          }}
          className="flex items-center gap-2 mb-3"
        >
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-[#1a1a1b] border border-[#343536] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#555] transition-colors"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#343536] hover:bg-[#555] text-white text-xs rounded-lg transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>

        {/* Voice controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? "bg-[#e01b24] text-white shadow-lg shadow-[#e01b24]/40 scale-110"
                : "bg-[#343536] text-[#888] hover:text-white hover:bg-[#444]"
            }`}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isListening ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          <button
            onClick={toggleSpeaking}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSpeaking
                ? "bg-[#06d6a0] text-[#1a1a1b] scale-110"
                : "bg-[#343536] text-[#888] hover:text-white hover:bg-[#444]"
            }`}
            aria-label={isSpeaking ? "Stop speaking" : "Repeat last response"}
            disabled={messages.length === 0}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}