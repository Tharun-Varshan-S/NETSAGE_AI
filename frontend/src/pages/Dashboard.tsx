import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import type { DashboardStats } from '../types/case';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4'];
const REVIEW_COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardStats>({ 
    queryKey: ['dashboard'], 
    queryFn: fetchDashboardStats 
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
        <span className="text-[var(--text-muted)] text-sm">Loading dashboard analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card max-w-lg mx-auto mt-12 p-6 flex gap-4 items-start border-red-500/20">
        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-red-400 text-sm">Connection Error</h3>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">Unable to fetch analytics. Ensure the backend API is running on port 8000.</p>
        </div>
      </div>
    );
  }

  const totalCases = data.issues_by_type.reduce((sum, item) => sum + item.value, 0);
  const hasReviews = data.review_stats && data.review_stats.total_reviews > 0;

  const reviewDecisionsData = [
    { name: 'Accepted', value: data.review_stats.accepted },
    { name: 'Edited', value: data.review_stats.edited },
    { name: 'Rejected', value: data.review_stats.rejected },
  ].filter(d => d.value > 0);

  const tooltipStyle = { 
    background: '#18181b', 
    borderColor: '#27272a', 
    borderRadius: '8px',
    fontSize: 12, 
    color: '#fafafa' 
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time analytics for AI diagnostics performance and case pipeline.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-value text-[var(--text-primary)]">{totalCases}</div>
          <div className="stat-label">Total Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-[var(--accent)]">{data.review_stats.total_reviews}</div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-[var(--success)]">
            {hasReviews ? `${data.review_stats.agreement_rate}%` : '—'}
          </div>
          <div className="stat-label">AI Agreement</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-[var(--warning)]">{data.review_stats.edited}</div>
          <div className="stat-label">Human Overrides</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Issue Categories */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Incidents by Category</h3>
          </div>
          <div className="card-body h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.issues_by_type} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" cy="50%" 
                  outerRadius={80} innerRadius={55}
                  paddingAngle={3}
                  label={{ fill: '#a1a1aa', fontSize: 11 }}
                >
                  {data.issues_by_type.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Severity Distribution</h3>
          </div>
          <div className="card-body h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.issues_by_severity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} stroke="#1e1e22" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#71717a' }} stroke="#1e1e22" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Review Decisions */}
        {reviewDecisionsData.length > 0 && (
          <div className="card md:col-span-2">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Human Review Decisions</h3>
            </div>
            <div className="card-body h-[260px] max-w-md mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={reviewDecisionsData} 
                    dataKey="value" nameKey="name" 
                    cx="50%" cy="50%" 
                    outerRadius={70} innerRadius={50}
                    paddingAngle={4}
                    label={{ fill: '#a1a1aa', fontSize: 11 }}
                  >
                    {reviewDecisionsData.map((_, i) => (
                      <Cell key={i} fill={REVIEW_COLORS[i]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {!hasReviews && (
        <div className="card p-4 text-center text-sm text-[var(--text-muted)] border-[var(--warning)]/20">
          No reviews recorded yet. Complete a diagnosis workflow to populate review analytics.
        </div>
      )}
    </div>
  );
}
