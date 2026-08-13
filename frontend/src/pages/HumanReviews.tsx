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
        <span className="text-[var(--text-muted)] text-sm">Loading review log...</span>
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
    <div className="space-y-5 animate-in select-text">
      <div className="page-header">
        <h1>Human Reviews</h1>
        <p>Audit log of all human review decisions — accepted, edited, and rejected diagnoses.</p>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
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
                      review.status === 'Accepted' ? 'badge-green' :
                      review.status === 'Edited' ? 'badge-amber' : 'badge-red'
                    }`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="max-w-[180px] truncate text-[var(--text-tertiary)]">
                    {editedDiag?.root_cause || '—'}
                  </td>
                  <td className="max-w-[160px] truncate text-[var(--text-muted)]">{comment || '—'}</td>
                  <td className="text-[var(--text-muted)] whitespace-nowrap text-[13px]">
                    {new Date(review.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {reviewedCases.length === 0 && (
          <div className="py-16 text-center text-[var(--text-muted)]">
            <Inbox className="mx-auto mb-3" size={28} />
            <p className="text-sm font-medium">No reviews recorded yet</p>
            <p className="text-[13px] mt-1">Complete a diagnosis and submit a human review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
