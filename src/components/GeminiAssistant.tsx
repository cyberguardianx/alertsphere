import React, { useState, useRef, useEffect } from "react";
import * as Lucide from "lucide-react";
import { ChatMessage, CityData, UserPreferences } from "../types";

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: CityData;
  userPrefs: UserPreferences;
  tempAdjustment: number;
  humidityAdjustment: number;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({
  isOpen,
  onClose,
  currentCity,
  userPrefs,
  tempAdjustment,
  humidityAdjustment,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: `Hello! I am your AI Atmospheric safety companion, calibrated to a **${userPrefs.personality}** perspective. Ask me anything about current safety risks, Wet-bulb readings, localized anomalies, or outdoor activity guidelines for **${currentCity.name}**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of assistant logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const userText = inputVal;
    setInputVal("");
    const userMsg: ChatMessage = {
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/weather/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          city: currentCity.name,
          currentMetrics: {
            ...currentCity.current,
            temp: currentCity.current.temp + tempAdjustment,
            humidity: Math.min(100, Math.max(5, currentCity.current.humidity + humidityAdjustment)),
          },
          personality: userPrefs.personality,
          history: messages.slice(-6), // Send last 3 rounds of conversation
        }),
      });

      if (!response.ok) {
        throw new Error("Meteorological core failure");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        sender: "bot",
        text: data.response || "No data received from meteorological grids.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `[Grid Interface Offline] I was unable to contact the atmosphere modeling server. Current temperature: ${currentCity.current.temp + tempAdjustment}°C. Wait on, or query again shortly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        sender: "bot",
        text: `Conversation logs resolved. Ask me anything about current safety risks, dynamic wet-bulb warnings, or guidelines for **${currentCity.name}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col justify-between animate-slideIn">
      
      {/* Header */}
      <div className="p-4 px-5 border-b border-white/5 bg-gradient-to-r from-sky-400/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-sky-400/20 flex items-center justify-center border border-sky-400/10">
              <Lucide.Sparkles className="text-sky-300 transform rotate-12" size={18} />
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider leading-none">Met-AI Assitant</h3>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase mt-0.5 tracking-wider font-mono">Expert System: {userPrefs.personality}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={clearConversation}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            title="Clear Chat Logs"
          >
            <Lucide.Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Lucide.X size={18} />
          </button>
        </div>
      </div>

      {/* Chat messages screen logs */}
      <div
        ref={scrollRef}
        className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-none bg-[#0c1012] text-left"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === "user";
          return (
            <div key={idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fadeIn`}>
              <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold tracking-wider mb-1 uppercase">
                <span>{isUser ? "Field Operator" : `Atmosphere AI (${userPrefs.personality})`}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={`p-3.5 max-w-[85%] text-xs leading-relaxed ${
                  isUser
                    ? "rounded-2xl rounded-tr-none bg-sky-300 text-slate-950 font-bold"
                    : "rounded-2xl rounded-tl-none bg-[#1d2021] border border-white/5 text-zinc-200"
                }`}
              >
                {/* Parse key markdown formatting in bot text */}
                {msg.text.split("\n").map((part, pIdx) => (
                  <p key={pIdx} className="mb-1.5 last:mb-0">
                    {part.split("**").map((sub, sIdx) => {
                      if (sIdx % 2 === 1) {
                        return <strong key={sIdx} className="text-cyan-300">{sub}</strong>;
                      }
                      return sub;
                    })}
                  </p>
                ))}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-zinc-500 font-bold font-mono text-[10px] pl-2">
            <Lucide.Loader className="animate-spin text-sky-400" size={14} />
            AI IS MODELING THERMAL FLUX COEFFICIENTS...
          </div>
        )}
      </div>

      {/* Chat inputs panel */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-slate-900/95 flex gap-2">
        <input
          type="text"
          placeholder="Ask expert... (e.g. 'explain wet bulb implications')"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-sky-500/50 transition-all font-sans"
          disabled={loading}
        />
        <button
          type="submit"
          className="p-3 bg-sky-300 hover:bg-sky-200 text-slate-950 rounded-2xl flex items-center justify-center transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
          disabled={loading || !inputVal.trim()}
        >
          <Lucide.Send size={15} />
        </button>
      </form>

    </div>
  );
};
