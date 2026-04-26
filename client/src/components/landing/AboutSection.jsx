const TECH = [
  { name: 'React 18',          category: 'Frontend',   color: '#4285F4' },
  { name: 'Node.js + Express', category: 'Backend',    color: '#34A853' },
  { name: 'MongoDB Atlas',     category: 'Database',   color: '#34A853' },
  { name: 'Socket.IO',         category: 'Real-Time',  color: '#4285F4' },
  { name: 'Gemini 1.5 Flash',  category: 'AI',         color: '#9333ea' },
  { name: 'Web Bluetooth API', category: 'IoT / BLE',  color: '#FBBC04' },
  { name: 'Leaflet.js',        category: 'Mapping',    color: '#34A853' },
  { name: 'JWT Auth',          category: 'Security',   color: '#EA4335' },
];

const AboutSection = () => (
  <section id="about" className="bg-brand-surface py-24 px-4 transition-colors duration-300">
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">

        {/* Left: Mission */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#4285F4] mb-3">The Mission</p>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-6 leading-tight">
            Safety shouldn't depend on{' '}
            <span className="bg-gradient-to-r from-[#EA4335] to-[#FBBC04] bg-clip-text text-transparent">
              luck or reaction time.
            </span>
          </h2>
          <div className="space-y-4 text-brand-muted text-base leading-relaxed">
            <p>
              SAHELI was built in response to a real problem: travelers in unfamiliar places are vulnerable,
              and existing safety tools are too slow, too complicated, or too passive.
            </p>
            <p>
              We built a platform that is{' '}
              <span className="text-brand-text font-semibold">proactive, not reactive</span>{' '}—
              monitoring biometrics continuously, detecting anomalies automatically, and getting security
              personnel moving before the user even realizes they are in danger.
            </p>
            <p>
              Created for the{' '}
              <span className="text-[#4285F4] font-semibold">Google Solution Challenge 2025</span>,
              SAHELI demonstrates how IoT, AI, and real-time web technologies solve a genuine
              human safety problem at scale.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Problem Space',  value: 'Traveler Safety' },
              { label: 'Challenge',      value: 'Google Solution Challenge' },
              { label: 'Platform Type',  value: 'IoT + AI SaaS' },
              { label: 'Response Mode',  value: 'Real-Time' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-brand-card border border-brand-border rounded-xl p-4">
                <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-brand-text">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tech Stack */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#4285F4] mb-5">Technology Stack</p>
          <div className="grid grid-cols-2 gap-3">
            {TECH.map(({ name, category, color }) => (
              <div key={name}
                className="bg-brand-card border border-brand-border hover:border-brand-muted rounded-xl p-4 transition-colors group hover:shadow-sm">
                <p className="text-sm font-bold mb-1 group-hover:scale-105 transition-transform origin-left" style={{ color }}>{name}</p>
                <p className="text-[10px] text-brand-muted uppercase tracking-wider">{category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
