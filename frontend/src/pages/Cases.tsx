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
        <span className="text-[var(--text-muted)] text-sm">Loading case catalog...</span>
      </div>
    );
  }

  if (error || !cases) {
    return (
      <div className="card max-w-lg mx-auto mt-12 p-6 flex gap-4 items-start border-red-500/20">
        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-red-400 text-sm">Connection Error</h3>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">Cannot reach the backend API.</p>
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
    <div className="space-y-5 animate-in select-text">
      <div className="page-header">
        <h1>Case Browser</h1>
        <p>Browse all network incident cases. Ground-truth fields are hidden during diagnosis.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-[9px] text-[var(--text-muted)]" size={15} />
        <input 
          type="text" placeholder="Search cases..." 
          className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="flex gap-4">
        {/* Case List */}
        <div className="card flex-1 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Severity</th>
                <th className="text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelectedCase(c)} className="cursor-pointer">
                  <td className="font-semibold text-[var(--text-primary)]">{c.case_id}</td>
                  <td><span className="badge badge-gray">{c.category}</span></td>
                  <td className="text-[var(--text-tertiary)] capitalize">{c.difficulty}</td>
                  <td>
                    <span className={`badge ${c.severity === 'High' ? 'badge-red' : c.severity === 'Medium' ? 'badge-amber' : 'badge-blue'}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-ghost text-[12px] py-1 px-2">
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <Inbox className="mx-auto mb-2" size={24} />
              <p className="text-sm">No cases found</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCase && (
          <div className="card w-[400px] shrink-0 flex flex-col max-h-[70vh] animate-in">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{selectedCase.case_id}</h3>
              <button onClick={() => setSelectedCase(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
            <div className="card-body flex-1 overflow-y-auto space-y-4 text-sm">
              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Symptoms</label>
                <p className="mt-1 text-[var(--text-secondary)] leading-relaxed">{selectedCase.symptom}</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Topology</label>
                <p className="mt-1 text-[var(--text-secondary)] leading-relaxed">{selectedCase.topology_note}</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">CLI Outputs</label>
                <div className="terminal mt-1">
                  <div className="terminal-body text-[11px] max-h-[200px] overflow-y-auto">{selectedCase.show_outputs}</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-[13px] text-amber-300/80">
                ⚠ Ground-truth fields are concealed in this view to prevent bias during diagnosis.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
