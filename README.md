# Intelligent Weather & Climate Dashboard

A modern, full-stack Progressive Web Application (PWA) built for advanced weather monitoring, climate simulations, and AI-driven meteorological reporting.

## 🌟 Key Features

* **Real-Time Weather Data:** Integration with meteorological APIs to provide accurate hourly and daily forecasts.
* **Offline Mode (PWA):** Implemented using Service Workers (Workbox) to cache network requests, allowing the application to display last-known data seamlessly even when the internet connection drops.
* **AI Meteorology Assistant:** Powered by the Google Gemini API to generate contextual weather reports, summarize alerts, and provide actionable insights based on current atmospheric conditions.
* **Advanced Location Search:** Integrated with Google Maps Places Autocomplete to easily search for atmospheric stations and geographical locations worldwide.
* **Climate Simulation Adjustments:** Allows users to simulate local temperature and humidity adjustments to visualize hypothetical climate shifts.
* **Responsive Visual Design:** Features a custom design system with dark/light mode compatibility built on Tailwind CSS.

## 🏗️ Technology Stack

* **Frontend:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express (used for secure API proxying and serving static assets)
* **Caching & PWA:** Vite PWA Plugin, Workbox Strategies (Stale-While-Revalidate)
* **AI & Machine Learning:** Google Gen AI SDK (Gemini)

## 📁 Project Structure

* `/src/components`: UI components including the `DashboardTab`, `GeminiAssistant`, and `ReportsTab`.
* `/src/App.tsx`: Main application wrapper handling state, layout, and network connectivity events.
* `/server.ts`: Express backend that routes AI queries to the Gemini API, handles geocoding proxies, and serves the production build.
* `/vite.config.ts`: Submits build instructions and registers Service Worker runtime caching rules.

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory and add your required keys (e.g., `GEMINI_API_KEY`). See `.env.example` for details.

### Running in Development

Run the frontend and backend simultaneously in development mode:
```bash
npm run dev
```

### Building for Production

Compile the project for production, generating the client-side bundle and the server file:
```bash
npm run build
```

Then, you can start the production server:
```bash
npm run start
```
