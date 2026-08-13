import { useQuery } from '@tanstack/react-query';
import { fetchCases } from '../api/client';
import type { Case } from '../types/case';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';

export default function HumanReviews() {
  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
        <span className="text-[var(--text-muted)] text-[13px]">Loading review log...</span>
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

  const reviewedCases = cases.filter(c => c.review);

  const parseEdited = (reason: string) => {
    try {
      const parsed = JSON.parse(reason);
      return { 
        comment: parsed.comment || '', 
        editedDiag: parsed.edited_diagnosis || null 
      };
    } catch { 
      return { comment: reason, editedDiag: null }; 
    }
  };

  return (
    <div className="space-y-6 animate-in select-text">
      <div className="page-header">
        <h1 className="page-title">Human Reviews</h1>
        <p className="page-description">Audit log of all human review decisions — accepted, edited, and rejected diagnoses.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="card-body p-0">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>AI Root Cause</th>
                <th>Decision</th>
                <th>Human Correction</th>
                <th>Reason</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {reviewedCases.map(c => {
                const review = c.review!;
                const { comment, editedDiag } = parseEdited(review.reason);
                
                return (
                  <tr key={c.id}>
                    <td className="font-semibold text-[var(--text-primary)] whitespace-nowrap">{c.case_id}</td>
                    <td className="max-w-[180px] truncate">{c.ai_root_cause || '—'}</td>
                    <td>
                      <span className={`badge ${
                        review.status === 'Accepted' ? 'badge-success' :
                        review.status === 'Edited' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate text-[var(--text-tertiary)]">
                      {editedDiag?.root_cause || '—'}
                    </td>
                    <td className="max-w-[160px] truncate text-[var(--text-muted)]">{comment || '—'}</td>
                    <td className="text-[var(--text-muted)] whitespace-nowrap text-[12px]">
                      {new Date(review.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {reviewedCases.length === 0 && (
            <div className="py-16 text-center text-[var(--text-muted)]">
              <Inbox className="mx-auto mb-3 opacity-50" size={28} />
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">No reviews recorded yet</p>
              <p className="text-[12px] mt-1">Complete a diagnosis and submit a human review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
