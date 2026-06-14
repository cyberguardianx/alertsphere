import { CityData, WeatherMetrics, HourForecast, DayForecast } from "./types";

export const CITIES: CityData[] = [
  {
    id: "new-york",
    name: "New York",
    country: "NY, US",
    timezone: "EDT",
    lat: 40.7128,
    lon: -74.0060,
    current: {
      temp: 28,
      condition: "Partly Cloudy",
      conditionIcon: "CloudSun",
      high: 31,
      low: 19,
      wetBulb: 24,
      wetBulbRisk: "Low Risk",
      rainProbability: 12,
      aqi: 42,
      aqiLabel: "Good",
      precipitation24h: 0.5,
      windSpeed: 12,
      windDir: "NE",
      sunrise: "06:12",
      sunset: "20:15",
      uvIndex: 4,
      uvLabel: "Moderate",
      visibility: 10,
      humidity: 45,
      pressure: 29.92
    },
    hourly: [
      { time: "Now", temp: 28, icon: "CloudSun", condition: "Partly Cloudy", rainProb: 12 },
      { time: "14:00", temp: 29, icon: "CloudSun", condition: "Partly Cloudy", rainProb: 15 },
      { time: "15:00", temp: 31, icon: "Sun", condition: "Sunny", rainProb: 5 },
      { time: "16:00", temp: 30, icon: "Sun", condition: "Sunny", rainProb: 5 },
      { time: "17:00", temp: 29, icon: "Sun", condition: "Sunny", rainProb: 5 },
      { time: "18:00", temp: 27, icon: "CloudSun", condition: "Partly Cloudy", rainProb: 10 },
      { time: "19:00", temp: 25, icon: "Cloud", condition: "Cloudy", rainProb: 20 },
      { time: "20:00", temp: 23, icon: "Moon", condition: "Clear Night", rainProb: 10 }
    ],
    daily: [
      { day: "Today", temp: 28, icon: "CloudSun", condition: "Partly Cloudy", high: 31, low: 19 },
      { day: "Mon", temp: 30, icon: "Sun", condition: "Sunny", high: 32, low: 20 },
      { day: "Tue", temp: 25, icon: "CloudRain", condition: "Scattered Rain", high: 28, low: 18 },
      { day: "Wed", temp: 24, icon: "CloudRain", condition: "Rainy", high: 26, low: 17 },
      { day: "Thu", temp: 27, icon: "CloudSun", condition: "Partly Cloudy", high: 29, low: 18 },
      { day: "Fri", temp: 29, icon: "Sun", condition: "Sunny", high: 31, low: 19 },
      { day: "Sat", temp: 28, icon: "CloudSun", condition: "Partly Cloudy", high: 30, low: 20 },
      { day: "Sun", temp: 26, icon: "CloudSun", condition: "Partly Cloudy", high: 28, low: 18 }
    ],
    minutely: [
      { time: "Now", rainChance: 12 },
      { time: "10m", rainChance: 12 },
      { time: "20m", rainChance: 15 },
      { time: "30m", rainChance: 18 },
      { time: "40m", rainChance: 10 },
      { time: "50m", rainChance: 5 },
      { time: "60m", rainChance: 5 }
    ]
  },
  {
    id: "london",
    name: "London",
    country: "UK",
    timezone: "BST",
    lat: 51.5074,
    lon: -0.1278,
    current: {
      temp: 16,
      condition: "Rainy & Chilly",
      conditionIcon: "CloudRain",
      high: 18,
      low: 11,
      wetBulb: 14,
      wetBulbRisk: "Low Risk",
      rainProbability: 85,
      aqi: 28,
      aqiLabel: "Good",
      precipitation24h: 1.8,
      windSpeed: 18,
      windDir: "WSW",
      sunrise: "04:48",
      sunset: "21:08",
      uvIndex: 2,
      uvLabel: "Low",
      visibility: 6,
      humidity: 88,
      pressure: 29.65
    },
    hourly: [
      { time: "Now", temp: 16, icon: "CloudRain", condition: "Moderate Rain", rainProb: 85 },
      { time: "14:00", temp: 16, icon: "CloudRain", condition: "Heavy Rain", rainProb: 90 },
      { time: "15:00", temp: 17, icon: "CloudRain", condition: "Drizzle", rainProb: 70 },
      { time: "16:00", temp: 17, icon: "Cloud", condition: "Overcast", rainProb: 40 },
      { time: "17:00", temp: 18, icon: "CloudSun", condition: "Brief Sun", rainProb: 30 },
      { time: "18:00", temp: 16, icon: "CloudRain", condition: "Light Shower", rainProb: 60 },
      { time: "19:00", temp: 15, icon: "CloudRain", condition: "Showers", rainProb: 50 },
      { time: "20:00", temp: 14, icon: "Cloud", condition: "Cloudy", rainProb: 30 }
    ],
    daily: [
      { day: "Today", temp: 16, icon: "CloudRain", condition: "Rainy", high: 18, low: 11 },
      { day: "Mon", temp: 18, icon: "CloudSun", condition: "Partly Cloudy", high: 20, low: 12 },
      { day: "Tue", temp: 19, icon: "Sun", condition: "Pleasant & Sunny", high: 21, low: 13 },
      { day: "Wed", temp: 15, icon: "CloudRain", condition: "Rainy Showers", high: 17, low: 10 },
      { day: "Thu", temp: 14, icon: "CloudRain", condition: "Heavy Rain", high: 15, low: 9 },
      { day: "Fri", temp: 16, icon: "Cloud", condition: "Cloudy", high: 18, low: 11 },
      { day: "Sat", temp: 17, icon: "CloudSun", condition: "Partly Cloudy", high: 19, low: 12 },
      { day: "Sun", temp: 18, icon: "Sun", condition: "Clear Skies", high: 20, low: 13 }
    ],
    minutely: [
      { time: "Now", rainChance: 85 },
      { time: "10m", rainChance: 90 },
      { time: "20m", rainChance: 92 },
      { time: "30m", rainChance: 80 },
      { time: "40m", rainChance: 75 },
      { time: "50m", rainChance: 70 },
      { time: "60m", rainChance: 65 }
    ]
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    timezone: "EET",
    lat: 30.0444,
    lon: 31.2357,
    current: {
      temp: 39,
      condition: "Hot & Sunny",
      conditionIcon: "Sun",
      high: 42,
      low: 26,
      wetBulb: 28,
      wetBulbRisk: "High Risk",
      rainProbability: 0,
      aqi: 112,
      aqiLabel: "Unhealthy",
      precipitation24h: 0.0,
      windSpeed: 9,
      windDir: "NNE",
      sunrise: "04:53",
      sunset: "18:59",
      uvIndex: 11,
      uvLabel: "Extreme",
      visibility: 8,
      humidity: 24,
      pressure: 29.85
    },
    hourly: [
      { time: "Now", temp: 39, icon: "Sun", condition: "Extreme Heat", rainProb: 0 },
      { time: "14:00", temp: 41, icon: "Sun", condition: "Extreme Heat", rainProb: 0 },
      { time: "15:00", temp: 42, icon: "Sun", condition: "Peak Heat", rainProb: 0 },
      { time: "16:00", temp: 40, icon: "Sun", condition: "Extreme Heat", rainProb: 0 },
      { time: "17:00", temp: 38, icon: "Sun", condition: "Scorching Sun", rainProb: 0 },
      { time: "18:00", temp: 36, icon: "Sun", condition: "Very Warm", rainProb: 0 },
      { time: "19:00", temp: 33, icon: "SunDim", condition: "Warm Sunset", rainProb: 0 },
      { time: "20:00", temp: 31, icon: "Moon", condition: "Warm Night", rainProb: 0 }
    ],
    daily: [
      { day: "Today", temp: 39, icon: "Sun", condition: "Scorching", high: 42, low: 26 },
      { day: "Mon", temp: 40, icon: "Sun", condition: "Extreme Heat", high: 43, low: 27 },
      { day: "Tue", temp: 38, icon: "Sun", condition: "Sunny", high: 41, low: 25 },
      { day: "Wed", temp: 36, icon: "Wind", condition: "Sandy Wind", high: 39, low: 24 },
      { day: "Thu", temp: 37, icon: "Sun", condition: "Pleasant desert sunny", high: 40, low: 25 },
      { day: "Fri", temp: 39, icon: "Sun", condition: "Hot & Dry", high: 42, low: 26 },
      { day: "Sat", temp: 41, icon: "Sun", condition: "Scorching Heat", high: 43, low: 27 },
      { day: "Sun", temp: 39, icon: "Sun", condition: "Sunny", high: 42, low: 26 }
    ],
    minutely: [
      { time: "Now", rainChance: 0 },
      { time: "10m", rainChance: 0 },
      { time: "20m", rainChance: 0 },
      { time: "30m", rainChance: 0 },
      { time: "40m", rainChance: 0 },
      { time: "50m", rainChance: 0 },
      { time: "60m", rainChance: 0 }
    ]
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    timezone: "JST",
    lat: 35.6895,
    lon: 139.6917,
    current: {
      temp: 24,
      condition: "Humid & Breeze",
      conditionIcon: "Wind",
      high: 27,
      low: 18,
      wetBulb: 22,
      wetBulbRisk: "Low Risk",
      rainProbability: 35,
      aqi: 55,
      aqiLabel: "Moderate",
      precipitation24h: 0.2,
      windSpeed: 14,
      windDir: "SSE",
      sunrise: "04:26",
      sunset: "18:51",
      uvIndex: 6,
      uvLabel: "High",
      visibility: 9,
      humidity: 79,
      pressure: 29.98
    },
    hourly: [
      { time: "Now", temp: 24, icon: "CloudSun", condition: "Overcast Breeze", rainProb: 35 },
      { time: "14:00", temp: 25, icon: "CloudSun", condition: "Humid Warmth", rainProb: 40 },
      { time: "15:00", temp: 26, icon: "CloudSun", condition: "Scattered sun", rainProb: 30 },
      { time: "16:00", temp: 26, icon: "Sun", condition: "Warm and humid", rainProb: 20 },
      { time: "17:00", temp: 25, icon: "SunDim", condition: "Mild sun", rainProb: 15 },
      { time: "18:00", temp: 23, icon: "Cloud", condition: "Breezy cloud cover", rainProb: 25 },
      { time: "19:00", temp: 21, icon: "CloudRain", condition: "Light drizzle", rainProb: 50 },
      { time: "20:00", temp: 19, icon: "CloudRain", condition: "Drizzle", rainProb: 60 }
    ],
    daily: [
      { day: "Today", temp: 24, icon: "Wind", condition: "Humid", high: 27, low: 18 },
      { day: "Mon", temp: 23, icon: "CloudRain", condition: "Light Rainfall", high: 25, low: 17 },
      { day: "Tue", temp: 21, icon: "CloudRain", condition: "Rainy Afternoon", high: 23, low: 16 },
      { day: "Wed", temp: 24, icon: "CloudSun", condition: "Subtle Sun", high: 26, low: 17 },
      { day: "Thu", temp: 26, icon: "Sun", condition: "Sunny & Mild", high: 29, low: 19 },
      { day: "Fri", temp: 27, icon: "Sun", condition: "Sunny & Humid", high: 30, low: 20 },
      { day: "Sat", temp: 25, icon: "Cloud", condition: "Cloudy", high: 27, low: 19 },
      { day: "Sun", temp: 23, icon: "CloudRain", condition: "Showers", high: 24, low: 18 }
    ],
    minutely: [
      { time: "Now", rainChance: 35 },
      { time: "10m", rainChance: 38 },
      { time: "20m", rainChance: 40 },
      { time: "30m", rainChance: 45 },
      { time: "40m", rainChance: 30 },
      { time: "50m", rainChance: 25 },
      { time: "60m", rainChance: 20 }
    ]
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    timezone: "AEST",
    lat: -33.8688,
    lon: 151.2093,
    current: {
      temp: 21,
      condition: "Clear Coastal Gale",
      conditionIcon: "Sun",
      high: 23,
      low: 15,
      wetBulb: 17,
      wetBulbRisk: "Low Risk",
      rainProbability: 5,
      aqi: 18,
      aqiLabel: "Good",
      precipitation24h: 0.0,
      windSpeed: 24,
      windDir: "S",
      sunrise: "06:45",
      sunset: "17:02",
      uvIndex: 3,
      uvLabel: "Moderate",
      visibility: 12,
      humidity: 50,
      pressure: 30.15
    },
    hourly: [
      { time: "Now", temp: 21, icon: "Sun", condition: "Crisp & Coastal", rainProb: 5 },
      { time: "14:00", temp: 22, icon: "Sun", condition: "Crisp & Coastal", rainProb: 5 },
      { time: "15:00", temp: 22, icon: "Sun", condition: "Breezy Skies", rainProb: 5 },
      { time: "16:00", temp: 20, icon: "SunDim", condition: "Gale sunset ahead", rainProb: 5 },
      { time: "17:00", temp: 18, icon: "SunDim", condition: "Chilly breeze", rainProb: 10 },
      { time: "18:00", temp: 17, icon: "Moon", condition: "Clear Gale", rainProb: 10 },
      { time: "19:00", temp: 16, icon: "Moon", condition: "Clear Chilly", rainProb: 5 },
      { time: "20:00", temp: 15, icon: "Moon", condition: "Chilly Night", rainProb: 5 }
    ],
    daily: [
      { day: "Today", temp: 21, icon: "Sun", condition: "Coastal Breeze", high: 23, low: 15 },
      { day: "Mon", temp: 20, icon: "CloudSun", condition: "Partly Cloudy", high: 22, low: 14 },
      { day: "Tue", temp: 19, icon: "Cloud", condition: "Overcast Winds", high: 21, low: 13 },
      { day: "Wed", temp: 18, icon: "CloudRain", condition: "Brief showers", high: 19, low: 12 },
      { day: "Thu", temp: 20, icon: "Sun", condition: "Sunny Crisp", high: 22, low: 14 },
      { day: "Fri", temp: 22, icon: "Sun", condition: "Sunny Warmth", high: 24, low: 15 },
      { day: "Sat", temp: 23, icon: "Sun", condition: "Sunny & Gentle", high: 25, low: 16 },
      { day: "Sun", temp: 21, icon: "CloudSun", condition: "Partly Cloudy", high: 23, low: 15 }
    ],
    minutely: [
      { time: "Now", rainChance: 5 },
      { time: "10m", rainChance: 5 },
      { time: "20m", rainChance: 5 },
      { time: "30m", rainChance: 10 },
      { time: "40m", rainChance: 10 },
      { time: "50m", rainChance: 5 },
      { time: "60m", rainChance: 5 }
    ]
  }
];

