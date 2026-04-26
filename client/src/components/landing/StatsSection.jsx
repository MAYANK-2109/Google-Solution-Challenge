import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function useCountUp(target, isVisible) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible || target === 0) { setCount(target); return; }
    let start = 0;
    const duration = 1600;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [isVisible, target]);
  return count;
}

const StatCard = ({ value, suffix, label, color, icon, isVisible }) => {
  const count = useCountUp(value, isVisible);
  return (
    <div className="flex flex-col items-center gap-3 p-8 bg-brand-card rounded-2xl shadow-sm hover:shadow-md border border-brand-border transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color} bg-current/10 mb-1`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-5xl font-black tracking-tight ${color} group-hover:scale-105 transition-transform duration-300`}>
        {count}{suffix}
      </p>
      <p className="text-sm text-brand-muted font-medium text-center">{label}</p>
    </div>
  );
};

const StatsSection = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState({ totalTravelers: 0, totalIncidents: 0, resolvedIncidents: 0, activeTrips: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/stats`)
      .then(r => setStats(r.data))
      .catch(() => {}) // silently fail — zeros are still meaningful
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const cards = [
    { value: stats.totalTravelers,   suffix: '', label: 'Registered Travelers',    color: 'text-[#4285F4]', icon: '🧑‍💼' },
    { value: stats.totalIncidents,   suffix: '', label: 'Incidents Logged',         color: 'text-[#EA4335]', icon: '🚨' },
    { value: stats.resolvedIncidents,suffix: '', label: 'Incidents Resolved',       color: 'text-[#34A853]', icon: '✅' },
    { value: stats.activeTrips,      suffix: '', label: 'Active Trips Right Now',   color: 'text-[#FBBC04]', icon: '📍' },
  ];

  return (
    <section className="bg-brand-surface py-20 px-4 transition-colors duration-300">
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#4285F4] mb-3">Live Platform Data</p>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-text">
            Real numbers.{' '}
            <span className="bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
              Real impact.
            </span>
          </h2>
          <p className="text-brand-muted mt-2 text-sm">
            {loading ? 'Fetching live data from the platform…' : 'Pulled live from the SAHELI database right now.'}
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((s) => <StatCard key={s.label} {...s} isVisible={visible && !loading} />)}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
