"use client";

import { useEffect, useRef, useState } from "react";
import functionPlot, { Chart } from "function-plot";

const LEGEND_COLORS = [
  "#2563eb", // Blue
  "#dc2626", // Red
  "#16a34a", // Green
  "#9333ea", // Purple
  "#ea580c", // Orange
  "#0891b2", // Cyan
  "#db2777", // Pink
];

type FunctionItem = {
  fn?: string;
  fnType?: "linear" | "implicit" | "parametric" | "points" | "vector";
  color?: string;
  graphType?: "polyline" | "scatter" | "interval";
  points?: number[][];
  vector?: [number, number];
  range?: [number, number] | null;
  closed?: boolean;
  nSamples?: number;
  label?: string;
};

type AdvancedPlotConfig = {
  data: FunctionItem[];
  title?: string;
  xAxis?: {
    domain?: [number, number];
    label?: string;
  };
  yAxis?: {
    domain?: [number, number];
    label?: string;
  };
  grid?: boolean;
  disableZoom?: boolean;
};

export default function MathGraph({ code }: { code: string }) {
  const rootEl = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<Chart>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [legendItems, setLegendItems] = useState<FunctionItem[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rootEl.current || dimensions.width === 0 || dimensions.height === 0)
      return;

    const drawGraph = async () => {
      setError(null);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any;
        try {
          parsed = JSON.parse(code);
        } catch {
          console.error("Failed to parse diagram", code);
          throw new Error("Failed to parse diagram");
        }

        let config: AdvancedPlotConfig;

        // Normalization
        if (Array.isArray(parsed.data)) {
          config = parsed as AdvancedPlotConfig;
        } else {
          config = {
            data: [
              {
                fn: parsed.fn || "x",
                color: LEGEND_COLORS[0],
                graphType: "polyline",
                label: parsed.fn,
                range: parsed.range,
              },
            ],
            xAxis: { domain: parsed.domain || [-10, 10] },
            yAxis: { domain: [-10, 10] },
            grid: true,
          };
        }

        if (rootEl.current) {
          rootEl.current.innerHTML = "";
        }

        // -----------------------------------------------------------
        // PREPARE DATA
        // -----------------------------------------------------------
        const processedData: FunctionItem[] = config.data.map((item, index) => {
          const fnType = item.fnType || "linear";
          let graphType = item.graphType;
          if (!graphType) {
            if (fnType === "implicit") graphType = "interval";
            else if (fnType === "points") graphType = "scatter";
            else graphType = "polyline";
          }

          let finalRange: [number, number] | undefined = undefined;
          if (
            fnType !== "implicit" &&
            Array.isArray(item.range) &&
            item.range.length >= 2
          ) {
            const min = Number(item.range[0]);
            const max = Number(item.range[1]);

            if (!isNaN(min) && !isNaN(max)) {
              finalRange = [min, max];
            }
          }

          return {
            ...item,
            fnType,
            graphType,
            color: item.color || LEGEND_COLORS[index % LEGEND_COLORS.length],
            label: item.label || item.fn || `Function ${index + 1}`,
            vector: item.vector ? [item.vector[0], item.vector[1]] : undefined,
            range: finalRange,
          };
        });

        setLegendItems(processedData);

        // -----------------------------------------------------------
        // CONFIG & RENDER
        // -----------------------------------------------------------
        const xDomain = config.xAxis?.domain || [-10, 10];
        let yDomain = config.yAxis?.domain || [-10, 10];

        // Adjust y-domain to match the aspect ratio
        const aspectRatio = dimensions.width / dimensions.height;
        const xRange = xDomain[1] - xDomain[0];
        const yRange = yDomain[1] - yDomain[0];

        if (yRange / xRange !== aspectRatio) {
          // Adjust yDomain to keep the aspect ratio correct
          const newYRange = xRange * (dimensions.height / dimensions.width);
          const centerY = (yDomain[0] + yDomain[1]) / 2;
          const halfYRange = newYRange / 2;
          yDomain = [centerY - halfYRange, centerY + halfYRange];
        }

        if (!rootEl.current) return;

        const instance = functionPlot({
          target: rootEl.current,
          width: dimensions.width,
          height: dimensions.height,
          title: config.title,
          grid: config.grid !== false,
          disableZoom: config.disableZoom,

          tip: {
            xLine: true,
            yLine: true,
            renderer: (x, y) => {
              return `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
            },
          },
          xAxis: {
            domain: xDomain,
            label: config.xAxis?.label || "x",
          },
          yAxis: {
            domain: yDomain,
            label: config.yAxis?.label || "y",
          },
          data: processedData as never,
        });

        chartInstance.current = instance;
      } catch (e) {
        console.error("MathGraph Render Error:", e);
        const msg = e instanceof Error ? e.message : "Invalid graph data.";
        setError(msg);
      }
    };

    const rafId = requestAnimationFrame(drawGraph);
    return () => cancelAnimationFrame(rafId);
  }, [code, dimensions]);

  return (
    <div className="group relative w-full h-full flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <style jsx global>{`
        .function-plot text {
          fill: #374151 !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          font-size: 12px !important;
        }
        .function-plot .domain {
          stroke: #9ca3af !important;
        }
        .function-plot .tick line {
          stroke: #e5e7eb !important;
        }
        .function-plot .origin {
          stroke: #d1d5db !important;
          opacity: 1 !important;
        }
        .function-plot .top-right-legend {
          display: none;
        }
      `}</style>

      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <div ref={rootEl} className="absolute inset-0" />
      </div>

      {legendItems.length > 0 && !error && (
        <div className="flex-none flex flex-wrap items-center gap-4 border-t border-gray-100 bg-gray-50/50 px-4 py-3 z-10">
          {legendItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs font-medium text-gray-900"
            >
              <span
                className="block h-3 w-3 rounded-full shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 border border-red-100 shadow-sm">
            ⚠️ {error}
          </div>
        </div>
      )}
    </div>
  );
}