export function getBackgroundGradient(metrics: WeatherMetrics): string {
  const t = metrics.temp;
  const cond = metrics.condition.toLowerCase();
  
  if (t >= 35) {
    // Scorching
    return "linear-gradient(135deg, #df5b20 0%, #e88d22 50%, #461f00 100%)";
  }
  if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle")) {
    // Rainy
    return "linear-gradient(135deg, #3d5264 0%, #5d758a 45%, #18232c 100%)";
  }
  if (cond.includes("gale") || cond.includes("wind") || cond.includes("storm")) {
    // Stormy / Wind
    return "linear-gradient(135deg, #1f2b5a 0%, #3e5388 50%, #0d1228 100%)";
  }
  if (cond.includes("cloud")) {
    // Cloudy / Partly cloudy
    return "linear-gradient(135deg, #4d8efe 0%, #76acfe 40%, #1f4277 100%)";
  }
  // Standard Sunny/Clear
  return "linear-gradient(135deg, #adc6ff 0%, #adc6ff 10%, #7cb2ec 50%, #143560 100%)";
}

export function calculateWetBulbRisk(t: number, h: number): { value: number; label: "Low Risk" | "Moderate Risk" | "High Risk" | "Extreme Danger" } {
  // Simple realistic calculation of wet bulb temperature based on air temperature (T) and absolute/relative humidity (H)
  // Stull Formula approximation
  const T = t;
  const RH = h;
  const Tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) + Math.atan(T + RH) - Math.atan(RH - 1.676331) + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
  const cleanTw = Math.round(Tw * 10) / 10;
  
  let risk: "Low Risk" | "Moderate Risk" | "High Risk" | "Extreme Danger" = "Low Risk";
  if (cleanTw >= 30) {
    risk = "Extreme Danger";
  } else if (cleanTw >= 25) {
    risk = "High Risk";
  } else if (cleanTw >= 20) {
    risk = "Moderate Risk";
  }
  
  return { value: Math.round(cleanTw), label: risk };
}

