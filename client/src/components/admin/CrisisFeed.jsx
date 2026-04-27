import { useRef, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Loader } from 'lucide-react';

const ICON_MAP = {
  SOS:     { icon: AlertTriangle, cls: 'text-red-400',   bg: 'bg-red-500/15 border-red-500/30',    badge: 'badge-sos' },
  Warning: { icon: AlertCircle,   cls: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', badge: 'badge-warning' },
  Normal:  { icon: Info,          cls: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', badge: 'badge-normal' },
};

const STATUS_BADGE = {
  open:         'bg-red-500/20 text-red-400 border-red-500/30',
  acknowledged: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  resolved:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const CrisisFeed = ({ incidents, onSelect, selectedId }) => {
  const feedRef = useRef(null);
  const [showAll, setShowAll] = useState(false);

  // Auto-scroll to top when new SOS arrives
  useEffect(() => {
    if (feedRef.current && incidents[0]?.type === 'SOS') {
      feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [incidents.length]);

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
        <CheckCircle size={40} className="text-emerald-500/40" />
        <p className="text-brand-muted text-sm font-medium">All clear. No incidents.</p>
        <p className="text-brand-muted/60 text-xs">Incidents will appear here in real time</p>
      </div>
    );
  }

  const displayedIncidents = showAll ? incidents : incidents.slice(0, 10);

  return (
    <div ref={feedRef} className="overflow-y-auto flex flex-col gap-2 h-full pr-1">
      {displayedIncidents.map((inc) => {
        const cfg  = ICON_MAP[inc.type] || ICON_MAP.Normal;
        const Icon = cfg.icon;
        const isSelected = inc._id === selectedId;
        const userName = inc.userId?.name || 'Unknown User';
        const initials = inc.userId?.avatarInitials || userName[0]?.toUpperCase() || 'U';

        return (
          <button
            key={inc._id}
            onClick={() => onSelect(inc)}
            className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${cfg.bg} ${
              isSelected ? 'ring-2 ring-brand-accent ring-offset-1 ring-offset-brand-card' : 'hover:brightness-125'
            } ${inc.type === 'SOS' ? 'animate-pulse-slow' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-xs font-bold text-brand-text shrink-0 border border-brand-border">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-sm text-brand-text truncate">{userName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_BADGE[inc.status] || STATUS_BADGE.open}`}>
                    {inc.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={12} className={cfg.cls} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.cls}`}>{inc.type}</span>
                  {inc.biometricSnapshot?.hr && (
                    <span className="text-xs text-brand-muted">· {inc.biometricSnapshot.hr} BPM</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-brand-muted truncate max-w-[180px]">
                    {inc.notes || 'No additional notes'}
                  </p>
                  <span className="text-[10px] text-brand-muted/60 whitespace-nowrap">
                    {formatDistanceToNow(new Date(inc.triggeredAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {incidents.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 py-2 text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-brand-text border border-brand-border rounded-lg bg-brand-surface hover:brightness-125 transition-all"
        >
          {showAll ? 'Show Last 10' : `Show All Crisis (${incidents.length})`}
        </button>
      )}
    </div>
  );
};

export default CrisisFeed;
