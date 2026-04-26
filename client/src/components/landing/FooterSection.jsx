import { Link } from 'react-router-dom';
import { Shield, Linkedin, ArrowRight } from 'lucide-react';

const FooterSection = () => (
  <footer className="bg-brand-bg border-t border-brand-border transition-colors duration-300">
    {/* CTA banner */}
    <div className="bg-gradient-to-r from-[#4285F4]/10 via-[#34A853]/5 to-[#4285F4]/10 border-b border-[#4285F4]/10 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-black text-brand-text mb-3">Ready to make every journey safer?</h2>
        <p className="text-brand-muted mb-8">Join SAHELI and put a real-time safety companion on every trip.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all duration-300 active:scale-95">
            Create Free Account
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login"
            className="inline-flex items-center justify-center px-8 py-4 border border-brand-border hover:border-[#4285F4]/40 text-brand-text hover:text-[#4285F4] font-semibold rounded-2xl transition-all duration-300">
            Sign In
          </Link>
        </div>
      </div>
    </div>

    {/* Footer links */}
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="font-black text-[#38bdf8] leading-none">SAHELI</p>
              <p className="text-[10px] text-brand-muted">Real-Time Safety Platform</p>
            </div>
          </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-brand-muted">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Use Cases', href: '#use-cases' },
            { label: 'About', href: '#about' },
            { label: 'Developer', href: '#developer' },
          ].map(({ label, href }) => (
            <a key={label} href={href} className="hover:text-[#4285F4] transition-colors">{label}</a>
          ))}
        </div>

        <a
          href="https://www.linkedin.com/in/mayank-kumar-chandrikapure-25115061bh/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl border border-brand-border hover:border-[#0077b5]/50 hover:bg-[#0077b5]/10 text-brand-muted hover:text-[#0077b5] transition-all"
        >
          <Linkedin size={18} />
        </a>
      </div>

      <div className="mt-8 pt-8 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-brand-muted">
        <p>© {new Date().getFullYear()} SAHELI. Built by Mayank Kumar Chandrikapure.</p>
        <p>Google Solution Challenge 2025 · All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default FooterSection;
