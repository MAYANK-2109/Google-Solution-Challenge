import { Heart, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

const ZONES = [
  { label: 'Resting',   min: 0,   max: 60,  color: 'text-blue-400',    bg: 'bg-blue-500/20',    bar: 'bg-blue-500' },
  { label: 'Normal',    min: 60,  max: 100, color: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500' },
  { label: 'Elevated',  min: 100, max: 120, color: 'text-amber-400',   bg: 'bg-amber-500/20',   bar: 'bg-amber-500' },
  { label: 'Critical',  min: 120, max: 999, color: 'text-red-400',     bg: 'bg-red-500/20',     bar: 'bg-red-500' },
];

const getZone = (hr) => ZONES.find((z) => hr >= z.min && hr < z.max) || ZONES[1];

const BiometricPanel = ({ heartRate, trend, isActive }) => {
  const zone = getZone(heartRate);
  const pct  = Math.min((heartRate / 180) * 100, 100);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // SVG arc for circular gauge
  const R = 54;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C * 0.75; // 270° arc

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 ${zone.bg} rounded-xl flex items-center justify-center`}>
          <Activity size={20} className={zone.color} />
        </div>
        <div>
          <h2 className="font-bold text-brand-text">Heart Rate Monitor</h2>
          <p className="text-xs text-brand-muted">Biometric telemetry · live</p>
        </div>
      </div>

      {isActive ? (
        <div className="flex items-center gap-6">
          {/* Circular gauge */}
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-[225deg]" viewBox="0 0 128 128">
              {/* Track */}
              <circle cx="64" cy="64" r={R} fill="none" strokeWidth="10"
                className="stroke-brand-border" strokeLinecap="round"
                strokeDasharray={`${C * 0.75} ${C * 0.25}`} />
              {/* Progress */}
              <circle cx="64" cy="64" r={R} fill="none" strokeWidth="10"
                className={`transition-all duration-700 ease-out ${zone.bar === 'bg-red-500' ? 'stroke-red-500' : zone.bar === 'bg-amber-500' ? 'stroke-amber-500' : zone.bar === 'bg-emerald-500' ? 'stroke-emerald-500' : 'stroke-blue-500'}`}
                strokeLinecap="round"
                strokeDasharray={`${C * 0.75}`}
                strokeDashoffset={offset} />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${zone.color}`}>{heartRate}</span>
              <span className="text-xs text-brand-muted font-medium">BPM</span>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 space-y-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${zone.bg} ${zone.color} border border-current/20`}>
              <Heart size={11} className={heartRate > 120 ? 'animate-pulse' : ''} />
              {zone.label}
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-brand-subtle">
              <TrendIcon size={16} className={zone.color} />
              <span>Heart rate is <span className={zone.color}>{trend === 'up' ? 'rising' : trend === 'down' ? 'falling' : 'stable'}</span></span>
            </div>

            {heartRate > 120 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
                ⚠️ Elevated HR detected. Auto-alert sent to security if sustained &gt;30s.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Heart size={40} className="text-brand-muted/40" />
          <p className="text-brand-muted text-sm text-center">Start a journey to begin biometric monitoring</p>
        </div>
      )}
    </div>
  );
};

export default BiometricPanel;
