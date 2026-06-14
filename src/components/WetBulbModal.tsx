import React, { useState } from "react";
import * as Lucide from "lucide-react";
import { UserPreferences } from "../types";

interface WetBulbModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWetBulb: number;
  currentRisk: string;
  userPrefs: UserPreferences;
}

export const WetBulbModal: React.FC<WetBulbModalProps> = ({
  isOpen,
  onClose,
  currentWetBulb,
  currentRisk,
  userPrefs,
}) => {
  const [loading, setLoading] = useState(false);
  const [customTemp, setCustomTemp] = useState<number>(30);
  const [customHumidity, setCustomHumidity] = useState<number>(70);
  const [calculatedIndex, setCalculatedIndex] = useState<{ value: number; label: string } | null>(null);

  if (!isOpen) return null;

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Direct client calculation logic corresponding to the Stull formula for instant interactive feedback
      const T = customTemp;
      const RH = customHumidity;
      const Tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) + Math.atan(T + RH) - Math.atan(RH - 1.676331) + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
      
      const val = Math.round(Tw * 10) / 10;
      let r = "Low Risk";
      if (val >= 30) r = "Extreme Danger";
      else if (val >= 25) r = "High Risk";
      else if (val >= 20) r = "Moderate Risk";

      setCalculatedIndex({ value: val, label: r });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTemp = (celsius: number) => {
    if (userPrefs.unitSystem === "us") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Extreme Danger":
        return "text-rose-400 bg-rose-500/15 border-rose-500/30";
      case "High Risk":
        return "text-orange-400 bg-orange-500/15 border-orange-500/30";
      case "Moderate Risk":
        return "text-amber-400 bg-amber-500/15 border-amber-500/30";
      default:
        return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl transition-all">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-sky-500/10 via-sky-300/10 to-transparent p-5 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lucide.ThermometerSnowflake className="text-sky-300 animate-spin-slow" size={24} />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider leading-none">The Wet-Bulb Science</h3>
              <p className="text-[10px] text-white/50 mt-1 uppercase font-semibold">Human Thermal Survivability Limit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer">
            <Lucide.X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] scrollbar-none text-left">
          
          {/* Active Sensor details */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-white/40 font-bold uppercase block">Current Active Sensor Index</span>
              <span className="text-4xl font-extrabold font-display tracking-tight text-white mt-1 block">
                {formatTemp(currentWetBulb)}
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-full border text-xs font-bold leading-none ${getRiskColor(currentRisk)}`}>
              ● {currentRisk}
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-white/80 leading-relaxed font-sans">
            <p>
              <strong>What is it?</strong> The wet-bulb temperature is the lowest temperature that can be achieved by evaporating water into the air at constant pressure. Unlike standard air temperature, it accounts directly for the cooling effect of sweat evaporation on human skin.
            </p>
            <p>
              <strong>Critical Human Limit:</strong> The threshold of human survivability is a continuous wet-bulb temperature of <strong>35°C (95°F)</strong>. Above this, the body can no longer radiate heat or evaporate sweat to cool itself, inevitably leading to core hyperthermia regardless of wind, water, or shade access.
            </p>
          </div>

          {/* Core educational Risk scale */}
          <div className="border-t border-white/10 pt-4">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block mb-2">Meteorological Risk Scales</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-emerald-400 block mb-0.5">&lt; {formatTemp(20)} (Low Warning)</span>
                <span className="text-white/60 leading-tight">Safe for heavy outdoor labour, running, and physical training.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-amber-400 block mb-0.5">{formatTemp(20)} - {formatTemp(24.9)} (Moderate)</span>
                <span className="text-white/60 leading-tight">Hydration schedules should be maintained. Rest slots recommended.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-orange-400 block mb-0.5">{formatTemp(25)} - {formatTemp(29.9)} (High Risk)</span>
                <span className="text-white/60 leading-tight">Body core heat increases. Limit sports, double fluids intake.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-rose-500 block mb-0.5">&gt; {formatTemp(30)} (Extreme Danger)</span>
                <span className="text-white/60 leading-tight">Active threat of heat stroke. Lethal with prolonged exposure.</span>
              </div>
            </div>
          </div>

          {/* Interactive Calculator Simulation tool */}
          <div className="border-t border-white/10 pt-4 text-xs">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block mb-3">Thermodynamic Calculator Simulator</span>
            
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/2 border border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/50 block mb-1 font-bold">Air Temp ({formatTemp(customTemp)})</label>
                  <input
                    type="range"
                    min="15"
                    max="45"
                    value={customTemp}
                    onChange={(e) => setCustomTemp(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1 font-bold">Relative Humidity ({customHumidity}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={customHumidity}
                    onChange={(e) => setCustomHumidity(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1.5">
                <button
                  onClick={handleCalculate}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-[10px] tracking-wide uppercase transition-all text-white cursor-pointer"
                >
                  Model Wet-bulb
                </button>
                
                {calculatedIndex && (
                  <div className="text-right font-mono text-xs">
                    <span className="text-[10px] text-white/40 block">Resulting Tw</span>
                    <span className="text-white font-bold">{formatTemp(calculatedIndex.value)}</span>
                    <span className="text-[10px] block text-sky-300 font-sans font-bold uppercase">{calculatedIndex.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer info lock */}
        <div className="p-4 bg-black/20 border-t border-white/5 text-center text-[10px] text-white/30 font-medium">
          Source: National Oceanic and Atmospheric Administration (NOAA) guidelines.
        </div>
      </div>
    </div>
  );
};
