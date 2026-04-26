import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SOSButton = ({ activeTrip, userId, currentHR, currentLocation, onSOSTriggered }) => {
  const { socket } = useSocket();
  const [localTriggered, setLocalTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdTimer, setHoldTimer] = useState(null);
  const HOLD_MS = 1500;

  const triggered = activeTrip?.alertLevel === 'sos' || localTriggered;

  useEffect(() => {
    if (activeTrip?.alertLevel === 'normal') setLocalTriggered(false);
  }, [activeTrip?.alertLevel]);

  // --- Upload audio (real or empty) to trigger AI analysis ---
  // NOTE: axios interceptor in AuthContext automatically attaches Authorization header.
  const uploadAudioForAnalysis = async (incidentId, audioBlob) => {
    if (!incidentId) {
      console.error('uploadAudioForAnalysis: missing incidentId');
      return;
    }
    const formData = new FormData();
    if (audioBlob && audioBlob.size > 0) {
      formData.append('audio', audioBlob, 'sos_audio.webm');
    }
    try {
      await axios.post(`${API}/incidents/${incidentId}/audio`, formData);
      toast.success('✨ AI risk report generated for security team.');
    } catch (err) {
      console.error('Audio upload failed:', err?.response?.status, err?.response?.data || err.message);
      toast.error(`⚠️ AI report failed (${err?.response?.status || 'network'}). Security still notified.`, {
        duration: 5000,
      });
    }
  };

  // --- Try to record 7s of audio; fall back gracefully ---
  const startAudioRecording = async (incidentId) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices not supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setRecording(false);
        setRecordingCountdown(0);
        await uploadAudioForAnalysis(incidentId, audioBlob);
      };

      setRecording(true);
      setRecordingCountdown(7);
      mediaRecorder.start();

      // countdown timer
      let count = 7;
      const countId = setInterval(() => {
        count -= 1;
        setRecordingCountdown(count);
        if (count <= 0) clearInterval(countId);
      }, 1000);

      setTimeout(() => {
        clearInterval(countId);
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      }, 7000);

    } catch (err) {
      console.warn('Mic unavailable, sending telemetry-only AI analysis:', err.message);
      toast('🎙️ Mic unavailable — generating AI report from telemetry...', {
        duration: 3000,
        icon: '⚠️',
      });
      // Send an empty request — the backend will generate a report based on biometrics only
      await uploadAudioForAnalysis(incidentId, null);
    }
  };

  const triggerSOS = useCallback(async () => {
    if (!activeTrip || triggered || loading) return;
    setLoading(true);
    try {
      const payload = {
        tripId: activeTrip._id,
        type: 'SOS',
        location: currentLocation,
        biometricSnapshot: { hr: currentHR },
        notes: 'Manual SOS triggered by user',
      };

      const { data: incident } = await axios.post(`${API}/incidents`, payload);

      // Instant socket push so map turns red immediately
      if (socket) {
        socket.emit('sos-trigger', {
          tripId: activeTrip._id,
          userId,
          lat: currentLocation?.lat,
          lng: currentLocation?.lng,
          hr: currentHR,
        });
      }

      setLocalTriggered(true);
      onSOSTriggered?.();
      toast.error('🚨 SOS Activated! Security has been alerted.', { duration: 6000 });

      // Start audio recording / AI analysis in background
      startAudioRecording(incident._id);
    } catch (err) {
      const msg = err?.response?.data?.message || 'SOS failed to send. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTrip, triggered, loading, currentLocation, currentHR, socket, userId, onSOSTriggered]);

  const startHold = () => {
    if (!activeTrip || triggered) return;
    let start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / HOLD_MS) * 100, 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setHoldProgress(0);
        triggerSOS();
      }
    }, 30);
    setHoldTimer(id);
  };

  const cancelHold = () => {
    if (holdTimer) { clearInterval(holdTimer); setHoldTimer(null); }
    setHoldProgress(0);
  };

  if (!activeTrip) {
    return (
      <div className="card opacity-50">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={20} className="text-brand-muted" />
          <h2 className="font-bold text-brand-muted">SOS Emergency</h2>
        </div>
        <p className="text-brand-muted text-sm">Start a journey to enable SOS</p>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle size={20} className="text-red-400" />
        <div>
          <h2 className="font-bold text-brand-text">Emergency SOS</h2>
          <p className="text-xs text-brand-muted">Hold button to send distress signal</p>
        </div>
      </div>

      {triggered ? (
        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-6 text-center animate-fade-in">
          <div className="text-4xl mb-3">🚨</div>
          <p className="text-red-400 font-black text-lg mb-1">SOS SENT</p>
          <p className="text-red-300/70 text-sm mb-4">Security has been notified and is responding to your location.</p>

          {recording && (
            <div className="bg-brand-surface/50 border border-brand-border rounded-xl p-3 flex flex-col items-center gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Recording Audio — {recordingCountdown}s
                </span>
              </div>
              <div className="w-full bg-brand-border rounded-full h-1">
                <div
                  className="bg-red-500 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${((7 - recordingCountdown) / 7) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-brand-muted">Capturing audio for AI situational analysis...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping-slow scale-125" />
            <button
              id="btn-sos"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              disabled={loading}
              className="relative w-36 h-36 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-black text-2xl shadow-2xl shadow-red-500/50 animate-glow-red select-none transition-transform active:scale-95 border-4 border-red-400/30"
              style={{
                background: holdProgress > 0
                  ? `conic-gradient(#ef4444 ${holdProgress * 3.6}deg, #991b1b ${holdProgress * 3.6}deg)`
                  : undefined,
              }}
            >
              <span className="text-4xl">🆘</span>
              <div className="text-[11px] font-bold uppercase tracking-widest mt-1">HOLD</div>
            </button>
          </div>

          {holdProgress > 0 && (
            <div className="w-full bg-brand-surface rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full transition-all duration-75"
                style={{ width: `${holdProgress}%` }} />
            </div>
          )}

          <p className="text-brand-muted text-xs text-center">
            Hold for {HOLD_MS / 1000} seconds to trigger emergency alert. <br />
            Releases immediately if you let go.
          </p>
        </div>
      )}
    </div>
  );
};

export default SOSButton;
