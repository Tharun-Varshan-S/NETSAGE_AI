import { useState } from 'react';
import CaseQueue from './pages/CaseQueue';
import Dashboard from './pages/Dashboard';
import ReviewScreen from './pages/ReviewScreen';
import Cases from './pages/Cases';
import HumanReviews from './pages/HumanReviews';
import Evaluation from './pages/Evaluation';
import { 
  LayoutDashboard, Terminal, Database, ShieldCheck, Award, Activity, ChevronRight
} from 'lucide-react';

type ActivePage = 'dashboard' | 'diagnose' | 'cases' | 'reviews' | 'evaluation';

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('dashboard');
  const [activeCaseId, setActiveCaseId] = useState<number | null>(null);
  const [activeCaseIdString, setActiveCaseIdString] = useState<string | null>(null);

  const navigateToDiagnoseCase = (id: number, caseIdStr: string) => {
    setActiveCaseId(id);
    setActiveCaseIdString(caseIdStr);
    setCurrentPage('diagnose');
  };

  const handleMenuClick = (page: ActivePage) => {
    setCurrentPage(page);
    setActiveCaseId(null);
    setActiveCaseIdString(null);
  };

  const navItems = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'diagnose' as const, name: 'Diagnose', icon: Terminal },
    { id: 'cases' as const, name: 'Case Browser', icon: Database },
    { id: 'reviews' as const, name: 'Reviews', icon: ShieldCheck },
    { id: 'evaluation' as const, name: 'Evaluation', icon: Award },
  ];

  const isActive = (id: ActivePage) => currentPage === id && activeCaseId === null;

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] select-none">
      
      {/* ── Sidebar ── */}
      <aside className="w-[220px] flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] shrink-0">
        
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-[var(--text-primary)]">NetSage AI</div>
              <div className="text-[11px] text-[var(--text-muted)]">Network Diagnostics</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleMenuClick(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-100
                ${isActive(id)
                  ? 'bg-[var(--accent-muted)] text-[var(--accent-hover)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
            >
              <Icon size={16} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        {/* Status Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--success)] pulse-dot" />
            <span>API Connected</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <header className="h-[52px] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)]">
            <span className="font-semibold text-[var(--text-secondary)]">NetSage AI</span>
            {activeCaseIdString && (
              <>
                <ChevronRight size={14} className="text-[var(--text-muted)]" />
                <span className="text-[var(--accent)] font-medium">{activeCaseIdString}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              Online
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {currentPage === 'dashboard' && <Dashboard />}
            
            {currentPage === 'diagnose' && (
              activeCaseId === null ? (
                <CaseQueue onSelectCase={navigateToDiagnoseCase} />
              ) : (
                <ReviewScreen 
                  caseId={activeCaseId} 
                  onBack={() => handleMenuClick('diagnose')} 
                />
              )
            )}

            {currentPage === 'cases' && <Cases />}
            {currentPage === 'reviews' && <HumanReviews />}
            {currentPage === 'evaluation' && <Evaluation />}
          </div>
        </main>
      </div>
    </div>
  );
}
