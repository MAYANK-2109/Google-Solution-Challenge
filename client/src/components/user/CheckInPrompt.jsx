import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Loader2, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL as API } from '../../constants';

const PROMPT_TIMEOUT = 30; // 30 seconds

const CheckInPrompt = ({ activeTrip, userId, onSOSTriggered, socket, currentLocation, currentHR }) => {
  // UI State
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(PROMPT_TIMEOUT);

  // Timers
  const mainIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // "Always Fresh" Data Box - completely immune to stale closures
  const dataBox = useRef({ activeTrip, userId, socket, currentLocation, currentHR, onSOSTriggered });

  // Keep the Data Box updated on every single render
  useEffect(() => {
    dataBox.current = { activeTrip, userId, socket, currentLocation, currentHR, onSOSTriggered };
  });

  // Action: Trigger SOS (Manual or Timeout)
  const triggerSOS = async (isTimeout = false) => {
    // 1. Stop all timers and hide UI
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setVisible(false);
    promptActiveRef.current = false;

    const { activeTrip: trip, userId: uId, socket: io, currentLocation: loc, currentHR: hr, onSOSTriggered: onSOS } = dataBox.current;
    if (!trip?._id) return;

    // 2. Notify User UI
    toast.error(isTimeout
      ? '⏰ No response detected — triggering SOS for your safety!'
      : '🆘 SOS triggered! Security is being alerted immediately.',
      { duration: 8000 });

    try {
      // 3. API Call
      const payload = {
        tripId: trip._id,
        type: 'SOS',
        location: loc,
        biometricSnapshot: { hr },
        notes: isTimeout ? `Auto-SOS: Check-in unanswered for ${PROMPT_TIMEOUT} seconds` : 'SOS: Traveller reported not okay during check-in',
      };
      const { data: incident } = await axios.post(`${API}/incidents`, payload);

      // 4. Sockets & Callbacks
      io?.emit('sos-trigger', { tripId: trip._id, userId: uId, lat: loc?.lat, lng: loc?.lng, hr });
      if (onSOS) onSOS();

      // 5. Audio recording
      startAudioRecording(incident._id);
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('SOS already active — security is responding.', { duration: 5000 });
      } else {
        toast.error('SOS failed. Please use the SOS button manually.');
      }
    }
  };

  // Action: User is Okay
  const handleOkay = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setVisible(false);
    promptActiveRef.current = false;

    const { activeTrip: trip, userId: uId, socket: io } = dataBox.current;
    if (!trip?._id) return;

    try {
      await axios.post(`${API}/checkin/confirm`, { tripId: trip._id });
      io?.emit('checkin-ok', { tripId: trip._id, userId: uId });
      toast.success("Great! Stay safe out there! 💪", { duration: 3000 });
    } catch { /* silent */ }
  };

  // Action: Show Prompt and Start 30s Countdown
  const showPrompt = async () => {
    if (promptActiveRef.current) return;
    promptActiveRef.current = true;

    setCountdown(PROMPT_TIMEOUT);
    setLoading(true);
    setVisible(true);

    axios.post(`${API}/checkin/generate-message`, {})
      .then(({ data }) => setMessage(data.message))
      .catch(() => setMessage("Hey! Just checking in — are you doing alright? Stay safe! 😊"))
      .finally(() => setLoading(false));

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    let remaining = PROMPT_TIMEOUT;

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        triggerSOS(true);
      }
    }, 1000);
  };

  // Master Control: The Check-in Interval
  useEffect(() => {
    // Only run if trip is active and not already in SOS
    if (!activeTrip?._id || activeTrip?.alertLevel === 'sos') {
      if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setVisible(false);
      return;
    }

    // Calculate how often to check in (e.g., 1 min = 60,000 ms)
    const intervalMinutes = activeTrip.checkInIntervalMinutes || 10;
    const intervalMs = intervalMinutes * 60 * 1000;

    // Clear any existing interval to prevent duplicates
    if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);

    // Start the strict metronome
    mainIntervalRef.current = setInterval(() => {
      showPrompt();
    }, intervalMs);

    // Cleanup on unmount or trip change
    return () => {
      if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [activeTrip?._id, activeTrip?.checkInIntervalMinutes, activeTrip?.alertLevel]);
  // ^^^ TINY dependency array! It NEVER resets due to heart rate or location changes!

  // Audio Recording
  const startAudioRecording = async (incidentId) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('No mic');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'sos_audio.webm');
        try {
          await axios.post(`${API}/incidents/${incidentId}/audio`, formData);
          toast.success('✨ AI risk report generated for security team.');
        } catch {
          toast.error('⚠️ AI report failed. Security still notified.');
        }
      };

      mediaRecorder.start();
      setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 7000);
    } catch {
      const formData = new FormData();
      try { await axios.post(`${API}/incidents/${incidentId}/audio`, formData); } catch { /* silent */ }
    }
  };

  // Render UI
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md animate-fade-in">
      <div className="card shadow-2xl w-full max-w-sm border-2 border-blue-500/30 relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(countdown / PROMPT_TIMEOUT) * 100}%` }}
        />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 mt-1">
          <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
            <Shield size={22} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-text">Safety Check-In</h2>
            <div className="flex items-center gap-1.5 text-xs text-brand-muted">
              <Clock size={10} />
              <span>{countdown}s remaining</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-5">
          {loading ? (
            <div className="flex items-center gap-2 text-brand-muted">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Generating message...</span>
            </div>
          ) : (
            <p className="text-sm text-brand-text leading-relaxed">{message}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleOkay} className="py-3 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 font-bold text-sm hover:bg-emerald-500/25 transition-all duration-200 active:scale-95">
            ✅ Yes, I'm okay!
          </button>
          <button onClick={() => triggerSOS(false)} className="py-3 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all duration-200 active:scale-95">
            🆘 No, help me!
          </button>
        </div>

        {/* Warning */}
        <div className="flex items-center gap-2 mt-4 text-[10px] text-brand-muted">
          <AlertTriangle size={10} className="text-amber-400 shrink-0" />
          <span>If unanswered, SOS will auto-trigger in {countdown} seconds for your safety.</span>
        </div>
      </div>
    </div>
  );
};

export default CheckInPrompt;
// MAYANK CHANDRIKAPURE
