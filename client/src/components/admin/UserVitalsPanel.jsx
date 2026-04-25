import { Activity, Heart, TrendingUp, TrendingDown, Minus, MapPin, User } from 'lucide-react';

const ZONES = [
  { label: 'Resting',  min: 0,   max: 60,  color: '#3b82f6' },
  { label: 'Normal',   min: 60,  max: 100, color: '#10b981' },
  { label: 'Elevated', min: 100, max: 120, color: '#f59e0b' },
  { label: 'Critical', min: 120, max: 999, color: '#ef4444' },
];
const getZone = (hr) => ZONES.find((z) => hr >= z.min && hr < z.max) || ZONES[1];

const UserVitalsPanel = ({ selectedUser, liveHR, liveLoc }) => {
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
        <Activity size={36} className="text-brand-muted/40" />
        <p className="text-brand-muted text-sm font-medium">No user selected</p>
        <p className="text-brand-muted/60 text-xs">Click a map marker or incident to view vitals</p>
      </div>
    );
  }

  const hr   = liveHR || 70;
  const zone = getZone(hr);
  const pct  = Math.min((hr / 180) * 100, 100);
  const R    = 40;
  const C    = 2 * Math.PI * R;

  const name     = selectedUser.userId?.name || selectedUser.userName || 'Unknown';
  const initials = selectedUser.userId?.avatarInitials || name[0]?.toUpperCase() || 'U';
  const alertLevel = selectedUser.alertLevel || 'normal';

  const ALERT_COLORS = { normal: '#10b981', warning: '#f59e0b', sos: '#ef4444' };
  const alertColor   = ALERT_COLORS[alertLevel];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* User identity */}
      <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl border border-brand-border">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
          style={{ background: `linear-gradient(135deg, ${alertColor}99, ${alertColor}44)`, border: `2px solid ${alertColor}66` }}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brand-text text-sm truncate">{name}</p>
          <p className="text-brand-muted text-xs truncate">{selectedUser.userId?.email}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase"
          style={{ color: alertColor, background: alertColor + '22', borderColor: alertColor + '55' }}>
          {alertLevel}
        </span>
      </div>

      {/* Heart Rate Gauge */}
      <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={14} style={{ color: zone.color }} className={hr > 120 ? 'animate-pulse' : ''} />
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Heart Rate</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Mini gauge */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-[225deg]" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r={R} fill="none" strokeWidth="8"
                stroke="#1f2d45" strokeLinecap="round"
                strokeDasharray={`${C * 0.75} ${C * 0.25}`} />
              <circle cx="48" cy="48" r={R} fill="none" strokeWidth="8"
                stroke={zone.color} strokeLinecap="round"
                strokeDasharray={`${C * 0.75}`}
                strokeDashoffset={C * 0.75 - (pct / 100) * C * 0.75}
                style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black" style={{ color: zone.color }}>{hr}</span>
              <span className="text-[9px] text-brand-muted">BPM</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black" style={{ color: zone.color }}>{zone.label}</p>
            <p className="text-xs text-brand-muted mt-0.5">Heart rate zone</p>
            {hr > 120 && (
              <div className="mt-2 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
                ⚠️ ELEVATED — Monitor closely
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      {liveLoc && (
        <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-brand-accent" />
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Last Location</span>
          </div>
          <p className="text-sm font-mono text-brand-subtle">
            {liveLoc.lat?.toFixed(6)}, {liveLoc.lng?.toFixed(6)}
          </p>
          <p className="text-xs text-brand-muted mt-1">Updated just now</p>
        </div>
      )}
    </div>
  );
};

export default UserVitalsPanel;
