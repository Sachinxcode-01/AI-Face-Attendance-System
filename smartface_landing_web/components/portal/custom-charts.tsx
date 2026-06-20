'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── AREA / LINE CHART ─────────────────────────────────────────────
interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  gridLines?: boolean;
}

export function CustomAreaChart({ data, height = 200, color = '#2563EB', gridLines = true }: AreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const width = 600;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y, value: d.value, label: d.label };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {gridLines && (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + ratio * chartHeight;
              const gridVal = Math.round(maxVal - ratio * range);
              return (
                <g key={ratio} className="opacity-20">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize={10}
                    className="font-mono"
                  >
                    {gridVal}%
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* Fill Area */}
        <motion.path
          d={areaPath}
          fill="url(#chartGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Smooth line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Intersections & Tooltips */}
        {points.map((p, i) => (
          <g
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
            {/* Extended hover region */}
            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
            
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 5 : 3.5}
              fill={hoveredIdx === i ? '#ffffff' : color}
              stroke={hoveredIdx === i ? color : '#020617'}
              strokeWidth={2}
              className="transition-all"
            />

            {/* X Labels */}
            {i % 2 === 0 && (
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={9}
                className="font-mono opacity-80"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}

        {/* Active Tooltip Drawer */}
        <AnimatePresence>
          {hoveredIdx !== null && (
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="pointer-events-none"
            >
              {/* Highlight Sweep vertical line */}
              <line
                x1={points[hoveredIdx].x}
                y1={paddingTop}
                x2={points[hoveredIdx].x}
                y2={paddingTop + chartHeight}
                stroke="#ffffff"
                strokeWidth={0.5}
                className="opacity-40"
              />
              
              {/* Tooltip Overlay */}
              <foreignObject
                x={Math.min(points[hoveredIdx].x - 60, width - 140)}
                y={Math.max(points[hoveredIdx].y - 50, 5)}
                width={120}
                height={40}
              >
                <div className="bg-slate-950/90 border border-white/10 rounded-lg p-1.5 text-center shadow-lg backdrop-blur-md">
                  <div className="text-[8px] font-mono text-slate-400 uppercase tracking-widest leading-none">
                    {points[hoveredIdx].label}
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    {points[hoveredIdx].value}%
                  </div>
                </div>
              </foreignObject>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}

// ─── BAR CHART ─────────────────────────────────────────────────────
interface BarChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export function CustomBarChart({ data, height = 200, color = '#3B82F6' }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const width = 600;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barWidth = (chartWidth / data.length) * 0.6;
  const gap = (chartWidth / data.length) * 0.4;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Horizontal scale indicators */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + ratio * chartHeight;
          const val = Math.round((1 - ratio) * maxVal);
          return (
            <g key={ratio} className="opacity-10">
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#ffffff" strokeWidth={0.5} />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="#ffffff" fontSize={10} className="font-mono">
                {val}
              </text>
            </g>
          );
        })}

        {/* Columns */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * chartHeight;
          const x = paddingLeft + i * (barWidth + gap) + gap / 2;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Animated Column Bar */}
              <motion.rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={hoveredIdx === i ? '#ffffff' : color}
                className="transition-colors duration-200"
                initial={{ height: 0, y: paddingTop + chartHeight }}
                animate={{ height: barHeight, y }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                style={{
                  filter: hoveredIdx === i ? 'drop-shadow(0 0 8px rgba(255,255,255,0.25))' : 'none',
                }}
              />

              {/* Labels */}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={9}
                className="font-mono opacity-85"
              >
                {d.label}
              </text>

              {/* Text Hover Tip */}
              {hoveredIdx === i && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={10}
                  className="font-mono font-bold"
                >
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── ATTENDANCE HEATMAP ────────────────────────────────────────────
export function AttendanceHeatmap() {
  // Generate mock semester density matrix (5 courses x 16 weeks)
  const courses = ['CSE-301', 'CSE-302', 'CSE-401', 'CSE-402', 'MAT-203'];
  const weeks = Array.from({ length: 16 }, (_, i) => `W${i + 1}`);

  // Generates randomized attendance status: 0 = absent (red), 1 = present (green), 2 = late (orange)
  const getCellColor = (val: number) => {
    if (val === 1) return 'bg-emerald-500/80 border-emerald-500/30 hover:bg-emerald-400';
    if (val === 2) return 'bg-amber-500/80 border-amber-500/30 hover:bg-amber-400';
    return 'bg-rose-500/80 border-rose-500/30 hover:bg-rose-400';
  };

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="min-w-[650px] p-2">
        <div className="grid grid-cols-17 gap-1.5 text-center">
          {/* Header Row: Weeks */}
          <div className="text-[10px] font-mono text-slate-500 font-bold uppercase py-1">
            Course
          </div>
          {weeks.map((w, idx) => (
            <div key={idx} className="text-[9px] font-mono text-slate-400 font-bold uppercase py-1">
              {w}
            </div>
          ))}

          {/* Rows: Courses & Cells */}
          {courses.map((course, rowIdx) => (
            <React.Fragment key={rowIdx}>
              {/* Course Title cell */}
              <div className="text-[10px] font-mono text-slate-300 font-bold text-left flex items-center pr-2">
                {course}
              </div>
              
              {/* Attendance matrix blocks */}
              {weeks.map((_, colIdx) => {
                // Static seed simulation mapping
                const seed = (rowIdx * 7 + colIdx * 13) % 20;
                const statusValue = seed < 15 ? 1 : seed < 18 ? 2 : 0; // ~75% present, 15% late, 10% absent

                return (
                  <motion.div
                    key={colIdx}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    className={`aspect-square rounded border transition-colors cursor-pointer relative group ${getCellColor(
                      statusValue
                    )}`}
                  >
                    {/* Tooltip Overlay popup */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-30 bg-slate-950 border border-white/10 text-[9px] font-mono text-white rounded p-1 shadow-lg w-20 text-center leading-none">
                      {statusValue === 1 ? 'Present' : statusValue === 2 ? 'Late' : 'Absent'}
                    </div>
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[9px] font-mono text-slate-400 justify-end">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/80" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/80" />
            <span>Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
