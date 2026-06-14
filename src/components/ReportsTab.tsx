import React, { useEffect, useState } from "react";
import { CityData, UserPreferences } from "../types";
import * as Lucide from "lucide-react";
import { TemperatureTrendChart } from "./TemperatureTrendChart";

interface ReportsTabProps {
  currentCity: CityData;
  allCities: CityData[];
  userPrefs: UserPreferences;
  onSelectCity: (id: string) => void;
  tempAdjustment: number;
  humidityAdjustment: number;
  activeTheme?: "light" | "dark";
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  currentCity,
  allCities,
  userPrefs,
  onSelectCity,
  tempAdjustment,
  humidityAdjustment,
  activeTheme = "dark",
}) => {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>("");

  const isLight = activeTheme === "light";

  const formatTemp = (celsius: number) => {
    if (userPrefs.unitSystem === "us") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const themeStyles = {
    container: isLight ? "bg-transparent text-slate-900" : "bg-transparent text-zinc-100",
    headerBorder: isLight ? "border-emerald-200/55" : "border-emerald-950/20",
    textPrimary: isLight ? "text-slate-950 font-extrabold" : "text-white font-bold",
    textSecondary: isLight ? "text-slate-900 font-bold" : "text-white/95 font-semibold",
    textTertiary: isLight ? "text-slate-800 font-semibold" : "text-[#ebeef3]/70 font-medium",
    textQuaternary: isLight ? "text-slate-700 font-semibold" : "text-white/50 font-medium",
    cardBg: isLight ? "bg-gradient-to-br from-[#e0f2fe]/75 to-[#d1fae5]/75 border border-emerald-250/50 shadow-sm" : "bg-gradient-to-br from-[#011a14]/90 to-[#010915]/90 border border-emerald-500/10",
    subCardBg: isLight ? "bg-white/40 hover:bg-white/65 border border-emerald-200/50" : "bg-white/5 hover:bg-white/10 border border-white/5",
    activeCardBg: "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-950 dark:text-[#3afd93] shadow-inner scale-[1.01]",
    refreshBtn: isLight ? "hover:bg-black/5 text-slate-900 border-emerald-300" : "hover:bg-white/10 text-white/85 border-white/15",
  };

  const fetchAiReport = async () => {
    setLoading(true);
    setReport("");
    setErrorText("");
    try {
      const response = await fetch("/api/weather/gemini-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: currentCity.name,
          currentMetrics: {
            ...currentCity.current,
            temp: currentCity.current.temp + tempAdjustment,
            humidity: Math.min(100, Math.max(5, currentCity.current.humidity + humidityAdjustment)),
          },
          personality: userPrefs.personality,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to consult Gemini meteorological servers");
      }

      const data = await response.json();
      setReport(data.report || "No advisory created.");
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to load meteorological advisor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiReport();
  }, [currentCity.id, tempAdjustment, humidityAdjustment, userPrefs.personality]);

  return (
    <div className={`flex flex-col flex-1 pb-24 px-6 pt-5 animate-fadeIn ${themeStyles.container}`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between pb-4 border-b ${themeStyles.headerBorder} mb-6`}>
        <div>
          <h2 className={`text-xl font-extrabold font-display tracking-tight flex items-center gap-1.5 ${themeStyles.textPrimary}`}>
            <Lucide.Sparkles className={isLight ? "text-amber-500 animate-pulse" : "text-amber-300 animate-pulse"} size={20} />
            Meteorological AI Advisory
          </h2>
          <p className={`text-xs ${themeStyles.textTertiary} mt-0.5`}>Custom analysis via AI with a {userPrefs.personality} focus.</p>
        </div>
        <button
          onClick={fetchAiReport}
          className={`p-2 rounded-full transition-colors border backdrop-blur-md ${themeStyles.refreshBtn}`}
          title="Regenerate Report"
          disabled={loading}
        >
          <Lucide.RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* AI Report Block */}
      <div className={`p-6 rounded-3xl border backdrop-blur-xl relative overflow-hidden min-h-[300px] ${themeStyles.cardBg}`}>
        {loading ? (
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${isLight ? "bg-white/40" : "bg-black/25"} gap-3.5`}>
            <div className="relative">
              <div className="w-12 h-12 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Lucide.Compass className="text-sky-400 animate-pulse" size={16} />
              </div>
            </div>
            <div className="text-center">
              <span className={`text-xs font-bold ${isLight ? "text-sky-600" : "text-sky-200"} tracking-widest uppercase`}>Consulting Gemini Atmosphere Servers</span>
              <p className={`text-[10px] ${themeStyles.textQuaternary} mt-1`}>Modeling thermal wet-bulb pressure ratios...</p>
            </div>
          </div>
        ) : errorText ? (
          <div className="text-center py-8">
            <Lucide.Compass className="text-rose-400 mx-auto" size={36} />
            <p className="text-sm font-bold text-rose-300 mt-2">Sensor Connection Error</p>
            <p className={`text-xs ${themeStyles.textTertiary}`}>{errorText}</p>
          </div>
        ) : (
          <div className={`prose ${isLight ? "prose-slate" : "prose-invert"} prose-sm max-w-none text-left space-y-4`}>
            {/* Custom parse formatting of headers to look visually outstanding */}
            {report.split("\n").map((line, idx) => {
              const cleaned = line.trim();
              if (cleaned.startsWith("###")) {
                return (
                  <h3 key={idx} className={`text-sm font-bold uppercase tracking-wider ${isLight ? "text-sky-600 border-slate-300/35" : "text-sky-300 border-white/5"} mt-5 border-b pb-1 flex items-center gap-2`}>
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full inline-block animate-ping" />
                    {cleaned.replace("###", "").trim()}
                  </h3>
                );
              }
              if (cleaned.startsWith("**") && cleaned.endsWith("**")) {
                return (
                  <h4 key={idx} className={`text-xs font-bold uppercase ${themeStyles.textPrimary} tracking-widest mt-4`}>
                    {cleaned.replace(/\*\*/g, "").trim()}
                  </h4>
                );
              }
              if (cleaned.startsWith("-")) {
                return (
                  <p key={idx} className={`text-xs font-medium ${themeStyles.textSecondary} leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 ${isLight ? "before:bg-black/20" : "before:bg-white/20"} before:rounded-full`}>
                    {cleaned.substring(1).trim()}
                  </p>
                );
              }
              return (
                <p key={idx} className={`text-xs font-medium ${themeStyles.textSecondary} leading-relaxed explanation-paragraph`}>
                  {cleaned}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Temperature Trend Chart */}
      <TemperatureTrendChart 
        data={currentCity.daily} 
        isLight={isLight} 
        tempAdjustment={tempAdjustment} 
      />

      {/* Global Stations Comparison Selector */}
      <div className="mt-8">
        <h3 className={`text-xs font-bold ${themeStyles.textSecondary} uppercase tracking-widest mb-3.5`}>Compare Atmospheric Stations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {allCities.map((city) => {
            const isCurrent = city.id === currentCity.id;
            return (
              <div
                key={city.id}
                onClick={() => onSelectCity(city.id)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                  isCurrent ? themeStyles.activeCardBg : themeStyles.subCardBg
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-[#24e574] animate-pulse shadow-[0_0_8px_rgba(36,229,116,0.6)]" : (isLight ? "bg-slate-405" : "bg-white/20")}`} />
                  <div>
                    <h4 className={`text-sm font-bold ${themeStyles.textPrimary} leading-none`}>{city.name}</h4>
                    <p className={`text-[10px] ${themeStyles.textQuaternary} mt-1`}>{city.country} • {city.timezone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 text-right font-mono">
                  <div>
                    <span className={`text-xs ${themeStyles.textQuaternary} block`}>Temp</span>
                    <span className={`text-sm font-bold ${themeStyles.textPrimary}`}>{formatTemp(city.current.temp)}</span>
                  </div>
                  <div>
                    <span className={`text-xs ${themeStyles.textQuaternary} block`}>Wet Bulb</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      city.current.wetBulbRisk === "High Risk" || city.current.wetBulbRisk === "Extreme Danger"
                        ? (isLight ? "text-rose-600 bg-rose-100" : "text-rose-300 bg-rose-500/20")
                        : (isLight ? "text-emerald-600 bg-emerald-100" : "text-emerald-300 bg-emerald-500/20")
                    }`}>
                      {formatTemp(city.current.wetBulb)}
                    </span>
                  </div>
                  <Lucide.ChevronRight size={16} className={isLight ? "text-slate-400" : "text-white/30"} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
