import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Loader2, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL as API } from '../../constants';

const PROMPT_TIMEOUT = 30; // 30 seconds

const CheckInPrompt = ({ activeTrip, userId, onSOSTriggered, socket, currentLocation, currentHR }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(PROMPT_TIMEOUT);

  // ALL LOGIC STATE IN REFS TO AVOID REACT STALE CLOSURES
  const lastCheckInRef = useRef(Date.now());
  const promptVisibleRef = useRef(false);
  const countdownIntervalRef = useRef(null);

  // ALWAYS FRESH PROPS IN REFS
  const activeTripRef = useRef(activeTrip);
  const locationRef = useRef(currentLocation);
  const hrRef = useRef(currentHR);
  const socketRef = useRef(socket);

  // Sync props to refs on every render
  useEffect(() => {
    activeTripRef.current = activeTrip;
    locationRef.current = currentLocation;
    hrRef.current = currentHR;
    socketRef.current = socket;
  });

  // Trip Init: Reset clock when a new trip starts or check-in confirms
  useEffect(() => {
    if (activeTrip?._id) {
      lastCheckInRef.current = activeTrip.lastCheckInAt 
        ? new Date(activeTrip.lastCheckInAt).getTime() 
        : Date.now();
      promptVisibleRef.current = false;
      setVisible(false);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [activeTrip?._id, activeTrip?.lastCheckInAt]);

  const triggerSOS = async (isTimeout = false) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    promptVisibleRef.current = false;
    setVisible(false);
    lastCheckInRef.current = Date.now(); // reset clock just in case

    const trip = activeTripRef.current;
    if (!trip?._id) return;

    toast.error(isTimeout
      ? '⏰ No response detected — triggering SOS for your safety!'
      : '🆘 SOS triggered! Security is being alerted immediately.',
      { duration: 8000 });

    try {
      const payload = {
        tripId: trip._id,
        type: 'SOS',
        location: locationRef.current,
        biometricSnapshot: { hr: hrRef.current },
        notes: isTimeout ? `Auto-SOS: Check-in unanswered for ${PROMPT_TIMEOUT} seconds` : 'SOS: Traveller reported not okay during check-in',
      };
      const { data: incident } = await axios.post(`${API}/incidents`, payload);

      socketRef.current?.emit('sos-trigger', { tripId: trip._id, userId, lat: locationRef.current?.lat, lng: locationRef.current?.lng, hr: hrRef.current });
      if (onSOSTriggered) onSOSTriggered();

      startAudioRecording(incident._id);
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('SOS already active — security is responding.', { duration: 5000 });
      } else {
        toast.error('SOS failed. Please use the SOS button manually.');
      }
    }
  };

  const handleOkay = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    promptVisibleRef.current = false;
    setVisible(false);

    // EXACTLY AS REQUESTED: Reset timestamp immediately upon answering
    lastCheckInRef.current = Date.now();

    const trip = activeTripRef.current;
    if (!trip?._id) return;

    try {
      await axios.post(`${API}/checkin/confirm`, { tripId: trip._id });
      socketRef.current?.emit('checkin-ok', { tripId: trip._id, userId });
      toast.success("Great! Stay safe out there! 💪", { duration: 3000 });
    } catch { /* silent */ }
  };

  const startPrompt = () => {
    promptVisibleRef.current = true;
    setVisible(true);
    setLoading(false);
    setCountdown(PROMPT_TIMEOUT);

    // Hardcoded messages for instantaneous rendering as requested
    const messages = [
      "Hey, just checking in on you! Everything okay on your end? Remember, I'm watching over you. Stay safe! 🛡️",
      "Hi there! Quick check — are you doing alright? Just making sure everything's smooth on your journey! 😊",
      "Hey you! Still out there conquering the world? Just wanted to make sure you're safe and sound! ✨"
    ];
    setMessage(messages[Math.floor(Math.random() * messages.length)]);

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

  // ------------------------------------------------------------------
  // DEAD SIMPLE TICKER - EXACTLY AS REQUESTED
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!activeTrip?._id || activeTrip?.alertLevel === 'sos') return;

    const intervalMinutes = activeTrip.checkInIntervalMinutes || 10;
    const intervalMs = intervalMinutes * 60 * 1000;

    const ticker = setInterval(() => {
      const now = Date.now();
      const diff = now - lastCheckInRef.current;

      // Check if time is up
      if (diff >= intervalMs) {
        if (promptVisibleRef.current) {
          // As requested: if the message is already displaying, update the timestamp
          // This ensures the ticker doesn't spam calls while prompt is open
          lastCheckInRef.current = now;
        } else {
          startPrompt();
        }
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [activeTrip?._id, activeTrip?.checkInIntervalMinutes, activeTrip?.alertLevel]);

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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md animate-fade-in">
      <div className="card shadow-2xl w-full max-w-sm border-2 border-blue-500/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(countdown / PROMPT_TIMEOUT) * 100}%` }}
        />

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

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleOkay} className="py-3 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 font-bold text-sm hover:bg-emerald-500/25 transition-all duration-200 active:scale-95">
            ✅ Yes, I'm okay!
          </button>
          <button onClick={() => triggerSOS(false)} className="py-3 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all duration-200 active:scale-95">
            🆘 No, help me!
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 text-[10px] text-brand-muted">
          <AlertTriangle size={10} className="text-amber-400 shrink-0" />
          <span>If unanswered, SOS will auto-trigger in {countdown} seconds for your safety.</span>
        </div>
      </div>
    </div>
  );
};

export default CheckInPrompt;
