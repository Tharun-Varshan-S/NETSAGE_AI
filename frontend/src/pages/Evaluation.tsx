import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCases } from '../api/client';
import type { Case } from '../types/case';
import { Loader2, AlertCircle, Search, Inbox, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

export default function Evaluation() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
        <span className="text-[var(--text-muted)] text-[13px]">Running evaluations...</span>
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

  const getGrade = (expected?: string, actual?: string): 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'PENDING' => {
    if (!actual) return 'PENDING';
    if (!expected) return 'CORRECT';
    const exp = expected.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const act = actual.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (exp === act) return 'CORRECT';
    const expW = exp.split(/\s+/).filter(w => w.length > 3);
    const actW = act.split(/\s+/).filter(w => w.length > 3);
    if (!expW.length || !actW.length) return exp === act ? 'CORRECT' : 'INCORRECT';
    const matches = expW.filter(w => actW.includes(w));
    const ratio = matches.length / Math.max(expW.length, actW.length);
    if (ratio >= 0.5 || exp.includes(act) || act.includes(exp)) return 'PARTIAL';
    return ratio > 0 ? 'PARTIAL' : 'INCORRECT';
  };

  const GradeBadge = ({ grade }: { grade: string }) => {
    const config: Record<string, { class: string; icon: React.ReactNode }> = {
      'CORRECT': { class: 'badge-success', icon: <CheckCircle2 size={12} /> },
      'PARTIAL': { class: 'badge-warning', icon: <AlertTriangle size={12} /> },
      'INCORRECT': { class: 'badge-danger', icon: <XCircle size={12} /> },
      'PENDING': { class: 'badge-neutral', icon: <HelpCircle size={12} /> },
    };
    const c = config[grade] || config['PENDING'];
    return <span className={`badge ${c.class}`}>{c.icon} {grade}</span>;
  };

  const getOverall = (g: { fault: string; cmd: string; fix: string; verify: string }) => {
    const all = [g.fault, g.cmd, g.fix, g.verify].filter(x => x !== 'PENDING');
    if (!all.length) return 'PENDING';
    if (all.every(x => x === 'CORRECT')) return 'CORRECT';
    if (all.some(x => x === 'INCORRECT')) return 'INCORRECT';
    return 'PARTIAL';
  };

  const graded = cases.map(c => {
    const grades = {
      fault: getGrade(c.expected_fault, c.ai_root_cause),
      cmd: getGrade(c.expected_next_command, c.ai_next_command),
      fix: getGrade(c.expected_fix, c.ai_fix_steps),
      verify: getGrade(c.verification_command, c.ai_verification_command),
    };
    return { ...c, grades, overall: getOverall(grades) };
  });

  const diagnosed = graded.filter(c => c.ai_root_cause);
  const correct = diagnosed.filter(c => c.overall === 'CORRECT').length;
  const partial = diagnosed.filter(c => c.overall === 'PARTIAL').length;
  const incorrect = diagnosed.filter(c => c.overall === 'INCORRECT').length;
  const accuracy = diagnosed.length > 0 ? Math.round(((correct + partial * 0.5) / diagnosed.length) * 100) : 0;

  const filtered = graded.filter(c =>
    c.case_id.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.expected_fault.toLowerCase().includes(search.toLowerCase())
  );

  const CompRow = ({ label, expected, actual, grade }: { label: string; expected?: string; actual?: string; grade: string }) => (
    <div className="flex items-start gap-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0">
      <span className="w-28 shrink-0 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-[var(--text-tertiary)]">
          <span className="text-[11px] text-[var(--text-muted)]">Expected: </span>
          {expected || <span className="italic">Not specified</span>}
        </div>
        <div className="text-[12px] text-[var(--text-secondary)] mt-1">
          <span className="text-[11px] text-[var(--text-muted)]">AI Output: </span>
          {actual || <span className="italic text-[var(--text-muted)]">Pending</span>}
        </div>
      </div>
      <div className="shrink-0"><GradeBadge grade={grade} /></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in select-text">
      <div className="page-header">
        <h1 className="page-title">Model Evaluation</h1>
        <p className="page-description">Compare AI predictions against ground-truth annotations across 4 dimensions.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-value text-[var(--text-primary)]">{cases.length}</div>
          <div className="stat-label">Total Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-[var(--accent)]">{diagnosed.length}</div>
          <div className="stat-label">Diagnosed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-[var(--success)]">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4 mt-1">
            <div className="text-center">
              <span className="text-[15px] font-bold text-[var(--success)]">{correct}</span>
              <div className="text-[10px] font-medium tracking-wide text-[var(--text-muted)] uppercase mt-0.5">Correct</div>
            </div>
            <div className="text-center">
              <span className="text-[15px] font-bold text-[var(--warning)]">{partial}</span>
              <div className="text-[10px] font-medium tracking-wide text-[var(--text-muted)] uppercase mt-0.5">Partial</div>
            </div>
            <div className="text-center">
              <span className="text-[15px] font-bold text-[var(--danger)]">{incorrect}</span>
              <div className="text-[10px] font-medium tracking-wide text-[var(--text-muted)] uppercase mt-0.5">Wrong</div>
            </div>
          </div>
          <div className="stat-label">Breakdown</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
        <input type="text" placeholder="Filter cases..." className="input-field pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="card-body p-0">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Case ID</th>
                <th>Fault (Expected → AI)</th>
                <th className="text-right">Overall Grade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <Fragment key={c.id}>
                  <tr onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="cursor-pointer group">
                    <td className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" style={{ width: 32 }}>
                      {expandedId === c.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="font-semibold text-[var(--text-primary)]">{c.case_id}</td>
                    <td>
                      <span className="text-[var(--text-tertiary)]">{c.expected_fault || '—'}</span>
                      <span className="text-[var(--text-muted)] mx-2">→</span>
                      <span className="text-[var(--text-secondary)]">{c.ai_root_cause || <span className="italic text-[var(--text-muted)]">Pending</span>}</span>
                    </td>
                    <td className="text-right">
                      {c.ai_root_cause ? <GradeBadge grade={c.overall} /> : <span className="text-[var(--text-muted)] italic text-[12px]">—</span>}
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-detail`}>
                      <td colSpan={4} className="bg-[var(--bg-secondary)]/30 !p-0">
                        <div className="px-6 py-4">
                          <CompRow label="Root Cause" expected={c.expected_fault} actual={c.ai_root_cause} grade={c.grades.fault} />
                          <CompRow label="Next Command" expected={c.expected_next_command} actual={c.ai_next_command} grade={c.grades.cmd} />
                          <CompRow label="Fix Steps" expected={c.expected_fix} actual={c.ai_fix_steps} grade={c.grades.fix} />
                          <CompRow label="Verification" expected={c.verification_command} actual={c.ai_verification_command} grade={c.grades.verify} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-[var(--text-muted)]">
              <Inbox className="mx-auto mb-3 opacity-50" size={28} />
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">No evaluations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
