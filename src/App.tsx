import { useState, useEffect, useRef } from "react";
import { CITIES, getBackgroundGradient, calculateWetBulbRisk, fetchLiveWeather } from "./data";
import { SystemAlerts, UserPreferences, CityData } from "./types";
import { DashboardTab } from "./components/DashboardTab";
import { AlertsTab } from "./components/AlertsTab";
import { ReportsTab } from "./components/ReportsTab";
import { SettingsTab } from "./components/SettingsTab";
import { WetBulbModal } from "./components/WetBulbModal";
import { GeminiAssistant } from "./components/GeminiAssistant";
import * as Lucide from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"Home" | "Reports" | "Alerts" | "Settings">("Home");
  const [citiesData, setCitiesData] = useState<CityData[]>(() => {
    try {
      const saved = localStorage.getItem("weather_cities");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    // default to london if nothing saved
    const london = CITIES.find(c => c.id === "london") || CITIES[0];
    return [london];
  });
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("weather_selected_city");
      if (saved) return saved;
    } catch(e) {}
    return "london";
  });

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Persist selections
  useEffect(() => {
    localStorage.setItem("weather_cities", JSON.stringify(citiesData));
  }, [citiesData]);

  useEffect(() => {
    localStorage.setItem("weather_selected_city", selectedCityId);
  }, [selectedCityId]);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Custom climate simulation offsets
  const [tempAdjustment, setTempAdjustment] = useState<number>(0);
  const [humidityAdjustment, setHumidityAdjustment] = useState<number>(0);

  // User details preferences as requested by metadata
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem("weather_user_prefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tempUnit === "F") parsed.unitSystem = "us";
        if (parsed.tempUnit === "C" && !parsed.unitSystem) parsed.unitSystem = "metric";
        
        // Remove personal properties from saved object permanently
        delete parsed.name;
        delete parsed.email;
        delete parsed.phone;
        delete parsed.dob;
        delete parsed.country;

        return parsed;
      } catch (e) {
        console.error("Failed to parse saved user prefs", e);
      }
    }
    return {
      unitSystem: "metric",
      personality: "scientific",
      notificationsEnabled: true,
      themeMode: "time-based", // 'light', 'dark', 'time-based'
    };
  });

  useEffect(() => {
    localStorage.setItem("weather_user_prefs", JSON.stringify(userPrefs));
  }, [userPrefs]);

  // Default alert thresholds aligned perfectly with screenshot 2
  const [systemAlerts, setSystemAlerts] = useState<SystemAlerts>(() => {
    try {
      const saved = localStorage.getItem("weather_system_alerts");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      temp: { enabled: true, min: 5, max: 30, unit: "C" },
      humidity: { enabled: true, min: 20, max: 80, unit: "%" },
      wetBulb: { enabled: false, min: 10, max: 25, unit: "C" }, // wet bulb default disabled (grey) in screenshot
      precipitation: { enabled: true, min: 20, max: 70, unit: "%" },
      aqi: { enabled: true, min: 0, max: 100, unit: "AQI" },
      wind: { enabled: false, min: 0, max: 25, unit: "mph" },
    };
  });

  useEffect(() => {
    localStorage.setItem("weather_system_alerts", JSON.stringify(systemAlerts));
  }, [systemAlerts]);

  const [wetBulbModalOpen, setWetBulbModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const fetchedCities = useRef(new Set<string>());

  // Retrieve current active city from selections
  const currentCity = citiesData.find((c) => c.id === selectedCityId) || citiesData[0];

  useEffect(() => {
    async function loadCityData() {
      if (!currentCity || fetchedCities.current.has(currentCity.id)) return;
      
      const liveData = await fetchLiveWeather(currentCity);
      fetchedCities.current.add(liveData.id);
      
      setCitiesData(prev => prev.map(c => c.id === liveData.id ? liveData : c));
    }
    loadCityData();
  }, [currentCity]);

  // Dynamically search or handle new locations

  const handleCitySearch = async (query: string) => {
    console.log("handleCitySearch received:", query);
    let place;
    try {
      const parsed = JSON.parse(query);
      if (parsed && (parsed.id || parsed.place_id)) {
        place = parsed;
      }
    } catch(e) {}

    // 1. If it's a string search, check existing list or geocode
    if (!place) {
      const term = query.toLowerCase().trim();
      const matched = citiesData.find((c) => c.name.toLowerCase() === term || c.name.toLowerCase().includes(term));
      if (matched) {
        console.log("Found matched static city:", matched);
        setSelectedCityId(matched.id);
        return;
      }

      try {
        console.log("Fetching new from /api/geocode for:", query);
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          place = await res.json();
        } else {
          alert("Could not fetch location data for that search.");
          return;
        }
      } catch (err) {
        console.error("Geocode error:", err);
        return;
      }
    }

    // 2. If we have a place object, register and navigate
    if (place) {
      console.log("Creating new city data for place:", place);
      const newId = `city-${place.id || place.place_id || Date.now()}`;
      
      const existing = citiesData.find(c => c.id === newId || (c.name === place.name && c.country === place.country));
      if (existing) {
        setSelectedCityId(existing.id);
        return;
      }

      const newCityData: CityData = {
        id: newId,
        name: place.name,
        country: place.country || "Unknown",
        timezone: place.timezone || "Auto",
        lat: place.latitude || place.lat,
        lon: place.longitude || place.lng,
        current: citiesData[0].current, // dummy initial data
        hourly: Array.from({length: 10}, (_, i) => ({
          time: i === 0 ? "Now" : `${String(new Date().getHours() + i).padStart(2, '0')}:00`,
          temp: 0, icon: "", condition: "", rainProb: 0
        })),
        daily: Array.from({length: 7}, (_, i) => ({
          day: i === 0 ? "Today" : `Day ${i+1}`,
          temp: 0, icon: "", condition: "", high: 0, low: 0
        })),
        minutely: Array.from({length: 12}, (_, i) => ({
          time: `${(i+1)*5}m`,
          rainChance: 0
        }))
      };
      
      console.log("New city data created:", newCityData);
      setCitiesData(prev => [...prev, newCityData]);
      setSelectedCityId(newCityData.id);
    }
  };

  // Adjustments handling
  const handleAdjustTemp = (val: number) => {
    setTempAdjustment(val);
  };

  const handleAdjustHumidity = (val: number) => {
    setHumidityAdjustment(val);
  };

  const handleResetAdjustments = () => {
    setTempAdjustment(0);
    setHumidityAdjustment(0);
  };

  const handleTabChange = (tab: "Home" | "Reports" | "Alerts" | "Settings") => {
    handleVibrate();
    setActiveTab(tab);
  };

  const handleVibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const activeTemp = Math.round(currentCity.current.temp + tempAdjustment);
  const activeHumidity = Math.min(100, Math.max(5, currentCity.current.humidity + humidityAdjustment));
  const { value: activeWetBulb, label: activeWetBulbRisk } = calculateWetBulbRisk(activeTemp, activeHumidity);

  // Calculate active display style based on display theme preference
  const getActiveTheme = (): "light" | "dark" => {
    const mode = userPrefs.themeMode || "dark";
    if (mode === "light") return "light";
    if (mode === "dark") return "dark";
    
    // time-based: day is light (06:00 to 18:00), night is dark
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "light" : "dark";
  };

  const activeTheme = getActiveTheme();

  // App-level alerts for simulation
  const appActiveAlerts: string[] = [];
  if (userPrefs.notificationsEnabled) {
    const formatTemp = (c: number) => userPrefs.unitSystem === "us" ? `${Math.round((c * 9) / 5 + 32)}°F` : `${c}°C`;
    const curCityMetrics = currentCity.current;
    
    if (systemAlerts.temp.enabled && (activeTemp < systemAlerts.temp.min || activeTemp > systemAlerts.temp.max)) {
      appActiveAlerts.push(`Temp ${formatTemp(activeTemp)} outside range`);
    }
    if (systemAlerts.humidity.enabled && (activeHumidity < systemAlerts.humidity.min || activeHumidity > systemAlerts.humidity.max)) {
      appActiveAlerts.push(`Humidity ${activeHumidity}% outside range`);
    }
    if (systemAlerts.wetBulb.enabled && (activeWetBulb < systemAlerts.wetBulb.min || activeWetBulb > systemAlerts.wetBulb.max)) {
      appActiveAlerts.push(`Wet Bulb ${formatTemp(activeWetBulb)} outside range`);
    }
    if (systemAlerts.precipitation.enabled && (curCityMetrics.rainProbability < systemAlerts.precipitation.min || curCityMetrics.rainProbability > systemAlerts.precipitation.max)) {
      appActiveAlerts.push(`Rain Risk ${curCityMetrics.rainProbability}% outside range`);
    }
    if (systemAlerts.aqi.enabled && (curCityMetrics.aqi < systemAlerts.aqi.min || curCityMetrics.aqi > systemAlerts.aqi.max)) {
      appActiveAlerts.push(`AQI ${curCityMetrics.aqi} outside range`);
    }
    if (systemAlerts.wind.enabled && (curCityMetrics.windSpeed < systemAlerts.wind.min || curCityMetrics.windSpeed > systemAlerts.wind.max)) {
      appActiveAlerts.push(`Wind ${curCityMetrics.windSpeed} mph outside range`);
    }
  }

  const [visiblePushAlerts, setVisiblePushAlerts] = useState<string[]>([]);

  useEffect(() => {
    // When active alerts change, simulate push notifications
    if (appActiveAlerts.length > 0 && userPrefs.notificationsEnabled) {
      setVisiblePushAlerts(appActiveAlerts);
      
      // Fire actual system web push notifications
      if ("Notification" in window && Notification.permission === "granted") {
        appActiveAlerts.forEach(alert => {
          new Notification("Weather Alert", {
            body: alert,
            icon: "/icon.png"
          });
        });
      }
      
      // Auto-hide push notifications after 3 seconds
      const timer = setTimeout(() => {
        setVisiblePushAlerts([]);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setVisiblePushAlerts([]);
    }
  }, [appActiveAlerts.join(","), userPrefs.notificationsEnabled]);

  const getLightBackgroundGradient = (temp: number, condition: string): string => {
    // Elegant soft sky blue and light mint green theme
    return "linear-gradient(185deg, #e5f6ff 0%, #f0fdf4 55%, #d1f7e3 100%)";
  };

  // Dynamic style gradient for background based on current active theme and tab
  const backgroundStyle = activeTab === "Home" 
    ? (activeTheme === "light"
        ? getLightBackgroundGradient(activeTemp, currentCity.current.condition)
        : getBackgroundGradient(currentCity.current)) // dark gradient based on condition
    : (activeTheme === "light"
        ? "linear-gradient(180deg, #e5f6ff 0%, #f0fdf4 50%, #d1f7e3 100%)" // Blue & Green light theme
        : "linear-gradient(180deg, #011612 0%, #010d14 100%)"); // Blue & Green dark theme

  return (
    <div
      style={{ background: backgroundStyle }}
      className={`min-h-screen ${activeTheme === "light" ? "text-slate-900" : "text-zinc-100"} font-sans transition-all duration-700 flex flex-col items-center justify-start overflow-x-hidden`}
    >
      {/* Central Screen Frame constraint */}
      <div className={`w-full min-h-screen flex flex-col justify-between border-x ${activeTheme === "light" ? "border-emerald-150 bg-white/10" : "border-emerald-950/20 bg-black/10"} relative shadow-2xl transition-all duration-300`}>
        
        {/* Offline Mode Badge */}
        {isOffline && (
          <div className="absolute top-4 right-4 z-40 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-orange-500/20 animate-pulse">
            <Lucide.WifiOff size={12} />
            Offline Mode
          </div>
        )}

        {/* Push Notification Overlay Simulation */}
        {visiblePushAlerts.length > 0 && userPrefs.notificationsEnabled && (
          <div className={`absolute top-4 inset-x-4 z-50 p-4 rounded-2xl shadow-2xl transition-all duration-300 border ${activeTheme === "light" ? "bg-white/95 border-rose-200 shadow-rose-900/10" : "bg-[#051110]/95 border-[rgba(244,63,94,0.3)] shadow-[rgba(0,0,0,0.5)]"} backdrop-blur-xl`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-1.5 ${activeTheme === "light" ? "bg-rose-100 text-rose-600" : "bg-rose-500/20 text-rose-400"}`}>
                <Lucide.Siren size={18} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTheme === "light" ? "text-slate-500" : "text-white/50"}`}>AlertSphere System</span>
                  <span className={`text-[9px] uppercase font-bold ${activeTheme === "light" ? "text-slate-400" : "text-white/30"}`}>Now</span>
                </div>
                <h4 className={`text-sm font-bold mt-0.5 mb-1 ${activeTheme === "light" ? "text-rose-700" : "text-rose-100"}`}>Sensor Barrier Breached!</h4>
                <div className="space-y-1">
                  {visiblePushAlerts.map((alert, idx) => (
                    <p key={idx} className={`text-xs font-semibold ${activeTheme === "light" ? "text-slate-700" : "text-slate-200"} truncate`}>
                      {alert}
                    </p>
                  ))}
                </div>
              </div>
              <button onClick={() => { handleVibrate(); setVisiblePushAlerts([]); }} className={`p-1 -ml-1 -mt-1 rounded-full ${activeTheme === "light" ? "hover:bg-slate-100 text-slate-400 hover:text-slate-600" : "hover:bg-white/10 text-white/40 hover:text-white"}`}>
                <Lucide.X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Layout Renderer */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden pb-24 relative">
          <AnimatePresence mode="wait">
            {activeTab === "Home" && (
              <motion.div
                key="Home"
                initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="w-full flex-1 flex flex-col"
              >
                <DashboardTab
                  cityData={currentCity}
                  userPrefs={userPrefs}
                  systemAlerts={systemAlerts}
                  onCitySearch={handleCitySearch}
                  onCitySelect={setSelectedCityId}
                  allCities={citiesData}
                  onOpenWetBulbModal={() => setWetBulbModalOpen(true)}
                  onOpenAiAssistant={() => setAiAssistantOpen(true)}
                  tempAdjustment={tempAdjustment}
                  humidityAdjustment={humidityAdjustment}
                  onAdjustTemp={handleAdjustTemp}
                  onAdjustHumidity={handleAdjustHumidity}
                  onResetAdjustments={handleResetAdjustments}
                  activeTheme={activeTheme}
                  isOffline={isOffline}
                />
              </motion.div>
            )}

            {activeTab === "Reports" && (
              <motion.div
                key="Reports"
                initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="w-full flex-1 flex flex-col"
              >
                <ReportsTab
                  currentCity={currentCity}
                  allCities={citiesData}
                  userPrefs={userPrefs}
                  onSelectCity={setSelectedCityId}
                  tempAdjustment={tempAdjustment}
                  humidityAdjustment={humidityAdjustment}
                  activeTheme={activeTheme}
                />
              </motion.div>
            )}

            {activeTab === "Alerts" && (
              <motion.div
                key="Alerts"
                initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="w-full flex-1 flex flex-col"
              >
                <AlertsTab
                  systemAlerts={systemAlerts}
                  userPrefs={userPrefs}
                  onSaveAlerts={setSystemAlerts}
                  activeTheme={activeTheme}
                />
              </motion.div>
            )}

            {activeTab === "Settings" && (
              <motion.div
                key="Settings"
                initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="w-full flex-1 flex flex-col"
              >
                <SettingsTab
                  userPrefs={userPrefs}
                  onUpdatePrefs={setUserPrefs}
                  activeTheme={activeTheme}
                  isInstallable={!!deferredPrompt}
                  onInstall={handleInstallPWA}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Bottom Navigation */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-md lg:max-w-xl transition-all duration-300">
          <div className={`flex items-center justify-around text-center p-2 rounded-2xl shadow-2xl backdrop-blur-2xl border ${
            activeTheme === "light" 
              ? "bg-white/40 border-white/60 shadow-emerald-900/10" 
              : "bg-[#020e10]/50 border-white/10 shadow-black/80"
          }`}>
          <button
            onClick={() => handleTabChange("Home")}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "Home"
                ? (activeTheme === "light" ? "bg-white/60 text-[#095028] shadow-sm transform scale-105" : "bg-white/10 text-[#24e574] transform scale-105 shadow-inner")
                : (activeTheme === "light" ? "text-slate-800/60 hover:text-black hover:bg-white/30" : "text-white/50 hover:text-white hover:bg-white/5")
            }`}
            id="tab_home_dashboard"
          >
            <Lucide.Home size={20} className={activeTab === "Home" ? "animate-pulse" : ""} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Home</span>
          </button>

          <button
            onClick={() => handleTabChange("Reports")}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "Reports"
                ? (activeTheme === "light" ? "bg-white/60 text-[#095028] shadow-sm transform scale-105" : "bg-white/10 text-[#24e574] transform scale-105 shadow-inner")
                : (activeTheme === "light" ? "text-slate-800/60 hover:text-black hover:bg-white/30" : "text-white/50 hover:text-white hover:bg-white/5")
            }`}
            id="tab_reports_discover"
          >
            <Lucide.Compass size={20} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Reports</span>
          </button>

          <button
            onClick={() => handleTabChange("Alerts")}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "Alerts"
                ? (activeTheme === "light" ? "bg-white/60 text-[#095028] shadow-sm transform scale-105" : "bg-white/10 text-[#24e574] transform scale-105 shadow-inner")
                : (activeTheme === "light" ? "text-slate-800/60 hover:text-black hover:bg-white/30" : "text-white/50 hover:text-white hover:bg-white/5")
            }`}
            id="tab_smart_alerts"
          >
            <div className="relative">
              <Lucide.Bell size={20} />
              {systemAlerts.temp.enabled && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Alerts</span>
          </button>

          <button
            onClick={() => handleTabChange("Settings")}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "Settings"
                ? (activeTheme === "light" ? "bg-white/60 text-[#095028] shadow-sm transform scale-105" : "bg-white/10 text-[#24e574] transform scale-105 shadow-inner")
                : (activeTheme === "light" ? "text-slate-800/60 hover:text-black hover:bg-white/30" : "text-white/50 hover:text-white hover:bg-white/5")
            }`}
            id="tab_user_settings"
          >
            <Lucide.Settings size={20} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Settings</span>
          </button>
          </div>
        </nav>

        {/* Global Modals */}
        <WetBulbModal
          isOpen={wetBulbModalOpen}
          onClose={() => setWetBulbModalOpen(false)}
          currentWetBulb={activeWetBulb}
          currentRisk={activeWetBulbRisk}
          userPrefs={userPrefs}
        />

        <GeminiAssistant
          isOpen={aiAssistantOpen}
          onClose={() => setAiAssistantOpen(false)}
          currentCity={currentCity}
          userPrefs={userPrefs}
          tempAdjustment={tempAdjustment}
          humidityAdjustment={humidityAdjustment}
        />

      </div>
    </div>
  );
}
