import { Watch, Bluetooth, BluetoothConnected, AlertCircle, XCircle } from 'lucide-react';

const SmartWatchConnector = ({ bluetooth }) => {
  const { connect, disconnect, hr, connected, deviceName, error, supported } = bluetooth;

  if (!supported) {
    return (
      <div className="card border-brand-border/50 bg-brand-surface/30 opacity-70">
        <div className="flex items-center gap-3 mb-2">
          <Watch size={20} className="text-brand-muted" />
          <h2 className="font-bold text-brand-text text-sm">Smartwatch</h2>
        </div>
        <p className="text-xs text-brand-muted">Web Bluetooth not supported in this browser. Try Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in border-blue-500/20 bg-blue-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-blue-500/20 text-blue-400' : 'bg-brand-surface border border-brand-border text-brand-muted'}`}>
            {connected ? <BluetoothConnected size={20} /> : <Bluetooth size={20} />}
          </div>
          <div>
            <h2 className="font-bold text-brand-text">Smartwatch Integration</h2>
            <p className="text-xs text-brand-muted">
              {connected ? `Connected to ${deviceName}` : 'Link BLE device for real vitals'}
            </p>
          </div>
        </div>
        {connected ? (
          <button onClick={disconnect} className="p-2 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-red-400 hover:border-red-400/50 transition-colors" title="Disconnect">
            <XCircle size={18} />
          </button>
        ) : (
          <button onClick={connect} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
            Connect
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-2 items-start text-xs text-red-400">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {connected && (
        <div className="mt-2 flex items-center gap-3 p-3 bg-brand-surface rounded-xl border border-brand-border">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <span className="text-sm font-medium text-brand-text flex-1">Streaming live telemetry</span>
          <span className="text-lg font-black text-blue-400">{hr || '--'} <span className="text-xs text-brand-muted font-medium">BPM</span></span>
        </div>
      )}
    </div>
  );
};

export default SmartWatchConnector;
