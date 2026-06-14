import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import { DayForecast } from '../types';

interface TemperatureTrendChartProps {
  data: DayForecast[];
  isLight: boolean;
  tempAdjustment: number;
}

export const TemperatureTrendChart: React.FC<TemperatureTrendChartProps> = ({ data, isLight, tempAdjustment }) => {
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 30 };

  const activeData: DayForecast[] = useMemo(() => {
    return data.map(d => ({
      ...d,
      high: Math.round(d.high + tempAdjustment),
      low: Math.round(d.low + tempAdjustment)
    }));
  }, [data, tempAdjustment]);

  const { pathHigh, pathLow, xScale, yScaleHigh, yScaleLow } = useMemo(() => {
    const x = d3.scalePoint()
      .domain(activeData.map(d => d.day))
      .range([padding.left, width - padding.right]);

    const yMin = (d3.min(activeData, (d: DayForecast) => d.low) as number) ?? 0;
    const yMax = (d3.max(activeData, (d: DayForecast) => d.high) as number) ?? 100;

    const y = d3.scaleLinear()
      .domain([yMin - 5, yMax + 5])
      .range([height - padding.bottom, padding.top]);

    const lineHigh = d3.line<DayForecast>()
      .x(d => x(d.day) || 0)
      .y(d => y(d.high))
      .curve(d3.curveMonotoneX);

    const lineLow = d3.line<DayForecast>()
      .x(d => x(d.day) || 0)
      .y(d => y(d.low))
      .curve(d3.curveMonotoneX);

    return { 
      pathHigh: lineHigh(activeData as any) || "", 
      pathLow: lineLow(activeData as any) || "",
      xScale: x,
      yScaleHigh: y,
      yScaleLow: y
    };
  }, [activeData]);

  const textColor = isLight ? "fill-slate-500" : "fill-white/50";
  const gridColor = isLight ? "stroke-slate-200" : "stroke-white/10";

  return (
    <div className="w-full overflow-x-auto scrollbar-none mt-8 mb-4">
      <h3 className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white/95"} uppercase tracking-widest mb-3.5`}>
        10-Day Temperature Trends
      </h3>
      <div className={`p-4 rounded-3xl border backdrop-blur-md min-w-[600px] ${isLight ? "bg-white/40 border-emerald-200/50" : "bg-white/5 border-white/5"}`}>
        <svg w="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines (horizontal) */}
          {yScaleHigh.ticks(4).map(tick => (
            <line
              key={tick}
              x1={padding.left}
              x2={width - padding.right}
              y1={yScaleHigh(tick)}
              y2={yScaleHigh(tick)}
              className={gridColor}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* X Axis labels */}
          {activeData.map(d => {
            const x = xScale(d.day) || 0;
            return (
              <text
                key={d.day}
                x={x}
                y={height - 5}
                className={`text-[10px] font-mono ${textColor}`}
                textAnchor="middle"
              >
                {d.day}
              </text>
            );
          })}

          {/* High temp line */}
          <motion.path
            d={pathHigh}
            fill="none"
            stroke={isLight ? "#fb923c" : "#f97316"}
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Low temp line */}
          <motion.path
            d={pathLow}
            fill="none"
            stroke={isLight ? "#38bdf8" : "#0ea5e9"}
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          />

          {/* Data points for high */}
          {activeData.map((d, i) => (
            <motion.circle
              key={`high-${i}`}
              cx={xScale(d.day) || 0}
              cy={yScaleHigh(d.high)}
              r={4}
              fill={isLight ? "#fb923c" : "#f97316"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 + (i * 0.05), type: "spring" }}
            />
          ))}

          {/* Data points for low */}
          {activeData.map((d, i) => (
            <motion.circle
              key={`low-${i}`}
              cx={xScale(d.day) || 0}
              cy={yScaleLow(d.low)}
              r={4}
              fill={isLight ? "#38bdf8" : "#0ea5e9"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.7 + (i * 0.05), type: "spring" }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
