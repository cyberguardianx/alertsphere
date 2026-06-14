export interface WeatherMetrics {
  temp: number; // °C
  condition: string;
  conditionIcon: string;
  high: number;
  low: number;
  wetBulb: number; // °C
  wetBulbRisk: "Low Risk" | "Moderate Risk" | "High Risk" | "Extreme Danger";
  rainProbability: number; // % in next hour
  aqi: number;
  aqiLabel: "Good" | "Moderate" | "Poor" | "Unhealthy" | "Hazardous";
  precipitation24h: number; // inches
  windSpeed: number; // mph
  windDir: string;
  sunrise: string;
  sunset: string;
  uvIndex: number;
  uvLabel: "Minimal" | "Low" | "Moderate" | "High" | "Very High" | "Extreme";
  visibility: number; // miles
  humidity: number; // %
  pressure: number; // inHg
}

export interface HourForecast {
  time: string;
  temp: number;
  icon: string;
  condition: string;
  rainProb: number;
}

export interface DayForecast {
  day: string;
  temp: number;
  icon: string;
  condition: string;
  high: number;
  low: number;
}

export interface MinForecast {
  time: string; // e.g. "10m", "20m"
  rainChance: number; // %
}

export interface CityData {
  id: string;
  name: string;
  country: string;
  timezone: string;
  lat?: number;
  lon?: number;
  current: WeatherMetrics;
  hourly: HourForecast[];
  daily: DayForecast[];
  minutely: MinForecast[];
}

export interface AlertThreshold {
  enabled: boolean;
  min: number;
  max: number;
  unit: string;
}

export interface SystemAlerts {
  temp: AlertThreshold;
  humidity: AlertThreshold;
  wetBulb: AlertThreshold;
  precipitation: AlertThreshold;
  aqi: AlertThreshold;
  wind: AlertThreshold;
}

export interface UserPreferences {
  unitSystem?: "metric" | "us" | "uk";
  personality: "scientific" | "casual" | "poetic" | "survivalist";
  notificationsEnabled: boolean;
  themeMode: "light" | "dark" | "time-based";
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}
