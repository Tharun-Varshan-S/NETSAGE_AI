import { useState } from 'react';
import DataIngestion from './pages/DataIngestion';
import Dashboard from './pages/Dashboard';
import ReviewScreen from './pages/ReviewScreen';
import Cases from './pages/Cases';
import HumanReviews from './pages/HumanReviews';
import Evaluation from './pages/Evaluation';
import { 
  LayoutDashboard, Plus, FolderKanban, UserCheck, ChartNoAxesCombined, Network, Terminal, Search,
  Settings, Bell, Menu, Activity, ChevronDown
} from 'lucide-react';

type ActivePage = 'dashboard' | 'diagnose' | 'cases' | 'reviews' | 'evaluation' | 'diagnostics' | 'cli';

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('dashboard');
  const [activeCaseId, setActiveCaseId] = useState<number | null>(null);
  const [activeCaseIdString, setActiveCaseIdString] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard' as const, name: 'Dashboard', icon: LayoutDashboard },
        { id: 'diagnose' as const, name: 'New Diagnosis', icon: Plus },
        { id: 'cases' as const, name: 'Cases', icon: FolderKanban },
      ]
    },
    {
      title: 'REVIEW',
      items: [
        { id: 'reviews' as const, name: 'Human Reviews', icon: UserCheck },
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'evaluation' as const, name: 'Evaluation', icon: ChartNoAxesCombined },
      ]
    },
    {
      title: 'NETWORK',
      items: [
        { id: 'diagnostics' as const, name: 'Diagnostics', icon: Network },
        { id: 'cli' as const, name: 'CLI Reference', icon: Terminal },
      ]
    }
  ];

  const isActive = (id: string) => currentPage === id && activeCaseId === null;

  return (
    <div className="flex h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] font-sans overflow-hidden">
      
      {/* ── Single Professional Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-[240px]' : 'w-0 hidden'} transition-all duration-300 flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] shrink-0 z-20`}>
        
        {/* Brand Header */}
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[14px] text-white tracking-tight leading-tight">NetSage AI</span>
            <span className="text-[11px] text-[var(--text-secondary)] leading-tight">AI Network Diagnostics</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-tertiary)] focus-within:border-[var(--accent)] transition-colors">
            <Search size={14} className="text-[var(--text-secondary)]" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full text-white placeholder-[var(--text-tertiary)] text-[13px]" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 pb-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">{group.title}</h4>
              <div className="space-y-0.5">
                {group.items.map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleMenuClick(id)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors
                      ${isActive(id)
                        ? 'bg-[var(--bg-active)] text-white'
                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'
                      }`}
                  >
                    <Icon size={16} className={isActive(id) ? 'text-[var(--accent-hover)]' : 'text-[var(--text-secondary)]'} />
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Nav */}
        <div className="px-3 py-4 border-t border-[var(--border-default)] space-y-1 mt-auto">
          <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors">
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <div className="px-3 py-1.5 flex items-center gap-3 text-[13px] font-medium text-[var(--text-secondary)]">
            <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
            <span>System Online</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-app)]">
        
        {/* Topbar */}
        <header className="h-[52px] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0 bg-[var(--bg-app)] z-10">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[var(--text-secondary)] hover:text-white transition-colors">
              <Menu size={18} />
            </button>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]">
              <span className="hover:text-white cursor-pointer transition-colors">Home</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-white">
                {activeCaseIdString ? `Diagnosis Review` : 
                 currentPage === 'dashboard' ? 'Dashboard' : 
                 currentPage === 'diagnose' ? 'New Diagnosis' :
                 currentPage === 'cases' ? 'Cases' : 
                 currentPage === 'reviews' ? 'Human Reviews' : 'Evaluation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hidden sm:flex">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div>
              System Online
            </div>
            
            <button className="text-[var(--text-secondary)] hover:text-white transition-colors relative">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent)] rounded-full border border-[var(--bg-app)]"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-hover)] pl-2 pr-1 py-1 rounded-md transition-colors">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-[var(--accent)] to-[var(--info)] flex items-center justify-center text-[10px] font-bold text-white">
                TH
              </div>
              <span className="text-[13px] font-medium text-white hidden sm:inline">Tharun</span>
              <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative z-0">
          <div className="page-container">
            {currentPage === 'dashboard' && <Dashboard />}
            
            {currentPage === 'diagnose' && (
              activeCaseId === null ? (
                <DataIngestion onCaseCreated={navigateToDiagnoseCase} />
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
            {currentPage === 'diagnostics' && <div className="text-[var(--text-muted)]">Network Diagnostics Tools...</div>}
            {currentPage === 'cli' && <div className="text-[var(--text-muted)]">CLI Reference Library...</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
