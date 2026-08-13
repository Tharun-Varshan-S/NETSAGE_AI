import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface DiagnosticActivityProps {
  data: any[];
}

export default function DiagnosticActivity({ data }: DiagnosticActivityProps) {
  // Fake timeline data if none provided
  const chartData = data && data.length > 0 ? data : [
    { name: 'May 15', cases: 20, diagnoses: 18, verified: 10 },
    { name: 'May 20', cases: 35, diagnoses: 28, verified: 15 },
    { name: 'May 25', cases: 25, diagnoses: 22, verified: 18 },
    { name: 'May 30', cases: 40, diagnoses: 35, verified: 28 },
    { name: 'Jun 4', cases: 30, diagnoses: 28, verified: 25 },
    { name: 'Jun 9', cases: 55, diagnoses: 50, verified: 40 },
    { name: 'Jun 14', cases: 45, diagnoses: 42, verified: 35 },
  ];

  return (
    <div className="card h-full">
      <div className="card-header border-none pb-0">
        <h3 className="card-title text-[14px]">Diagnostic Activity</h3>
        <select className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] rounded-md px-2 py-1 outline-none focus:border-[var(--accent)]">
          <option>Daily</option>
          <option>Weekly</option>
        </select>
      </div>
      <div className="px-5 pt-3 flex gap-4 text-[11px] text-[var(--text-secondary)] font-medium">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div> Cases</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#a78bfa]"></div> Diagnoses</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--success)]"></div> Verified Fixes</div>
      </div>
      <div className="card-body h-[240px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} stroke="none" dy={10} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} stroke="none" />
            <Tooltip />
            <Area type="monotone" dataKey="cases" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCases)" />
            <Area type="monotone" dataKey="diagnoses" stroke="#a78bfa" strokeWidth={2} fill="none" />
            <Area type="monotone" dataKey="verified" stroke="var(--success)" strokeWidth={2} fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
