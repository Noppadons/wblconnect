import React from 'react';

// Simple SVG Bar Chart
export function SimpleBarChart({ data, height = 200, color = "#2563eb" }: { data: number[], height?: number, color?: string }) {
    const max = Math.max(...data, 1);

    return (
        <div className="flex items-end gap-2 h-full w-full" style={{ height }}>
            {data.map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                        className="w-full rounded-t-md opacity-80 hover:opacity-100 transition-all duration-300 relative"
                        style={{
                            height: `${(value / max) * 100}%`,
                            backgroundColor: color
                        }}
                    >
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Simple SVG Line Chart (Smooth Curve)
export function SimpleLineChart({ data, height = 200, color = "#2563eb" }: { data: number[], height?: number, color?: string }) {
    const max = Math.max(...data, 1);
    const min = 0;
    const range = max - min;

    // Generate SVG path
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-full" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Gradient Fill */}
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area under curve */}
                <path
                    d={`M0,100 L${points.replace(/ /g, ' L')} L100,100 Z`}
                    fill={`url(#gradient-${color})`}
                />

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Dots */}
                {data.map((val, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - ((val - min) / range) * 100;
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill={color}
                            className="hover:r-2 transition-all cursor-pointer"
                        >
                            <title>{val}</title>
                        </circle>
                    );
                })}
            </svg>
        </div>
    );
}
