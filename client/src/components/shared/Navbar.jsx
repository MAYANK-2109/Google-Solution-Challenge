import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Shield, LogOut, Wifi, WifiOff, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-brand-surface/80 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield size={18} className="text-white" />
          </div>
          <div className="leading-none">
            <span className="font-black text-lg text-brand-text tracking-tight">Safe</span>
            <span className="font-black text-lg text-gradient tracking-tight">Stay</span>
          </div>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
            connected
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-red-400 border-red-500/30 bg-red-500/10'
          }`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Offline'}
          </div>

          {/* Role badge */}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            user?.role === 'admin'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {user?.role}
          </span>

          {/* Theme switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface/70 text-brand-muted hover:text-brand-text transition-all duration-200"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow">
            {user?.avatarInitials || user?.name?.[0]?.toUpperCase() || 'U'}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-brand-border hover:border-red-500/50 hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-all duration-200"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
