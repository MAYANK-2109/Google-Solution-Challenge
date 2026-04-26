import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin } from 'lucide-react';

const CAMPUS_CENTER = [15.3173, 73.9278];
const STATUS_COLORS = {
  normal:  '#10b981',
  warning: '#f59e0b',
  sos:     '#ef4444',
};

const MapController = ({ centerPoint }) => {
  const map = useMap();
  useEffect(() => {
    if (centerPoint && centerPoint.lat && centerPoint.lng) {
      map.flyTo([centerPoint.lat, centerPoint.lng], 18, { animate: true, duration: 1.5 });
    }
  }, [centerPoint, map]);
  return null;
};

const LiveMap = ({ userLocations, onSelectUser, centerPoint }) => {
  const mapRef = useRef(null);

  const handleMarkerClick = (entry) => {
    onSelectUser?.(entry);
  };

  return (
    <MapContainer
      center={centerPoint && centerPoint.lat ? [centerPoint.lat, centerPoint.lng] : CAMPUS_CENTER}
      zoom={16}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
    >
      <MapController centerPoint={centerPoint} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle
        center={CAMPUS_CENTER}
        radius={600}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.05,
        }}
      />

      {userLocations.map((entry) => {
        const color = STATUS_COLORS[entry.alertLevel || 'normal'];
        return (
          <CircleMarker
            key={entry.tripId}
            center={[entry.lat, entry.lng]}
            radius={entry.alertLevel === 'sos' ? 10 : entry.alertLevel === 'warning' ? 8 : 6}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
            eventHandlers={{ click: () => handleMarkerClick(entry) }}
          >
            <Popup>
              <div className="bg-brand-card p-3 rounded-2xl text-sm text-brand-text">
                <p className="font-bold mb-1">{entry.userName || 'User'}</p>
                <p className="text-brand-muted text-xs mb-2">{entry.lat?.toFixed(5)}, {entry.lng?.toFixed(5)}</p>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    background: `${STATUS_COLORS[entry.alertLevel || 'normal']}33`,
                    color: STATUS_COLORS[entry.alertLevel || 'normal'],
                  }}
                >
                  {entry.alertLevel || 'normal'}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default LiveMap;
