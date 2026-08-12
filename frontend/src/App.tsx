import { useState } from 'react';
import CaseQueue from './pages/CaseQueue';
import Dashboard from './pages/Dashboard';
import ReviewScreen from './pages/ReviewScreen';
import { Activity, LayoutDashboard, ListTodo } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'queue' | 'dashboard' | 'review'>('queue');
  const [activeCaseId, setActiveCaseId] = useState<number | null>(null);

  const navigateToReview = (id: number) => {
    setActiveCaseId(id);
    setView('review');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white shadow p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Activity className="text-blue-400" />
          NetSage AI
        </div>
        <nav className="flex gap-4">
          <button 
            onClick={() => setView('queue')} 
            className={`flex items-center gap-1 transition hover:text-blue-300 ${view === 'queue' ? 'text-blue-400' : 'text-slate-300'}`}
          >
            <ListTodo size={18} /> Queue
          </button>
          <button 
            onClick={() => setView('dashboard')} 
            className={`flex items-center gap-1 transition hover:text-blue-300 ${view === 'dashboard' ? 'text-blue-400' : 'text-slate-300'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
        </nav>
      </header>
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {view === 'queue' && <CaseQueue onSelectCase={navigateToReview} />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'review' && activeCaseId && (
          <ReviewScreen 
            caseId={activeCaseId} 
            onBack={() => setView('queue')} 
          />
        )}
      </main>
    </div>
  );
}
