
import { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toPng } from 'html-to-image';

interface ChartData {
  market_breakdown: Array<{ name: string; value: number; color: string }>;
  revenue_projections: Array<{ year: string; revenue: number; costs: number }>;
  financial_table: Array<{ metric: string; value: string }>;
}

interface ChartRendererProps {
  chartData: ChartData;
  onChartsReady: (images: { pieChart: string; barChart: string }) => void;
}

/**
 * Renders charts off-screen with explicit dimensions (440x320) and captures them as base64 images.
 * Does not use ResponsiveContainer to ensure consistent sizing for PDF embedding.
 */
export default function ChartRenderer({ chartData, onChartsReady }: ChartRendererProps) {
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    if (captured) return;

    const captureCharts = async () => {
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 1500));

      let pieImage = '';
      let barImage = '';

      try {
        if (pieRef.current) {
          pieImage = await toPng(pieRef.current, {
            backgroundColor: '#ffffff',
            width: 440,
            height: 320,
            pixelRatio: 2,
            skipFonts: true,
          });
        }
      } catch (e) {
        console.warn('Failed to capture pie chart:', e);
      }

      try {
        if (barRef.current) {
          barImage = await toPng(barRef.current, {
            backgroundColor: '#ffffff',
            width: 440,
            height: 320,
            pixelRatio: 2,
            skipFonts: true,
          });
        }
      } catch (e) {
        console.warn('Failed to capture bar chart:', e);
      }

      setCaptured(true);
      onChartsReady({ pieChart: pieImage, barChart: barImage });
    };

    captureCharts();
  }, [chartData, captured, onChartsReady]);

  const EMERALD_COLORS = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'];

  return (
    <div style={{ position: 'fixed', left: '-9999px', top: '0px', zIndex: -1 }}>
      {/* Pie Chart */}
      <div ref={pieRef} style={{ width: 440, height: 320, padding: 20, background: '#fff' }}>
        <PieChart width={400} height={280}>
          <Pie
            data={chartData.market_breakdown}
            cx={200}
            cy={130}
            innerRadius={50}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            isAnimationActive={false}
            label={({ name, value }) => `${name}: $${value}B`}
            labelLine={true}
          >
            {chartData.market_breakdown.map((entry, index) => (
              <Cell key={index} fill={entry.color || EMERALD_COLORS[index % EMERALD_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* Bar Chart */}
      <div ref={barRef} style={{ width: 440, height: 320, padding: 20, background: '#fff' }}>
        <BarChart width={400} height={280} data={chartData.revenue_projections}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: 'Millions ($)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#059669" name="Revenue" isAnimationActive={false} radius={[4, 4, 0, 0]} />
          <Bar dataKey="costs" fill="#f59e0b" name="Costs" isAnimationActive={false} radius={[4, 4, 0, 0]} />
        </BarChart>
      </div>
    </div>
  );
}
