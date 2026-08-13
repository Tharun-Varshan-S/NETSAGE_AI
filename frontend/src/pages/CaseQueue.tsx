import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCases } from '../api/client';
import type { Case } from '../types/case';
import { Search, Loader2, AlertCircle, ArrowRight, CheckCircle2, Clock, Inbox } from 'lucide-react';

interface CaseQueueProps {
  onSelectCase: (id: number, caseIdStr: string) => void;
}

export default function CaseQueue({ onSelectCase }: CaseQueueProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
        <span className="text-[var(--text-muted)] text-sm">Loading case registry...</span>
      </div>
    );
  }
  
  if (error || !cases) {
    return (
      <div className="card max-w-lg mx-auto mt-12 p-6 flex gap-4 items-start border-red-500/20">
        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-red-400 text-sm">Connection Error</h3>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">Cannot reach the backend API. Ensure the FastAPI server is running.</p>
        </div>
      </div>
    );
  }

  const filteredCases = cases.filter(c => {
    const isReviewed = !!c.review;
    if (activeTab === 'pending' && isReviewed) return false;
    if (activeTab === 'reviewed' && !isReviewed) return false;

    const matchesSearch = c.case_id.toLowerCase().includes(search.toLowerCase()) || 
                          c.symptom.toLowerCase().includes(search.toLowerCase()) ||
                          c.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(cases.map(c => c.category)));
  const pendingCount = cases.filter(c => !c.review).length;
  const reviewedCount = cases.filter(c => !!c.review).length;

  const tabs = [
    { id: 'all' as const, label: 'All', count: cases.length },
    { id: 'pending' as const, label: 'Pending', count: pendingCount },
    { id: 'reviewed' as const, label: 'Reviewed', count: reviewedCount },
  ];

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <h1>Incident Queue</h1>
        <p>Select a case to begin AI-assisted diagnosis and troubleshooting.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[11px] ${activeTab === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-[9px] text-[var(--text-muted)]" size={15} />
            <input 
              type="text" 
              placeholder="Search cases..." 
              className="input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select 
            className="input w-auto min-w-[140px]"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Symptom</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(c => (
                <tr key={c.id} onClick={() => onSelectCase(c.id, c.case_id)} className="cursor-pointer">
                  <td className="font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {c.case_id}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="badge badge-gray">{c.category}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`badge ${
                      c.severity === 'High' ? 'badge-red' : 
                      c.severity === 'Medium' ? 'badge-amber' : 'badge-blue'
                    }`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    {c.review ? (
                      <span className="flex items-center gap-1.5 text-[var(--success)] text-[13px]">
                        <CheckCircle2 size={14} /> Reviewed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[var(--text-muted)] text-[13px]">
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs truncate text-[var(--text-tertiary)]">
                    {c.symptom}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <button className="btn btn-primary text-[12px] py-1.5 px-3">
                      Diagnose <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCases.length === 0 && (
          <div className="py-16 text-center text-[var(--text-muted)]">
            <Inbox className="mx-auto mb-3 text-[var(--text-muted)]" size={28} />
            <p className="text-sm font-medium">No cases match your filters</p>
            <p className="text-[13px] mt-1 text-[var(--text-muted)]">Try adjusting search or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
