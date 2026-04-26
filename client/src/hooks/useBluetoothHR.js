import { useState, useCallback, useEffect } from 'react';

export const useBluetoothHR = () => {
  const [hr, setHr] = useState(null);
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState(null);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(false);
  const [device, setDevice] = useState(null);

  useEffect(() => {
    if (navigator.bluetooth) {
      setSupported(true);
    }
  }, []);

  const handleHRMeasurement = (event) => {
    const value = event.target.value;
    const flags = value.getUint8(0);
    const hr16 = flags & 0x01;
    let currentHr;
    if (hr16) {
      currentHr = value.getUint16(1, true);
    } else {
      currentHr = value.getUint8(1);
    }
    setHr(currentHr);
  };

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth is not supported in this browser.');
      return;
    }
    setError(null);
    try {
      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      });
      setDeviceName(bleDevice.name || 'Unknown Device');
      setDevice(bleDevice);

      bleDevice.addEventListener('gattserverdisconnected', disconnect);

      const server = await bleDevice.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleHRMeasurement);
      setConnected(true);
    } catch (err) {
      console.error('Bluetooth connection failed:', err);
      setError(err.message);
      setConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setConnected(false);
    setHr(null);
    setDeviceName(null);
  }, [device]);

  return { connect, disconnect, hr, connected, deviceName, error, supported };
};
