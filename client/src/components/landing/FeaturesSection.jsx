import { Shield, Heart, Radio, Brain, MapPin, Bluetooth } from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    title: 'One-Hold SOS',
    desc: 'Hold for 1.5 seconds to send an instant emergency alert to security. Deliberate trigger prevents false alarms.',
    tag: 'Critical',
    iconColor: '#EA4335',
    tagBg: 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/20',
  },
  {
    icon: Heart,
    title: 'Live Biometric Monitoring',
    desc: 'Continuous heart rate tracking every 3 seconds. Elevated readings automatically trigger a security warning.',
    tag: 'Real-Time',
    iconColor: '#EA4335',
    tagBg: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  },
  {
    icon: Bluetooth,
    title: 'Smartwatch BLE Integration',
    desc: 'Pair any BLE heart rate monitor directly from your browser using the Web Bluetooth API. No app download needed.',
    tag: 'Bluetooth',
    iconColor: '#4285F4',
    tagBg: 'bg-[#4285F4]/10 text-[#4285F4] border-[#4285F4]/20',
  },
  {
    icon: Brain,
    title: 'Gemini AI Risk Reports',
    desc: 'On every SOS, Gemini 1.5 Flash analyzes audio and biometrics to generate a live situational risk report for security.',
    tag: 'AI-Powered',
    iconColor: '#9333ea',
    tagBg: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
  {
    icon: MapPin,
    title: 'Live GPS Tracking',
    desc: 'Every active traveler is pinned on a real-time map on the admin dashboard. Full location history is saved per trip.',
    tag: 'Live Map',
    iconColor: '#34A853',
    tagBg: 'bg-[#34A853]/10 text-[#34A853] border-[#34A853]/20',
  },
  {
    icon: Radio,
    title: 'Admin Command Center',
    desc: 'A dedicated security dashboard with live crisis feed, incident management, QuickCall messaging, and traveler vitals.',
    tag: 'Admin',
    iconColor: '#FBBC04',
    tagBg: 'bg-[#FBBC04]/10 text-[#FBBC04] border-[#FBBC04]/20',
  },
];

const FeaturesSection = () => (
  <section id="features" className="bg-brand-bg py-24 px-4 transition-colors duration-300">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-xs font-bold uppercase tracking-widest text-[#4285F4] mb-3">Platform Features</p>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-4">
          Everything security needs.{' '}
          <span className="bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
            Everything travelers deserve.
          </span>
        </h2>
        <p className="text-brand-muted max-w-xl mx-auto text-base leading-relaxed">
          A full IoT safety stack — from smartwatch to security command center — designed for real emergencies.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc, tag, iconColor, tagBg }) => (
          <div key={title}
            className="group bg-brand-card border border-brand-border hover:border-[#4285F4]/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-default hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}18` }}>
                <Icon size={22} style={{ color: iconColor }} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${tagBg}`}>{tag}</span>
            </div>
            <h3 className="text-base font-bold text-brand-text mb-2">{title}</h3>
            <p className="text-sm text-brand-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
