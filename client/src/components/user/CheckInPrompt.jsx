import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, AlertTriangle, Loader2, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PROMPT_TIMEOUT = 30; // seconds before auto SOS

const CheckInPrompt = ({ activeTrip, userId, onSOSTriggered, socket, currentLocation, currentHR }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(PROMPT_TIMEOUT);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const promptActiveRef = useRef(false);

  // Fetch a Gemini-generated check-in message
  const fetchMessage = useCallback(async () => {
    try {
      const { data } = await axios.post(`${API}/checkin/generate-message`, {});
      setMessage(data.message);
    } catch {
      setMessage("Hey! Just checking in — are you doing alright? Stay safe! 😊");
    }
  }, []);

  // Show the check-in prompt
  const showPrompt = useCallback(async () => {
    if (promptActiveRef.current) return;
    promptActiveRef.current = true;
    setLoading(true);
    await fetchMessage();
    setLoading(false);
    setCountdown(PROMPT_TIMEOUT);
    setVisible(true);

    // Start 30s countdown
    if (countdownRef.current) clearInterval(countdownRef.current);
    let remaining = PROMPT_TIMEOUT;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        // Auto-trigger SOS on timeout
        handleNotOkay(true);
      }
    }, 1000);
  }, [fetchMessage]);

  // Start the periodic interval timer
  useEffect(() => {
    if (!activeTrip || activeTrip.alertLevel === 'sos') {
      // Don't check-in during active SOS
      return;
    }

    const intervalMs = (activeTrip.checkInIntervalMinutes || 10) * 60 * 1000;

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      showPrompt();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [activeTrip?._id, activeTrip?.alertLevel, activeTrip?.checkInIntervalMinutes, showPrompt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // User confirms they are okay
  const handleOkay = useCallback(async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setVisible(false);
    promptActiveRef.current = false;

    if (!activeTrip?._id) return;

    try {
      await axios.post(`${API}/checkin/confirm`, { tripId: activeTrip._id });
      socket?.emit('checkin-ok', { tripId: activeTrip._id, userId });
    } catch { /* silent */ }

    toast.success("Great! Stay safe out there! 💪", { duration: 3000 });
  }, [activeTrip?._id, socket, userId]);

  // User says they are NOT okay → trigger SOS
  const handleNotOkay = useCallback(async (isTimeout = false) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setVisible(false);
    promptActiveRef.current = false;

    if (!activeTrip?._id) return;

    const toastMsg = isTimeout
      ? '⏰ No response detected — triggering SOS for your safety!'
      : '🆘 SOS triggered! Security is being alerted immediately.';
    toast.error(toastMsg, { duration: 8000 });

    // Trigger SOS via API
    try {
      const payload = {
        tripId: activeTrip._id,
        type: 'SOS',
        location: currentLocation,
        biometricSnapshot: { hr: currentHR },
        notes: isTimeout ? `Auto-SOS: Check-in unanswered for ${PROMPT_TIMEOUT} seconds` : 'SOS: Traveller reported not okay during check-in',
      };
      const { data: incident } = await axios.post(`${API}/incidents`, payload);

      // Socket push for instant map update
      socket?.emit('sos-trigger', {
        tripId: activeTrip._id,
        userId,
        lat: currentLocation?.lat,
        lng: currentLocation?.lng,
        hr: currentHR,
      });

      onSOSTriggered?.();

      // Start audio recording for AI analysis
      startAudioRecording(incident._id);
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('SOS already active — security is responding.', { duration: 5000 });
      } else {
        toast.error('SOS failed. Please use the SOS button manually.');
      }
    }
  }, [activeTrip?._id, currentLocation, currentHR, socket, userId, onSOSTriggered]);

  // Show the check-in prompt
  const showPrompt = useCallback(async () => {
    if (promptActiveRef.current) return;
    promptActiveRef.current = true;
    setLoading(true);
    await fetchMessage();
    setLoading(false);
    setCountdown(PROMPT_TIMEOUT);
    setVisible(true);

    // Start 30s countdown
    if (countdownRef.current) clearInterval(countdownRef.current);
    let remaining = PROMPT_TIMEOUT;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        // Auto-trigger SOS on timeout
        handleNotOkay(true);
      }
    }, 1000);
  }, [fetchMessage, handleNotOkay]);
  const startAudioRecording = async (incidentId) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('No mic');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

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
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      }, 7000);
    } catch {
      // No mic — send without audio
      const formData = new FormData();
      try {
        await axios.post(`${API}/incidents/${incidentId}/audio`, formData);
      } catch { /* silent */ }
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md animate-fade-in">
      <div className="card shadow-2xl w-full max-w-sm border-2 border-blue-500/30 relative overflow-hidden">
        {/* Countdown progress bar */}
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

        {/* Gemini-generated message */}
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
          <button
            onClick={handleOkay}
            className="py-3 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 font-bold text-sm hover:bg-emerald-500/25 transition-all duration-200 active:scale-95"
          >
            ✅ Yes, I'm okay!
          </button>
          <button
            onClick={() => handleNotOkay(false)}
            className="py-3 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all duration-200 active:scale-95"
          >
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
