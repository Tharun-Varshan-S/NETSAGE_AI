import { ArrowUp, ArrowDown } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number; // Positive for up, negative for down
  trendText?: string;
  chartData?: any[];
  chartColor?: string;
}

export default function MetricCard({ title, value, trend, trendText, chartData, chartColor = '#8b5cf6' }: MetricCardProps) {
  return (
    <div className="card p-4 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">{title}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[26px] font-bold text-[var(--text-primary)] leading-none mb-2">{value}</div>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-[11px] font-medium ${trend >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{Math.abs(trend)}%</span>
              {trendText && <span className="text-[var(--text-tertiary)] ml-1 font-normal">{trendText}</span>}
            </div>
          )}
        </div>

        {chartData && chartData.length > 0 && (
          <div className="w-[80px] h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
