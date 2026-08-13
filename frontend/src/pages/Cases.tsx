import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCases } from '../api/client';
import type { Case } from '../types/case';
import { Loader2, AlertCircle, Search, Inbox, Eye, X } from 'lucide-react';

export default function Cases() {
  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
        <span className="text-[var(--text-muted)] text-[13px]">Loading case catalog...</span>
      </div>
    );
  }

  if (error || !cases) {
    return (
      <div className="card max-w-lg mx-auto mt-12 p-6 flex gap-3 items-start border-[var(--danger)]/20">
        <AlertCircle className="text-[var(--danger)] shrink-0" size={18} />
        <div>
          <h3 className="font-semibold text-[var(--danger)] text-[13px]">Connection Error</h3>
          <p className="text-[var(--text-tertiary)] text-[12px] mt-1">Cannot reach the backend API.</p>
        </div>
      </div>
    );
  }

  const filtered = cases.filter(c =>
    c.case_id.toLowerCase().includes(search.toLowerCase()) ||
    c.symptom.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in select-text">
      <div className="page-header">
        <h1 className="page-title">Case Browser</h1>
        <p className="page-description">Browse all network incident cases. Ground-truth fields are hidden during diagnosis.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
        <input 
          type="text" placeholder="Search cases..." 
          className="input-field pl-9" value={search} onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="flex gap-6">
        {/* Case List */}
        <div className="card flex-1 overflow-hidden">
          <div className="card-body p-0">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Severity</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelectedCase(c)} className="cursor-pointer group">
                    <td className="font-semibold text-[var(--text-primary)]">{c.case_id}</td>
                    <td><span className="badge badge-neutral">{c.category}</span></td>
                    <td className="text-[var(--text-tertiary)] capitalize">{c.difficulty}</td>
                    <td>
                      <span className={`badge ${c.severity === 'High' ? 'badge-danger' : c.severity === 'Medium' ? 'badge-warning' : 'badge-info'}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="btn btn-secondary text-[11px] py-1 px-2.5 h-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={13} className="mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-[var(--text-muted)]">
                <Inbox className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-[13px]">No cases found</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedCase && (
          <div className="card w-[380px] shrink-0 flex flex-col max-h-[75vh] animate-in sticky top-0">
            <div className="card-header flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="card-title text-[14px]">{selectedCase.case_id}</h3>
              <button onClick={() => setSelectedCase(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="card-body flex-1 overflow-y-auto space-y-5 py-4 text-[13px]">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Symptoms</label>
                <p className="text-[var(--text-secondary)] leading-relaxed">{selectedCase.symptom}</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Topology</label>
                <p className="text-[var(--text-secondary)] leading-relaxed">{selectedCase.topology_note}</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">CLI Outputs</label>
                <div className="terminal-block text-[11px] max-h-[220px] overflow-y-auto mt-1">
                  {selectedCase.show_outputs}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[12px] text-[var(--warning)]/90">
                ⚠ Ground-truth fields are concealed in this view to prevent bias during diagnosis.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
