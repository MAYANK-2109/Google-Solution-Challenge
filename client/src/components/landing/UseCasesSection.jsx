import { GraduationCap, Briefcase, Hospital, Users } from 'lucide-react';

const CASES = [
  {
    icon: GraduationCap,
    title: 'University Campuses',
    desc: 'Protect students traveling between campuses, hostels, or on field trips. Admins get live vitals and can respond before an incident escalates.',
    examples: ['Student Safety Patrols', 'Field Trip Monitoring', 'Late-Night Walk Alerts'],
    color: '#4285F4',
  },
  {
    icon: Briefcase,
    title: 'Corporate Travel Programs',
    desc: "Ensure employee safety on business trips in unfamiliar cities. Security teams get a live view of every traveler's status globally.",
    examples: ['Employee Location', 'HR Duty of Care', 'International Travel Safety'],
    color: '#FBBC04',
  },
  {
    icon: Hospital,
    title: 'Healthcare & Field Workers',
    desc: 'Safeguard nurses, paramedics, and social workers working alone in the field. Biometric stress detection escalates automatically.',
    examples: ['Lone Worker Safety', 'Biometric Stress Detection', 'Instant Dispatch'],
    color: '#EA4335',
  },
  {
    icon: Users,
    title: 'Community Safety Programs',
    desc: 'Built for NGOs and community organizations running safety programs for vulnerable individuals traveling in high-risk areas.',
    examples: ['Volunteer Tracking', 'Community Watch', 'Group Journey Monitoring'],
    color: '#34A853',
  },
];

const UseCasesSection = () => (
  <section id="use-cases" className="bg-brand-bg py-24 px-4 transition-colors duration-300">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-xs font-bold uppercase tracking-widest text-[#4285F4] mb-3">Use Cases</p>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-4">
          Built for any environment{' '}
          <span className="bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
            where safety matters.
          </span>
        </h2>
        <p className="text-brand-muted max-w-lg mx-auto text-base">
          SAHELI adapts to any organization that puts people's safety first.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {CASES.map(({ icon: Icon, title, desc, examples, color }) => (
          <div key={title}
            className="group bg-brand-card border border-brand-border hover:border-[#4285F4]/40 rounded-2xl p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
              style={{ background: `${color}15` }}>
              <Icon size={26} style={{ color }} />
            </div>
            <h3 className="text-xl font-bold text-brand-text mb-3">{title}</h3>
            <p className="text-brand-muted text-sm leading-relaxed mb-5">{desc}</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <span key={ex}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full border border-brand-border text-brand-muted bg-brand-bg">
                  {ex}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default UseCasesSection;
