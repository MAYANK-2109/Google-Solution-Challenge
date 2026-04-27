import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useBiometrics } from '../hooks/useBiometrics';
import { useBluetoothHR } from '../hooks/useBluetoothHR';
import { useGeolocation } from '../hooks/useGeolocation';
import Navbar from '../components/shared/Navbar';
import TripControl from '../components/user/TripControl';
import BiometricPanel from '../components/user/BiometricPanel';
import SmartWatchConnector from '../components/user/SmartWatchConnector';
import SOSButton from '../components/user/SOSButton';
import QuickCall from '../components/user/QuickCall';
import CheckInPrompt from '../components/user/CheckInPrompt';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, Bell } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTrip, setActiveTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [isCrisis, setIsCrisis] = useState(false);
  const [adminMessages, setAdminMessages] = useState([]);
  const posRef = useRef({ lat: 15.3173, lng: 73.9278 });

  // Bluetooth
  const bluetooth = useBluetoothHR();

  // Biometrics
  const { heartRate, trend } = useBiometrics(activeTrip?._id, user?._id, !!activeTrip, isCrisis, bluetooth.hr);

  // Geolocation (stores latest position in posRef)
  useGeolocation(activeTrip?._id, user?._id, !!activeTrip);

  // Restore active trip on mount
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await axios.get(`${API}/trips/my`);
        const active = data.find((t) => t.status === 'active' || t.status === 'emergency');
        if (active) {
          setActiveTrip(active);
          if (socket) socket.emit('join-trip', { tripId: active._id, userId: user?._id });
        }
      } catch {
        /* no active trip */
      } finally {
        setLoadingTrip(false);
      }
    };
    if (user) fetchTrip();
  }, [user, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('crisis-alert', ({ type, message }) => {
      setIsCrisis(type === 'SOS' || type === 'Warning');
      toast.error(message, { duration: 8000, id: 'crisis' });
    });

    socket.on('alert-resolved', ({ message }) => {
      setIsCrisis(false);
      toast.success(message, { duration: 5000 });
    });

    socket.on('admin-message', ({ message, adminName, timestamp }) => {
      setAdminMessages((prev) => [{ message, adminName, timestamp }, ...prev.slice(0, 4)]);
      toast.success(`Security: ${message}`, { duration: 6000 });
    });

    socket.on('sos-acknowledged', ({ message }) => {
      toast.success(message, { duration: 8000, icon: '🛡️' });
    });

    socket.on('sos-duplicate', ({ message }) => {
      toast(message, { duration: 5000, icon: '⚠️' });
    });

    return () => {
      socket.off('crisis-alert');
      socket.off('alert-resolved');
      socket.off('admin-message');
      socket.off('sos-acknowledged');
      socket.off('sos-duplicate');
    };
  }, [socket]);

  const handleTripStart = useCallback((trip) => {
    setActiveTrip(trip);
    setIsCrisis(false);
    if (socket) socket.emit('join-trip', { tripId: trip._id, userId: user?._id });
  }, [socket, user]);

  const handleTripEnd = useCallback(() => {
    setActiveTrip(null);
    setIsCrisis(false);
    setAdminMessages([]);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isCrisis ? 'bg-red-950/20' : 'bg-brand-bg'}`}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        {/* Welcome Banner */}
        <div className="glasscard flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg shrink-0">
            {user?.avatarInitials || user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-brand-muted text-xs">Welcome back</p>
            <h1 className="font-black text-brand-text text-lg truncate">{user?.name}</h1>
            <p className="text-brand-muted text-xs">Guest Safety Portal</p>
          </div>
          <div className="ml-auto">
            <Shield size={24} className={activeTrip ? 'text-emerald-400' : 'text-brand-muted'} />
          </div>
        </div>

        {/* Crisis banner */}
        {isCrisis && (
          <div className="bg-red-500/20 border-2 border-red-500/60 rounded-2xl p-4 text-center animate-pulse">
            <p className="text-red-300 font-black text-lg">🚨 CRISIS DETECTED</p>
            <p className="text-red-400/80 text-sm mt-1">Security has been alerted and is responding</p>
          </div>
        )}

        {/* Admin messages */}
        {adminMessages.length > 0 && (
          <div className="card border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Security Messages</span>
            </div>
            {adminMessages.map((msg, i) => (
              <div key={i} className="text-sm text-brand-text bg-brand-surface rounded-xl px-3 py-2 mb-2">
                <span className="text-blue-400 font-semibold">{msg.adminName}: </span>{msg.message}
              </div>
            ))}
          </div>
        )}

        {loadingTrip ? (
          <div className="card flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <TripControl activeTrip={activeTrip} onTripStart={handleTripStart} onTripEnd={handleTripEnd} />
            <BiometricPanel heartRate={heartRate} trend={trend} isActive={!!activeTrip} isBluetoothConnected={bluetooth.connected} />
            <SmartWatchConnector bluetooth={bluetooth} />
            <SOSButton
              activeTrip={activeTrip}
              userId={user?._id}
              currentHR={heartRate}
              currentLocation={posRef.current}
              onSOSTriggered={() => setIsCrisis(true)}
            />
            <QuickCall activeTrip={activeTrip} />
            <CheckInPrompt
              activeTrip={activeTrip}
              userId={user?._id}
              onSOSTriggered={() => setIsCrisis(true)}
              socket={socket}
              currentLocation={posRef.current}
              currentHR={heartRate}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
