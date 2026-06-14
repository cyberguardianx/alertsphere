import React from "react";
import * as Lucide from "lucide-react";

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ name, className = "", size = 24 }) => {
  switch (name) {
    case "Sun":
      return <Lucide.Sun className={`${className} text-amber-300 animate-pulse`} size={size} />;
    case "SunDim":
      return <Lucide.SunDim className={`${className} text-orange-200`} size={size} />;
    case "CloudSun":
      return <Lucide.CloudSun className={`${className} text-sky-200`} size={size} />;
    case "Cloud":
      return <Lucide.Cloud className={`${className} text-slate-300`} size={size} />;
    case "CloudRain":
      return <Lucide.CloudRain className={`${className} text-blue-300`} size={size} />;
    case "Wind":
      return <Lucide.Wind className={`${className} text-teal-200 animate-spin-slow`} size={size} />;
    case "Moon":
      return <Lucide.Moon className={`${className} text-indigo-200`} size={size} />;
    case "CloudSnow":
      return <Lucide.CloudSnow className={`${className} text-blue-100`} size={size} />;
    case "Sunrise":
      return <Lucide.Sunrise className={`${className} text-orange-300`} size={size} />;
    case "Sunset":
      return <Lucide.Sunset className={`${className} text-amber-400`} size={size} />;
    default:
      return <Lucide.Sun className={`${className} text-amber-300`} size={size} />;
  }
};
