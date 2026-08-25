import { useState } from 'react';
import { Activity, Lock, User } from 'lucide-react';
import { login } from '../api/client';
import toast from 'react-hot-toast';

interface LoginProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(username, password);
      toast.success('Successfully logged in');
      onLoginSuccess(data.access_token, data.username, data.role);
    } catch (err: any) {
      toast.error(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--info)]"></div>
        
        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--accent)]/20">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">NetSage AI</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[13px] font-medium text-[var(--text-secondary)] ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-[var(--text-tertiary)]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-[var(--accent)] focus:outline-none transition-colors"
                  placeholder="junior or senior"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-[var(--text-secondary)] ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-[var(--text-tertiary)]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-[var(--accent)] focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg py-2.5 text-sm font-medium transition-colors mt-6 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
            <p>Demo accounts: <span className="text-[var(--text-secondary)] font-mono">junior:password</span> | <span className="text-[var(--text-secondary)] font-mono">senior:password</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
