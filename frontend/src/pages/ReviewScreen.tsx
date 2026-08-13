import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCase, diagnoseCase, submitReview, submitCommandOutput } from '../api/client';
import { 
  ArrowLeft, AlertTriangle, X, Terminal, 
  Sparkles, CheckCircle2, XCircle, PlayCircle, Loader2, Copy,
  Network, ClipboardCopy, AlertCircle, Check
} from 'lucide-react';
import type { Case } from '../types/case';

interface ReviewScreenProps {
  caseId: number;
  onBack: () => void;
}

export default function ReviewScreen({ caseId, onBack }: ReviewScreenProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Needs Info Form State
  const [commandOutput, setCommandOutput] = useState('');
  
  // Verification Form State
  const [inVerificationMode, setInVerificationMode] = useState(false);
  const [verificationOutput, setVerificationOutput] = useState('');
  
  // Review Actions State
  const [reviewMode, setReviewMode] = useState<'none' | 'accept' | 'edit' | 'reject'>('none');
  const [rejectReason, setRejectReason] = useState('');
  const [editReason, setEditReason] = useState('');
  
  // Edit Form Fields
  const [editRootCause, setEditRootCause] = useState('');
  const [editOsiLayer, setEditOsiLayer] = useState('');
  const [editConfidence, setEditConfidence] = useState('');
  const [editEvidence, setEditEvidence] = useState('');
  const [editReasonText, setEditReasonText] = useState('');
  const [editFixSteps, setEditFixSteps] = useState('');
  const [editVerificationCommand, setEditVerificationCommand] = useState('');

  // Fetch current case data
  const { data: caseData, isLoading, error: fetchError } = useQuery<Case>({
    queryKey: ['cases', caseId],
    queryFn: () => fetchCase(caseId),
  });

  // Prefill Edit fields once data is loaded
  useEffect(() => {
    if (caseData) {
      setEditRootCause(caseData.ai_root_cause || '');
      setEditOsiLayer(caseData.ai_osi_layer || '');
      setEditConfidence(caseData.ai_confidence || 'Medium');
      setEditEvidence(caseData.ai_evidence || '');
      setEditReasonText(caseData.ai_reason || '');
      setEditFixSteps(caseData.ai_fix_steps || '');
      setEditVerificationCommand(caseData.ai_verification_command || '');
      
      if (['VERIFICATION_REQUIRED', 'RESOLVED', 'NOT_RESOLVED'].includes(caseData.diagnosis_status || '')) {
        setInVerificationMode(true);
      } else {
        setInVerificationMode(false);
      }
    }
  }, [caseData]);

  // Mutations
  const diagnoseMutation = useMutation({
    mutationFn: () => diagnoseCase(caseId),
    onSuccess: () => {
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Diagnosis failed. Please verify the AI engine connection.');
    }
  });

  const submitOutputMutation = useMutation({
    mutationFn: () => submitCommandOutput(caseId, caseData?.ai_next_command || '', commandOutput),
    onSuccess: () => {
      setCommandOutput('');
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit command output.');
    }
  });

  const submitVerificationMutation = useMutation({
    mutationFn: () => submitCommandOutput(
      caseId, 
      caseData?.ai_verification_command || editVerificationCommand || 'verification_command', 
      verificationOutput
    ),
    onSuccess: () => {
      setVerificationOutput('');
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to verify backend result.');
    }
  });

  const reviewMutation = useMutation({
    mutationFn: ({ status, reason }: { status: 'Accepted' | 'Edited' | 'Rejected'; reason: string }) => 
      submitReview(caseId, status, reason),
    onSuccess: () => {
      setReviewMode('none');
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit review.');
    }
  });

  // Client-side rule checker engine
  const runLocalRules = (showOutputs: string) => {
    const interfaces: any[] = [];
    const vlans: any[] = [];
    const routes: any[] = [];
    let defaultGateway = "UNKNOWN";

    const interfacePattern = /^(FastEthernet\d+\/\d+|GigabitEthernet\d+\/\d+|Serial\d+\/\d+\/\d+|Vlan\d+)\s+([0-9\.]+|unassigned)\s+\w+\s+\w+\s+(up|down|administratively down)\s+(up|down)/i;
    const vlanPattern = /^(\d{1,4})\s+([\w\-]+)\s+(active|suspend)\s*(.*)$/;
    const routePattern = /^([CSORD][\*\s]\s+(?:[0-9\.]+\/[0-9]+).*)$/;
    const gatewayMatch = showOutputs.match(/Gateway of last resort is ([0-9\.]+) to network 0\.0\.0\.0/);
    const gatewayNotSetMatch = showOutputs.match(/Gateway of last resort is not set/);

    if (gatewayMatch) defaultGateway = gatewayMatch[1];
    else if (gatewayNotSetMatch) defaultGateway = "NOT_SET";

    const lines = showOutputs.split('\n');
    for (let line of lines) {
      line = line.trim();
      const intMatch = line.match(interfacePattern);
      if (intMatch) interfaces.push({ name: intMatch[1], ip: intMatch[2], status: intMatch[3], protocol: intMatch[4] });
      const vlanMatch = line.match(vlanPattern);
      if (vlanMatch) vlans.push({ id: vlanMatch[1], name: vlanMatch[2], status: vlanMatch[3], ports: vlanMatch[4]?.trim() || "None" });
      const routeMatch = line.match(routePattern);
      if (routeMatch) routes.push(routeMatch[1].trim());
    }

    const hasInterfaceData = showOutputs.includes("show ip int brief") || showOutputs.includes("Interface");
    const hasVlanData = showOutputs.includes("show vlan") || showOutputs.includes("VLAN Name");
    const hasRoutingData = showOutputs.includes("show ip route") || showOutputs.includes("Gateway of last resort");

    const results: any[] = [];

    // check_duplicate_ips
    if (!hasInterfaceData) {
      results.push({ rule: "DUPLICATE_IP", status: "INSUFFICIENT_EVIDENCE", evidence: [], reason: "Interface IP assignment information was not supplied." });
    } else {
      const findings: string[] = [];
      if (showOutputs.includes("DUPADDR") || showOutputs.includes("Duplicate address")) findings.push("Detected duplicate IP address warning in logs.");
      const seen = new Set<string>();
      for (const intf of interfaces) {
        if (intf.ip && intf.ip !== "unassigned") {
          if (seen.has(intf.ip)) findings.push(`Duplicate IP configured across interfaces: ${intf.ip}`);
          seen.add(intf.ip);
        }
      }
      if (findings.length > 0) results.push({ rule: "DUPLICATE_IP", status: "DETECTED", severity: "HIGH", confidence: 1.0, evidence: findings, source: "show ip interface brief / logs" });
    }

    // check_wrong_masks
    if (!showOutputs) {
      results.push({ rule: "WRONG_MASK", status: "INSUFFICIENT_EVIDENCE", evidence: [], reason: "No CLI outputs provided." });
    } else {
      const findings: string[] = [];
      const ipMaskPattern = /((?:192\.168|172\.(?:1[6-9]|2[0-9]|3[0-1])|10\.)\.\d{1,3}\.\d{1,3})[\/ ](?:255\.0\.0\.0|\/8)/g;
      const matches = showOutputs.match(ipMaskPattern);
      if (matches) for (const m of matches) findings.push(`Suspicious subnet mask: ${m} appears to be /8 which is overly broad.`);
      if (findings.length > 0) results.push({ rule: "WRONG_MASK", status: "DETECTED", severity: "MEDIUM", confidence: 0.8, evidence: findings, source: "show running-config / interfaces" });
    }

    // check_gateway_mismatch
    if (!hasRoutingData) {
      results.push({ rule: "GATEWAY_MISMATCH", status: "INSUFFICIENT_EVIDENCE", evidence: [], reason: "Routing or gateway information was not supplied." });
    } else {
      const findings: string[] = [];
      if (defaultGateway === "NOT_SET") findings.push("No default route is set (Gateway of last resort is not set).");
      if (findings.length > 0) results.push({ rule: "GATEWAY_MISMATCH", status: "DETECTED", severity: "HIGH", confidence: 0.9, evidence: findings, source: "show ip route" });
    }

    // check_interface_down
    if (!hasInterfaceData) {
      results.push({ rule: "INTERFACE_DOWN", status: "INSUFFICIENT_EVIDENCE", evidence: [], reason: "Interface state information was not supplied." });
    } else {
      const findings: string[] = [];
      for (const intf of interfaces) {
        if (intf.status.toLowerCase().includes("down") || intf.protocol.toLowerCase().includes("down")) findings.push(`Interface ${intf.name} is ${intf.status}/${intf.protocol}`);
      }
      for (const line of lines) {
        if (line.includes("administratively down") && !findings.some(f => f.includes("administratively down"))) findings.push(`Interface is administratively down: ${line.trim()}`);
      }
      if (findings.length > 0) results.push({ rule: "INTERFACE_DOWN", status: "DETECTED", severity: "HIGH", confidence: 1.0, evidence: findings, source: "show ip interface brief" });
    }

    // check_missing_vlan
    if (!hasVlanData) {
      results.push({ rule: "MISSING_VLAN", status: "INSUFFICIENT_EVIDENCE", evidence: [], reason: "VLAN database information was not supplied." });
    } else {
      const findings: string[] = [];
      if (showOutputs.includes("does not exist") && showOutputs.includes("VLAN")) findings.push("A port is assigned to a VLAN that does not exist in the VLAN database.");
      for (const vlan of vlans) {
        if (vlan.status === "suspend" || vlan.status.includes("inactive")) findings.push(`VLAN ${vlan.id} (${vlan.name}) is suspended/inactive.`);
      }
      if (findings.length > 0) results.push({ rule: "MISSING_VLAN", status: "DETECTED", severity: "HIGH", confidence: 1.0, evidence: findings, source: "show vlan brief" });
    }

    // check_missing_routes
    if (!hasRoutingData) {
      results.push({ rule: "MISSING_ROUTES", status: "INSUFFICIENT_EVIDENCE", evidence: [], reason: "Routing table information was not supplied." });
    } else {
      const findings: string[] = [];
      if (defaultGateway === "NOT_SET" && routes.length === 0) findings.push("Routing table is empty and no default gateway is set.");
      if (findings.length > 0) results.push({ rule: "MISSING_ROUTES", status: "DETECTED", severity: "MEDIUM", confidence: 0.8, evidence: findings, source: "show ip route" });
    }

    return results;
  };

  const ruleFindings = useMemo(() => runLocalRules(caseData ? caseData.show_outputs : ''), [caseData]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
        <span className="text-[var(--text-muted)] text-sm">Loading case details...</span>
      </div>
    );
  }

  // Error
  if (fetchError || !caseData) {
    return (
      <div className="card max-w-lg mx-auto mt-12 p-6 flex flex-col gap-4 border-red-500/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-red-400 text-sm">Connection Error</h3>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">{fetchError?.message || 'Could not fetch case details.'}</p>
          </div>
        </div>
        <button onClick={onBack} className="btn btn-secondary self-start">← Back to Queue</button>
      </div>
    );
  }

  // Parse CLI blocks
  const parseCommandBlocks = (showOutputs: string) => {
    const blocks: { command: string; output: string }[] = [];
    const parts = showOutputs.split(/\n*--- Output of (.*?) ---\n*/g);
    if (parts.length <= 1) {
      blocks.push({ command: "initial_setup_logs", output: showOutputs });
    } else {
      if (parts[0].trim()) blocks.push({ command: "initial_setup_logs", output: parts[0] });
      for (let i = 1; i < parts.length; i += 2) {
        blocks.push({ command: parts[i], output: parts[i + 1] || '' });
      }
    }
    return blocks;
  };

  const commandBlocks = parseCommandBlocks(caseData.show_outputs);
  const r1Blocks = commandBlocks.filter(b => b.command.includes("R1") || b.output.includes("R1#") || b.output.includes("R1("));
  const r2Blocks = commandBlocks.filter(b => b.command.includes("R2") || b.output.includes("R2#") || b.output.includes("R2("));
  const generalBlocks = commandBlocks.filter(b => !r1Blocks.includes(b) && !r2Blocks.includes(b));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAcceptReview = () => reviewMutation.mutate({ status: 'Accepted', reason: 'Diagnosis accepted as correct.' });

  const handleRejectReview = () => {
    if (!rejectReason.trim()) return;
    reviewMutation.mutate({ status: 'Rejected', reason: rejectReason });
  };

  const handleEditReview = () => {
    const payload = {
      decision: 'Edited',
      human_comment: editReason,
      original_diagnosis: {
        root_cause: caseData.ai_root_cause, osi_layer: caseData.ai_osi_layer, confidence: caseData.ai_confidence,
        evidence: caseData.ai_evidence, reason: caseData.ai_reason, fix_steps: caseData.ai_fix_steps, verification_command: caseData.ai_verification_command,
      },
      edited_diagnosis: {
        root_cause: editRootCause, osi_layer: editOsiLayer, confidence: editConfidence,
        evidence: editEvidence, reason: editReasonText, fix_steps: editFixSteps, verification_command: editVerificationCommand,
      },
    };
    reviewMutation.mutate({ status: 'Edited', reason: JSON.stringify(payload, null, 2) });
  };

  const hasDiagnoseRun = !!caseData.ai_root_cause;
  const isReviewed = !!caseData.review;
  const isAcceptedOrEdited = caseData.review?.status === 'Accepted' || caseData.review?.status === 'Edited';

  const timelineSteps = [
    { label: 'Problem reported', detail: 'Symptoms parsed and topology loaded', done: true },
    { label: 'Evidence analyzed', detail: `${commandBlocks.length} CLI blocks`, done: true },
    { label: 'Rules evaluated', detail: `${ruleFindings.length} checks`, done: hasDiagnoseRun },
    { label: 'AI diagnosis', detail: caseData.ai_root_cause || 'Pending', done: hasDiagnoseRun && caseData.diagnosis_status !== 'NEEDS_INFO' },
    { label: 'Human review', detail: caseData.review ? caseData.review.status : 'Awaiting', done: isReviewed },
    { label: 'Verification', detail: caseData.diagnosis_status === 'RESOLVED' ? 'Resolved' : 'Pending', done: caseData.diagnosis_status === 'RESOLVED' || caseData.diagnosis_status === 'NOT_RESOLVED' },
  ];

  const confPercent = caseData.ai_confidence === 'High' ? 92 : caseData.ai_confidence === 'Medium' ? 68 : 35;

  // Helper for terminal blocks
  const TerminalBlock = ({ title, blocks, fallback }: { title: string; blocks: { command: string; output: string }[]; fallback: string }) => (
    <div className="terminal flex flex-col min-h-[200px] max-h-[350px]">
      <div className="terminal-header">
        <Terminal size={13} className="text-[var(--accent)]" />
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">{title}</span>
      </div>
      <div className="terminal-body flex-1 overflow-y-auto text-[12px]">
        {blocks.length > 0 ? blocks.map((b, i) => (
          <div key={i} className="mb-3">
            <span className="text-green-400 font-semibold block">{b.command}</span>
            <pre className="whitespace-pre-wrap overflow-x-auto text-[var(--text-tertiary)]">{b.output}</pre>
          </div>
        )) : <span className="text-[var(--text-muted)] italic">{fallback}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-in select-text">
      
      {/* Error Banner */}
      {errorMsg && (
        <div className="card p-3 flex items-center justify-between border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn btn-ghost text-sm py-1.5 px-2">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="h-5 w-px bg-[var(--border-subtle)]" />
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{caseData.case_id}</h1>
          <span className="badge badge-gray">{caseData.category}</span>
          <span className={`badge ${caseData.severity === 'High' ? 'badge-red' : caseData.severity === 'Medium' ? 'badge-amber' : 'badge-blue'}`}>{caseData.severity}</span>
        </div>
        <span className={`badge ${
          caseData.diagnosis_status === 'NEEDS_INFO' ? 'badge-amber' : 
          caseData.diagnosis_status === 'DIAGNOSED' ? 'badge-blue' :
          caseData.diagnosis_status === 'RESOLVED' ? 'badge-green' :
          caseData.diagnosis_status === 'NOT_RESOLVED' ? 'badge-red' : 'badge-gray'
        }`}>{caseData.diagnosis_status || 'NEW'}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Symptoms */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Reported Symptoms</h3>
            </div>
            <div className="card-body text-[14px] text-[var(--text-secondary)] leading-relaxed">
              {caseData.symptom}
            </div>
          </div>

          {/* Topology */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Network Topology</h3>
            </div>
            <div className="card-body text-[14px] text-[var(--text-tertiary)] leading-relaxed">
              {caseData.topology_note}
            </div>
          </div>

          {/* Terminals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TerminalBlock title="Router R1" blocks={r1Blocks} fallback="No R1 logs. See general output." />
            <TerminalBlock title="Router R2" blocks={r2Blocks} fallback="No R2 logs. See general output." />
          </div>

          {generalBlocks.length > 0 && (
            <TerminalBlock title="General CLI Output" blocks={generalBlocks} fallback="" />
          )}
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-5">

          {/* AI Diagnosis Card */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                <Sparkles size={15} className="text-[var(--accent)]" /> AI Diagnosis
              </span>
            </div>
            <div className="card-body space-y-4">
              {/* Root Cause */}
              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Root Cause</label>
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)] text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  {caseData.ai_root_cause || <span className="text-[var(--text-muted)] italic">Run diagnosis to identify root cause.</span>}
                </div>
              </div>

              {/* Evidence */}
              {caseData.ai_evidence && (
                <div>
                  <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Evidence</label>
                  <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">{caseData.ai_evidence}</p>
                </div>
              )}

              {/* Reasoning */}
              {caseData.ai_reason && (
                <div>
                  <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Reasoning</label>
                  <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">{caseData.ai_reason}</p>
                </div>
              )}

              {/* OSI + Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase block mb-1">OSI Layer</label>
                  <span className="text-[var(--accent)] font-semibold">{caseData.ai_osi_layer || '—'}</span>
                </div>
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase block mb-1">Confidence</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${confPercent}%` }} />
                    </div>
                    <span className="text-[12px] text-[var(--text-secondary)] font-semibold">{confPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Rule Findings */}
              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-2">Rule Checks</label>
                <div className="space-y-1.5">
                  {ruleFindings.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[13px]">
                      {f.status === 'DETECTED' ? (
                        <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      ) : (
                        <CheckCircle2 size={13} className="text-[var(--success)] shrink-0" />
                      )}
                      <span className={f.status === 'DETECTED' ? 'text-amber-300' : 'text-[var(--text-tertiary)]'}>
                        {f.rule.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Progress</h3>
            </div>
            <div className="card-body space-y-0">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full border-2 ${
                      step.done ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-transparent border-[var(--border-strong)]'
                    }`} />
                    {i < timelineSteps.length - 1 && <div className="w-px flex-1 bg-[var(--border-subtle)] mt-1" />}
                  </div>
                  <div className="-mt-0.5 min-w-0">
                    <span className={`text-[13px] font-medium block ${step.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {step.label}
                    </span>
                    {step.done && step.detail && (
                      <span className="text-[12px] text-[var(--text-muted)] block truncate">{step.detail}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-width action sections ── */}
      <div className="space-y-5">

        {/* Start Diagnosis */}
        {!hasDiagnoseRun && (
          <div className="card p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Ready to Diagnose</h3>
              <p className="text-[var(--text-tertiary)] text-sm mt-0.5">Run AI-assisted fault detection, rule checks, and root cause analysis.</p>
            </div>
            <button 
              onClick={() => diagnoseMutation.mutate()}
              disabled={diagnoseMutation.isPending}
              className="btn btn-primary"
            >
              {diagnoseMutation.isPending ? (
                <><Loader2 size={15} className="animate-spin" /> Running...</>
              ) : (
                <><PlayCircle size={15} /> Run Diagnosis</>
              )}
            </button>
          </div>
        )}

        {/* Needs More Info */}
        {caseData.diagnosis_status === 'NEEDS_INFO' && caseData.ai_next_command && (
          <div className="card border-amber-500/20">
            <div className="card-header bg-amber-500/5 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-300">Additional Evidence Required</h3>
            </div>
            <div className="card-body space-y-4">
              <p className="text-[var(--text-tertiary)] text-sm">Execute the following command in Packet Tracer and paste the output below.</p>
              
              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Command</label>
                <div className="flex items-center justify-between p-3 bg-[#050507] rounded-lg border border-[var(--border-subtle)] font-mono text-sm">
                  <code className="text-green-400 select-all">{caseData.ai_next_command}</code>
                  <button onClick={() => handleCopy(caseData.ai_next_command || '')} className="btn btn-ghost text-[12px] py-1 px-2">
                    <ClipboardCopy size={13} />
                    {copiedText === caseData.ai_next_command ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Paste Output</label>
                <textarea 
                  className="input font-mono text-[13px]" rows={5}
                  placeholder="Paste command output here..."
                  value={commandOutput} onChange={e => setCommandOutput(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => submitOutputMutation.mutate()}
                  disabled={submitOutputMutation.isPending || !commandOutput.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {submitOutputMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Evidence →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Human Review */}
        {caseData.diagnosis_status === 'DIAGNOSED' && !caseData.review && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                <Check size={15} className="text-[var(--accent)]" /> Human Review
              </h3>
            </div>
            <div className="card-body space-y-4">
              
              <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)]">
                <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">AI Diagnosis</label>
                <p className="text-[var(--text-secondary)]">{caseData.ai_root_cause}</p>
              </div>

              {reviewMode === 'none' && (
                <div className="flex gap-2">
                  <button onClick={() => setReviewMode('accept')} className="btn btn-success">✓ Accept</button>
                  <button onClick={() => setReviewMode('edit')} className="btn btn-warning">✎ Edit</button>
                  <button onClick={() => setReviewMode('reject')} className="btn btn-danger">✕ Reject</button>
                </div>
              )}

              {reviewMode === 'accept' && (
                <div className="p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)] space-y-3 max-w-lg">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Confirm the AI diagnosis is correct?</p>
                  <p className="text-sm text-[var(--text-muted)]">This moves the case to the fix and verification stage.</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setReviewMode('none')} className="btn btn-secondary text-sm">Cancel</button>
                    <button onClick={handleAcceptReview} disabled={reviewMutation.isPending} className="btn btn-success text-sm">
                      {reviewMutation.isPending && <Loader2 size={14} className="animate-spin" />} Confirm
                    </button>
                  </div>
                </div>
              )}

              {reviewMode === 'reject' && (
                <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/15 space-y-3 max-w-lg">
                  <p className="text-sm font-medium text-red-400">Provide a rejection reason:</p>
                  <textarea 
                    className="input text-sm" rows={3}
                    placeholder="Why is this diagnosis incorrect?" 
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setReviewMode('none')} className="btn btn-secondary text-sm">Cancel</button>
                    <button onClick={handleRejectReview} disabled={reviewMutation.isPending || !rejectReason.trim()} className="btn btn-danger text-sm disabled:opacity-50">
                      {reviewMutation.isPending && <Loader2 size={14} className="animate-spin" />} Reject
                    </button>
                  </div>
                </div>
              )}

              {reviewMode === 'edit' && (
                <div className="p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-subtle)] space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Edit Diagnosis</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">Root Cause</label>
                      <input type="text" className="input text-sm" value={editRootCause} onChange={e => setEditRootCause(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">OSI Layer</label>
                      <input type="text" className="input text-sm" value={editOsiLayer} onChange={e => setEditOsiLayer(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">Confidence</label>
                      <select className="input text-sm" value={editConfidence} onChange={e => setEditConfidence(e.target.value)}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">Evidence</label>
                      <input type="text" className="input text-sm" value={editEvidence} onChange={e => setEditEvidence(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">Analysis Explanation</label>
                      <textarea className="input text-sm" rows={2} value={editReasonText} onChange={e => setEditReasonText(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">Fix Steps</label>
                      <textarea className="input text-sm font-mono" rows={2} value={editFixSteps} onChange={e => setEditFixSteps(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">Verification Command</label>
                      <input type="text" className="input text-sm font-mono" value={editVerificationCommand} onChange={e => setEditVerificationCommand(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[var(--text-muted)] block mb-1">Override Reason *</label>
                      <input type="text" className="input text-sm" placeholder="Why are you overriding?" value={editReason} onChange={e => setEditReason(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border-subtle)]">
                    <button onClick={() => setReviewMode('none')} className="btn btn-secondary text-sm">Cancel</button>
                    <button onClick={handleEditReview} disabled={reviewMutation.isPending || !editReason.trim()} className="btn btn-warning text-sm disabled:opacity-50">
                      {reviewMutation.isPending && <Loader2 size={14} className="animate-spin" />} Save Override
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Status */}
        {isReviewed && (
          <div className={`card p-4 flex items-start gap-3 ${
            caseData.review?.status === 'Accepted' ? 'border-green-500/20 bg-green-500/5' :
            caseData.review?.status === 'Edited' ? 'border-amber-500/20 bg-amber-500/5' :
            'border-red-500/20 bg-red-500/5'
          }`}>
            <CheckCircle2 size={18} className={
              caseData.review?.status === 'Accepted' ? 'text-green-400' :
              caseData.review?.status === 'Edited' ? 'text-amber-400' : 'text-red-400'
            } />
            <div>
              <p className="font-semibold text-sm">
                Review Decision: <span className={
                  caseData.review?.status === 'Accepted' ? 'text-green-400' :
                  caseData.review?.status === 'Edited' ? 'text-amber-400' : 'text-red-400'
                }>{caseData.review?.status}</span>
              </p>
              {caseData.review?.reason && (
                <div className="mt-2 text-sm text-[var(--text-tertiary)] leading-relaxed">
                  {caseData.review.reason.startsWith('{') ? (() => {
                    try {
                      const p = JSON.parse(caseData.review.reason);
                      return <><strong>Comment:</strong> {p.human_comment || 'None'}{p.edited_diagnosis && <><br /><strong>Edited root cause:</strong> {p.edited_diagnosis.root_cause}</>}</>;
                    } catch { return caseData.review.reason; }
                  })() : caseData.review.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fix Steps */}
        {isAcceptedOrEdited && !inVerificationMode && (
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Terminal size={15} className="text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Recommended Fix</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-sm text-amber-300/80">
                ⚠ Manual action required. Apply these commands in Cisco Packet Tracer. NetSage does not modify live devices.
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Fix Commands</label>
                <pre className="p-3 bg-[#050507] rounded-lg border border-[var(--border-subtle)] font-mono text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap overflow-x-auto">
                  {caseData.ai_fix_steps}
                </pre>
              </div>

              {caseData.ai_verification_command && (
                <div>
                  <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Verification Command</label>
                  <code className="block p-2 bg-[#050507] rounded-lg border border-[var(--border-subtle)] font-mono text-green-400 text-sm">
                    {caseData.ai_verification_command}
                  </code>
                </div>
              )}

              <button onClick={() => setInVerificationMode(true)} className="btn btn-primary w-full justify-center">
                Proceed to Verification →
              </button>
            </div>
          </div>
        )}

        {/* Verification */}
        {inVerificationMode && (
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Verification</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Run This Command</label>
                <div className="flex items-center justify-between p-3 bg-[#050507] rounded-lg border border-[var(--border-subtle)] font-mono text-sm">
                  <code className="text-green-400 select-all">
                    {caseData.ai_verification_command || editVerificationCommand || 'show ip interface brief'}
                  </code>
                  <button onClick={() => handleCopy(caseData.ai_verification_command || editVerificationCommand || '')} className="btn btn-ghost text-[12px] py-1 px-2">
                    <Copy size={13} /> {copiedText === (caseData.ai_verification_command || editVerificationCommand) ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1">Paste Output</label>
                <textarea 
                  className="input font-mono text-[13px]" rows={6}
                  placeholder="Paste verification output here..."
                  value={verificationOutput} onChange={e => setVerificationOutput(e.target.value)}
                />
              </div>

              <button 
                onClick={() => submitVerificationMutation.mutate()}
                disabled={submitVerificationMutation.isPending || !verificationOutput.trim()}
                className="btn btn-primary w-full justify-center disabled:opacity-50"
              >
                {submitVerificationMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : 'Verify Fix'}
              </button>

              {/* Result */}
              {(caseData.diagnosis_status === 'RESOLVED' || caseData.diagnosis_status === 'NOT_RESOLVED') && (
                <div className={`p-4 rounded-lg flex items-center gap-3 font-semibold ${
                  caseData.diagnosis_status === 'RESOLVED' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {caseData.diagnosis_status === 'RESOLVED' ? (
                    <><CheckCircle2 size={18} /> Issue Resolved Successfully</>
                  ) : (
                    <><XCircle size={18} /> Issue Not Resolved — Further Investigation Needed</>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