function mapWeatherCodeToCondition(code: number, isDay: boolean = true) {
  if (code === 0) return { condition: isDay ? "Clear Sky" : "Clear Night", icon: isDay ? "Sun" : "Moon" };
  if (code === 1) return { condition: isDay ? "Mostly Clear" : "Mostly Clear", icon: isDay ? "SunCloud" : "CloudMoon" };
  if (code === 2) return { condition: "Partly Cloudy", icon: "CloudSun" };
  if (code === 3) return { condition: "Overcast", icon: "Cloud" };
  if (code === 45 || code === 48) return { condition: "Fog", icon: "CloudFog" };
  if (code >= 51 && code <= 55) return { condition: "Drizzle", icon: "CloudDrizzle" };
  if (code >= 61 && code <= 65) return { condition: "Rain", icon: "CloudRain" };
  if (code >= 71 && code <= 75) return { condition: "Snow", icon: "Snowflake" };
  if (code >= 80 && code <= 82) return { condition: "Rain Showers", icon: "CloudRain" };
  if (code >= 95) return { condition: "Thunderstorm", icon: "CloudLightning" };
  return { condition: "Unknown", icon: "Cloud" };
}

function getWindDirString(deg: number) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16] || "N";
}

function getUvLabel(uv: number): any {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

function getAqiLabelByValue(aqi: number): "Good" | "Moderate" | "Poor" | "Unhealthy" | "Hazardous" {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Poor";
  if (aqi <= 200) return "Unhealthy";
  return "Hazardous";
}

export async function fetchLiveWeather(city: CityData): Promise<CityData> {
  if (city.lat === undefined || city.lon === undefined) {
    return city;
  }
  
  try {
    const url = `/api/weather-proxy?lat=${city.lat}&lon=${city.lon}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch weather data");
    
    const data = await response.json();
    
    const curr = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    
    const weatherMapping = mapWeatherCodeToCondition(curr.weather_code, curr.is_day === 1);
        
    const updatedCurrent = {
      temp: Math.round(curr.temperature_2m),
      condition: weatherMapping.condition,
      conditionIcon: weatherMapping.icon,
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      wetBulb: city.current.wetBulb, // Updated below
      wetBulbRisk: city.current.wetBulbRisk, // Updated below
      rainProbability: hourly.precipitation_probability[0] || 0,
      aqi: city.current.aqi, // Using static AQI as fallback
      aqiLabel: city.current.aqiLabel,
      precipitation24h: (daily.precipitation_sum[0] || 0) / 25.4, // store in inches
      windSpeed: Math.round(curr.wind_speed_10m * 0.621371), // store in mph
      windDir: getWindDirString(curr.wind_direction_10m),
      sunrise: new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      uvIndex: Math.round(daily.uv_index_max[0] || 0),
      uvLabel: getUvLabel(daily.uv_index_max[0] || 0),
      visibility: Math.round((hourly.visibility[0] || 16000) / 1000 * 0.621371), // store in miles
      humidity: Math.round(curr.relative_humidity_2m),
      pressure: parseFloat((curr.surface_pressure / 33.8639).toFixed(2)), // store in inHg 
    };
    
    if (curr.us_aqi !== undefined) {
      updatedCurrent.aqi = Math.round(curr.us_aqi);
      updatedCurrent.aqiLabel = getAqiLabelByValue(updatedCurrent.aqi);
    }

    // The metric 'visibility' in our static is in miles. Open-Meteo gives meters.
    // Dashboard km displays Math.round(visibility * 1.6).
    const visMeters = hourly.visibility && hourly.visibility[0] ? hourly.visibility[0] : 16000;
    updatedCurrent.visibility = Math.round(visMeters / 1609.34); // Convert meters to miles
    
    const wb = calculateWetBulbRisk(updatedCurrent.temp, updatedCurrent.humidity);
    updatedCurrent.wetBulb = wb.value;
    updatedCurrent.wetBulbRisk = wb.label;
    
    // Map hourly forecast
    const updatedHourly: HourForecast[] = [];
    const nowInfo = curr.time ? new Date(curr.time) : new Date(); // Open-Meteo current.time gives current local time of the location
    // Find closest index in hourly array
    let startIdx = 0;
    if (hourly.time && hourly.time.length > 0) {
      if (curr.time) {
          startIdx = hourly.time.findIndex((t: string) => new Date(t).getTime() >= nowInfo.getTime());
          if (startIdx === -1) startIdx = 0;
      } else {
          const now = new Date();
          const nowHour = now.getHours();
          startIdx = hourly.time.findIndex((t: string) => {
              return new Date(t).getTime() >= now.getTime() - 3600000;
          });
          if (startIdx === -1 || startIdx < 0) startIdx = 0;
      }
    }

    // Map 24 items from startIdx
    for (let i = 0; i < 24; i++) {
        const idx = startIdx + i;
        if (!hourly.time || !hourly.time[idx]) break;
        const d = new Date(hourly.time[idx]);
        let timeLabel = `${d.getHours().toString().padStart(2, '0')}:00`;
        if (i === 0) timeLabel = "Now";

        const wm = mapWeatherCodeToCondition(hourly.weather_code[idx], true);
        updatedHourly.push({
            time: timeLabel,
            temp: Math.round(hourly.temperature_2m[idx]),
            icon: wm.icon,
            condition: wm.condition,
            rainProb: hourly.precipitation_probability[idx] || 0
        });
    }

    // Map daily forecast
    const updatedDaily: DayForecast[] = [];
    for (let i = 0; i < 7; i++) {
        if (!daily.time || !daily.time[i]) break;
        const d = new Date(daily.time[i]);
        const dayLabel = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
        const wm = mapWeatherCodeToCondition(daily.weather_code[i], true);
        updatedDaily.push({
            day: dayLabel,
            temp: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
            high: Math.round(daily.temperature_2m_max[i]),
            low: Math.round(daily.temperature_2m_min[i]),
            icon: wm.icon,
            condition: wm.condition
        });
    }

    const minutely = data.minutely_15;
    const updatedMinutely = [];
    if (minutely && minutely.time && minutely.precipitation_probability) {
      let mIdx = minutely.time.findIndex((t: string) => new Date(t).getTime() >= nowInfo.getTime());
      if (mIdx === -1) mIdx = 0;
      for (let i = 0; i < 7; i++) {
        const idx = mIdx + i;
        if (!minutely.time[idx]) break;
        let timeLabel = i === 0 ? "Now" : `${i * 15}m`;
        updatedMinutely.push({
          time: timeLabel,
          rainChance: minutely.precipitation_probability[idx] || 0
        });
      }
    }

    return {
      ...city,
      current: updatedCurrent,
      hourly: updatedHourly.length > 0 ? updatedHourly : city.hourly,
      minutely: updatedMinutely.length > 0 ? updatedMinutely : city.minutely,
      daily: updatedDaily.length > 0 ? updatedDaily : city.daily,
    };
  } catch (err) {
    console.error("Open-Meteo API Error:", err);
    return city;
  }
}
