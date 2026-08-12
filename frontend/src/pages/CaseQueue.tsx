import { useQuery } from '@tanstack/react-query';
import { fetchCases } from '../api/client';
import { Case } from '../types/case';
import { CheckCircle2, Clock } from 'lucide-react';

export default function CaseQueue({ onSelectCase }: { onSelectCase: (id: number) => void }) {
  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading cases...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading cases.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Troubleshooting Queue</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases?.map((c) => (
          <div 
            key={c.id} 
            onClick={() => onSelectCase(c.id)}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.concept_tag}</span>
              {c.review ? (
                <CheckCircle2 size={18} className="text-emerald-500" title={`Reviewed: ${c.review.status}`} />
              ) : (
                <Clock size={18} className="text-amber-500" title="Pending Review" />
              )}
            </div>
            <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{c.symptom}</h3>
            <div className="flex gap-2 mt-4 text-xs font-medium">
              <span className={`px-2 py-1 rounded bg-slate-100 ${c.severity === 'High' ? 'text-red-600' : 'text-slate-600'}`}>
                {c.severity} Severity
              </span>
              <span className="px-2 py-1 rounded bg-slate-100 text-slate-600">{c.osi_layer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
