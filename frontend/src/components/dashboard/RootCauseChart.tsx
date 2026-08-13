import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface RootCauseChartProps {
  data: any[];
}

const PURPLE_PALETTE = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9', '#4c1d95', '#3b0764'];

export default function RootCauseChart({ data }: RootCauseChartProps) {
  // Use dummy data if empty
  const chartData = data && data.length > 0 ? data : [
    { name: 'Routing Protocol Failure', value: 35 },
    { name: 'Hardware Failure', value: 25 },
    { name: 'Configuration Error', value: 20 },
    { name: 'Link Down', value: 10 },
    { name: 'Security Policy Block', value: 5 },
    { name: 'Unknown/Other', value: 5 },
  ];

  return (
    <div className="card h-full">
      <div className="card-header border-none pb-0">
        <h3 className="card-title text-[14px]">Root Cause Distribution</h3>
      </div>
      <div className="card-body h-[260px] flex items-center">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                stroke="none"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PURPLE_PALETTE[i % PURPLE_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 pl-2">
          <ul className="space-y-2">
            {chartData.slice(0, 6).map((item, i) => (
              <li key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PURPLE_PALETTE[i % PURPLE_PALETTE.length] }}></div>
                  <span className="text-[var(--text-secondary)] truncate max-w-[80px]" title={item.name}>{item.name}</span>
                </div>
                <span className="text-[var(--text-primary)] font-medium">{item.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
