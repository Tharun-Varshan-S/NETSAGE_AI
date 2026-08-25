import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCase, diagnoseCase, submitReview, submitCommandOutput, submitForReview } from '../api/client';
import { 
  ArrowLeft, AlertTriangle, X, Terminal, 
  Sparkles, CheckCircle2, XCircle, PlayCircle, Loader2, Copy,
  ClipboardCopy, AlertCircle, Check
} from 'lucide-react';
import type { Case } from '../types/case';

interface ReviewScreenProps {
  caseId: number;
  onBack: () => void;
  userRole?: string;
}

export default function ReviewScreen({ caseId, onBack, userRole }: ReviewScreenProps) {
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
  const [hasAutoRun, setHasAutoRun] = useState(false);
  
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

      // Auto-run diagnosis if it is a new case and hasn't run yet
      if (!caseData.ai_root_cause && caseData.diagnosis_status !== 'NEEDS_INFO' && !hasAutoRun) {
        setHasAutoRun(true);
        diagnoseMutation.mutate();
      }
    }
  }, [caseData, hasAutoRun, diagnoseMutation]);

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
      finalDiag.verification_command || 'verification_command', 
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

  const submitForReviewMutation = useMutation({
    mutationFn: () => submitForReview(caseId),
    onSuccess: () => {
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit for review.');
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
        <span className="text-[var(--text-muted)] text-[13px]">Loading case details...</span>
      </div>
    );
  }

  // Error
  if (fetchError || !caseData) {
    return (
      <div className="card max-w-lg mx-auto mt-12 p-6 flex flex-col gap-4 border-[var(--danger)]/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-[var(--danger)] shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-[var(--danger)] text-[13px]">Connection Error</h3>
            <p className="text-[var(--text-tertiary)] text-[13px] mt-1">{fetchError?.message || 'Could not fetch case details.'}</p>
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

  const handleAcceptReview = () => {
    const payload = {
      decision: 'Accepted',
      comment: 'Diagnosis accepted as correct by senior engineer.',
      original_diagnosis: {
        root_cause: caseData?.ai_root_cause, osi_layer: caseData?.ai_osi_layer, confidence: caseData?.ai_confidence,
        evidence: caseData?.ai_evidence, reason: caseData?.ai_reason, fix_steps: caseData?.ai_fix_steps,
        verification_command: caseData?.ai_verification_command, next_command: caseData?.ai_next_command,
      }
    };
    reviewMutation.mutate({ status: 'Accepted', reason: JSON.stringify(payload) });
  };

  const handleRejectReview = () => {
    if (!rejectReason.trim()) return;
    const payload = {
      decision: 'Rejected',
      comment: rejectReason,
      original_diagnosis: {
        root_cause: caseData.ai_root_cause, osi_layer: caseData.ai_osi_layer, confidence: caseData.ai_confidence,
        evidence: caseData.ai_evidence, reason: caseData.ai_reason, fix_steps: caseData.ai_fix_steps,
        verification_command: caseData.ai_verification_command, next_command: caseData.ai_next_command,
      },
    };
    reviewMutation.mutate({ status: 'Rejected', reason: JSON.stringify(payload) });
  };

  const handleEditReview = () => {
    const payload = {
      decision: 'Edited',
      comment: editReason,
      original_diagnosis: {
        root_cause: caseData.ai_root_cause, osi_layer: caseData.ai_osi_layer, confidence: caseData.ai_confidence,
        evidence: caseData.ai_evidence, reason: caseData.ai_reason, fix_steps: caseData.ai_fix_steps,
        verification_command: caseData.ai_verification_command, next_command: caseData.ai_next_command,
      },
      edited_diagnosis: {
        root_cause: editRootCause, osi_layer: editOsiLayer, confidence: editConfidence,
        evidence: editEvidence, reason: editReasonText, fix_steps: editFixSteps, verification_command: editVerificationCommand,
      },
    };
    reviewMutation.mutate({ status: 'Edited', reason: JSON.stringify(payload) });
  };

  const hasDiagnoseRun = !!caseData.ai_root_cause;
  const isReviewed = !!caseData.review;

  const timelineSteps = [
    { label: 'Problem reported', detail: 'Symptoms parsed and topology loaded', done: true },
    { label: 'Evidence analyzed', detail: `${commandBlocks.length} CLI blocks`, done: true },
    { label: 'Rules evaluated', detail: `${ruleFindings.length} checks`, done: hasDiagnoseRun },
    { label: 'AI diagnosis', detail: caseData.ai_root_cause || 'Pending', done: hasDiagnoseRun && caseData.diagnosis_status !== 'NEEDS_INFO' },
    { label: 'Human review', detail: caseData.review ? caseData.review.status : 'Awaiting', done: isReviewed },
    { label: 'Verification', detail: caseData.diagnosis_status === 'RESOLVED' ? 'Resolved' : 'Pending', done: caseData.diagnosis_status === 'RESOLVED' || caseData.diagnosis_status === 'NOT_RESOLVED' },
  ];

  const confPercent = caseData?.ai_confidence === 'High' ? 92 : caseData?.ai_confidence === 'Medium' ? 68 : 35;

  const getFinalDiagnosis = () => {
    if (caseData?.review?.status === 'Edited' && caseData.review.reason) {
      try {
        const parsed = JSON.parse(caseData.review.reason);
        if (parsed.edited_diagnosis) {
          return { ...caseData, ...parsed.edited_diagnosis };
        }
      } catch (e) {
        // fallback
      }
    }
    return {
      root_cause: caseData?.ai_root_cause,
      osi_layer: caseData?.ai_osi_layer,
      confidence: caseData?.ai_confidence,
      evidence: caseData?.ai_evidence,
      reason: caseData?.ai_reason,
      fix_steps: caseData?.ai_fix_steps,
      verification_command: caseData?.ai_verification_command,
      next_command: caseData?.ai_next_command,
    };
  };

  const finalDiag = getFinalDiagnosis();

  // Helper for terminal blocks
  const TerminalBlock = ({ title, blocks, fallback }: { title: string; blocks: { command: string; output: string }[]; fallback: string }) => (
    <div className="card h-full">
      <div className="card-header py-3 flex items-center gap-2">
        <Terminal size={14} className="text-[var(--accent)]" />
        <span className="text-[13px] font-medium text-[var(--text-secondary)]">{title}</span>
      </div>
      <div className="card-body p-0 max-h-[350px] overflow-y-auto terminal-block rounded-t-none border-x-0 border-b-0">
        {blocks.length > 0 ? blocks.map((b, i) => (
          <div key={i} className="mb-4 last:mb-0">
            <span className="text-green-400 font-semibold block mb-1 text-[12px]">{b.command}</span>
            <pre className="whitespace-pre-wrap text-[var(--text-secondary)]">{b.output}</pre>
          </div>
        )) : <span className="text-[var(--text-muted)] italic px-4 py-3 block text-[12px]">{fallback}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in select-text">
      
      {/* Error Banner */}
      {errorMsg && (
        <div className="card p-3 flex items-center justify-between border-[var(--danger)]/20 bg-[var(--danger)]/5">
          <div className="flex items-center gap-2 text-[var(--danger)] text-[13px]">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn btn-secondary py-1.5 px-2.5 text-[12px] h-auto">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="h-5 w-px bg-[var(--border-subtle)]" />
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{caseData.case_id}</h1>
          <span className="badge badge-neutral">{caseData.category}</span>
          <span className={`badge ${caseData.severity === 'High' ? 'badge-danger' : caseData.severity === 'Medium' ? 'badge-warning' : 'badge-info'}`}>{caseData.severity}</span>
        </div>
        <span className={`badge ${
          caseData.diagnosis_status === 'NEEDS_INFO' ? 'badge-warning' : 
          caseData.diagnosis_status === 'DIAGNOSED' ? 'badge-info' :
          caseData.diagnosis_status === 'PENDING_REVIEW' ? 'badge-info' :
          caseData.diagnosis_status === 'VERIFICATION_REQUIRED' ? 'badge-warning' :
          caseData.diagnosis_status === 'RESOLVED' ? 'badge-success' :
          caseData.diagnosis_status === 'NOT_RESOLVED' ? 'badge-danger' :
          caseData.diagnosis_status === 'REJECTED' ? 'badge-danger' : 'badge-neutral'
        }`}>{caseData.diagnosis_status || 'NEW'}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Symptoms */}
          <div className="card">
            <div className="card-header bg-transparent border-none pb-0">
              <h3 className="card-title text-[14px]">Reported Symptoms</h3>
            </div>
            <div className="card-body pt-3 text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {caseData.symptom}
            </div>
          </div>

          {/* Topology */}
          <div className="card">
            <div className="card-header bg-transparent border-none pb-0">
              <h3 className="card-title text-[14px]">Network Topology</h3>
            </div>
            <div className="card-body pt-3 text-[13px] text-[var(--text-tertiary)] leading-relaxed">
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
        <div className="space-y-6">

          {/* AI Diagnosis Card / Loading State */}
          {!hasDiagnoseRun ? (
            <div className="card p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] border border-[var(--border-default)]">
              {diagnoseMutation.isPending ? (
                <>
                  <div className="relative flex justify-center items-center h-16 w-16 mb-2">
                    <div className="absolute inset-0 rounded-full blur-md bg-[var(--accent)]/20 animate-pulse" />
                    <Loader2 size={36} className="animate-spin text-[var(--accent)] relative z-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] text-[15px]">Diagnosing network...</h3>
                    <p className="text-[var(--text-tertiary)] text-[12px] mt-2 leading-relaxed">
                      Analyzing topology, parsing CLI, and evaluating rules.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-[14px]">Ready to Diagnose</h3>
                    <p className="text-[var(--text-tertiary)] text-[12px] mt-1">
                      Evidence ingested.
                    </p>
                  </div>
                  <button 
                    onClick={() => diagnoseMutation.mutate()}
                    className="btn btn-primary mt-3 w-full justify-center"
                  >
                    <PlayCircle size={15} /> Run Diagnosis
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="card border border-[var(--border-default)]">
              <div className="card-header bg-[var(--bg-secondary)]/50 border-b border-[var(--border-subtle)]">
                <span className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                  <Sparkles size={15} className="text-[var(--accent)]" /> AI Diagnosis
                </span>
              </div>
              <div className="card-body space-y-4">
                {/* Root Cause */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Root Cause</label>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)] text-[13px] text-[var(--text-secondary)] leading-relaxed break-words">
                  {caseData.ai_root_cause || <span className="text-[var(--text-muted)] italic">Run diagnosis to identify root cause.</span>}
                </div>
              </div>

              {/* Evidence */}
              {caseData.ai_evidence && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Evidence</label>
                  <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed break-words">{caseData.ai_evidence}</p>
                </div>
              )}

              {/* Reasoning */}
              {caseData.ai_reason && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Reasoning</label>
                  <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed break-words">{caseData.ai_reason}</p>
                </div>
              )}

              {/* OSI + Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">OSI Layer</label>
                  <span className="text-[var(--accent)] font-semibold text-[13px]">{caseData.ai_osi_layer || '—'}</span>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Confidence</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-[var(--border-default)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${confPercent}%` }} />
                    </div>
                    <span className="text-[11px] text-[var(--text-secondary)] font-semibold">{confPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Rule Findings */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-2">Rule Checks</label>
                <div className="space-y-1.5">
                  {ruleFindings.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      {f.status === 'DETECTED' ? (
                        <AlertTriangle size={13} className="text-[var(--warning)] shrink-0" />
                      ) : (
                        <CheckCircle2 size={13} className="text-[var(--success)] shrink-0" />
                      )}
                      <span className={f.status === 'DETECTED' ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'}>
                        {f.rule.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Timeline */}
          <div className="card">
            <div className="card-header bg-transparent border-none pb-0">
              <h3 className="card-title text-[14px]">Progress</h3>
            </div>
            <div className="card-body pt-3 space-y-0">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full border-[1.5px] ${
                      step.done ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-transparent border-[var(--border-strong)]'
                    }`} />
                    {i < timelineSteps.length - 1 && <div className="w-px flex-1 bg-[var(--border-subtle)] mt-1" />}
                  </div>
                  <div className="-mt-1 min-w-0">
                    <span className={`text-[12px] font-medium block ${step.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {step.label}
                    </span>
                    {step.done && step.detail && (
                      <span className="text-[11px] text-[var(--text-muted)] block truncate mt-0.5">{step.detail}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-width action sections ── */}
      <div className="space-y-6">



        {/* Needs More Info */}
        {caseData.diagnosis_status === 'NEEDS_INFO' && caseData.ai_next_command && (
          <div className="card border-[var(--warning)]/20">
            <div className="card-header bg-[var(--warning)]/5 flex items-center gap-2">
              <AlertTriangle size={15} className="text-[var(--warning)]" />
              <h3 className="text-[14px] font-semibold text-[var(--warning)]">Additional Evidence Required</h3>
            </div>
            <div className="card-body space-y-4">
              <p className="text-[var(--text-tertiary)] text-[13px]">Execute the following command in Packet Tracer and paste the output below.</p>
              
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Command</label>
                <div className="flex items-center justify-between p-2.5 terminal-block">
                  <code className="text-green-400 select-all">{caseData.ai_next_command}</code>
                  <button onClick={() => handleCopy(caseData.ai_next_command || '')} className="btn btn-secondary text-[11px] py-1 px-2 h-auto">
                    <ClipboardCopy size={13} />
                    {copiedText === caseData.ai_next_command ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Paste Output</label>
                <textarea 
                  className="textarea-field font-mono text-[12px]" rows={5}
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

        {/* Junior Submit For Review */}
        {caseData.diagnosis_status === 'DIAGNOSED' && !caseData.review && userRole === 'junior' && (
          <div className="card">
            <div className="card-header bg-[var(--bg-secondary)]/50">
              <h3 className="card-title flex items-center gap-2">
                <Check size={15} className="text-[var(--accent)]" /> AI Diagnosis Complete
              </h3>
            </div>
            <div className="card-body space-y-5">
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">AI Diagnosis</label>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{caseData.ai_root_cause}</p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => submitForReviewMutation.mutate()}
                  disabled={submitForReviewMutation.isPending}
                  className="btn btn-primary"
                >
                  {submitForReviewMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Submit to Senior for Review'}
                </button>
              </div>
            </div>
          </div>
        )}

        {caseData.diagnosis_status === 'PENDING_REVIEW' && !caseData.review && userRole === 'junior' && (
          <div className="card border-[var(--info)]/20 bg-[var(--info)]/5 p-4 flex items-start gap-3">
            <Loader2 size={18} className="text-[var(--info)] animate-spin" />
            <div>
              <p className="font-semibold text-[13px] text-[var(--text-primary)]">Pending Senior Review</p>
              <p className="mt-1.5 text-[12px] text-[var(--text-tertiary)] leading-relaxed">This case has been submitted and is waiting for a Senior Engineer to review the diagnosis.</p>
            </div>
          </div>
        )}

        {/* Human Review (Senior) */}
        {caseData.diagnosis_status === 'PENDING_REVIEW' && !caseData.review && userRole === 'senior' && (
          <div className="card">
            <div className="card-header bg-[var(--bg-secondary)]/50">
              <h3 className="card-title flex items-center gap-2">
                <Check size={15} className="text-[var(--accent)]" /> Senior Human Review
              </h3>
            </div>
            <div className="card-body space-y-5">
              
              {/* Full AI Diagnosis Summary for Senior */}
              <div className="space-y-3">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">AI Root Cause</label>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{caseData.ai_root_cause || '—'}</p>
                </div>

                {caseData.ai_evidence && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Evidence</label>
                    <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed break-words">{caseData.ai_evidence}</p>
                  </div>
                )}

                {caseData.ai_reason && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Reasoning</label>
                    <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed break-words">{caseData.ai_reason}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                    <label className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">OSI Layer</label>
                    <span className="text-[var(--accent)] font-semibold text-[13px]">{caseData.ai_osi_layer || '—'}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                    <label className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Confidence</label>
                    <span className="text-[var(--text-secondary)] font-semibold text-[13px]">{caseData.ai_confidence || '—'}</span>
                  </div>
                </div>

                {caseData.ai_next_command && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Next Command</label>
                    <code className="text-green-400 text-[12px] font-mono">{caseData.ai_next_command}</code>
                  </div>
                )}

                {caseData.ai_fix_steps && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Fix Steps</label>
                    <pre className="text-[12px] text-[var(--text-tertiary)] leading-relaxed whitespace-pre-wrap break-words font-mono">{caseData.ai_fix_steps}</pre>
                  </div>
                )}

                {caseData.ai_verification_command && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Verification Command</label>
                    <code className="text-green-400 text-[12px] font-mono">{caseData.ai_verification_command}</code>
                  </div>
                )}
              </div>

              {reviewMode === 'none' && (
                <div className="flex gap-2">
                  <button onClick={() => setReviewMode('accept')} className="btn btn-success">✓ Accept</button>
                  <button onClick={() => setReviewMode('edit')} className="btn btn-secondary">✎ Edit</button>
                  <button onClick={() => setReviewMode('reject')} className="btn btn-danger">✕ Reject</button>
                </div>
              )}

              {reviewMode === 'accept' && (
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)] space-y-3 max-w-lg">
                  <p className="text-[13px] font-medium text-[var(--text-secondary)]">Confirm the AI diagnosis is correct?</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">This accepts the AI diagnosis and moves the case to the fix and verification stage.</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setReviewMode('none')} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleAcceptReview} disabled={reviewMutation.isPending} className="btn btn-success">
                      {reviewMutation.isPending && <Loader2 size={14} className="animate-spin" />} Confirm Accept
                    </button>
                  </div>
                </div>
              )}

              {reviewMode === 'reject' && (
                <div className="p-4 bg-[var(--danger)]/5 rounded-lg border border-[var(--danger)]/20 space-y-3 max-w-lg">
                  <p className="text-[13px] font-medium text-[var(--danger)]">Provide a rejection reason:</p>
                  <textarea 
                    className="textarea-field" rows={3}
                    placeholder="Why is this diagnosis incorrect? What did the AI get wrong?" 
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setReviewMode('none')} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleRejectReview} disabled={reviewMutation.isPending || !rejectReason.trim()} className="btn btn-danger disabled:opacity-50">
                      {reviewMutation.isPending && <Loader2 size={14} className="animate-spin" />} Reject Diagnosis
                    </button>
                  </div>
                </div>
              )}

              {reviewMode === 'edit' && (
                <div className="p-5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)] space-y-4">
                  <h4 className="text-[14px] font-semibold text-[var(--text-secondary)]">Edit Diagnosis</h4>
                  <p className="text-[12px] text-[var(--text-tertiary)]">Modify the AI diagnosis below. The original AI output will be preserved for auditing.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Root Cause</label>
                      <input type="text" className="input-field" value={editRootCause} onChange={e => setEditRootCause(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">OSI Layer</label>
                      <input type="text" className="input-field" value={editOsiLayer} onChange={e => setEditOsiLayer(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Confidence</label>
                      <select className="input-field" value={editConfidence} onChange={e => setEditConfidence(e.target.value)}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Evidence</label>
                      <input type="text" className="input-field" value={editEvidence} onChange={e => setEditEvidence(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="input-label">Analysis Explanation</label>
                      <textarea className="textarea-field min-h-[60px]" rows={2} value={editReasonText} onChange={e => setEditReasonText(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="input-label">Fix Steps</label>
                      <textarea className="textarea-field font-mono text-[12px] min-h-[60px]" rows={2} value={editFixSteps} onChange={e => setEditFixSteps(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Verification Command</label>
                      <input type="text" className="input-field font-mono text-[12px]" value={editVerificationCommand} onChange={e => setEditVerificationCommand(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label text-[var(--warning)]">Override Reason *</label>
                      <input type="text" className="input-field border-[var(--warning)]/50 focus:border-[var(--warning)] focus:ring-[var(--warning)]" placeholder="Why are you overriding the AI?" value={editReason} onChange={e => setEditReason(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border-subtle)]">
                    <button onClick={() => setReviewMode('none')} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleEditReview} disabled={reviewMutation.isPending || !editReason.trim()} className="btn btn-warning disabled:opacity-50">
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
          <div className={`card p-5 ${
            caseData.review?.status === 'Accepted' ? 'border-[var(--success)]/20 bg-[var(--success)]/5' :
            caseData.review?.status === 'Edited' ? 'border-[var(--warning)]/20 bg-[var(--warning)]/5' :
            'border-[var(--danger)]/20 bg-[var(--danger)]/5'
          }`}>
            <div className="flex items-start gap-3">
              {caseData.review?.status === 'Rejected' ? (
                <XCircle size={18} className="text-[var(--danger)] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={18} className={
                  `shrink-0 mt-0.5 ${caseData.review?.status === 'Accepted' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`
                } />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-[var(--text-primary)]">
                  Review Decision: <span className={
                    caseData.review?.status === 'Accepted' ? 'text-[var(--success)]' :
                    caseData.review?.status === 'Edited' ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
                  }>{caseData.review?.status}</span>
                </p>
                {caseData.review?.reason && (
                  <div className="mt-2 text-[12px] text-[var(--text-tertiary)] leading-relaxed space-y-2">
                    {caseData.review.reason.startsWith('{') ? (() => {
                      try {
                        const p = JSON.parse(caseData.review!.reason!);
                        return (
                          <div className="space-y-3">
                            {p.comment && (
                              <div>
                                <strong className="text-[var(--text-secondary)]">Senior Comment:</strong>
                                <p className="mt-0.5">{p.comment}</p>
                              </div>
                            )}
                            {p.original_diagnosis && (
                              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)]">
                                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Original AI Diagnosis (Preserved)</label>
                                <p className="text-[12px] text-[var(--text-tertiary)]">
                                  <strong>Root Cause:</strong> {p.original_diagnosis.root_cause || '—'}<br />
                                  <strong>OSI Layer:</strong> {p.original_diagnosis.osi_layer || '—'} · <strong>Confidence:</strong> {p.original_diagnosis.confidence || '—'}
                                </p>
                              </div>
                            )}
                            {p.edited_diagnosis && (
                              <div className="p-3 bg-[var(--warning)]/10 rounded-lg border border-[var(--warning)]/20">
                                <label className="text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider block mb-1.5">Senior's Edited Diagnosis</label>
                                <p className="text-[12px] text-[var(--text-secondary)]">
                                  <strong>Root Cause:</strong> {p.edited_diagnosis.root_cause || '—'}<br />
                                  <strong>OSI Layer:</strong> {p.edited_diagnosis.osi_layer || '—'} · <strong>Confidence:</strong> {p.edited_diagnosis.confidence || '—'}<br />
                                  {p.edited_diagnosis.fix_steps && <><strong>Fix Steps:</strong> {p.edited_diagnosis.fix_steps}<br /></>}
                                  {p.edited_diagnosis.verification_command && <><strong>Verification:</strong> <code className="font-mono text-green-400">{p.edited_diagnosis.verification_command}</code></>}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      } catch { return caseData.review!.reason; }
                    })() : caseData.review.reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fix Steps */}
        {isReviewed && (caseData.review?.status === 'Accepted' || caseData.review?.status === 'Edited') && !inVerificationMode && (
          <div className="card">
            <div className="card-header bg-transparent border-none">
              <h3 className="card-title flex items-center gap-2">
                <Terminal size={15} className="text-[var(--accent)]" />
                Recommended Fix
              </h3>
            </div>
            <div className="card-body pt-0 space-y-4">
              <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[12px] text-[var(--warning)]">
                ⚠ Manual action required. Apply these commands in Cisco Packet Tracer. NetSage does not modify live devices.
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Fix Commands</label>
                <pre className="terminal-block whitespace-pre-wrap break-all">
                  {finalDiag.fix_steps || 'No automated fix commands were identified.'}
                </pre>
              </div>

              {finalDiag.verification_command && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Verification Command</label>
                  <code className="terminal-block py-2 block text-green-400">
                    {finalDiag.verification_command}
                  </code>
                </div>
              )}

              <button onClick={() => setInVerificationMode(true)} className="btn btn-primary w-full mt-2 justify-center">
                Proceed to Verification →
              </button>
            </div>
          </div>
        )}

        {/* Verification */}
        {inVerificationMode && (
          <div className="card">
            <div className="card-header bg-[var(--bg-secondary)]/50">
              <h3 className="card-title flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--accent)]" />
                Verification
              </h3>
            </div>
            <div className="card-body space-y-5">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Run This Command</label>
                <div className="flex items-center justify-between p-2.5 terminal-block">
                  <code className="text-green-400 select-all">
                    {finalDiag.verification_command || 'show ip interface brief'}
                  </code>
                  <button onClick={() => handleCopy(finalDiag.verification_command || '')} className="btn btn-secondary text-[11px] py-1 px-2 h-auto">
                    <Copy size={13} /> {copiedText === (finalDiag.verification_command) ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide block mb-1.5">Paste Output</label>
                <textarea 
                  className="textarea-field font-mono text-[12px]" rows={6}
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
                <div className={`p-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] ${
                  caseData.diagnosis_status === 'RESOLVED' 
                    ? 'bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]' 
                    : 'bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)]'
                }`}>
                  {caseData.diagnosis_status === 'RESOLVED' ? (
                    <><CheckCircle2 size={16} /> Issue Resolved Successfully</>
                  ) : (
                    <><XCircle size={16} /> Issue Not Resolved. Return to Troubleshooting.</>
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
