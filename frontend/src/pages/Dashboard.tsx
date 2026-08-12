import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboardStats });

  if (isLoading) return <div className="p-8 text-center">Loading stats...</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="text-4xl font-bold text-slate-800 mb-2">{data.review_stats.total_reviews}</div>
          <div className="text-slate-500 font-medium">Total Reviews</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="text-4xl font-bold text-emerald-500 mb-2">{data.review_stats.agreement_rate}%</div>
          <div className="text-slate-500 font-medium">AI Agreement Rate</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center flex justify-around">
           <div>
             <div className="text-2xl font-bold text-emerald-600">{data.review_stats.accepted}</div>
             <div className="text-xs text-slate-500">Accepted</div>
           </div>
           <div>
             <div className="text-2xl font-bold text-amber-500">{data.review_stats.edited}</div>
             <div className="text-xs text-slate-500">Edited</div>
           </div>
           <div>
             <div className="text-2xl font-bold text-red-500">{data.review_stats.rejected}</div>
             <div className="text-xs text-slate-500">Rejected</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="font-semibold text-slate-700 mb-4 text-center">Issues by Category</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.issues_by_type} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {data.issues_by_type.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="font-semibold text-slate-700 mb-4 text-center">Issues by Severity</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.issues_by_severity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
