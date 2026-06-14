import React, { useState } from "react";
import { SystemAlerts, UserPreferences } from "../types";
import * as Lucide from "lucide-react";

interface AlertsTabProps {
  systemAlerts: SystemAlerts;
  userPrefs: UserPreferences;
  onSaveAlerts: (newAlerts: SystemAlerts) => void;
  activeTheme?: "light" | "dark";
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  systemAlerts,
  userPrefs,
  onSaveAlerts,
  activeTheme = "dark",
}) => {
  const isLight = activeTheme === "light";
  const cardClass = isLight 
    ? "bg-gradient-to-br from-[#e0f2fe]/75 to-[#d1fae5]/75 border border-emerald-200/60 shadow-sm" 
    : "bg-gradient-to-br from-[#011a14]/90 to-[#010915]/90 border border-emerald-500/10";
  const textClass = isLight ? "text-slate-950 font-extrabold" : "text-white font-bold";
  const subtextClass = isLight ? "text-slate-800 font-semibold" : "text-zinc-200 font-medium";
  const sliderTrackClass = isLight ? "bg-emerald-500/10 border border-emerald-500/10" : "bg-zinc-800";
  const labelClass = isLight ? "text-slate-700 font-bold" : "text-zinc-300 font-semibold";

  // Local state copy of current alert parameters to allow fine tuning before saving
  const [tempEnabled, setTempEnabled] = useState(systemAlerts.temp.enabled);
  const [tempMin, setTempMin] = useState(systemAlerts.temp.min);
  const [tempMax, setTempMax] = useState(systemAlerts.temp.max);

  const [humidityEnabled, setHumidityEnabled] = useState(systemAlerts.humidity.enabled);
  const [humidityMin, setHumidityMin] = useState(systemAlerts.humidity.min);
  const [humidityMax, setHumidityMax] = useState(systemAlerts.humidity.max);

  const [wetBulbEnabled, setWetBulbEnabled] = useState(systemAlerts.wetBulb.enabled);
  const [wetBulbMin, setWetBulbMin] = useState(systemAlerts.wetBulb.min);
  const [wetBulbMax, setWetBulbMax] = useState(systemAlerts.wetBulb.max);

  const [precipEnabled, setPrecipEnabled] = useState(systemAlerts.precipitation.enabled);
  const [precipMin, setPrecipMin] = useState(systemAlerts.precipitation.min);
  const [precipMax, setPrecipMax] = useState(systemAlerts.precipitation.max);

  const [aqiEnabled, setAqiEnabled] = useState(systemAlerts.aqi.enabled);
  const [aqiMin, setAqiMin] = useState(systemAlerts.aqi.min);
  const [aqiMax, setAqiMax] = useState(systemAlerts.aqi.max);

  const [windEnabled, setWindEnabled] = useState(systemAlerts.wind.enabled);
  const [windMin, setWindMin] = useState(systemAlerts.wind.min);
  const [windMax, setWindMax] = useState(systemAlerts.wind.max);

  const [showToast, setShowToast] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatTemp = (celsius: number) => {
    if (userPrefs.unitSystem === "us") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const formatSpeedValues = (mph: number) => {
    if (userPrefs.unitSystem === "us" || userPrefs.unitSystem === "uk") {
      return `${mph} mph`;
    }
    return `${Math.round(mph * 1.60934)} km/h`;
  };

  const handleResetToDefault = () => {
    setTempEnabled(systemAlerts.temp.enabled);
    setTempMin(systemAlerts.temp.min);
    setTempMax(systemAlerts.temp.max);
    setHumidityEnabled(systemAlerts.humidity.enabled);
    setHumidityMin(systemAlerts.humidity.min);
    setHumidityMax(systemAlerts.humidity.max);
    setWetBulbEnabled(systemAlerts.wetBulb.enabled);
    setWetBulbMin(systemAlerts.wetBulb.min);
    setWetBulbMax(systemAlerts.wetBulb.max);
    setPrecipEnabled(systemAlerts.precipitation.enabled);
    setPrecipMin(systemAlerts.precipitation.min);
    setPrecipMax(systemAlerts.precipitation.max);
    setAqiEnabled(systemAlerts.aqi.enabled);
    setAqiMin(systemAlerts.aqi.min);
    setAqiMax(systemAlerts.aqi.max);
    setWindEnabled(systemAlerts.wind.enabled);
    setWindMin(systemAlerts.wind.min);
    setWindMax(systemAlerts.wind.max);
    setIsMenuOpen(false);
  };

  const handleClearAllAlerts = () => {
    setTempEnabled(false);
    setHumidityEnabled(false);
    setWetBulbEnabled(false);
    setPrecipEnabled(false);
    setAqiEnabled(false);
    setWindEnabled(false);
    setIsMenuOpen(false);
  };

  const handleMenuItemClick = (msg: string) => {
    alert(msg);
    setIsMenuOpen(false);
  };

  const handleSave = () => {
    const updatedAlerts: SystemAlerts = {
      temp: { enabled: tempEnabled, min: tempMin, max: tempMax, unit: "C" },
      humidity: { enabled: humidityEnabled, min: humidityMin, max: humidityMax, unit: "%" },
      wetBulb: { enabled: wetBulbEnabled, min: wetBulbMin, max: wetBulbMax, unit: "C" },
      precipitation: { enabled: precipEnabled, min: precipMin, max: precipMax, unit: "%" },
      aqi: { enabled: aqiEnabled, min: aqiMin, max: aqiMax, unit: "AQI" },
      wind: { enabled: windEnabled, min: windMin, max: windMax, unit: "mph" },
    };
    onSaveAlerts(updatedAlerts);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className={`flex flex-col flex-1 pb-24 bg-transparent text-current animate-fadeIn pr-1 pl-1`}>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#24e574] text-[#03150d] px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs uppercase tracking-wider border border-emerald-400 animate-bounce">
          <Lucide.CheckCircle size={16} />
          Sensors Boundary Map Synchronized!
        </div>
      )}

      {/* Top Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? "border-emerald-200/50 bg-white/40" : "border-white/5 bg-transparent"} sticky top-0 z-30 backdrop-blur-md`}>
        <div className="flex items-center gap-1">
          <button className={`p-1 rounded-full ${isLight ? "hover:bg-black/5 text-slate-900" : "hover:bg-white/10 text-white/85"}`}>
            <Lucide.ChevronLeft size={22} />
          </button>
          <span className={`text-lg font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Smart Alerts</span>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-full ${isLight ? "hover:bg-black/5 text-slate-900" : "hover:bg-white/10 text-white/85"}`}
          >
            <Lucide.MoreVertical size={20} />
          </button>
          
          {isMenuOpen && (
            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200 border ${isLight ? 'bg-white border-emerald-100 shadow-emerald-500/10' : 'bg-[#03150d] border-[#24e574]/20 shadow-black'}`}>
              <div className="py-1 flex flex-col">
                <button 
                  onClick={handleResetToDefault}
                  className={`px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${isLight ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900' : 'text-zinc-300 hover:bg-[#24e574]/10 hover:text-[#24e574]'}`}
                >
                  <Lucide.RefreshCcw size={16} />
                  Reset to default settings
                </button>
                <button 
                  onClick={handleClearAllAlerts}
                  className={`px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${isLight ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900' : 'text-zinc-300 hover:bg-[#24e574]/10 hover:text-[#24e574]'}`}
                >
                  <Lucide.Trash2 size={16} />
                  Clear all alerts
                </button>
                <button 
                  onClick={() => handleMenuItemClick("View alert history: No recent alerts found.")}
                  className={`px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${isLight ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900' : 'text-zinc-300 hover:bg-[#24e574]/10 hover:text-[#24e574]'}`}
                >
                  <Lucide.History size={16} />
                  View alert history
                </button>
                <button 
                  onClick={() => handleMenuItemClick("Mute notifications enabled.")}
                  className={`px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${isLight ? 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900' : 'text-zinc-300 hover:bg-[#24e574]/10 hover:text-[#24e574]'}`}
                >
                  <Lucide.BellOff size={16} />
                  Mute notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        <p className={`text-sm ${subtextClass} font-medium leading-relaxed max-w-md`}>
          Set custom thresholds to receive push notifications when conditions breach your configured parameters.
        </p>

        {/* Alerts Configuration List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Temperature */}
          <div className={`p-5 rounded-3xl transition-all ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-700/20 flex items-center justify-center border border-orange-500/10">
                  <Lucide.Thermometer className="text-orange-400" size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-normal ${textClass}`}>Temperature</h3>
                  <p className={`text-xs font-medium ${subtextClass}`}>Notify if outside range</p>
                </div>
              </div>

              {/* IOS Styled Switch Button Toggle */}
              <button
                onClick={() => setTempEnabled(!tempEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all outline-none ${
                  tempEnabled ? "bg-[#24e574]" : (isLight ? "bg-slate-350" : "bg-zinc-700")
                }`}
                id="toggle_temp_alert"
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                    tempEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Range indicators text display */}
            <div className={`mt-5 text-center ${tempEnabled ? "opacity-100" : "opacity-40"}`}>
              <div className={`text-2xl font-bold font-display tracking-tight ${textClass} flex items-center justify-center gap-1.5 select-none`}>
                <span className="text-gray-500 text-lg">&lt;</span>
                <span>{formatTemp(tempMin)}</span>
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wider mx-1">or</span>
                <span className="text-gray-500 text-lg">&gt;</span>
                <span>{formatTemp(tempMax)}</span>
              </div>
            </div>

            {/* Custom Interactive Sliders Controls */}
            <div className={`mt-5 space-y-4 ${tempEnabled ? "opacity-100" : "pointer-events-none opacity-20"}`}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className={labelClass}>{formatTemp(-20)}</span>
                <span className="text-emerald-550 font-mono">Bound Limits</span>
                <span className={labelClass}>{formatTemp(50)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Min Temp:</span>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={tempMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < tempMax) setTempMin(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-10 text-right ${textClass}`}>{formatTemp(tempMin)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Max Temp:</span>
                  <input
                    type="range"
                    min="25"
                    max="50"
                    value={tempMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > tempMin) setTempMax(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-10 text-right ${textClass}`}>{formatTemp(tempMax)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Humidity */}
          <div className={`p-5 rounded-3xl transition-all ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-700/20 flex items-center justify-center border border-blue-500/10">
                  <Lucide.Droplet className="text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-normal ${textClass}`}>Humidity</h3>
                  <p className={`text-xs font-medium ${subtextClass}`}>Notify if outside range</p>
                </div>
              </div>

              <button
                onClick={() => setHumidityEnabled(!humidityEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all outline-none ${
                  humidityEnabled ? "bg-[#24e574]" : (isLight ? "bg-slate-350" : "bg-zinc-700")
                }`}
                id="toggle_humidity_alert"
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                    humidityEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className={`mt-5 text-center ${humidityEnabled ? "opacity-100" : "opacity-40"}`}>
              <div className={`text-2xl font-bold font-display tracking-tight ${textClass} flex items-center justify-center gap-1.5 select-none`}>
                <span className="text-gray-500 text-lg">&lt;</span>
                <span>{humidityMin}%</span>
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wider mx-1">or</span>
                <span className="text-gray-500 text-lg">&gt;</span>
                <span>{humidityMax}%</span>
              </div>
            </div>

            <div className={`mt-5 space-y-4 ${humidityEnabled ? "opacity-100" : "pointer-events-none opacity-20"}`}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className={labelClass}>0%</span>
                <span className="text-emerald-550 font-mono">Bound Limits</span>
                <span className={labelClass}>100%</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Min Humidity:</span>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={humidityMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < humidityMax) setHumidityMin(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-12 text-right ${textClass}`}>{humidityMin}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Max Humidity:</span>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={humidityMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > humidityMin) setHumidityMax(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-12 text-right ${textClass}`}>{humidityMax}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Wet Bulb warning limit */}
          <div className={`p-5 rounded-3xl transition-all ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-700/20 flex items-center justify-center border border-yellow-500/10">
                  <Lucide.AlertCircle className="text-yellow-400 animate-pulse" size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-normal ${textClass}`}>Wet Bulb</h3>
                  <p className={`text-xs font-medium ${subtextClass}`}>Notify if outside range</p>
                </div>
              </div>

              <button
                onClick={() => setWetBulbEnabled(!wetBulbEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all outline-none ${
                  wetBulbEnabled ? "bg-[#24e574]" : (isLight ? "bg-slate-350" : "bg-zinc-700")
                }`}
                id="toggle_wetbulb_alert"
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                    wetBulbEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className={`mt-5 text-center ${wetBulbEnabled ? "opacity-100" : "opacity-40"}`}>
              <div className={`text-2xl font-bold font-display tracking-tight ${textClass} flex items-center justify-center gap-1.5 select-none`}>
                <span className="text-gray-500 text-lg">&lt;</span>
                <span>{formatTemp(wetBulbMin)}</span>
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wider mx-1">or</span>
                <span className="text-gray-500 text-lg">&gt;</span>
                <span>{formatTemp(wetBulbMax)}</span>
              </div>
            </div>

            <div className={`mt-5 space-y-4 ${wetBulbEnabled ? "opacity-100" : "pointer-events-none opacity-20"}`}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className={labelClass}>{formatTemp(0)}</span>
                <span className="text-emerald-550 font-mono">Bound Limits</span>
                <span className={labelClass}>{formatTemp(35)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Min Wet Bulb:</span>
                  <input
                    type="range"
                    min="0"
                    max="19"
                    value={wetBulbMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < wetBulbMax) setWetBulbMin(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-10 text-right ${textClass}`}>{formatTemp(wetBulbMin)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Max Wet Bulb:</span>
                  <input
                    type="range"
                    min="20"
                    max="35"
                    value={wetBulbMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > wetBulbMin) setWetBulbMax(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-10 text-right ${textClass}`}>{formatTemp(wetBulbMax)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Precipitation risk */}
          <div className={`p-5 rounded-3xl transition-all ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-700/20 flex items-center justify-center border border-cyan-500/10">
                  <Lucide.CloudRain className="text-cyan-400" size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-normal ${textClass}`}>Precipitation</h3>
                  <p className={`text-xs font-medium ${subtextClass}`}>Notify if outside range</p>
                </div>
              </div>

              <button
                onClick={() => setPrecipEnabled(!precipEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all outline-none ${
                  precipEnabled ? "bg-[#24e574]" : (isLight ? "bg-slate-350" : "bg-zinc-700")
                }`}
                id="toggle_precip_alert"
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                    precipEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className={`mt-5 text-center ${precipEnabled ? "opacity-100" : "opacity-40"}`}>
              <div className={`text-2xl font-bold font-display tracking-tight ${textClass} flex items-center justify-center gap-1.5 select-none`}>
                <span className="text-gray-500 text-lg">&lt;</span>
                <span>{precipMin}%</span>
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wider mx-1">or</span>
                <span className="text-gray-500 text-lg">&gt;</span>
                <span>{precipMax}%</span>
              </div>
            </div>

            <div className={`mt-5 space-y-4 ${precipEnabled ? "opacity-100" : "pointer-events-none opacity-20"}`}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className={labelClass}>0%</span>
                <span className="text-emerald-550 font-mono">Bound Limits</span>
                <span className={labelClass}>100%</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Min Precip %:</span>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={precipMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < precipMax) setPrecipMin(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-12 text-right ${textClass}`}>{precipMin}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Max Precip %:</span>
                  <input
                    type="range"
                    min="41"
                    max="100"
                    value={precipMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > precipMin) setPrecipMax(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-12 text-right ${textClass}`}>{precipMax}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Air Quality (AQI) */}
          <div className={`p-5 rounded-3xl transition-all ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-700/20 flex items-center justify-center border border-teal-500/10">
                  <Lucide.Gauge className="text-teal-400" size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-normal ${textClass}`}>Air Quality Index</h3>
                  <p className={`text-xs font-medium ${subtextClass}`}>Notify if outside range</p>
                </div>
              </div>

              <button
                onClick={() => setAqiEnabled(!aqiEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all outline-none ${
                    aqiEnabled ? "bg-[#24e574]" : (isLight ? "bg-slate-350" : "bg-zinc-700")
                }`}
                id="toggle_aqi_alert"
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                    aqiEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className={`mt-5 text-center ${aqiEnabled ? "opacity-100" : "opacity-40"}`}>
              <div className={`text-2xl font-bold font-display tracking-tight ${textClass} flex items-center justify-center gap-1.5 select-none`}>
                <span className="text-gray-500 text-lg">&lt;</span>
                <span>{aqiMin}</span>
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wider mx-1">or</span>
                <span className="text-gray-500 text-lg">&gt;</span>
                <span>{aqiMax}</span>
              </div>
            </div>

            <div className={`mt-5 space-y-4 ${aqiEnabled ? "opacity-100" : "pointer-events-none opacity-20"}`}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className={labelClass}>0 AQI</span>
                <span className="text-emerald-550 font-mono">Bound Limits</span>
                <span className={labelClass}>300 AQI</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Min AQI:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={aqiMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < aqiMax) setAqiMin(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-12 text-right ${textClass}`}>{aqiMin}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Max AQI:</span>
                  <input
                    type="range"
                    min="101"
                    max="300"
                    value={aqiMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > aqiMin) setAqiMax(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold w-12 text-right ${textClass}`}>{aqiMax}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Wind Speed */}
          <div className={`p-5 rounded-3xl transition-all ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-700/20 flex items-center justify-center border border-indigo-500/10">
                  <Lucide.Wind className="text-indigo-400" size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-normal ${textClass}`}>Wind Speed</h3>
                  <p className={`text-xs font-medium ${subtextClass}`}>Notify if outside range</p>
                </div>
              </div>

              <button
                onClick={() => setWindEnabled(!windEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all outline-none ${
                    windEnabled ? "bg-[#24e574]" : (isLight ? "bg-slate-350" : "bg-zinc-700")
                }`}
                id="toggle_wind_alert"
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                    windEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className={`mt-5 text-center ${windEnabled ? "opacity-100" : "opacity-40"}`}>
              <div className={`text-2xl font-bold font-display tracking-tight ${textClass} flex items-center justify-center gap-1.5 select-none`}>
                <span className="text-gray-500 text-lg">&lt;</span>
                <span>{formatSpeedValues(windMin)}</span>
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wider mx-1">or</span>
                <span className="text-gray-500 text-lg">&gt;</span>
                <span>{formatSpeedValues(windMax)}</span>
              </div>
            </div>

            <div className={`mt-5 space-y-4 ${windEnabled ? "opacity-100" : "pointer-events-none opacity-20"}`}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className={labelClass}>{formatSpeedValues(0)}</span>
                <span className="text-emerald-550 font-mono">Bound Limits</span>
                <span className={labelClass}>{formatSpeedValues(100)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Min Wind:</span>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={windMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < windMax) setWindMin(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold whitespace-nowrap text-right ${textClass}`}>{formatSpeedValues(windMin)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${labelClass} w-12`}>Max Wind:</span>
                  <input
                    type="range"
                    min="21"
                    max="100"
                    value={windMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > windMin) setWindMax(val);
                    }}
                    className={`flex-1 accent-[#24e574] h-1 ${sliderTrackClass} rounded-lg appearance-none cursor-pointer`}
                  />
                  <span className={`text-xs font-mono font-bold whitespace-nowrap text-right ${textClass}`}>{formatSpeedValues(windMax)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Floating Action Button "Save Alerts" as shown in the second screenshot */}
        <div className="mt-8 flex justify-center sticky bottom-32 z-50">
          <button
            type="button"
            onClick={handleSave}
            className={`px-8 py-4 bg-[#24e574] hover:bg-[#1bc963] text-[#03150d] rounded-full font-extrabold text-xs uppercase tracking-widest shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer`}
            id="btn_save_alerts"
          >
            <Lucide.Save size={16} /> Save Alerts
          </button>
        </div>

      </div>
    </div>
  );
};
