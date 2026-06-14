import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const PORT = 3000;

// Initialize Google GenAI on the server with user agent header as requested
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI features will fallback to offline mock responses.");
}

async function generateContentWithRetry(aiClient: GoogleGenAI, request: any, retries: number = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await aiClient.models.generateContent(request);
    } catch (error: any) {
      lastError = error;
      const isRetryable = error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE") || error?.status === 503;
      if (isRetryable && i < retries - 1) {
        console.warn(`Gemini API busy or rate limited, retrying (${i + 1}/${retries - 1})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ----------------------------------------
// API ENDPOINTS
// ----------------------------------------

app.get("/api/places-autocomplete", async (req, res) => {
  const { input } = req.query;
  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "No input provided." });
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}&count=5&language=en&format=json`;
    const response = await axios.get(geoUrl);
    const data = response.data;
    if (data.results) {
      const predictions = data.results.map((r: any) => ({
        place_id: r.id.toString(),
        description: `${r.name}, ${r.admin1 ? r.admin1 + ', ' : ''}${r.country}`,
        structured_formatting: {
          main_text: r.name,
          secondary_text: `${r.admin1 ? r.admin1 + ', ' : ''}${r.country}`
        },
        raw: r
      }));
      res.json({ predictions });
    } else {
      res.json({ predictions: [] });
    }
  } catch (err: any) {
    console.error("Autocomplete proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/geocode", async (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "No geocode query provided." });
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await axios.get(geoUrl);
    const data = response.data;
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      res.json({
        id: result.id.toString(),
        name: result.name,
        country: result.country,
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone || "Auto"
      });
    } else {
      res.status(404).json({ error: "ZERO_RESULTS", message: "No matching location found" });
    }
  } catch (err: any) {
    console.error("Geocoding proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to chat with the dynamic weather assistant
app.post("/api/weather/ai", async (req, res) => {
  const { prompt, city, currentMetrics, personality = "scientific", history = [] } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  const systemInstructionsMap = {
    scientific: "You are an expert meteorological scientist with deep academic knowledge about atmospheric sciences, humidity ratios, thermodynamics, and the crucial science of Wet-Bulb temperature. Keep responses highly precise, factual, objective, yet fascinating and clear. Avoid jargon where standard words suffice, but respect accuracy.",
    casual: "You are a warm, friendly, down-to-earth local weather guide. You explain things simply, use occasional analogies, and keep the tone cheerful, approachable, and encouraging.",
    poetic: "You are a scenic, narrative weather bard. You view weather as the Earth's majestic mood, using elegant, descriptive, evocative prose to depict the atmosphere, sunlight, frost, and winds. Make standard weather reports read like beautiful entries in a naturalist's journal.",
    survivalist: "You are an extreme weather resilience and safety specialist. You focus on thermal management, warning zones, body heat indices, dehydration risks, and tactical preparations (clothing, shelter, hydration, timing). Your tone is vigilant, highly practical, direct, and action-oriented."
  };

  const selectedInstruction = systemInstructionsMap[personality as keyof typeof systemInstructionsMap] || systemInstructionsMap.scientific;

  const currentContext = `
The user is currently viewing the weather for "${city}".
Current meteorological parameters read:
- Air Temperature: ${currentMetrics?.temp}°C
- Wet Bulb Temperature: ${currentMetrics?.wetBulb}°C (${currentMetrics?.wetBulbRisk})
- Humidity: ${currentMetrics?.humidity}%
- Air Quality Index (AQI): ${currentMetrics?.aqi} (${currentMetrics?.aqiLabel})
- Wind Speed: ${currentMetrics?.windSpeed} mph (${currentMetrics?.windDir})
- Precipitation likelihood: ${currentMetrics?.rainProbability}%
- UV Index: ${currentMetrics?.uvIndex} (${currentMetrics?.uvLabel})
- Pressure: ${currentMetrics?.pressure} inHg
- Sunrise: ${currentMetrics?.sunrise}, Sunset: ${currentMetrics?.sunset}
`;

  if (!ai) {
    // Elegant fallback response if no API Key is available
    const fallbackAnswer = `[Offline Mode - API Key not found] Here is an analysis of ${city}'s current weather state under a **${personality}** perspective:
The air is ${currentMetrics?.temp}°C with ${currentMetrics?.humidity}% humidity. Notably, the **Wet Bulb temperature reaches ${currentMetrics?.wetBulb}°C (${currentMetrics?.wetBulbRisk})**. This indicates the rate of evaporative cooling is safe but warrants attention. For more customized, live-generated AI insights across dynamic models, please check your Gemini API secrets in AI Studio's sidebar configuration!`;
    return res.json({ response: fallbackAnswer });
  }

  try {
    const sdkContents = [];
    if (history.length > 0) {
      for (const msg of history) {
        sdkContents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
      sdkContents.push({ role: "user", parts: [{ text: `${currentContext}\n\nUser request: ${prompt}` }] });
    } else {
      sdkContents.push({ role: "user", parts: [{ text: `${currentContext}\n\nUser request: ${prompt}` }] });
    }

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.0-flash",
      contents: sdkContents,
      config: {
        systemInstruction: `${selectedInstruction} Keep your explanation to 2-3 short, highly informative paragraphs. Frame all explanations to directly help the user in their context.`
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429;
    if (isRateLimit) {
      console.warn("Gemini API rate limited (429) during AI chat. Falling back.");
    } else {
      console.error("Gemini assistant error:", error);
    }
    res.json({
      response: `I encountered an issue analyzing the meteorological grid directly. However, your local sensors read ${currentMetrics?.temp}°C with a Wet Bulb index of ${currentMetrics?.wetBulb}°C. Rest assured, your threshold guards are actively monitoring changes. (Diagnostic: ${error.message || "Failed API transaction"})`
    });
  }
});

// Endpoint to generate daily report synopsis on load or tab shift
app.post("/api/weather/gemini-report", async (req, res) => {
  const { city, currentMetrics, personality = "scientific" } = req.body;

  if (!city || !currentMetrics) {
    return res.status(400).json({ error: "Missing city or meteorological parameters" });
  }

  const prompt = `Develop a comprehensive, bespoke weather synopsis and outdoor advisory report for ${city}.
Metrics:
- Temperature: ${currentMetrics.temp}°C
- Wet Bulb Temp: ${currentMetrics.wetBulb}°C (${currentMetrics.wetBulbRisk})
- Relative Humidity: ${currentMetrics.humidity}%
- Air Quality (AQI): ${currentMetrics.aqi} (${currentMetrics.aqiLabel})
- UV Exposure level: ${currentMetrics.uvIndex} (${currentMetrics.uvLabel})
- Wind activity: ${currentMetrics.windSpeed} mph from ${currentMetrics.windDir}

Structure your report into 3 logical, visually balanced parts using clear bold titles and markdown lists:
1. **Atmo-Report**: A crisp, analytical synopsis of the air state (temperature, air quality, humidity) highlighting the specific role the Wet-Bulb temperature plays in local comfort today.
2. **Thermal Safety Guard**: Highlight health risks (heat exhaustion, hydration speed, freeze factors, UV danger) based on the wet-bulb temperature.
3. **Daily Action Blueprint**: 3 high-value actionable, tactical recommendations concerning clothing, exercise timing, and hydration speed for the next 12 hours.

Personality format style to write in: ${personality}. Make it elegant, factual, engaging, and extremely readable. Avoid fluff.`;

  if (!ai) {
    const defaultSnippet = `### **Atmo-Report**
The atmospheric layers above **${city}** present a temperature of **${currentMetrics.temp}°C** with a relative humidity level of **${currentMetrics.humidity}%**. The critical **Wet Bulb index is currently ${currentMetrics.wetBulb}°C**, which means evaporative cooling remains highly efficient, placing local residents in the **${currentMetrics.wetBulbRisk}** safety zone.

### **Thermal Safety Guard**
- **Heat Exhaustion risk**: Exceptionally minimal. The high rate of sweat evaporation allows for effortless temperature regulation.
- **Hydration rate**: standard intake (~250ml per hour of moderate exertion is sufficient).
- **UV Danger level**: ${currentMetrics.uvLabel}. Basic protective wear recommended if spending more than 30 minutes in direct midday sunlight.

### **Daily Action Blueprint**
- **Optimal Exercise Slot**: Mid-afternoon. Wind speeds are ${currentMetrics.windSpeed} mph, providing excellent breeze circulation.
- **Thermal Apparel**: Light breathable cotton or thin active blends to optimize moisture wicking.
- **Micro-Environment advice**: Keep shades partially drawn during peak sun hours to preserve cooler indoor ambient air without excessive cooling.`;
    return res.json({ report: defaultSnippet });
  }

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional meteorological synopsis broadcaster. Provide detailed, well-structured summaries of current weather metrics."
      }
    });

    res.json({ report: response.text });
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429;
    if (isRateLimit) {
      console.warn(`Gemini API rate limited (429). Falling back to sensory grid for ${city}.`);
    } else {
      console.error("Gemini report generation error:", error);
    }
    res.json({
      report: `### **Alert: Sensor Synergy Offline**
We couldn't generate a custom AI synopsis for **${city}**. However, here is the immediate sensory grid:
- **Current Temperature**: ${currentMetrics.temp}°C
- **Humidity Quotient**: ${currentMetrics.humidity}%
- **Acoustic / Wind Force**: ${currentMetrics.windSpeed} mph
- **Wet Bulb Index**: ${currentMetrics.wetBulb}°C (${currentMetrics.wetBulbRisk})

Please review your saved alerts to ensure safety parameters are matched.`
    });
  }
});

// Proxy for Open-Meteo
app.get("/api/weather-proxy", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat/lon" });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,weather_code,precipitation_probability,visibility,uv_index&minutely_15=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`;
    const response = await axios.get(url);
    const data = response.data;
    
    // Fetch AQI
    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
      const aqiRes = await axios.get(aqiUrl);
      if (aqiRes.status === 200) {
        const aqiData = aqiRes.data;
        data.current.us_aqi = aqiData.current.us_aqi;
      }
    } catch(e) {
      console.warn("Failed to fetch live AQI:", e);
    }
    
    res.json(data);
  } catch (err: any) {
    console.error("Open-meteo proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------
// WEB SERVER STATIC / DEV INTEGRATION
// ----------------------------------------

async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Import Vite's dev server dynamically to keep production self-contained in CJS/built server
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server paths mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running at URL: http://localhost:${PORT}`);
  });
}

setupServer();
