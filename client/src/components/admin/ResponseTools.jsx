import { useState } from 'react';
import { Phone, MapPin, CheckCircle, MessageCircle, AlertOctagon, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ResponseTools = ({ selectedIncident, selectedUser, onResolved, chatHistory = [], onMessageSent }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const forwardLocation = () => {
    const loc = selectedUser?.loc || selectedIncident?.location;
    if (!loc) { toast.error('No location data available'); return; }
    const mapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    window.open(mapsUrl, '_blank');
    toast.success('📍 Location opened in Google Maps');
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
      // Clear user's alert
      socket?.emit('resolve-alert', {
        tripId: selectedIncident.tripId,
        userId: selectedIncident.userId?._id,
      });
      toast.success('Incident resolved');
      onResolved?.(selectedIncident._id);
    } catch (err) {
      toast.error('Failed to resolve incident');
    } finally {
      setResolving(false);
    }
  };

  const acknowledgeIncident = async () => {
    if (!selectedIncident) return;
    try {
      await axios.patch(`${API}/incidents/${selectedIncident._id}/acknowledge`);
      toast.success('Incident acknowledged');
      onResolved?.(selectedIncident._id, 'acknowledged');
    } catch {
      toast.error('Failed to acknowledge');
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
