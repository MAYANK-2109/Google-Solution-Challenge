import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Use Cases', href: '#use-cases' },
    { label: 'About', href: '#about' },
    { label: 'Developer', href: '#developer' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-brand-bg/90 backdrop-blur-xl shadow-md border-b border-brand-border'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-4">
        {/* Logo — SAHELI */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:shadow-sky-500/50 transition-shadow">
            <Shield size={20} className="text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-[#38bdf8]">
            SAHELI
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href }) => (
            <a key={label} href={href}
              className="relative group text-sm font-medium text-brand-muted hover:text-[#4285F4] transition-colors duration-300 py-1"
            >
              {label}
              <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-[#4285F4] rounded-full opacity-0 -translate-x-1/2 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0" />
            </a>
          ))}
        </div>

        {/* Right: Theme + CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface text-brand-muted hover:text-brand-text transition-all"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/login"
            className="px-5 py-2 text-sm font-semibold text-brand-text hover:text-[#4285F4] border border-brand-border hover:border-[#4285F4]/40 rounded-xl transition-all duration-200">
            Log In
          </Link>
          <Link to="/register"
            className="px-5 py-2 text-sm font-bold text-white bg-[#4285F4] hover:bg-[#3367d6] rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 active:scale-95">
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={toggleTheme}
            className="p-2 rounded-xl border border-brand-border text-brand-muted">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="p-2 text-brand-text hover:text-[#4285F4]" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-surface border-b border-brand-border px-4 pb-6 space-y-1 animate-fade-in">
          {navLinks.map(({ label, href }) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm font-medium text-brand-text hover:text-[#4285F4] border-b border-brand-border transition-colors">
              {label}
            </a>
          ))}
          <div className="flex gap-3 pt-4">
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-semibold border border-brand-border text-brand-text rounded-xl">
              Log In
            </Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-bold bg-[#4285F4] text-white rounded-xl">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
