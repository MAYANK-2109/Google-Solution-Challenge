import { useState, useEffect } from 'react';
import { Phone, MapPin, CheckCircle, MessageCircle, AlertOctagon, Loader2, Volume2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ResponseTools = ({ selectedIncident, selectedUser, liveLoc, onResolved, chatHistory = [], onMessageSent }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  // Fetch audio when selected incident changes
  useEffect(() => {
    setAudioSrc(null);
    if (!selectedIncident?._id) return;

    const fetchAudio = async () => {
      setLoadingAudio(true);
      try {
        const { data } = await axios.get(`${API}/incidents/${selectedIncident._id}/audio-clip`);
        if (data.audioData) {
          setAudioSrc(`data:${data.mimeType};base64,${data.audioData}`);
        }
      } catch {
        // No audio available — that's fine
      } finally {
        setLoadingAudio(false);
      }
    };
    fetchAudio();
  }, [selectedIncident?._id]);

  const forwardLocation = async () => {
    const loc = liveLoc || selectedUser?.loc || selectedIncident?.location;
    if (!loc) { toast.error('No location data available'); return; }
    const mapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    
    const name = selectedUser?.userId?.name || selectedUser?.userName || selectedIncident?.userId?.name || 'User';
    const textToShare = `Emergency Alert: Live location of ${name}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Emergency Location',
          text: textToShare,
          url: mapsUrl
        });
        toast.success('📍 Location forwarded successfully');
      } else {
        await navigator.clipboard.writeText(`${textToShare}\n${mapsUrl}`);
        toast.success('📍 Location link copied to clipboard');
        window.open(mapsUrl, '_blank');
      }
    } catch (err) {
      console.error('Share failed:', err);
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${textToShare}\n${mapsUrl}`);
          toast.success('📍 Location link copied to clipboard');
          window.open(mapsUrl, '_blank');
        } catch (clipboardErr) {
          toast.error('Failed to copy location, opening map directly...');
          window.open(mapsUrl, '_blank');
        }
      }
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedUser?.tripId) return;
    setSendingMsg(true);
    socket?.emit('admin-response', {
      tripId: selectedUser.tripId,
      message: message.trim(),
      adminName: user?.name || 'Security',
    });
    onMessageSent?.(selectedUser.tripId, message.trim());
    toast.success('Message sent to user');
    setMessage('');
    setSendingMsg(false);
  };

  const resolveIncident = async () => {
    if (!selectedIncident) return;
    setResolving(true);
    try {
      await axios.patch(`${API}/incidents/${selectedIncident._id}/resolve`, {
        responderNotes: `Resolved by ${user?.name}`,
      });
      // Clear user's alert via socket
      const tripId = typeof selectedIncident.tripId === 'object'
        ? selectedIncident.tripId?._id
        : selectedIncident.tripId;
      socket?.emit('resolve-alert', {
        tripId,
        userId: selectedIncident.userId?._id || selectedIncident.userId,
      });
      toast.success('✅ Incident resolved');
      onResolved?.(selectedIncident._id);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resolve incident';
      toast.error(msg);
      console.error('Resolve error:', err);
    } finally {
      setResolving(false);
    }
  };

  const acknowledgeIncident = async () => {
    if (!selectedIncident) return;
    try {
      await axios.patch(`${API}/incidents/${selectedIncident._id}/acknowledge`);

      // Notify the traveller via socket
      const tripId = typeof selectedIncident.tripId === 'object'
        ? selectedIncident.tripId?._id
        : selectedIncident.tripId;
      socket?.emit('incident-acknowledged', {
        tripId,
        adminName: user?.name || 'Security',
      });

      toast.success('Incident acknowledged');
      onResolved?.(selectedIncident._id, 'acknowledged');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to acknowledge';
      toast.error(msg);
    }
  };

  const disabled = !selectedIncident && !selectedUser;

  return (
    <div className="space-y-4 animate-fade-in">
      {disabled ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <AlertOctagon size={36} className="text-brand-muted/40" />
          <p className="text-brand-muted text-sm">Select an incident to enable response tools</p>
        </div>
      ) : (
        <>
          {/* Quick action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-forward-location"
              onClick={forwardLocation}
              className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all duration-200 text-sm font-semibold active:scale-95"
            >
              <MapPin size={16} />
              Forward Location
            </button>
            <button
              id="btn-call-responder"
              onClick={() => toast.success('📞 Alerting nearest responder unit...')}
              className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all duration-200 text-sm font-semibold active:scale-95"
            >
              <Phone size={16} />
              Alert Responder
            </button>
          </div>

          {/* Gemini AI Risk Report */}
          {selectedIncident?.aiRiskReport && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 animate-fade-in shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Risk Assessment</span>
              </div>
              <p className="text-sm text-purple-200 leading-relaxed">
                {selectedIncident.aiRiskReport}
              </p>
            </div>
          )}

          {/* Audio Playback */}
          {(audioSrc || loadingAudio) && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-sky-400" />
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">SOS Audio Recording</span>
              </div>
              {loadingAudio ? (
                <div className="flex items-center gap-2 text-brand-muted text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Loading audio...
                </div>
              ) : (
                <audio controls className="w-full mt-1" style={{ height: '36px' }}>
                  <source src={audioSrc} />
                  Your browser does not support audio playback.
                </audio>
              )}
            </div>
          )}

          {/* Incident status actions */}
          {selectedIncident && selectedIncident.status === 'open' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-acknowledge"
                onClick={acknowledgeIncident}
                className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-semibold active:scale-95"
              >
                <AlertOctagon size={16} />
                Acknowledge
              </button>
              <button
                id="btn-resolve"
                onClick={resolveIncident}
                disabled={resolving}
                className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-semibold active:scale-95 disabled:opacity-50"
              >
                {resolving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Resolve
              </button>
            </div>
          )}

          {selectedIncident && selectedIncident.status === 'acknowledged' && (
            <button
              id="btn-resolve-acknowledged"
              onClick={resolveIncident}
              disabled={resolving}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold active:scale-95 disabled:opacity-50"
            >
              {resolving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Mark as Resolved
            </button>
          )}

          {/* Message user */}
          {selectedUser?.tripId && (
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
                Message to User
              </label>

              {chatHistory.length > 0 && (
                <div className="bg-brand-surface border border-brand-border rounded-xl p-3 mb-3 max-h-40 overflow-y-auto flex flex-col gap-2">
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex ${chat.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${chat.sender === 'admin' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-blue-500/20 text-blue-100'}`}>
                        <p>{chat.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  id="admin-message-input"
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Security team is on the way..."
                  className="input-field flex-1 text-sm py-2"
                />
                <button
                  id="btn-send-message"
                  onClick={sendMessage}
                  disabled={!message.trim() || sendingMsg}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResponseTools;
