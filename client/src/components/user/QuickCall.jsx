import { useState } from 'react';
import { Phone, MessageCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

const QuickCall = ({ activeTrip }) => {
  const { socket } = useSocket();
  const [messageSent, setMessageSent] = useState(false);

  const callDesk = () => {
    toast.success('📞 Connecting to Security Desk...', { duration: 3000 });
    // Emit notification to admin room via socket
    if (socket && activeTrip) {
      socket.emit('admin-notification', {
        tripId: activeTrip._id,
        message: 'Guest is requesting a call with the security desk.',
        type: 'call-request',
      });
    }
  };

  const sendCheckIn = () => {
    if (!activeTrip || messageSent) return;
    if (socket) {
      socket.emit('admin-notification', {
        tripId: activeTrip._id,
        message: 'Guest sent a check-in: "I\'m safe, no issues."',
        type: 'check-in',
      });
    }
    setMessageSent(true);
    toast.success('✅ Check-in sent to security desk!');
    setTimeout(() => setMessageSent(false), 10000);
  };

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
          <Phone size={20} className="text-green-400" />
        </div>
        <div>
          <h2 className="font-bold text-brand-text">Quick Contact</h2>
          <p className="text-xs text-brand-muted">Reach security desk instantly</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          id="btn-call-desk"
          onClick={callDesk}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all duration-200 active:scale-95"
        >
          <Phone size={24} />
          <span className="text-xs font-bold uppercase tracking-wide">Call Desk</span>
        </button>

        <button
          id="btn-checkin"
          onClick={sendCheckIn}
          disabled={!activeTrip || messageSent}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 active:scale-95 ${
            messageSent
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 disabled:opacity-40'
          }`}
        >
          {messageSent ? <CheckCircle size={24} /> : <MessageCircle size={24} />}
          <span className="text-xs font-bold uppercase tracking-wide">{messageSent ? 'Sent!' : "I'm Safe"}</span>
        </button>
      </div>

      <p className="text-brand-muted text-xs mt-3 text-center">
        Security Desk · Extension <span className="text-brand-accent font-mono">100</span>
      </p>
    </div>
  );
};

export default QuickCall;
