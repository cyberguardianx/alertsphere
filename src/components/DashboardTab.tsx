import React, { useState, useEffect } from "react";
import { CityData, UserPreferences, SystemAlerts } from "../types";
import { WeatherIcon } from "./WeatherIcons";
import { AppLogo } from "./AppLogo";
import * as Lucide from "lucide-react";
import { calculateWetBulbRisk } from "../data";

interface DashboardTabProps {
  cityData: CityData;
  userPrefs: UserPreferences;
  systemAlerts: SystemAlerts;
  onCitySearch: (query: string) => void;
  onCitySelect: (cityId: string) => void;
  allCities: CityData[];
  onOpenWetBulbModal: () => void;
  onOpenAiAssistant: () => void;
  tempAdjustment: number;
  humidityAdjustment: number;
  onAdjustTemp: (val: number) => void;
  onAdjustHumidity: (val: number) => void;
  onResetAdjustments: () => void;
  activeTheme?: "light" | "dark";
  isOffline?: boolean;
}

interface HourlyPoint {
  time: string;
  value: number;
  label?: string;
}

const generate24HourData = (metric: string, city: CityData): HourlyPoint[] => {
  const points: HourlyPoint[] = [];
  const currentHour = 14; 

  for (let i = 0; i < 24; i++) {
    const hr = (currentHour + i) % 24;
    const timeStr = `${hr.toString().padStart(2, "0")}:00`;

    const angle = ((hr - 15) / 24) * 2 * Math.PI;
    const diurnalFactor = 0.5 + 0.5 * Math.cos(angle);

    let value = 0;
    let label = "";

    switch (metric) {
      case "wetBulb": {
        const temp = city.current.low + (city.current.high - city.current.low) * diurnalFactor;
        const humidity = Math.min(100, Math.max(5, Math.round(85 - diurnalFactor * 35)));

        const T = temp;
        const RH = humidity;
        const Tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
                   Math.atan(T + RH) - Math.atan(RH - 1.676331) +
                   0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
        value = Math.round(Tw * 10) / 10;

        if (value >= 30) label = "Extreme Danger";
        else if (value >= 25) label = "High Risk";
        else if (value >= 20) label = "Moderate Risk";
        else label = "Low Risk";
        break;
      }

      case "rain": {
        const baseProb = city.current.rainProbability;
        const offset = Math.sin(((hr - 8) / 24) * 2 * Math.PI) * 20;
        value = Math.min(100, Math.max(0, Math.round(baseProb + offset)));
        label = value > 70 ? "Heavy Risk" : value > 40 ? "Moderate" : "Low Risk";
        break;
      }

      case "aqi": {
        const rush1 = Math.exp(-Math.pow(hr - 8, 2) / 4);
        const rush2 = Math.exp(-Math.pow(hr - 18, 2) / 4);
        const trafficSurge = (rush1 + rush2) * 25;
        value = Math.round(city.current.aqi + trafficSurge - 10 + Math.sin(angle) * 5);
        value = Math.max(5, value);

        if (value <= 50) label = "Good";
        else if (value <= 100) label = "Moderate";
        else label = "Unhealthy";
        break;
      }

      case "precipitation": {
        if (city.current.rainProbability > 10) {
          const baseRain = city.current.precipitation24h / 12;
          const hourlyFactor = Math.max(0, Math.sin(((hr - 12) / 24) * 2 * Math.PI) + 0.5);
          value = Math.round((baseRain * hourlyFactor) * 100) / 100;
        } else {
          value = 0;
        }
        break;
      }

      case "wind": {
        const baseWind = city.current.windSpeed;
        const windDrift = Math.sin(angle) * (baseWind * 0.3);
        value = Math.round((baseWind + windDrift) * 10) / 10;
        label = value > 20 ? "Gale Force" : value > 12 ? "Moderate" : "Gentle";
        break;
      }

      case "uv": {
        if (hr >= 6 && hr <= 19) {
          const uvAngle = ((hr - 13) / 13) * (Math.PI / 2);
          const intensity = Math.cos(uvAngle);
          value = Math.round((city.current.uvIndex * intensity) * 10) / 10;
          value = Math.max(0, value);
        } else {
          value = 0;
        }
        if (value >= 8) label = "Very High";
        else if (value >= 6) label = "High";
        else if (value >= 3) label = "Moderate";
        else label = "Low";
        break;
      }

      case "humidity": {
        value = Math.min(100, Math.max(5, Math.round(city.current.humidity + (1 - diurnalFactor * 2) * 15)));
        label = value > 80 ? "Saturated" : value > 50 ? "Humid" : "Dry";
        break;
      }

      default:
        value = 0;
    }

    points.push({
      time: i === 0 ? "Now" : timeStr,
      value,
      label
    });
  }

  return points;
};

