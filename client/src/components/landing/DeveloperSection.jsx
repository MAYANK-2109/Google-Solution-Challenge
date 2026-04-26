import { Linkedin, Code2, Globe, Award } from 'lucide-react';

const SKILLS = [
  'Full Stack Development', 'IoT Systems', 'React & Node.js',
  'MongoDB', 'Socket.IO', 'AI / ML Integration', 'REST APIs', 'Real-Time Systems',
];

const DeveloperSection = () => (
  <section id="developer" className="bg-brand-bg py-24 px-4 transition-colors duration-300">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-xs font-bold uppercase tracking-widest text-[#4285F4] mb-3">The Developer</p>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-text">
          Built with passion,{' '}
          <span className="bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
            one commit at a time.
          </span>
        </h2>
      </div>

      <div className="relative bg-brand-card border border-brand-border rounded-3xl p-8 sm:p-12 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        {/* BG glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4285F4]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#34A853]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Google-color top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC04] to-[#34A853]" />

        <div className="relative flex flex-col sm:flex-row gap-10 items-start">
          {/* Avatar */}
          <div className="shrink-0 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center shadow-xl shadow-blue-500/20 text-white font-black text-4xl">
                MK
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#34A853] rounded-xl flex items-center justify-center shadow-lg">
                <Code2 size={14} className="text-white" />
              </div>
            </div>
            <a
              href="https://www.linkedin.com/in/mayank-kumar-chandrikapure-25115061bh/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#005885] text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/10 active:scale-95"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h3 className="text-2xl font-black text-brand-text">Mayank Kumar Chandrikapure</h3>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/20 uppercase tracking-wider">
                Creator
              </span>
            </div>
            <p className="text-base font-semibold text-[#4285F4] mb-4">Full Stack Developer · IoT & AI Enthusiast</p>
            <p className="text-brand-muted text-sm leading-relaxed mb-6">
              Mayank is a passionate software developer focused on building technology that makes a real-world impact.
              SAHELI is his submission for the Google Solution Challenge 2025, combining his expertise in IoT, real-time systems,
              and AI to create a platform that genuinely improves traveler safety.
              He built the entire stack — from the MERN backend and Socket.IO real-time layer to the React frontend and BLE smartwatch integration.
            </p>

            {/* Achievements */}
            <div className="flex flex-wrap gap-5 mb-6">
              {[
                { icon: Award, label: 'Google Solution Challenge 2025', color: '#FBBC04' },
                { icon: Globe, label: 'Full-Stack MERN Developer', color: '#34A853' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 text-sm font-medium text-brand-muted">
                  <Icon size={15} style={{ color }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s, i) => {
                const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
                const c = colors[i % colors.length];
                return (
                  <span key={s}
                    className="text-[11px] font-semibold px-3 py-1 rounded-full border"
                    style={{ color: c, borderColor: `${c}30`, background: `${c}10` }}>
                    {s}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DeveloperSection;
