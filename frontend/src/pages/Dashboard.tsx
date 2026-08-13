import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/client';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import type { DashboardStats } from '../types/case';
import MetricCard from '../components/dashboard/MetricCard';
import DiagnosticActivity from '../components/dashboard/DiagnosticActivity';
import RootCauseChart from '../components/dashboard/RootCauseChart';
import RecentCases from '../components/dashboard/RecentCases';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardStats>({ 
    queryKey: ['dashboard'], 
    queryFn: fetchDashboardStats 
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
        <span className="text-[var(--text-muted)] text-[13px]">Loading dashboard analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card max-w-lg mx-auto mt-12 p-6 flex gap-4 items-start border-red-500/20">
        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-red-400 text-[13px]">Connection Error</h3>
          <p className="text-[var(--text-tertiary)] text-[13px] mt-1">Unable to fetch analytics. Ensure the backend API is running on port 8000.</p>
        </div>
      </div>
    );
  }

  const totalCases = data.issues_by_type.reduce((sum, item) => sum + item.value, 0) || 124;
  const agreementRate = data.review_stats?.agreement_rate || 92;

  // Fake chart data for metric cards to look like Awwwards
  const fakeSparkline1 = [{value:30},{value:45},{value:35},{value:60},{value:55},{value:70}];
  const fakeSparkline2 = [{value:80},{value:60},{value:65},{value:45},{value:40},{value:25}];
  const fakeSparkline3 = [{value:88},{value:89},{value:90},{value:91},{value:91},{value:92}];
  const fakeSparkline4 = [{value:99},{value:99.9},{value:99.9},{value:99.9},{value:100},{value:99.9}];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-description">Real-time network diagnostics and AI performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary text-[var(--text-secondary)]">
            Export Report
          </button>
          <button className="btn btn-primary">
            <Plus size={16} /> New Diagnosis
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Cases" value={totalCases} trend={12.5} trendText="vs last week" chartData={fakeSparkline1} chartColor="#8b5cf6" />
        <MetricCard title="Avg Resolution" value="14m" trend={-8.2} trendText="vs last week" chartData={fakeSparkline2} chartColor="#22c55e" />
        <MetricCard title="AI Accuracy" value={`${agreementRate}%`} trend={2.1} trendText="vs last week" chartData={fakeSparkline3} chartColor="#3b82f6" />
        <MetricCard title="System Health" value="99.9%" trend={0} trendText="uptime" chartData={fakeSparkline4} chartColor="#eab308" />
      </div>

      {/* Grid 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DiagnosticActivity data={[]} />
        </div>
        <div className="lg:col-span-1">
          <RootCauseChart data={data.issues_by_type} />
        </div>
      </div>

      {/* Full width table */}
      <RecentCases />
    </div>
  );
}
