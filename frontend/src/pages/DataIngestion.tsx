import { useState } from 'react';
import { createCase } from '../api/client';
import { Terminal, Network, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface DataIngestionProps {
  onCaseCreated: (id: number, caseIdStr: string) => void;
}

export default function DataIngestion({ onCaseCreated }: DataIngestionProps) {
  const [symptom, setSymptom] = useState('');
  const [topology, setTopology] = useState('');
  const [outputs, setOutputs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptom.trim() || !outputs.trim()) {
      toast.error('Symptoms and CLI Outputs are required.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const newCase = await createCase(symptom, topology, outputs);
      toast.success('Case created successfully!');
      onCaseCreated(newCase.id, newCase.case_id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to ingest data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      <div className="page-header">
        <h1 className="page-title">New Diagnosis</h1>
        <p className="page-description">
          Ingest raw evidence from your lab environment or Packet Tracer into the AI Diagnostic Engine.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="card-body space-y-5">

          <div className="space-y-1.5">
            <label className="input-label flex items-center gap-2">
              <AlertCircle size={14} className="text-[var(--warning)]" />
              Observed Symptoms <span className="text-[var(--danger)]">*</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. PC-1 cannot reach Server-1 in VLAN 30"
              className="input-field"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="input-label flex items-center gap-2">
              <Network size={14} className="text-[var(--info)]" />
              Topology Notes (Optional)
            </label>
            <textarea 
              placeholder="e.g. Router R1 connects to Switch S1 via G0/0/1"
              className="textarea-field min-h-[80px]"
              value={topology}
              onChange={(e) => setTopology(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="input-label flex items-center gap-2">
              <Terminal size={14} className="text-[var(--success)]" />
              Raw CLI Outputs <span className="text-[var(--danger)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--text-tertiary)] mb-1">
              Paste outputs from commands like <code>show ip int brief</code>, <code>show vlan</code>, or <code>show ip route</code>.
            </p>
            <textarea 
              placeholder="R1# show ip int brief&#10;Interface          IP-Address      OK? Method Status                Protocol&#10;GigabitEthernet0/0 192.168.10.1    YES NVRAM  up                    up"
              className="textarea-field min-h-[250px] font-mono text-[12px] leading-relaxed"
              value={outputs}
              onChange={(e) => setOutputs(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Ingesting Data...
                </>
              ) : (
                <>
                  Begin AI Diagnosis
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
