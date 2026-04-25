import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

const BASE_HR = 70;
const VARIANCE = 12;
const CRISIS_HR_MIN = 130;
const CRISIS_HR_MAX = 165;
const EMIT_INTERVAL = 3000; // 3 seconds

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export const useBiometrics = (tripId, userId, isActive, isCrisis = false) => {
  const { socket } = useSocket();
  const [heartRate, setHeartRate] = useState(BASE_HR);
  const [trend, setTrend] = useState('stable'); // 'up' | 'down' | 'stable'
  const prevHR = useRef(BASE_HR);
  const intervalRef = useRef(null);

  const generateHR = useCallback(() => {
    let hr;
    if (isCrisis) {
      hr = CRISIS_HR_MIN + Math.floor(Math.random() * (CRISIS_HR_MAX - CRISIS_HR_MIN));
    } else {
      const delta = (Math.random() - 0.5) * VARIANCE;
      hr = clamp(Math.round(prevHR.current + delta), 55, 115);
    }
    const t = hr > prevHR.current + 2 ? 'up' : hr < prevHR.current - 2 ? 'down' : 'stable';
    prevHR.current = hr;
    setHeartRate(hr);
    setTrend(t);
    return hr;
  }, [isCrisis]);

  useEffect(() => {
    if (!isActive) {
      clearInterval(intervalRef.current);
      return;
    }

    const tick = () => {
      const hr = generateHR();
      if (socket && tripId) {
        socket.emit('biometric-update', { tripId, userId, hr });
      }
    };

    tick();
    intervalRef.current = setInterval(tick, EMIT_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [isActive, generateHR, socket, tripId, userId]);

  return { heartRate, trend };
};
