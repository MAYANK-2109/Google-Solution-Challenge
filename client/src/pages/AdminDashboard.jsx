import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import Navbar from '../components/shared/Navbar';
import LiveMap from '../components/admin/LiveMap';
import CrisisFeed from '../components/admin/CrisisFeed';
import UserVitalsPanel from '../components/admin/UserVitalsPanel';
import ResponseTools from '../components/admin/ResponseTools';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, AlertTriangle, Activity, Shield, Radio } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { socket, connected } = useSocket();
  const [incidents, setIncidents] = useState([]);
  const [userLocations, setUserLocations] = useState([]); // [{ tripId, userId, userName, lat, lng, alertLevel }]
  const [liveHR, setLiveHR] = useState({});   // { userId: hr }
  const [liveSource, setLiveSource] = useState({}); // { userId: source }
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); // { tripId, userId, userName, loc, alertLevel }
  const [activeTrips, setActiveTrips] = useState([]);
  const [chatLogs, setChatLogs] = useState({}); // { [tripId]: [] }

  // ── Load initial data ───────────────────────────────────
  const fetchInitial = useCallback(async () => {
    try {
      const [incRes, tripRes] = await Promise.all([
        axios.get(`${API}/incidents?limit=100`),
        axios.get(`${API}/trips/active`),
      ]);
      setIncidents(incRes.data);
      setActiveTrips(tripRes.data);

      // Seed userLocations from active trips
      const locs = tripRes.data
        .filter((t) => t.currentLocation?.lat)
        .map((t) => ({
          tripId: t._id,
          userId: t.userId?._id,
          userName: t.userId?.name,
          lat: t.currentLocation.lat,
          lng: t.currentLocation.lng,
          alertLevel: t.alertLevel || 'normal',
        }));
      setUserLocations(locs);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    }
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  // ── Socket listeners ────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-admin');

    // Live location updates
    socket.on('user-location', ({ tripId, userId, lat, lng }) => {
      setUserLocations((prev) => {
        const exists = prev.find((u) => u.tripId === tripId);
        if (exists) {
          return prev.map((u) => u.tripId === tripId ? { ...u, lat, lng } : u);
        }
        return [...prev, { tripId, userId, userName: 'User', lat, lng, alertLevel: 'normal' }];
      });
    });

    // Live biometrics
    socket.on('user-biometric', ({ tripId, userId, hr, source }) => {
      setLiveHR((prev) => ({ ...prev, [userId]: hr }));
      setLiveSource((prev) => ({ ...prev, [userId]: source }));
    });

    // New incident (Warning auto-triggered or manual)
    socket.on('new-incident', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
      // Update alert level on map
      setUserLocations((prev) =>
        prev.map((u) => u.tripId === incident.tripId?._id || u.tripId === incident.tripId
          ? { ...u, alertLevel: incident.type === 'Warning' ? 'warning' : u.alertLevel }
          : u
        ));
      toast(`⚠️ Warning: ${incident.userId?.name} — ${incident.notes}`, {
        icon: '⚠️', duration: 8000, style: { background: '#1a2235', color: '#f59e0b' },
      });
    });

    // SOS alert
    socket.on('sos-alert', ({ incident, tripId, userId }) => {
      setIncidents((prev) => [incident, ...prev]);
      setUserLocations((prev) =>
        prev.map((u) => u.tripId === tripId ? { ...u, alertLevel: 'sos' } : u)
      );
      toast.error(`🚨 SOS! ${incident.userId?.name} needs help NOW!`, {
        duration: 12000, id: `sos-${tripId}`,
      });
      // Auto-select the SOS incident
      setSelectedIncident(incident);
      setSelectedUser({
        ...incident,
        tripId: tripId,
        userId: incident.userId,
        userName: incident.userId?.name,
        loc: incident.location,
        alertLevel: 'sos',
      });
    });

    // Alert cleared by admin resolve
    socket.on('alert-cleared', ({ tripId, userId }) => {
      setUserLocations((prev) =>
        prev.map((u) => u.tripId === tripId ? { ...u, alertLevel: 'normal' } : u)
      );
    });

    // Incoming messages from User QuickCall
    socket.on('admin-notification', ({ tripId, message, timestamp }) => {
      setChatLogs((prev) => ({
        ...prev,
        [tripId]: [...(prev[tripId] || []), { sender: 'user', message, timestamp }]
      }));
      toast(`User Message: ${message}`, { icon: '💬', duration: 6000 });
    });

    // AI Risk Report or status update — live update incident in list
    socket.on('incident-updated', (updatedIncident) => {
      setIncidents((prev) =>
        prev.map((i) => i._id === updatedIncident._id ? { ...i, ...updatedIncident } : i)
      );
      // If this is the currently selected incident, update it too
      setSelectedIncident((prev) =>
        prev && prev._id === updatedIncident._id ? { ...prev, ...updatedIncident } : prev
      );
    });

    // Traveller confirmed check-in
    socket.on('checkin-ok', ({ tripId, userId }) => {
      toast.success(`✅ User confirmed safety check-in`, { duration: 3000, icon: '💚' });
    });

    return () => {
      socket.off('user-location');
      socket.off('user-biometric');
      socket.off('new-incident');
      socket.off('sos-alert');
      socket.off('alert-cleared');
      socket.off('admin-notification');
      socket.off('incident-updated');
      socket.off('checkin-ok');
    };
  }, [socket]);

  // ── Select incident → populate user panel ───────────────
  const handleSelectIncident = useCallback((inc) => {
    setSelectedIncident(inc);
    // Try to find live location first, then fall back to the incident's stored location
    const liveLoc = userLocations.find((u) => u.tripId === inc.tripId || u.userId === inc.userId?._id);
    const resolvedLoc = (liveLoc ? { lat: liveLoc.lat, lng: liveLoc.lng } : null) || inc.location || null;
    setSelectedUser({
      ...inc,
      tripId: inc.tripId || liveLoc?.tripId,
      userId: inc.userId,
      userName: inc.userId?.name,
      loc: resolvedLoc,
      alertLevel: inc.type === 'SOS' ? 'sos' : inc.type === 'Warning' ? 'warning' : 'normal',
    });
  }, [userLocations]);

  const handleSelectMapUser = useCallback((entry) => {
    setSelectedUser({ ...entry, loc: { lat: entry.lat, lng: entry.lng } });
    setSelectedIncident(null);
  }, []);

  const handleResolved = useCallback((id, newStatus = 'resolved') => {
    setIncidents((prev) =>
      prev.map((i) => i._id === id ? { ...i, status: newStatus } : i)
    );
  }, []);

  // ── Stats ───────────────────────────────────────────────
  const openSOS = incidents.filter((i) => i.type === 'SOS' && i.status === 'open').length;
  const openWarnings = incidents.filter((i) => i.type === 'Warning' && i.status === 'open').length;
  const activeCount = userLocations.length;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4 flex flex-col gap-4">

        {/* ── Stats Bar ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Users', value: activeCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'Open SOS', value: openSOS, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Open Warnings', value: openWarnings, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Stream Status', value: connected ? 'LIVE' : 'OFF', icon: Radio, color: connected ? 'text-emerald-400' : 'text-red-400', bg: connected ? 'bg-emerald-500/10' : 'bg-red-500/10', border: connected ? 'border-emerald-500/20' : 'border-red-500/20' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`card ${bg} border ${border} flex items-center gap-3 py-3`}>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center border ${border}`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-brand-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 flex-1 min-h-0">

          {/* Left: Map + Feed */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* Live Map */}
            <div className="card p-0 overflow-hidden" style={{ height: '420px' }}>
              <div className="px-4 py-3 border-b border-brand-border flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-brand-text uppercase tracking-widest">Live Map · {activeCount} Active</span>
              </div>
              <div style={{ height: 'calc(100% - 45px)' }}>
                <LiveMap
                  userLocations={userLocations}
                  onSelectUser={handleSelectMapUser}
                  centerPoint={selectedUser?.loc || selectedIncident?.location || null}
                />
              </div>
            </div>

            {/* Crisis Feed */}
            <div className="card flex flex-col" style={{ height: '320px' }}>
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <AlertTriangle size={16} className="text-amber-400" />
                <h2 className="font-bold text-brand-text text-sm">Crisis Management Feed</h2>
                <span className="ml-auto text-xs text-brand-muted">{incidents.length} events</span>
              </div>
              <div className="flex-1 min-h-0">
                <CrisisFeed
                  incidents={incidents}
                  onSelect={handleSelectIncident}
                  selectedId={selectedIncident?._id}
                />
              </div>
            </div>
          </div>

          {/* Right: Vitals + Response */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* User Vitals */}
            <div className="card flex flex-col" style={{ minHeight: '280px' }}>
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Activity size={16} className="text-blue-400" />
                <h2 className="font-bold text-brand-text text-sm">User Vitals</h2>
              </div>
              <UserVitalsPanel
                selectedUser={selectedUser}
                liveHR={selectedUser ? liveHR[selectedUser.userId?._id || selectedUser.userId] : null}
                liveSource={selectedUser ? liveSource[selectedUser.userId?._id || selectedUser.userId] : null}
                liveLoc={
                  (selectedUser ? userLocations.find((u) => u.tripId === selectedUser.tripId) : null)
                  || selectedUser?.loc
                  || null
                }
              />
            </div>

            {/* Response Tools */}
            <div className="card flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Shield size={16} className="text-emerald-400" />
                <h2 className="font-bold text-brand-text text-sm">Response Tools</h2>
              </div>
              <ResponseTools
                selectedIncident={selectedIncident}
                selectedUser={selectedUser}
                liveLoc={
                  (selectedUser ? userLocations.find((u) => u.tripId === selectedUser.tripId) : null)
                  || selectedUser?.loc
                  || selectedIncident?.location
                  || null
                }
                onResolved={handleResolved}
                chatHistory={chatLogs[selectedUser?.tripId] || []}
                onMessageSent={(tripId, msg) => {
                  setChatLogs((prev) => ({
                    ...prev,
                    [tripId]: [...(prev[tripId] || []), { sender: 'admin', message: msg, timestamp: Date.now() }]
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
