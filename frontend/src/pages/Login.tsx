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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-4174-large.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--info)]"></div>
        
        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/90 backdrop-blur-md flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">NetSage AI</h1>
            <p className="text-white/70 text-sm mt-1 font-medium">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[13px] font-medium text-white/80 ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-white/50" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:bg-black/40 focus:border-white/30 focus:outline-none transition-all duration-300"
                  placeholder="junior or senior"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-white/80 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-white/50" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:bg-black/40 focus:border-white/30 focus:outline-none transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-300 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] mt-6 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-white/50">
            <p>Demo accounts: <span className="text-white/80 font-mono">junior:password</span> | <span className="text-white/80 font-mono">senior:password</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
