import React, { useState } from "react";
import { UserPreferences } from "../types";
import * as Lucide from "lucide-react";

interface SettingsTabProps {
  userPrefs: UserPreferences;
  onUpdatePrefs: (newPrefs: UserPreferences) => void;
  activeTheme?: "light" | "dark";
  isInstallable?: boolean;
  onInstall?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  userPrefs,
  onUpdatePrefs,
  activeTheme = "dark",
  isInstallable = false,
  onInstall,
}) => {
  const isLight = activeTheme === "light";

  const themeStyles = {
    container: isLight ? "bg-transparent text-slate-900" : "bg-transparent text-zinc-100",
    headerBorder: isLight ? "border-emerald-200/55" : "border-emerald-950/20",
    textPrimary: isLight ? "text-slate-950 font-extrabold" : "text-white font-bold",
    textSecondary: isLight ? "text-slate-900 font-bold" : "text-white/90 font-semibold",
    textTertiary: isLight ? "text-slate-800 font-semibold" : "text-white/70 font-medium",
    textQuaternary: isLight ? "text-slate-700 font-semibold" : "text-white/50 font-medium",
    cardBg: isLight 
      ? "bg-gradient-to-br from-[#e0f2fe]/75 to-[#d1fae5]/75 border border-emerald-200/60 shadow-sm backdrop-blur-xl" 
      : "bg-gradient-to-br from-[#011a14]/90 to-[#010915]/90 border border-emerald-500/10",
    pillBg: "bg-emerald-500/10 border border-emerald-550/25",
    activePillBtn: "bg-[#24e574]/20 border border-[#24e574] text-emerald-800 font-extrabold shadow-sm dark:text-emerald-300",
    inactivePillBtn: isLight ? "text-slate-800/70 hover:text-black font-bold" : "text-zinc-400 hover:text-white font-semibold",
    activeCard: "bg-[#24e574]/20 border border-[#24e574] text-[#0f5731] font-extrabold shadow-sm dark:text-[#3afd93]",
    inactiveCard: isLight ? "bg-white/40 hover:bg-white/60 border border-black/5 text-slate-900" : "bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-350",
    activePersonaCard: "bg-emerald-500/15 border border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold",
    inactivePersonaCard: isLight ? "bg-white/40 hover:bg-white/60 border border-black/5 text-slate-800" : "bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-350",
    diagnosticsBg: isLight ? "bg-gradient-to-br from-[#e0f2fe]/45 to-[#d1fae5]/45 border border-emerald-200/50 shadow-sm" : "bg-white/2 border border-white/5",
  };

  const handleSelectUnitSystem = (sys: "metric" | "us" | "uk") => {
    onUpdatePrefs({
      ...userPrefs,
      unitSystem: sys,
    });
  };

  const handleSelectPersonality = (p: UserPreferences["personality"]) => {
    onUpdatePrefs({
      ...userPrefs,
      personality: p,
    });
  };

  const handleToggleNotifications = async () => {
    let enabled = !userPrefs.notificationsEnabled;
    
    if (enabled && "Notification" in window) {
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          enabled = false;
        }
      }
    }

    onUpdatePrefs({
      ...userPrefs,
      notificationsEnabled: enabled,
    });
  };

  return (
    <div className={`flex flex-col flex-1 pb-24 px-6 pt-5 animate-fadeIn ${themeStyles.container}`}>
      {/* Settings Title */}
      <div className={`pb-4 border-b ${themeStyles.headerBorder} mb-6`}>
        <h2 className={`text-xl font-extrabold font-display tracking-tight flex items-center gap-2 ${themeStyles.textPrimary}`}>
          <Lucide.Settings className="text-[#24e574]" size={20} />
          System Preferences
        </h2>
        <p className={`text-xs ${themeStyles.textTertiary} mt-0.5`}>Control thermal rendering, units, and AI voice personality.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 items-stretch mb-6">
        
        {/* Core Personality Selection panel */}
        <div className={`p-5 rounded-3xl ${themeStyles.cardBg} h-full flex flex-col`}>
          <h3 className={`text-sm font-bold flex items-center gap-1.5 ${themeStyles.textPrimary}`}>
            <Lucide.Sparkles size={16} className="text-[#24e574]" />
            AI Meteorological Persona
          </h3>
          <p className={`text-xs ${themeStyles.textTertiary} mt-0.5 mb-4`}>Choose how the weather bot explains safety ratios & reports.</p>
          
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {[
              { id: "scientific" as const, label: "Scientific Academic", desc: "Detailed thermodynamic thermodynamics, evaporative cooling data." },
              { id: "casual" as const, label: "Warm Conversational Guide", desc: "Explain things simply, with friendly, relatable analogies." },
              { id: "poetic" as const, label: "Bard Scenic Prosaist", desc: "Descriptive elegance, weather as natural landscapes prose." },
              { id: "survivalist" as const, label: "Resilience safety Specialist", desc: "Hydration speeds, direct hazard cautions, clothing safety." }
            ].map((p) => {
              const active = userPrefs.personality === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersonality(p.id)}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex justify-between items-center group cursor-pointer ${
                    active ? themeStyles.activePersonaCard : themeStyles.inactivePersonaCard
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <h4 className={`text-xs font-bold transition-colors uppercase tracking-wide ${active ? "text-emerald-700 dark:text-[#24e574]" : themeStyles.textPrimary}`}>{p.label}</h4>
                    <p className={`text-[10px] ${active ? (isLight ? "text-slate-800" : "text-white/80") : themeStyles.textTertiary} mt-0.5 leading-normal`}>{p.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${active ? "border-emerald-500 bg-emerald-500/20" : (isLight ? "border-slate-350" : "border-white/20")}`}>
                    {active && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {/* Display Theme Mode Toggler */}
        <div className={`p-6 rounded-3xl ${themeStyles.cardBg} flex flex-col items-center justify-between text-center h-full`}>
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <Lucide.Palette size={20} className="text-[#24e574]" />
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>Display Theme</h3>
            </div>
            <p className={`text-[10px] ${themeStyles.textTertiary}`}>Toggle day, night, or auto.</p>
          </div>
          
          <div className={`flex p-0.5 rounded-full select-none mt-4 w-full justify-between ${themeStyles.pillBg}`}>
            {[
              { id: "light" as const, label: "Day", icon: Lucide.Sun },
              { id: "dark" as const, label: "Night", icon: Lucide.Moon },
              { id: "time-based" as const, label: "Auto", icon: Lucide.Clock }
            ].map((t) => {
              const active = userPrefs.themeMode === t.id;
              const IconComponent = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => onUpdatePrefs({ ...userPrefs, themeMode: t.id })}
                  className={`px-3 py-1.5 flex-1 rounded-full flex justify-center items-center gap-1 transition-all cursor-pointer ${
                    active ? themeStyles.activePillBtn : themeStyles.inactivePillBtn
                  }`}
                  id={`theme_option_${t.id}`}
                  title={t.label}
                >
                  <IconComponent size={14} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Temperature selection toggler */}
        <div className={`p-6 rounded-3xl ${themeStyles.cardBg} flex flex-col items-center justify-between text-center h-full`}>
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <Lucide.Thermometer size={20} className="text-[#24e574]" />
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>Scale</h3>
            </div>
            <p className={`text-[10px] ${themeStyles.textTertiary}`}>Swap measuring scales.</p>
          </div>
          <div className={`flex p-0.5 rounded-full select-none mt-4 w-full justify-between ${themeStyles.pillBg}`}>
            <button
              onClick={() => handleSelectUnitSystem("metric")}
              className={`px-3 py-2 flex-1 flex justify-center items-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                userPrefs.unitSystem === "metric" || !userPrefs.unitSystem
                  ? themeStyles.activePillBtn
                  : themeStyles.inactivePillBtn
              }`}
            >
              Metric
            </button>
            <button
              onClick={() => handleSelectUnitSystem("us")}
              className={`px-3 py-2 flex-1 flex justify-center items-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                userPrefs.unitSystem === "us"
                  ? themeStyles.activePillBtn
                  : themeStyles.inactivePillBtn
              }`}
            >
              US
            </button>
            <button
              onClick={() => handleSelectUnitSystem("uk")}
              className={`px-3 py-2 flex-1 flex justify-center items-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                userPrefs.unitSystem === "uk"
                  ? themeStyles.activePillBtn
                  : themeStyles.inactivePillBtn
              }`}
            >
              UK
            </button>
          </div>
        </div>

        {/* Notifications push switcher */}
        <div className={`p-6 rounded-3xl ${themeStyles.cardBg} flex flex-col items-center justify-between text-center h-full`}>
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <Lucide.Bell size={20} className="text-[#24e574]" />
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>Simulation</h3>
            </div>
            <p className={`text-[10px] ${themeStyles.textTertiary}`}>Flash floating sirens.</p>
          </div>
          <div className="flex-1 flex items-end justify-center w-full mt-4">
            <button
              onClick={handleToggleNotifications}
              className={`w-full max-w-[80px] h-8 flex items-center rounded-full p-1 transition-all outline-none ${
                userPrefs.notificationsEnabled ? "bg-[#24e574]" : (isLight ? "bg-slate-300" : "bg-neutral-800")
              }`}
              id="toggle_settings_notifications"
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform duration-300 ${
                  userPrefs.notificationsEnabled ? "translate-x-[48px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* System Diagnostics Info / Install App */}
        <div className={`text-center rounded-3xl p-6 border flex flex-col items-center justify-between h-full ${themeStyles.diagnosticsBg}`}>
          {isInstallable ? (
            <>
              <div className="flex-1 flex flex-col items-center justify-center w-full">
                <Lucide.Download className={`mx-auto ${isLight ? "text-emerald-800" : "text-[#24e574]"} mb-2`} size={28} />
                <h4 className={`text-xs uppercase tracking-widest font-bold ${themeStyles.textPrimary}`}>Install App</h4>
                <p className={`text-[10px] ${themeStyles.textTertiary} leading-tight mt-2`}>Get the full<br />app experience</p>
              </div>
              <button 
                onClick={onInstall}
                className={`w-full py-2.5 mt-4 rounded-xl font-bold text-xs transition-opacity hover:opacity-90 shadow-sm ${isLight ? "bg-emerald-600 text-white" : "bg-[#24e574] text-[#03150d]"}`}
                id="btn_install_pwa"
              >
                Install Now
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 flex flex-col items-center justify-center">
                <Lucide.Shield className={`mx-auto ${isLight ? "text-emerald-800" : "text-[#24e574]"} mb-2`} size={28} />
                <h4 className={`text-xs uppercase tracking-widest font-bold ${themeStyles.textPrimary}`}>AlertSphere</h4>
              </div>
              <p className={`text-[10px] ${themeStyles.textTertiary} leading-tight mt-4`}>Environmental alerts<br />that matter</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
