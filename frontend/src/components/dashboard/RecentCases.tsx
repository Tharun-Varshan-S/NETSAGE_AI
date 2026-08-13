import { Shield, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RecentCases() {
  const dummyCases = [
    { id: 'NS-00124', device: 'Router1', issue: 'Interface down on Gi0/1', layer: 'Layer 1', severity: 'High', status: 'Verified', time: '2m ago' },
    { id: 'NS-00123', device: 'SW-Core-1', issue: 'VLAN 20 unreachable', layer: 'Layer 2', severity: 'Medium', status: 'Resolved', time: '15m ago' },
    { id: 'NS-00122', device: 'Router2', issue: 'Route to 10.10.0.0/16 missing', layer: 'Layer 3', severity: 'High', status: 'Analyzing', time: '32m ago' },
    { id: 'NS-00121', device: 'Firewall-1', issue: 'ACL blocking DNS', layer: 'Layer 4', severity: 'Medium', status: 'Pending Review', time: '1h ago' },
    { id: 'NS-00120', device: 'DHCP-Server', issue: 'IP lease allocation failed', layer: 'Layer 7', severity: 'Low', status: 'Resolved', time: '2h ago' },
  ];

  const getSeverityClass = (sev: string) => {
    switch(sev.toLowerCase()) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'verified': case 'resolved': return <CheckCircle2 size={14} className="text-[var(--success)]" />;
      case 'analyzing': return <AlertCircle size={14} className="text-[var(--accent-hover)]" />;
      case 'pending review': return <AlertTriangle size={14} className="text-[var(--warning)]" />;
      default: return <Clock size={14} className="text-[var(--text-secondary)]" />;
    }
  };

  const getStatusTextClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'verified': case 'resolved': return 'text-[var(--success)]';
      case 'analyzing': return 'text-[var(--accent-hover)]';
      case 'pending review': return 'text-[var(--warning)]';
      default: return 'text-[var(--text-secondary)]';
    }
  };

  return (
    <div className="card">
      <div className="card-header border-none pb-2">
        <h3 className="card-title text-[14px]">Recent Diagnoses</h3>
      </div>
      <div className="table-container border-none bg-transparent rounded-none shadow-none">
        <table className="table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Device</th>
              <th>Issue</th>
              <th>OSI Layer</th>
              <th>Severity</th>
              <th>Status</th>
              <th className="text-right">Created</th>
            </tr>
          </thead>
          <tbody>
            {dummyCases.map((c) => (
              <tr key={c.id}>
                <td className="text-[var(--accent-hover)] font-medium cursor-pointer hover:underline">{c.id}</td>
                <td className="text-[var(--text-primary)] font-medium">{c.device}</td>
                <td className="text-[var(--text-secondary)]">{c.issue}</td>
                <td className="text-[var(--text-secondary)]">{c.layer}</td>
                <td><span className={`badge ${getSeverityClass(c.severity)}`}>{c.severity}</span></td>
                <td>
                  <div className="flex items-center gap-1.5 font-medium">
                    {getStatusIcon(c.status)}
                    <span className={getStatusTextClass(c.status)}>{c.status}</span>
                  </div>
                </td>
                <td className="text-right text-[var(--text-tertiary)]">{c.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
