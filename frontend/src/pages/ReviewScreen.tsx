import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCase, diagnoseCase, submitReview } from '../api/client';
import { ArrowLeft, Cpu, AlertTriangle, Info, Check, Edit2, X } from 'lucide-react';

export default function ReviewScreen({ caseId, onBack }: { caseId: number, onBack: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['cases', caseId],
    queryFn: () => fetchCase(caseId),
  });

  const diagnoseMutation = useMutation({
    mutationFn: () => diagnoseCase(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
    }
  });

  const reviewMutation = useMutation({
    mutationFn: (status: string) => submitReview(caseId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onBack();
    }
  });

  if (isLoading || !caseData) return <div className="p-8 text-center text-slate-500">Loading case details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 text-slate-600 rounded-full transition"><ArrowLeft /></button>
        <h1 className="text-2xl font-bold text-slate-800">Case #{caseId} Review</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Evidence */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Evidence</h2>
          
          <div className="mb-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Symptom</h3>
            <p className="text-slate-600 mt-1">{caseData.symptom}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Info size={16} className="text-blue-500" /> Topology Note</h3>
            <p className="text-slate-600 mt-1">{caseData.topology_note}</p>
          </div>
          
          <div className="flex-1 flex flex-col min-h-[300px]">
            <h3 className="font-semibold text-slate-700 mb-2">Show Command Outputs</h3>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm flex-1 max-h-[500px] overflow-y-auto font-mono">
              {caseData.show_outputs}
            </pre>
          </div>
        </div>

        {/* Right Col: AI Diagnosis & Review */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="text-indigo-500" /> AI Diagnosis
              </h2>
              {!caseData.ai_root_cause && (
                <button 
                  onClick={() => diagnoseMutation.mutate()}
                  disabled={diagnoseMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 transition"
                >
                  {diagnoseMutation.isPending ? 'Analyzing...' : 'Run AI Analysis'}
                </button>
              )}
            </div>

            {caseData.ai_root_cause ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Root Cause</span>
                  <p className="text-slate-800 font-medium">{caseData.ai_root_cause}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</span>
                    <p className={`font-medium ${caseData.ai_confidence === 'High' ? 'text-emerald-600' : 'text-amber-600'}`}>{caseData.ai_confidence}</p>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evidence</span>
                    <p className="text-slate-700 text-sm italic border-l-2 border-indigo-200 pl-2 mt-1">{caseData.ai_evidence}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Command</span>
                  <p className="font-mono text-sm bg-slate-100 p-1 rounded inline-block text-slate-800 mt-1">{caseData.ai_next_command}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fix Steps</span>
                  <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap">{caseData.ai_fix_steps}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Cpu size={48} className="mx-auto mb-4 opacity-20" />
                <p>No diagnosis generated yet.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Human Review</h2>
            <div className="space-y-4">
              <textarea 
                className="w-full border border-slate-300 bg-slate-50 rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Reason for editing or rejecting (optional for Accept)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => reviewMutation.mutate('Accepted')}
                  disabled={reviewMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold py-2 rounded transition disabled:opacity-50"
                >
                  <Check size={18} /> Accept
                </button>
                <button 
                  onClick={() => reviewMutation.mutate('Edited')}
                  disabled={reviewMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold py-2 rounded transition disabled:opacity-50"
                >
                  <Edit2 size={18} /> Edit
                </button>
                <button 
                  onClick={() => reviewMutation.mutate('Rejected')}
                  disabled={reviewMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 rounded transition disabled:opacity-50"
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
