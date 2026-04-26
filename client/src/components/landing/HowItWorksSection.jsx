const STEPS = [
  {
    num: '01',
    emoji: '🧭',
    title: 'Traveler Starts a Trip',
    desc: 'Open SAHELI, register your journey, and optionally pair a BLE smartwatch for live heart rate data. GPS tracking begins automatically.',
    color: '#4285F4',
  },
  {
    num: '02',
    emoji: '💓',
    title: 'Continuous Biometric Monitoring',
    desc: 'Heart rate is streamed to the admin command center every 3 seconds. A reading above 120 BPM for 30+ seconds auto-triggers a security warning — before you even act.',
    color: '#34A853',
  },
  {
    num: '03',
    emoji: '🚨',
    title: 'SOS Alert Activated',
    desc: 'Hold the SOS button for 1.5s. An incident is created instantly, a 7-second audio clip is captured, and all security personnel are notified in real time.',
    color: '#EA4335',
  },
  {
    num: '04',
    emoji: '🤖',
    title: 'AI Analysis & Security Response',
    desc: 'Gemini AI analyzes audio and biometrics in seconds, generating a risk report on the admin dashboard. Security dispatches, messages via QuickCall, and resolves the incident.',
    color: '#9333ea',
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="bg-brand-surface py-24 px-4 transition-colors duration-300">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-xs font-bold uppercase tracking-widest text-[#4285F4] mb-3">How It Works</p>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-text">
          From check-in to{' '}
          <span className="bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
            crisis resolved
          </span>
          , in seconds.
        </h2>
      </div>

      <div className="space-y-5">
        {STEPS.map(({ num, emoji, title, desc, color }) => (
          <div key={num}
            className="flex gap-6 bg-brand-card border border-brand-border hover:border-[#4285F4]/40 rounded-2xl p-6 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border border-brand-border bg-brand-bg"
                style={{ color }}>
                {emoji}
              </div>
              <span className="text-xs font-bold" style={{ color }}>{num}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-text mb-2">{title}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