// SVG scalloped path formula computation helper for UV index and Visibility cards
const getScallopPath = (cx: number, cy: number, r: number, amp: number, count: number) => {
  const points: string[] = [];
  const totalPoints = 120;
  for (let i = 0; i <= totalPoints; i++) {
    const theta = (i / totalPoints) * 2 * Math.PI;
    const currentR = r + amp * Math.cos(count * theta);
    const x = cx + currentR * Math.cos(theta);
    const y = cy + currentR * Math.sin(theta);
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(" ") + " Z";
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  cityData,
  userPrefs,
  systemAlerts,
  onCitySearch,
  onCitySelect,
  allCities,
  onOpenWetBulbModal,
  onOpenAiAssistant,
  tempAdjustment,
  humidityAdjustment,
  onAdjustTemp,
  onAdjustHumidity,
  onResetAdjustments,
  activeTheme = "dark",
  isOffline = false,
}) => {
  const isLight = activeTheme === "light";

  const themeStyles = {
    textPrimary: isLight ? "text-slate-950 font-extrabold" : "text-white font-bold",
    textSecondary: isLight ? "text-slate-900 font-bold" : "text-slate-100 font-semibold",
    textTertiary: isLight ? "text-slate-800 font-semibold" : "text-slate-200 font-medium",
    textQuaternary: isLight ? "text-slate-700 font-semibold" : "text-slate-300 font-medium",
    cardBg: isLight 
      ? "bg-gradient-to-br from-[#e0f2fe]/75 to-[#d1fae5]/75 hover:from-[#e0f2fe]/90 hover:to-[#d1fae5]/90 border border-emerald-200/60 backdrop-blur-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all" 
      : "bg-gradient-to-br from-[#011a14]/90 to-[#010915]/90 border border-[#24e574]/20 hover:border-[#24e574]/45 hover:bg-black/40",
    circleBg: isLight
      ? "bg-gradient-to-br from-[#e5f6ff]/85 to-[#d1f7e3]/85 border border-emerald-200/60 shadow-sm hover:scale-[1.02]"
      : "bg-gradient-to-br from-[#011411]/90 to-[#010915]/90 border border-[#24e574]/15 hover:border-[#38f387]/35 hover:scale-[1.02]",
    headerBg: isLight ? "bg-gradient-to-br from-[#e0f2fe]/50 to-[#d1fae5]/50 border-b border-emerald-200/50 shadow-sm" : "bg-black/20 border-white/5",
    forecastBoxBg: isLight ? "bg-gradient-to-br from-[#e0f2fe]/65 to-[#d1fae5]/65 border border-emerald-200/55 shadow-sm backdrop-blur-md" : "bg-gradient-to-br from-[#011411]/90 to-[#010915]/90 border border-[#24e574]/20 shadow-inner",
    subCardBg: isLight ? "bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-200" : "bg-white/5 border border-white/5 hover:bg-white/10",
    lineStroke: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
    scallopFill: isLight ? "rgba(255, 255, 255, 0.72)" : "#010e11",
    scallopStroke: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.06)",
    scallopDot: isLight ? "rgba(0, 0, 0, 0.25)" : "rgba(255,255,255,0.2)",
    circleRingBg: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.02)",
    aqiTrack: isLight ? "bg-slate-300" : "bg-white/10",
    humidityWave: isLight ? "#d1f5e0" : "#062d19",
    dewPoint: isLight ? "bg-[#d1f7e3] text-[#095028] border-[#24e574]/40" : "bg-[#1a3a27] text-[#24e574] border-[#24e574]/20",
    presetCard: isLight ? "bg-slate-900/95 border-black/15" : "bg-slate-950/95 border-white/10",
    presetBtnActive: "bg-emerald-500/20 border border-emerald-500 text-emerald-600 font-bold",
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [dashboardViewMode, setDashboardViewMode] = useState<"grid" | "wind" | "humidity" | "uv" | "pressure" | "visibility" | "precipitation" | "sunset" | "aqi">("grid");
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  // Auto-hide the offline toast after 3 seconds
  useEffect(() => {
    if (showOfflineToast) {
      const timer = setTimeout(() => setShowOfflineToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showOfflineToast]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      if (isOffline) {
        setSuggestions([]);
        return;
      }
      
      const fetchSuggestions = async () => {
        let results: any[] = [];
        try {
          const res = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            results = (data.predictions || []).map((r: any) => ({
                id: r.place_id || Date.now().toString(),
                description: r.description,
                structured_formatting: {
                    main_text: r.structured_formatting?.main_text || r.description.split(",")[0],
                    secondary_text: r.structured_formatting?.secondary_text || ""
                },
                raw: r.raw || r
            }));
          }
        } catch (e) {
          console.error("Failed to fetch suggestions");
        }
        
        // Add static matches
        const term = searchQuery.toLowerCase().trim();
        const staticMatches = allCities.filter((c) => c.name.toLowerCase().includes(term) || c.country.toLowerCase().includes(term));
        staticMatches.forEach(mc => {
           // check if already in results
           if (!results.some(r => r.structured_formatting.main_text.toLowerCase() === mc.name.toLowerCase())) {
             results.push({
                 id: mc.id,
                 description: `${mc.name}, ${mc.country}`,
                 structured_formatting: {
                     main_text: mc.name,
                     secondary_text: mc.country
                 },
                 raw: { static_id: mc.id, name: mc.name, country: mc.country }
             });
           }
        });

        setSuggestions(results);
      };
      
      const timeoutId = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const baseMetrics = cityData.current;
  const currentTemp = Math.round(baseMetrics.temp + tempAdjustment);
  const currentHumidity = Math.min(100, Math.max(5, baseMetrics.humidity + humidityAdjustment));
  const dpVal = Math.round(currentTemp - (100 - currentHumidity) / 5);
  const calculatedPressureVal = Math.round(baseMetrics.pressure * 33.8639) || 1006;

  const { value: currentWetBulb, label: currentWetBulbRisk } = calculateWetBulbRisk(currentTemp, currentHumidity);

  const formatTemp = (celsius: number) => {
    if (userPrefs.unitSystem === "us") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const formatDistance = (miles: number) => {
    if (userPrefs.unitSystem === "us" || userPrefs.unitSystem === "uk") {
      return `${miles} mi`;
    }
    return `${Math.round(miles * 1.60934)} km`;
  };

  const formatSpeed = (mph: number) => {
    if (userPrefs.unitSystem === "us" || userPrefs.unitSystem === "uk") {
      return `${mph} mph`;
    }
    return `${Math.round(mph * 1.60934)} km/h`;
  };

  const formatPrecip = (value: number, isAmount: boolean = false) => {
    if (!isAmount) return `${value}%`;
    if (userPrefs.unitSystem === "us") {
      return `${value.toFixed(2)} in`;
    }
    return `${Math.round(value * 25.4)} mm`;
  };

  const formatPressure = (inHg: number) => {
    if (userPrefs.unitSystem === "metric" || userPrefs.unitSystem === "uk") {
      return `${Math.round(inHg * 33.8639)} hPa`;
    }
    return `${inHg.toFixed(2)} inHg`;
  };

  const highTempFormatted = formatTemp(cityData.current.high + tempAdjustment);
  const lowTempFormatted = formatTemp(cityData.current.low + tempAdjustment);

  // Active alarm thresholds ribbon matching screenshot 2
  const activeAlerts: string[] = [];
  if (systemAlerts.temp.enabled && (currentTemp < systemAlerts.temp.min || currentTemp > systemAlerts.temp.max)) {
    activeAlerts.push(`Temp (${formatTemp(currentTemp)}) is outside range ${formatTemp(systemAlerts.temp.min)} - ${formatTemp(systemAlerts.temp.max)}`);
  }
  if (systemAlerts.humidity.enabled && (currentHumidity < systemAlerts.humidity.min || currentHumidity > systemAlerts.humidity.max)) {
    activeAlerts.push(`Humidity (${currentHumidity}%) is outside range ${systemAlerts.humidity.min}% - ${systemAlerts.humidity.max}%`);
  }
  if (systemAlerts.wetBulb.enabled && (currentWetBulb < systemAlerts.wetBulb.min || currentWetBulb > systemAlerts.wetBulb.max)) {
    activeAlerts.push(`Wet Bulb (${formatTemp(currentWetBulb)}) is outside range ${formatTemp(systemAlerts.wetBulb.min)} - ${formatTemp(systemAlerts.wetBulb.max)}`);
  }
  if (systemAlerts.precipitation.enabled && (baseMetrics.rainProbability < systemAlerts.precipitation.min || baseMetrics.rainProbability > systemAlerts.precipitation.max)) {
    activeAlerts.push(`Rain Risk (${baseMetrics.rainProbability}%) is outside range ${systemAlerts.precipitation.min}% - ${systemAlerts.precipitation.max}%`);
  }
  if (systemAlerts.aqi.enabled && (baseMetrics.aqi < systemAlerts.aqi.min || baseMetrics.aqi > systemAlerts.aqi.max)) {
    activeAlerts.push(`AQI (${baseMetrics.aqi}) is outside range ${systemAlerts.aqi.min} - ${systemAlerts.aqi.max}`);
  }
  if (systemAlerts.wind.enabled && (baseMetrics.windSpeed < systemAlerts.wind.min || baseMetrics.windSpeed > systemAlerts.wind.max)) {
    activeAlerts.push(`Wind speed (${formatSpeed(baseMetrics.windSpeed)}) is outside range ${formatSpeed(systemAlerts.wind.min)} - ${formatSpeed(systemAlerts.wind.max)}`);
  }

  const handleSelectCity = (id: string) => {
    onCitySelect(id);
    setSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isOffline) {
        const term = searchQuery.toLowerCase().trim();
        const matched = allCities.find((c) => c.name.toLowerCase().includes(term) || c.country.toLowerCase().includes(term));
        if (!matched) {
          setShowOfflineToast(true);
          return;
        }
      }
      onCitySearch(searchQuery);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const METRICS_ORDER = [
    "wetBulb",
    "wind",
    "uv",
    "visibility",
    "pressure",
    "precipitation",
    "sunset",
    "aqi",
    "humidity"
  ];

  const handlePrevMetric = () => {
    if (!selectedMetric) return;
    const currentIndex = METRICS_ORDER.indexOf(selectedMetric);
    const prevIndex = currentIndex <= 0 ? METRICS_ORDER.length - 1 : currentIndex - 1;
    setSelectedMetric(METRICS_ORDER[prevIndex]);
  };

  const handleNextMetric = () => {
    if (!selectedMetric) return;
    const currentIndex = METRICS_ORDER.indexOf(selectedMetric);
    const nextIndex = currentIndex >= METRICS_ORDER.length - 1 ? 0 : currentIndex + 1;
    setSelectedMetric(METRICS_ORDER[nextIndex]);
  };

  // Switcher badge coloring for wet bulb
  const getWetBulbBadgeColor = (risk: string) => {
    switch (risk) {
      case "Extreme Danger":
        return "bg-rose-500/80 border-rose-400 text-white animate-pulse";
      case "High Risk":
        return "bg-orange-500/80 border-orange-400 text-white";
      case "Moderate Risk":
        return "bg-amber-500/70 border-amber-400 text-slate-100";
      default:
        return "bg-emerald-500/60 border-emerald-400 text-white";
    }
  };

  const handlePrevInlineMetric = () => {
    const currentIndex = METRICS_ORDER.indexOf(dashboardViewMode);
    const prevIndex = currentIndex <= 0 ? METRICS_ORDER.length - 1 : currentIndex - 1;
    let finalIdx = prevIndex;
    if (METRICS_ORDER[prevIndex] === 'wetBulb') finalIdx = METRICS_ORDER.length - 1;
    setDashboardViewMode(METRICS_ORDER[finalIdx] as any);
  };

  const handleNextInlineMetric = () => {
    const currentIndex = METRICS_ORDER.indexOf(dashboardViewMode);
    const nextIndex = currentIndex >= METRICS_ORDER.length - 1 ? 0 : currentIndex + 1;
    let finalIdx = nextIndex;
    if (METRICS_ORDER[nextIndex] === 'wetBulb') finalIdx = 1;
    setDashboardViewMode(METRICS_ORDER[finalIdx] as any);
  };

  // GRID CARD RENDER HELPERS - Styled to perfectly match Image 11 alternations
   const renderPrecipitationCard = (onClick: () => void, value: string) => {
    return (
      <button
        onClick={onClick}
        className={`w-full h-36 min-h-[140px] max-w-[155px] mx-auto ${themeStyles.cardBg} rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition-all text-left shadow-sm`}
      >
        <div className={`flex items-center gap-1.5 ${themeStyles.textTertiary}`}>
          <Lucide.CloudDrizzle className="text-[#24e574]" size={14} />
          <span className="text-[11px] font-bold uppercase tracking-wider font-sans leading-none truncate">Precipitation</span>
        </div>
        <div>
          <span className={`text-[28px]  font-display block leading-none`}>
            {value}
          </span>
        </div>
        <p className={`text-[10px] ${themeStyles.textQuaternary} font-medium leading-tight`}>
          Total rain for the day
        </p>
      </button>
    );
  };

  const renderWindCircle = (onClick: () => void, speed: string, dir: string) => {
    const blobPath = getScallopPath(70, 70, 42, 6, 3);
    return (
      <button
        onClick={onClick}
        className={`w-full h-36 min-h-[140px] max-w-[155px] mx-auto rounded-full ${themeStyles.circleBg} flex flex-col items-center justify-between p-4 cursor-pointer active:scale-95 transition-all text-center relative overflow-hidden shadow-sm`}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <svg className="w-full h-full rotate-45 text-[#24e574]/15" viewBox="0 0 140 140">
            <path d={blobPath} fill="currentColor" />
          </svg>
        </div>
        
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${themeStyles.textTertiary} font-sans mt-0.5`}>
          <Lucide.Wind size={12} className="text-[#24e574]" />
          <span>Wind</span>
        </div>
        
        <div className="flex flex-col items-center justify-center my-auto">
          <span className={`text-xl font-bold ${themeStyles.textPrimary} tracking-tight leading-none`}>{speed}</span>
        </div>
        
        <div className={`text-[9.5px] font-bold ${themeStyles.textQuaternary} uppercase tracking-wider font-sans mb-1`}>
          From {dir}
        </div>
      </button>
    );
  };

  const renderSunsetCard = (onClick: () => void, sunrise: string, sunset: string) => {
    return (
      <button
        onClick={onClick}
        className={`w-full h-36 min-h-[140px] max-w-[155px] mx-auto ${themeStyles.cardBg} rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition-all text-left shadow-sm`}
      >
        <div className={`flex items-center gap-1.5 ${themeStyles.textTertiary}`}>
          <Lucide.Sunrise className="text-[#24e574]" size={14} />
          <span className="text-[11px] font-bold uppercase tracking-wider font-sans leading-none truncate">Sun Cycle</span>
        </div>
        
        <div className="h-6 w-full relative overflow-hidden flex items-end">
          <svg className="w-full h-6 overflow-visible animate-pulse" viewBox="0 0 100 20">
            <line x1="0" y1="18" x2="100" y2="18" stroke={themeStyles.lineStroke} strokeWidth="1" />
            <path d="M 5 18 Q 50 -10 95 18" fill="none" stroke="#24e574" strokeWidth="1.5" />
            <circle cx="50" cy="4" r="2" fill="#f59e0b" />
          </svg>
        </div>
        
        <div className={`flex justify-between items-center text-[9.5px] ${themeStyles.textSecondary} font-bold`}>
          <div className="flex items-center gap-1">
            <Lucide.Sunrise size={11} className="text-[#24e574]" />
            <span className="font-mono">{sunrise}</span>
          </div>
          <div className="flex items-center gap-1">
            <Lucide.Sunset size={11} className="text-orange-400" />
            <span className="font-mono">{sunset}</span>
          </div>
        </div>
      </button>
    );
  };

  const renderScallopedCard = (
    onClick: () => void,
    title: string,
    icon: React.ReactNode,
    value: React.ReactNode,
    label: string,
    scallops = 14,
    amp = 3,
    color = "#24e574"
  ) => {
    const path = getScallopPath(70, 70, 64, amp, scallops);
    return (
      <button
        onClick={onClick}
        className={`w-full h-36 min-h-[140px] max-w-[155px] mx-auto rounded-full ${themeStyles.circleBg} flex flex-col items-center justify-between p-4 cursor-pointer active:scale-95 transition-all text-center relative overflow-hidden shadow-sm`}
      >
        <svg className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0" viewBox="0 0 140 140">
          <path d={path} fill="none" stroke={`${color}15`} strokeWidth="1.5" />
          <circle cx="70" cy="70" r="56" fill="none" stroke={`${color}10`} strokeWidth="1" strokeDasharray="3 3" />
          {title === "UV index" && (
            <>
              <circle cx="20" cy="70" r="2.5" fill={color} />
              <circle cx="70" cy="20" r="2" fill={themeStyles.scallopDot} />
              <circle cx="120" cy="70" r="2" fill={themeStyles.scallopDot} />
              <circle cx="70" cy="120" r="2.5" fill={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"} />
            </>
          )}
        </svg>
        
        <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${themeStyles.textTertiary} font-sans mt-0.5`}>
            {icon}
            <span>{title}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center my-auto">
            <span className={`text-xl font-bold ${themeStyles.textPrimary} tracking-tight leading-none`}>{value}</span>
          </div>
          
          <div className={`text-[9.5px] font-bold ${themeStyles.textQuaternary} uppercase tracking-wider font-sans mb-1`}>
            {label}
          </div>
        </div>
      </button>
    );
  };

  const renderAirQualityCard = (onClick: () => void, aqiVal: number, aqiLabel: string) => {
    return (
      <button
        onClick={onClick}
        className={`w-full h-36 min-h-[140px] max-w-[155px] mx-auto ${themeStyles.cardBg} rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition-all text-left shadow-sm`}
      >
        <div className={`flex items-center gap-1.5 ${themeStyles.textTertiary}`}>
          <Lucide.Activity className="text-[#24e574]" size={14} />
          <span className="text-[11px] font-bold uppercase tracking-wider font-sans leading-none truncate">Air Quality</span>
        </div>
        
        <div>
          <span className={`text-[28px]  font-display block leading-none`}>
            {aqiVal}
          </span>
        </div>
        
        <div className="w-full">
          <div className={`w-full ${themeStyles.aqiTrack} h-1 border border-white/5 rounded-full overflow-hidden mb-1.5`}>
            <div 
              className="h-full bg-[#24e574]" 
              style={{ width: `${Math.min(100, (aqiVal / 150) * 100)}%` }} 
            />
          </div>
          <p className={`text-[9.5px] ${themeStyles.textQuaternary} font-bold uppercase tracking-wider font-sans truncate`}>
            {aqiLabel}
          </p>
        </div>
      </button>
    );
  };

  const renderHumidityCard = (onClick: () => void, humidityValue: number, dewPoint: number) => {
    const fillHeightPercent = humidityValue / 100;
    const waveY = 140 - (140 * fillHeightPercent);
    
    return (
      <button
        onClick={onClick}
        className={`w-full h-36 min-h-[140px] max-w-[155px] mx-auto ${themeStyles.cardBg} rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden text-left shadow-sm`}
      >
        <div className="absolute inset-x-0 bottom-0 pointer-events-none h-full w-full z-0 opacity-80">
          <svg className="w-full h-full" viewBox="0 0 140 140" preserveAspectRatio="none">
            <path 
              d={`M 0 ${waveY} Q 35 ${waveY - 4} 70 ${waveY} T 140 ${waveY} L 140 140 L 0 140 Z`} 
              fill={themeStyles.humidityWave} 
            />
            <path 
              d={`M 0 ${waveY} Q 35 ${waveY - 4} 70 ${waveY} T 140 ${waveY}`} 
              fill="none" 
              stroke="#24e574" 
              strokeWidth="1.5" 
            />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          <div className={`flex items-center gap-1.5 ${themeStyles.textTertiary}`}>
            <Lucide.Droplet className="text-[#24e574]" size={14} />
            <span className="text-[11px] font-bold uppercase tracking-wider font-sans leading-none truncate">Humidity</span>
          </div>
          
          <div>
            <span className={`text-[28px]  font-display`}>
              {humidityValue}%
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`h-4.5 px-2 rounded-full flex items-center justify-center text-[9px] font-mono font-bold border ${themeStyles.dewPoint}`}>
              {dewPoint}°
            </div>
            <span className={`text-[9.5px] ${themeStyles.textQuaternary} font-bold font-sans uppercase`}>Dew Point</span>
          </div>
        </div>
      </button>
    );
  };

  const renderPressureCircle = (onClick: () => void, text: string) => {
    return (
      <button
        onClick={onClick}
        className={`w-full h-36 min-h-[140px] max-w-[155px] mx-auto rounded-full ${themeStyles.circleBg} flex flex-col items-center justify-between p-4 cursor-pointer active:scale-95 transition-all text-center relative overflow-hidden shadow-sm`}
      >
        <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none z-0" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="58" fill="none" stroke={themeStyles.circleRingBg} strokeWidth="3" />
          <circle cx="70" cy="70" r="58" fill="none" stroke="#24e574" strokeWidth="3" 
            strokeDasharray={`${2 * Math.PI * 58}`}
            strokeDashoffset={`${2 * Math.PI * 58 * (1 - 0.72)}`}
            className="opacity-90"
          />
          <circle cx="70" cy="70" r="50" fill="none" stroke={isLight ? "rgba(36,229,116,0.22)" : "rgba(36,229,116,0.12)"} strokeWidth="1" strokeDasharray="3 3" />
        </svg>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full pointer-events-none gap-1.5">
          <div className={`flex items-center gap-0.5 text-[10px] uppercase font-bold tracking-wider ${themeStyles.textTertiary} font-sans`}>
            <Lucide.ChevronUp size={11} className="text-[#24e574]" />
            <span>Pressure</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className={`text-[17px] font-bold ${themeStyles.textPrimary} leading-none tracking-tight font-sans`}>{text}</span>
          </div>
          <div className="text-[9px] text-[#24e574]/90 font-bold uppercase tracking-widest font-mono">
            MSLP NORMAL
          </div>
        </div>
      </button>
    );
  };

  // DETAILED FULLSCREEN RENDERING - Triggers identical layout to screenshots 1 to 10
  const renderDetailView = (metric: string, isInline: boolean = false) => {
    const onPrevMetric = isInline ? handlePrevInlineMetric : handlePrevMetric;
    const onNextMetric = isInline ? handleNextInlineMetric : handleNextMetric;

    let titleStr = "";
    let iconEl: React.ReactNode = null;
    
    switch (metric) {
      case "pressure":
        titleStr = "Pressure";
        iconEl = <Lucide.ChevronUp className="text-[#24e574]" size={26} />;
        break;
      case "humidity":
        titleStr = "Humidity";
        iconEl = <Lucide.Droplet className="text-[#24e574]" size={24} />;
        break;
      case "visibility":
        titleStr = "Visibility";
        iconEl = <Lucide.Eye className="text-[#24e574]" size={26} />;
        break;
      case "aqi":
        titleStr = "Air quality";
        iconEl = <Lucide.Activity className="text-[#24e574]" size={26} />;
        break;
      case "uv":
        titleStr = "UV index";
        iconEl = <Lucide.Sun className="text-[#24e574]" size={26} />;
        break;
      case "sunset":
        titleStr = "Sunrise and sunset";
        iconEl = <Lucide.Sunrise className="text-[#24e574]" size={26} />;
        break;
      case "wind":
        titleStr = "Wind";
        iconEl = <Lucide.Wind className="text-[#24e574]" size={26} />;
        break;
      case "precipitation":
        titleStr = "Precipitation";
        iconEl = <Lucide.CloudDrizzle className="text-[#24e574]" size={26} />;
        break;
      case "wetBulb":
        titleStr = "Wet bulb risk";
        iconEl = <Lucide.Flame className="text-amber-400" size={26} />;
        break;
    }

    return (
      <div className={`flex flex-col flex-1 animate-fadeIn ${isInline ? "" : "px-6 pb-24"}`}>
        {/* Detail Title Header Bar with Back Left Arrow */}
        <header className={`flex items-center gap-3 z-10 ${isInline ? "pb-4" : "py-6"}`}>
          {!isInline && (
            <button 
              onClick={() => setSelectedMetric(null)}
              className="p-1 -ml-1 text-[#24e574] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center focus:outline-none"
            >
              <Lucide.ArrowLeft size={28} />
            </button>
          )}
          
          <div className="flex items-center gap-2.5">
            {iconEl}
            <h1 className={`text-2xl font-semibold tracking-tight ${themeStyles.textPrimary} font-sans`}>
              {titleStr}
            </h1>
          </div>
        </header>

        {/* Thick Rounded Matte Visual Container Block */}
        <div className={`${isLight ? "bg-white/70 border border-emerald-200/50 backdrop-blur-md shadow-sm" : "bg-[#05110a] border border-white/5"} rounded-[32px] p-6 shadow-xl w-full flex flex-col justify-between mb-6 relative overflow-hidden min-h-[180px]`}>
          
          {metric === "pressure" && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Current condition
                  </span>
                  <span className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"} block font-sans`}>
                    {formatPressure(cityData.current.pressure || 29.92)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              {/* Horizontal filled neon green bar track */}
              <div className={`w-full ${isLight ? "bg-slate-100" : "bg-[#0a2013]"} h-2.5 rounded-full overflow-hidden mt-6`}>
                <div className="bg-[#24e574] h-full rounded-full" style={{ width: "70%" }} />
              </div>
            </div>
          )}

          {metric === "humidity" && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Today's average
                  </span>
                  <span className={`text-[48px]  font-display`}>
                    {currentHumidity}%
                  </span>
                </div>
                {/* Arrow navigation buttons */}
                <div className="flex items-center gap-1.5 mt-1 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Hourly Bar Graphic with rain droplet pins */}
              <div className="flex items-end justify-between gap-2.5 mt-8 overflow-x-auto scrollbar-none pb-2 h-32">
                {(() => {
                  const humData = generate24HourData("humidity", cityData).slice(0, 9);
                  const values = humData.map(p => p.value);
                  const maxHum = Math.max(...values, 100);

                  return humData.map((p, idx) => {
                    const val = p.value;
                    const barHeightPct = Math.max(20, (val / maxHum) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center select-none justify-end h-full">
                        <div 
                          style={{ height: `${barHeightPct}%` }}
                          className="w-8 max-w-full rounded-[10px] bg-gradient-to-t from-[#24e574]/40 to-[#24e574] relative flex items-start justify-center pt-2 gap-1 mb-1.5"
                        >
                          <Lucide.Droplet size={10} className="text-[#03150d] fill-[#03150d] opacity-80" />
                        </div>
                        <span className={`text-[12px] font-bold ${isLight ? "text-slate-900" : "text-white/90"} font-mono`}>{val}%</span>
                        <span className={`text-[9px] font-bold ${isLight ? "text-slate-500" : "text-white/40"} uppercase tracking-wider mt-1 font-sans`}>{p.time}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {metric === "visibility" && (
            <div className="relative overflow-hidden w-full h-full min-h-[140px] flex flex-col justify-between">
              {/* Organic wave design vectors under condition text */}
              <div className="absolute inset-y-0 right-0 pointer-events-none select-none opacity-20 w-48">
                <svg className="w-full h-full text-[#24e574]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M50 0 C70 30 80 70 100 100 L100 0 Z" fill="currentColor" />
                  <path d="M0 0 C30 20 60 40 100 100" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              
              <div className="relative z-10 flex justify-between items-start w-full">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Current condition
                  </span>
                  <span className={`text-[44px]  font-display`}>
                    {formatDistance(cityData.current.visibility || 10)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {metric === "aqi" && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Current condition
                  </span>
                  <span className={`text-3xl font-black ${isLight ? "text-slate-950" : "text-white"} block font-sans`}>
                    {cityData.current.aqi} <span className="text-[#24e574] text-xl font-medium tracking-normal ml-1">Satisfactory air quality</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Slider timeline with colored tracks */}
              <div className="w-full h-3 rounded-full mt-6 bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-red-600 relative overflow-visible">
                <div 
                  className="absolute w-5 h-5 -top-1 border-2 border-slate-900 bg-white rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 cursor-default"
                  style={{ left: `${Math.min(95, Math.max(5, (cityData.current.aqi / 150) * 100))}%` }}
                >
                  <div className="w-2.5 h-2.5 bg-[#24e574] rounded-full" />
                </div>
              </div>

              <div className={`space-y-4 border mt-6 rounded-2xl p-4 text-xs ${isLight ? "border-emerald-500/20 bg-emerald-500/5 text-slate-800" : "border-white/5 bg-black/25 text-white/80"}`}>
                <p className="leading-relaxed">
                  <span className="font-bold text-[#24e574]">General population:</span> No special precautions.
                </p>
                <p className={`leading-relaxed border-t pt-3 ${isLight ? "border-slate-300/30" : "border-white/5"}`}>
                  <span className={`font-bold ${isLight ? "text-amber-700 font-extrabold" : "text-amber-300"}`}>Vulnerable population:</span> Do less prolonged or strenuous outdoor physical exertion.
                </p>
              </div>
            </div>
          )}

          {metric === "uv" && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Today's high
                  </span>
                  <span className={`text-[44px]  font-display`}>
                    {cityData.current.uvIndex} <span className="text-xl font-bold font-sans text-[#24e574] tracking-normal ml-0.5">{cityData.current.uvLabel}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mt-6 overflow-x-auto scrollbar-none gap-2 h-32">
                {(() => {
                  const uvData = generate24HourData("uv", cityData).slice(0, 9);
                  const values = uvData.map(p => p.value);
                  const maxUV = Math.max(...values, 8); // Scale against at least 8 to keep it realistic

                  return uvData.map((p, idx) => {
                    const val = values[idx];
                    const barHeightPct = Math.max(15, (val / maxUV) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center select-none justify-end h-full">
                        <div 
                          style={{ height: `${barHeightPct}%` }}
                          className={`w-8 max-w-full rounded-[10px] ${val > 0 ? "bg-gradient-to-t from-[#24e574]/30 to-[#24e574]" : (isLight ? "bg-slate-200" : "bg-white/10")} relative flex items-start justify-center pt-2 mb-1.5`}
                        >
                          {val > 0 ? (
                            <Lucide.Sun size={12} className="text-[#03150d] animate-pulse" />
                          ) : (
                            <Lucide.Moon size={12} className={isLight ? "text-slate-400" : "text-white/40"} />
                          )}
                        </div>
                        <span className={`text-[12px] font-bold ${isLight ? "text-slate-900" : "text-white/90"}`}>{val}</span>
                        <span className={`text-[9px] font-bold ${isLight ? "text-slate-500" : "text-white/40"} uppercase tracking-wider mt-1 font-sans`}>{p.time}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {metric === "sunset" && (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Today's cycle
                  </span>
                </div>
                <div className="flex items-center gap-1.5 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className={`h-40 w-full relative pt-4 overflow-hidden rounded-2xl flex flex-col justify-end border ${isLight ? "bg-slate-50 border-slate-300/40" : "bg-black/25 border-white/5"}`}>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 340 120" preserveAspectRatio="none">
                  <line x1="0" y1="80" x2="340" y2="80" stroke={isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"} strokeWidth="1" />
                  <path d="M 10 110 Q 170 -10 330 110 L 330 120 L 10 120 Z" fill="rgba(36,229,116,0.06)" />
                  <path d="M 10 110 Q 170 -10 330 110" fill="none" stroke="#24e574" strokeWidth="2.5" />
                  <circle cx="170" cy="35" r="5" fill="#f59e0b" className="animate-pulse" />
                </svg>
                
                <div className={`grid grid-cols-4 border-t py-3 text-center relative z-10 text-sans ${isLight ? "border-slate-300/30 bg-slate-100/60" : "border-white/5 bg-black/40"}`}>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[#24e574] font-bold uppercase tracking-wider">Dawn</span>
                    <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"} mt-1`}>5:07 am</span>
                  </div>
                  <div className={`flex flex-col border-l ${isLight ? "border-slate-300/30" : "border-white/5"}`}>
                    <span className="text-[9px] text-[#24e574] font-bold uppercase tracking-wider">Sunrise</span>
                    <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"} mt-1`}>{cityData.current.sunrise}</span>
                  </div>
                  <div className={`flex flex-col border-l ${isLight ? "border-slate-300/30" : "border-white/5"}`}>
                    <span className="text-[9px] text-[#24e574] font-bold uppercase tracking-wider">Sunset</span>
                    <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"} mt-1`}>{cityData.current.sunset}</span>
                  </div>
                  <div className={`flex flex-col border-l font-sans ${isLight ? "border-slate-300/30" : "border-white/5"}`}>
                    <span className="text-[9px] text-[#24e574] font-bold uppercase tracking-wider font-sans">Dusk</span>
                    <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"} mt-1 font-sans`}>7:41 pm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {metric === "wind" && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Today's high
                  </span>
                  <span className={`text-[44px]  font-display`}>
                    {formatSpeed(cityData.current.windSpeed || 7)}
                  </span>
                  <span className={`text-[13px] font-bold ${isLight ? "text-slate-600" : "text-white/60"} block font-sans`}>
                    Wind Direction: {{
                      "N": "North", "NNE": "North Northeast", "NE": "Northeast", "ENE": "East Northeast", 
                      "E": "East", "ESE": "East Southeast", "SE": "Southeast", "SSE": "South Southeast",
                      "S": "South", "SSW": "South Southwest", "SW": "Southwest", "WSW": "West Southwest", 
                      "W": "West", "WNW": "West Northwest", "NW": "Northwest", "NNW": "North Northwest"
                    }[cityData.current.windDir?.toUpperCase()] || cityData.current.windDir || "Northwest"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mt-6 overflow-x-auto scrollbar-none gap-2 h-32">
                {(() => {
                  const windData = generate24HourData("wind", cityData).slice(0, 9);
                  const values = windData.map(p => Math.round(p.value * 1.6));
                  const maxWind = Math.max(...values);

                  return windData.map((p, idx) => {
                    const val = values[idx];
                    const barHeightPct = Math.max(20, (val / Math.max(maxWind, 1)) * 100);
                    
                    const getWindRotation = (dir: string): number => {
                      const dirs: Record<string, number> = {
                        "N": 0, "NNE": 22.5, "NE": 45, "ENE": 67.5, "E": 90, "ESE": 112.5, "SE": 135, "SSE": 157.5,
                        "S": 180, "SSW": 202.5, "SW": 225, "WSW": 247.5, "W": 270, "WNW": 292.5, "NW": 315, "NNW": 337.5
                      };
                      return dirs[dir?.toUpperCase()] || 0;
                    };
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center select-none justify-end h-full">
                        <div 
                          style={{ height: `${barHeightPct}%` }}
                          className="w-8 max-w-full rounded-[10px] bg-gradient-to-t from-[#24e574]/30 to-[#24e574] relative flex items-start justify-center pt-2 mb-1.5"
                        >
                          <div style={{ transform: `rotate(${getWindRotation(cityData.current.windDir)}deg)` }}>
                            <Lucide.Navigation size={12} fill="#03150d" className="text-[#03150d]" strokeWidth={1} />
                          </div>
                        </div>
                        <span className={`text-[12px] font-bold ${isLight ? "text-slate-900" : "text-white/90"}`}>{val}</span>
                        <span className={`text-[9px] font-bold ${isLight ? "text-slate-500" : "text-white/40"} uppercase tracking-wider mt-1 font-sans`}>{p.time}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {metric === "precipitation" && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Today's total
                  </span>
                  <span className={`text-[44px] tracking-tight font-black ${isLight ? "text-slate-950" : "text-white"} block`}>
                    {formatPrecip(cityData.current.precipitation24h || 1.3, true)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 relative z-20">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mt-6 overflow-x-auto scrollbar-none gap-2 h-32">
                {(() => {
                  const rainData = generate24HourData("rain", cityData).slice(0, 9);
                  const values = rainData.map(p => p.value);
                  const maxRain = Math.max(...values, 20);

                  return rainData.map((p, idx) => {
                    const val = values[idx];
                    const isRain = val > 20;
                    const barHeightPct = Math.max(15, (val / maxRain) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center select-none justify-end h-full">
                        <div 
                          style={{ height: `${barHeightPct}%` }}
                          className={`w-8 max-w-full rounded-[10px] ${isRain ? "bg-gradient-to-t from-[#24e574]/30 to-[#24e574]" : (isLight ? "bg-slate-200" : "bg-white/10")} relative flex items-start justify-center pt-2 mb-1.5`}
                        >
                          {isRain ? (
                            <Lucide.CloudRain size={12} className="text-[#03150d]" />
                          ) : (
                            <Lucide.Cloud size={12} className={isLight ? "text-slate-400" : "text-white/40"} />
                          )}
                        </div>
                        <span className={`text-[12px] font-bold ${isLight ? "text-slate-900" : "text-white/90"}`}>{val}%</span>
                        <span className={`text-[9px] font-bold ${isLight ? "text-slate-500" : "text-white/40"} uppercase tracking-wider mt-1 font-sans`}>{p.time}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {metric === "wetBulb" && (
            <div>
              <div className="flex justify-between items-start w-full">
                <div className="flex-1">
                  <span className={`text-[11px] uppercase tracking-wider ${isLight ? "text-slate-500 font-extrabold" : "text-white/40 font-bold"} block mb-1 font-sans`}>
                    Current extreme risk estimation
                  </span>
                  <span className={`text-[36px] md:text-[44px] tracking-tight font-black ${isLight ? "text-slate-950" : "text-white"} leading-none block`}>
                    {formatTemp(currentWetBulb)} <span className="text-xl font-bold text-amber-400 tracking-normal ml-1">● {currentWetBulbRisk}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 relative z-20 flex-shrink-0 ml-4">
                  <button onClick={onPrevMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronLeft size={16} />
                  </button>
                  <button onClick={onNextMetric} className={`${isLight ? "bg-black/5 border border-black/5 hover:bg-black/10 text-slate-800" : "bg-white/5 border border-white/5 hover:bg-white/10 text-white"} p-2 rounded-full cursor-pointer transition-all`}>
                    <Lucide.ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className={`w-full ${isLight ? "bg-slate-100" : "bg-[#121c15]"} h-3 rounded-full overflow-hidden mt-6 relative shadow-inner`}>
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentWetBulbRisk === "Extreme Danger" ? "bg-red-500" :
                    currentWetBulbRisk === "High Risk" ? "bg-orange-500" :
                    currentWetBulbRisk === "Moderate Risk" ? "bg-amber-400" : "bg-[#24e574]"
                  }`} 
                  style={{ width: `${Math.min(100, Math.max(10, (currentWetBulb / 35) * 100))}%` }} 
                />
              </div>

              <div className="flex justify-between items-end mt-6 overflow-x-auto scrollbar-none gap-2 h-32">
                {(() => {
                  const wbData = generate24HourData("wetBulb", cityData).slice(0, 9);
                  const values = wbData.map(p => p.value);
                  const maxWb = Math.max(...values, 35);
                  
                  return wbData.map((p, idx) => {
                    const val = p.value;
                    const barHeightPct = Math.max(15, (val / maxWb) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center select-none justify-end h-full font-sans">
                        <div 
                          style={{ height: `${barHeightPct}%` }}
                          className={`w-8 max-w-full rounded-[10px] bg-gradient-to-t from-[#24e574]/30 to-[#24e574] relative flex items-start justify-center pt-2 mb-1.5`}
                        >
                          <Lucide.Thermometer size={12} className="text-[#03150d]" />
                        </div>
                        <span className={`text-[12px] font-bold ${isLight ? "text-slate-900" : "text-white/90"} font-mono`}>{formatTemp(val)}</span>
                        <span className={`text-[9px] font-bold ${isLight ? "text-slate-500" : "text-white/40"} uppercase tracking-wider mt-1`}>{p.time}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Narrative explanatory paragraphs under card */}
        {!isInline && (
        <section className={`space-y-6 text-sm leading-relaxed ${isLight ? "text-slate-800 font-medium" : "text-zinc-300 font-normal"} font-sans`}>
          {metric === "pressure" && (
            <>
              <p>
                Atmospheric pressure, also known as air pressure or barometric pressure, is the downward pressure exerted by the earth's atmosphere. This app uses mean sea level pressure (MSLP).
              </p>
              <p className={`leading-relaxed border-l-2 border-[#24e574]/30 pl-4 ${isLight ? "text-slate-700 font-semibold" : "text-zinc-400"}`}>
                Abnormal atmospheric pressure may cause headaches, joint pain, fatigue and other effects.
              </p>
            </>
          )}

          {metric === "humidity" && (
            <>
              <p>
                Relative humidity is the percentage of water vapour present in the air compared to the maximum amount that the air can hold at a given temperature.
              </p>
              <p className={`leading-relaxed border-l-2 border-[#24e574]/30 pl-4 ${isLight ? "text-slate-700 font-semibold" : "text-zinc-400"}`}>
                Dew point is what the temperature would need to be cooled to in order to achieve a relative humidity of 100%.
              </p>
            </>
          )}

          {metric === "visibility" && (
            <>
              <p>
                Visibility measures the distances at which prominent objects can be seen against the sky or horizon. Visibility can be affected by precipitation, fog, dust, smoke or haze.
              </p>
            </>
          )}

          {metric === "aqi" && (
            <>
              <p>
                Air quality index is a scale designed to help you understand how polluted the air is in a particular area.
              </p>
              <p>
                Different air quality index ranges are associated with different health effects. The scale helps people understand potential risks to their health.
              </p>
              <p className={`leading-relaxed border-l-2 border-[#24e574]/30 pl-4 text-xs font-mono ${isLight ? "text-slate-600 font-bold" : "text-zinc-400"}`}>
                NAQI is based on measurements of seven air pollutants: particulate matter (PM2.5, PM10), ozone (O3), carbon monoxide (CO), sulphur dioxide (SO2), nitrogen dioxide (NO2) and ammonia (NH3), over a period of 1–24 hours.
              </p>
            </>
          )}

          {metric === "uv" && (
            <>
              <p>
                The UV index measures the strength of the sun's ultraviolet (UV) radiation. It is on a scale of 0 to 11+, with the higher values indicating stronger UV radiation.
              </p>
              <p>
                UV radiation can cause sunburn, skin cancer and eye damage. The higher the UV index, the greater the risk of these problems.
              </p>
              <div className={`p-4 rounded-2xl border space-y-4 text-xs ${isLight ? "bg-slate-100 border-slate-300/40 text-slate-800 shadow-sm" : "bg-[#0a120e] border-white/5"}`}>
                <p>
                  <span className="font-bold text-[#24e574] uppercase block">0-2: Low</span>
                  No protection needed. You can safely stay outside using minimal sun protection.
                </p>
                <p className={`border-t pt-4 ${isLight ? "border-slate-300/35" : "border-white/5"}`}>
                  <span className="font-bold text-amber-500 uppercase block font-semibold">3-7: Moderate to High</span>
                  Protection needed. Seek shade during late morning through mid-afternoon. When outside, generously apply broad-spectrum SPF-15 or higher sunscreen on exposed skin and wear protective clothing, a wide-brimmed hat and sunglasses.
                </p>
                <p className={`border-t pt-4 ${isLight ? "border-slate-300/35" : "border-white/5"}`}>
                  <span className="font-bold text-red-500 uppercase block">8+: Very high to Extreme</span>
                  Extra protection needed. Be careful outside, especially during late morning through mid-afternoon. If your shadow is shorter than you, seek shade and wear protective clothing, a wide-brimmed hat and sunglasses, and generously apply a minimum of SPF-15, broad-spectrum sunscreen on exposed skin.
                </p>
              </div>
            </>
          )}

          {metric === "sunset" && (
            <>
              <p>
                <span className="font-bold text-[#24e574] mr-1.5">Dawn:</span> The first appearance of light in the sky just before sunrise.
              </p>
              <p>
                <span className="font-bold text-[#24e574] mr-1.5">Sunrise:</span> When the sun first appears above the horizon.
              </p>
              <p>
                <span className="font-bold text-[#24e574] mr-1.5">Sunset:</span> When the sun disappears below the horizon.
              </p>
              <p>
                <span className="font-bold text-[#24e574] mr-1.5">Dusk:</span> The last appearance of light in the sky just before nightfall.
              </p>
            </>
          )}

          {metric === "wind" && (
            <>
              <p>
                Wind speed is measured by averaging wind speeds over a period of time. Gusts are sudden bursts of wind typically lasting under 20 seconds.
              </p>
            </>
          )}

          {metric === "precipitation" && (
            <>
              <p>
                Precipitation is any liquid or frozen water that forms in the atmosphere and falls back to the earth as rain, sleet, hail, snow, etc.
              </p>
              <p className={`leading-relaxed border-l-2 border-[#24e574]/30 pl-4 ${isLight ? "text-slate-700 font-semibold" : "text-zinc-400"}`}>
                This chart measures the amount of precipitation that is forecast throughout the day.
              </p>
            </>
          )}

          {metric === "wetBulb" && (
            <>
              <p>
                Wet Bulb temperature is the lowest temperature that can be reached by evaporating water. It measures the combined effect of heat and humidity on human body thermoregulation.
              </p>
              <p>
                At a wet bulb temperature of 35°C (95°F) or higher, even healthy human beings cannot survive outdoors for sustained intervals, as the body is unable to shed metabolic heat via sweat evaporation.
              </p>
            </>
          )}
        </section>
        )}
      </div>
    );
  };

  // If a metric is chosen, render the gorgeous detail screen block instead
  if (selectedMetric) {
    return renderDetailView(selectedMetric);
  }

  // STANDARD WEATHER DASHBOARD & GRID VIEW
  return (
    <div className="flex flex-col flex-1 pb-16">
      {/* Offline Toast Notification */}
      {showOfflineToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-orange-500/50 shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-orange-900/50 min-w-[300px]">
          <div className="bg-orange-500/20 p-2 rounded-full">
            <Lucide.WifiOff className="text-orange-400" size={20} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-white text-sm">Offline Mode</span>
            <span className="text-white/70 text-[10px]">Cannot fetch new locations without connection</span>
          </div>
        </div>
      )}

      {/* Header bar styled exactly like Image 11 */}
      <header className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? "border-black/5" : "border-white/5"} sticky top-0 z-40 ${themeStyles.headerBg} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <AppLogo className="mr-2 border-r pr-3 border-black/10 dark:border-white/10" showText={false} />
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`flex items-center gap-1.5 text-lg font-medium tracking-tight ${themeStyles.textPrimary} focus:outline-none hover:opacity-80 transition-all cursor-pointer`}
            id="btn_city_selector"
          >
            <Lucide.MapPin size={20} className={isLight ? "text-slate-800" : "text-white/80"} />
            <span>{cityData.name}, {cityData.country}</span>
            <Lucide.ChevronDown size={14} className={isLight ? "text-slate-500/60" : "text-white/40"} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2 rounded-full ${isLight ? "hover:bg-black/5" : "hover:bg-white/5"} ${isLight ? "text-slate-800" : "text-white/80 hover:text-white"} transition-all cursor-pointer`}
            title="Search Stations"
          >
            <Lucide.Search size={18} />
          </button>
          
          <button
            onClick={onOpenAiAssistant}
            className={`p-2 rounded-full ${isLight ? "hover:bg-black/5" : "hover:bg-white/5"} ${isLight ? "text-[#eab308]" : "text-white/80 hover:text-white"} transition-all cursor-pointer`}
            title="AI Co-pilot"
          >
            <Lucide.Sparkles size={18} className="text-amber-500 animate-pulse" />
          </button>

          <button
            onClick={() => alert(`Atmospheric parameters for ${cityData.name} saved successfully!`)}
            className="rounded-full bg-[#24e574] text-[#03150d] font-semibold text-xs tracking-wide py-1.5 px-4 h-9 hover:opacity-95 active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer"
          >
            Save
          </button>
        </div>
      </header>

      {/* Preset Stations panel */}
      {searchOpen && (
        <div className={`mx-6 mt-3 p-4 rounded-3xl ${themeStyles.presetCard} backdrop-blur-2xl transition-all z-40 shadow-xl relative animate-fadeIn`}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white/90 uppercase tracking-widest">Atmospheric Stations</h3>
            <button onClick={() => setSearchOpen(false)} className="text-white/60 hover:text-white">
              <Lucide.X size={16} />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4 relative">
            <input
              type="text"
              placeholder="Enter station name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#24e574]/40 transition-all font-sans"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-[#24e574] text-[#03150d] hover:opacity-90 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all font-sans"
            >
              <Lucide.ArrowRight size={12} /> Go
            </button>
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-slate-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (s.raw.static_id) {
                         onCitySearch(s.raw.name);
                      } else {
                         onCitySearch(JSON.stringify(s.raw));
                      }
                      setSearchQuery("");
                      setSuggestions([]);
                      setSearchOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-xs text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-none flex items-center gap-2"
                  >
                    <Lucide.MapPin size={14} className="text-[#24e574] opacity-80" />
                    <span className="font-semibold">{s.structured_formatting.main_text}</span>
                    <span className="text-white/50 text-[10px]">{s.structured_formatting.secondary_text}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block mb-1 font-sans">Presets</span>
            <div className="grid grid-cols-2 gap-1.5">
              {allCities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCity(c.id)}
                  className={`px-3 py-2 rounded-2xl text-left text-xs font-medium transition-all flex items-center justify-between group ${
                    cityData.id === c.id
                      ? "bg-[#24e574]/15 border border-[#24e574] text-white"
                      : "bg-white/5 hover:bg-white/10 text-white/80 border border-transparent"
                  }`}
                >
                  <span className="font-sans font-bold">{c.name}</span>
                  <span className="opacity-40 text-[9px] font-mono group-hover:opacity-100 transition-opacity">
                    {c.timezone}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alarm breached ribbons */}
      {activeAlerts.length > 0 && (
        <div className={`mx-6 mt-4 p-3.5 ${isLight ? "bg-rose-100/40 border border-rose-300/50" : "bg-rose-500/10 border border-rose-400/30"} rounded-3xl backdrop-blur-xl flex flex-col gap-2 shadow-lg`}>
          <div className={`flex items-center gap-2 ${isLight ? "text-rose-800 font-bold" : "text-rose-300"}`}>
            <Lucide.AlertOctagon className={`${isLight ? "text-rose-600" : "text-rose-400"} animate-pulse flex-shrink-0`} size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Threshold Alarm Breached!</span>
          </div>
          <div className="space-y-1 pl-6">
            {activeAlerts.map((alert, idx) => (
              <p key={idx} className={`text-xs ${isLight ? "text-rose-700 font-semibold" : "text-rose-100"} font-medium leading-relaxed`}>
                • {alert}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start lg:px-8 lg:mt-8 pb-24 w-full h-full max-w-[1600px] mx-auto">
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 w-full lg:sticky lg:top-24">
          {/* Meteorological primary banner */}
          <section className="flex flex-col items-center justify-center text-center mt-7 lg:mt-0 px-6 lg:px-0 animate-fadeIn select-none font-sans">
        <h1 className={`text-[72px] md:text-[84px] font-bold ${themeStyles.textPrimary} tracking-tighter leading-none relative filter drop-shadow`}>
          {formatTemp(currentTemp)}
        </h1>
        <p className={`text-lg md:text-xl font-medium ${themeStyles.textSecondary} mt-1`}>
          {cityData.current.condition}
        </p>
        <p className={`text-[11px] font-bold ${themeStyles.textQuaternary} mt-1 uppercase tracking-wider font-mono`}>
          H: {highTempFormatted} • L: {lowTempFormatted}
        </p>
      </section>

      {/* Forecasting widget */}
      <div className={`mx-6 lg:mx-0 lg:mt-0 mt-6 p-5 rounded-[32px] ${themeStyles.forecastBoxBg} flex flex-col gap-6`}>
        {/* Hourly Forecast */}
        <div>
          <div className={`flex items-center gap-2 pb-3 mb-3 border-b ${isLight ? "border-black/5" : "border-white/5"} ${themeStyles.textTertiary}`}>
            <Lucide.Clock className="text-[#24e574]" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider font-sans">Hourly Forecast</span>
          </div>
          <div className="overflow-x-auto scrollbar-none flex gap-4 pb-1">
            {cityData.hourly.map((f, idx) => {
              const hourTemp = Math.round(f.temp + tempAdjustment);
              return (
                <div key={idx} className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl ${themeStyles.subCardBg} min-w-[80px] transition-colors font-sans gap-0.5`}>
                  <span className={`text-[11px] ${themeStyles.textTertiary} font-bold`}>{f.time}</span>
                  <WeatherIcon name={f.icon} className="my-2" size={18} />
                  <span className={`text-xs font-bold ${themeStyles.textPrimary} font-sans`}>{formatTemp(hourTemp)}</span>
                  <span className="text-[9px] text-[#24e574]/60 font-semibold font-mono mt-0.5">{f.rainProb}% rain</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Forecast */}
        <div>
          <div className={`flex items-center gap-2 pb-3 mb-3 border-b ${isLight ? "border-black/5" : "border-white/5"} ${themeStyles.textTertiary}`}>
            <Lucide.CalendarDays className="text-[#24e574]" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider font-sans">10-Day Forecast</span>
          </div>
          <div className="overflow-x-auto scrollbar-none flex gap-4 pb-1">
            {cityData.daily.map((f, idx) => {
              const dayHighTemp = Math.round(f.high + tempAdjustment);
              const dayLowTemp = Math.round(f.low + tempAdjustment);
              return (
                <div key={idx} className={`flex-shrink-0 flex flex-col items-center justify-center p-3.5 rounded-2xl ${themeStyles.subCardBg} min-w-[105px] transition-colors font-sans`}>
                  <span className={`text-xs ${themeStyles.textSecondary} font-bold`}>{f.day}</span>
                  <span className={`text-[9px] ${themeStyles.textQuaternary} font-semibold mt-0.5 block truncate max-w-full`}>{f.condition}</span>
                  <WeatherIcon name={f.icon} className="my-2" size={20} />
                  <div className="flex gap-2 text-[10px] font-bold font-mono">
                    <span className={themeStyles.textPrimary}>{formatTemp(dayHighTemp)}</span>
                    <span className={themeStyles.textQuaternary}>{formatTemp(dayLowTemp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

        </div>
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 w-full mt-6 lg:mt-0">
          {/* Wet Bulb Risk Assessment */}
          <div className="px-6 lg:px-0">
        <button
          onClick={() => setSelectedMetric("wetBulb")}
          className={`w-full ${isLight ? "bg-white/65 hover:bg-white/80 border-amber-400/50" : "bg-[#0a120e] border border-amber-400/30 hover:border-amber-400/60"} rounded-[32px] p-5 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden transition-all duration-350 cursor-pointer group text-left`}
          id="card_wet_bulb"
        >
          {currentWetBulbRisk === "Extreme Danger" && (
            <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 text-amber-500 mb-2 font-bold">
              <Lucide.Thermometer className="text-amber-500 group-hover:scale-110 transition-transform" size={15} />
              <span className="text-[11px] font-bold uppercase tracking-wider font-sans">WET BULB INDEX</span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-4xl font-bold font-sans ${themeStyles.textPrimary} tracking-tight leading-none`}>
                {formatTemp(currentWetBulb)}
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-sans ${getWetBulbBadgeColor(currentWetBulbRisk)}`}>
                ● {currentWetBulbRisk}
              </span>
            </div>
            
            <p className={`text-[11.5px] ${isLight ? "text-slate-600 font-semibold" : "text-zinc-400/90"} mt-3 font-sans leading-relaxed`}>
              Thermal limit for human thermodynamic sweat cooling. Check risk cycles.
            </p>
          </div>

          <div className={`w-12 h-12 rounded-full ${isLight ? "bg-black/5 border-black/5" : "bg-white/5 border border-white/5"} flex items-center justify-center backdrop-blur shadow-sm flex-shrink-0 ml-4 hidden md:flex`}>
            <Lucide.Flame className={`size-5 ${
              currentWetBulbRisk === "Extreme Danger" ? "text-red-500 animate-bounce" : "text-amber-400 animate-pulse"
            }`} />
          </div>
        </button>
      </div>

      {/* Weather Widgets Header & Toggle */}
      <div className="px-6 lg:px-0 mt-8 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm tracking-widest uppercase font-bold ${themeStyles.textPrimary} opacity-90`}>Weather widgets</h3>
        </div>
        
        <div className="flex gap-2 text-sm overflow-x-auto pb-4 scrollbar-none snap-x mask-fade-right">
          <button 
            onClick={() => setDashboardViewMode("grid")}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all snap-start shadow-sm border border-transparent ${
              dashboardViewMode === "grid" 
                ? (isLight ? "bg-slate-900 text-white" : "bg-[#24e574] text-[#03150d] border-[#24e574]/30") 
                : (isLight ? "bg-white/80 text-slate-700 hover:bg-white" : "bg-[#0a120e] text-white/70 hover:bg-[#0f1d16] hover:text-white border-white/5")
            }`}
            id="btn_view_grid"
          >
            Overview
          </button>
          
          {METRICS_ORDER.filter(m => m !== 'wetBulb').map(m => {
            const labels: Record<string, string> = { "wind": "Wind", "uv": "UV Index", "visibility": "Visibility", "pressure": "Pressure", "precipitation": "Precipitation", "sunset": "Sunrise", "aqi": "Air Quality", "humidity": "Humidity" };
            return (
              <button 
                key={m}
                onClick={() => setDashboardViewMode(m as any)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all snap-start shadow-sm border border-transparent ${
                  dashboardViewMode === m 
                    ? (isLight ? "bg-slate-900 text-white" : "bg-[#24e574] text-[#03150d] border-[#24e574]/30") 
                    : (isLight ? "bg-white/80 text-slate-700 hover:bg-white" : "bg-[#0a120e] text-white/70 hover:bg-[#0f1d16] hover:text-white border-white/5")
                }`}
                id={`btn_view_${m}`}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>
      </div>

      {dashboardViewMode === "grid" ? (
        <>
          {/* Circle Tiles Row */}
          <div className="px-6 lg:px-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Row 1, Col 1: Wind (Circle with Wave Blob) */}
              <div className="flex justify-center items-center w-full">
                {renderWindCircle(
                  () => setSelectedMetric("wind"),
                  formatSpeed(baseMetrics.windSpeed || 7),
                  baseMetrics.windDir || "NW"
                )}
              </div>

              {/* Row 1, Col 2: UV Index (Scalloped Circle) */}
              <div className="flex justify-center items-center w-full">
                {renderScallopedCard(
                  () => setSelectedMetric("uv"),
                  "UV index",
                  <Lucide.Sun size={12} className="text-[#24e574]" />,
                  baseMetrics.uvIndex || "0",
                  baseMetrics.uvLabel || "Low"
                )}
              </div>

              {/* Row 1, Col 3: Visibility (Scalloped Circle) */}
              <div className="flex justify-center items-center w-full font-sans">
                {renderScallopedCard(
                  () => setSelectedMetric("visibility"),
                  "Visibility",
                  <Lucide.Eye size={12} className="text-[#24e574]" />,
                  formatDistance(baseMetrics.visibility || 10),
                  "Normal Range",
                  16,
                  2,
                  "#24e574"
                )}
              </div>

              {/* Row 1, Col 4: Pressure (Circle with ring indicators) */}
              <div className="flex justify-center items-center w-full">
                {renderPressureCircle(
                  () => setSelectedMetric("pressure"),
                  formatPressure(baseMetrics.pressure || 29.92)
                )}
              </div>
            </div>
          </div>

          {/* Square Tiles Row */}
          <div className="px-6 lg:px-0 pb-6 lg:pb-0 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Row 2, Col 1: Precipitation (Rounded Rect) */}
              <div className="flex justify-center items-center w-full">
                {renderPrecipitationCard(() => setSelectedMetric("precipitation"), formatPrecip(baseMetrics.precipitation24h || 1.3, true))}
              </div>

              {/* Row 2, Col 2: Sunrise and Sunset (Rounded Rect) */}
              <div className="flex justify-center items-center w-full">
                {renderSunsetCard(
                  () => setSelectedMetric("sunset"),
                  baseMetrics.sunrise || "5:33 am",
                  baseMetrics.sunset || "7:16 pm"
                )}
              </div>

              {/* Row 2, Col 3: Air quality (Rounded Rect) */}
              <div className="flex justify-center items-center w-full">
                {renderAirQualityCard(
                  () => setSelectedMetric("aqi"),
                  baseMetrics.aqi || 97,
                  baseMetrics.aqiLabel || "Satisfactory"
                )}
              </div>

              {/* Row 2, Col 4: Humidity (Rounded Rect with wave fill) */}
              <div className="flex justify-center items-center w-full">
                {renderHumidityCard(
                  () => setSelectedMetric("humidity"),
                  currentHumidity,
                  dpVal
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="px-6 lg:px-0 pb-6">
          {renderDetailView(dashboardViewMode, true)}
        </div>
      )}

        </div>
      </div>

      {/* Floating Action AI Button */}
      <button
        onClick={onOpenAiAssistant}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg hover:bg-white/90 active:scale-95 transition-all text-xl cursor-pointer hover:shadow-emerald-400/20 hover:shadow-xl z-30 group"
        title="Consult AI Weather Assistant"
        id="btn_fab_chat"
      >
        <Lucide.Sparkles className="text-amber-500 group-hover:rotate-12 transition-transform animate-pulse" size={24} />
      </button>
    </div>
  );
};
