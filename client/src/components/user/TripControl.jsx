import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, CheckCircle, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TripControl = ({ onTripStart, onTripEnd, activeTrip }) => {
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('tripDestination') || '');
  const [destination, setDestination] = useState(() => localStorage.getItem('tripDestination') || '');
  const [destinationCoords, setDestinationCoords] = useState(() => {
    const saved = localStorage.getItem('tripDestinationCoords');
    return saved ? JSON.parse(saved) : null;
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [journeyTime, setJourneyTime] = useState('');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounce = useRef(null);

  // Elapsed timer
  useEffect(() => {
    if (!activeTrip) { setElapsed(''); return; }
    const update = () => setElapsed(formatDistanceToNow(new Date(activeTrip.startTime), { includeSeconds: true }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeTrip]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCurrentPosition({ lat: 15.3173, lng: 73.9278 })
      );
    } else {
      setCurrentPosition({ lat: 15.3173, lng: 73.9278 });
    }
  }, []);

  useEffect(() => {
    if (!destinationCoords || !currentPosition) return;
    calculateJourneyTime(destinationCoords);
  }, [destinationCoords, currentPosition]);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
        },
      });

      setSearchResults(
        data.map((place) => ({
          label: place.display_name,
          lat: Number(place.lat),
          lng: Number(place.lon),
        }))
      );
    } catch (err) {
      setSearchError('Destination search unavailable right now.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    searchDebounce.current = setTimeout(() => fetchSuggestions(searchQuery), 300);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery, fetchSuggestions]);

  const selectSuggestion = (item) => {
    setDestination(item.label);
    setSearchQuery(item.label);
    setDestinationCoords({ lat: item.lat, lng: item.lng });
    setShowSuggestions(false);
    localStorage.setItem('tripDestination', item.label);
    localStorage.setItem('tripDestinationCoords', JSON.stringify({ lat: item.lat, lng: item.lng }));
  };

  const calculateJourneyTime = async (destinationLatLng) => {
    if (!currentPosition) {
      setJourneyTime('Current location unavailable');
      return;
    }

    try {
      const { data } = await axios.get(
        `https://router.project-osrm.org/route/v1/walking/${currentPosition.lng},${currentPosition.lat};${destinationLatLng.lng},${destinationLatLng.lat}`,
        {
          params: {
            overview: 'false',
            alternatives: false,
            steps: false,
          },
        }
      );

      if (data.code === 'Ok' && data.routes?.[0]) {
        const minutes = Math.max(1, Math.round(data.routes[0].duration / 60));
        setJourneyTime(`${minutes} min`);
      } else {
        setJourneyTime('Unable to calculate');
      }
    } catch (err) {
      setJourneyTime('Unable to calculate');
    }
  };

  const startTrip = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/trips/start`, {
        destinationLabel: destination || 'Hotel Campus',
      });
      toast.success('Safe Journey started! GPS & vitals are being monitored.');
      onTripStart(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not start trip');
    } finally {
      setLoading(false);
    }
  }, [onTripStart, destination]);

  const endTrip = useCallback(async () => {
    if (!activeTrip) return;
    setLoading(true);
    try {
      await axios.patch(`${API}/trips/${activeTrip._id}/end`);
      toast.success('Trip ended safely. Thank you!');
      onTripEnd();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not end trip');
    } finally {
      setLoading(false);
    }
  }, [activeTrip, onTripEnd]);


  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Navigation size={20} className="text-blue-400" />
        </div>
        <div>
          <h2 className="font-bold text-brand-text">Safe Journey</h2>
          <p className="text-xs text-brand-muted">GPS + biometrics monitoring</p>
        </div>
        {activeTrip && (
          <div className="ml-auto flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            ACTIVE
          </div>
        )}
      </div>

      {activeTrip ? (
        <div className="space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-surface rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-brand-muted text-xs mb-1">
                <Clock size={12} /> Elapsed
              </div>
              <p className="font-bold text-brand-text text-sm">{elapsed}</p>
            </div>
            <div className="bg-brand-surface rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-brand-muted text-xs mb-1">
                <MapPin size={12} /> Destination
              </div>
              <p className="font-bold text-brand-text text-sm truncate">{activeTrip.destinationLabel}</p>
            </div>
          </div>

          <button
            id="btn-end-trip"
            onClick={endTrip}
            disabled={loading}
            className="w-full py-3 rounded-xl border-2 border-emerald-500/50 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          >
            <CheckCircle size={18} />
            {loading ? 'Ending...' : 'End Journey Safely'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-brand-muted text-sm mb-4">
            Start a monitored journey. Security will be notified of your location and vitals in real time.
          </p>
          <div className="mb-3 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDestination(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search destination..."
              className="input-field"
              autoComplete="off"
            />
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-2xl border border-brand-border bg-brand-surface shadow-xl">
                {searchResults.map((item, index) => (
                  <button
                    key={`${item.label}-${index}`}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    className="w-full text-left px-4 py-3 hover:bg-brand-border/70 transition-colors"
                  >
                    <div className="text-sm font-semibold text-brand-text">{item.label}</div>
                    <div className="text-xs text-brand-muted">{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</div>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <p className="text-xs text-brand-muted mt-2">Searching for destinations...</p>
            )}
            {searchError && (
              <p className="text-xs text-red-400 mt-2">{searchError}</p>
            )}
            {journeyTime && (
              <p className="text-xs text-brand-muted mt-2">Estimated journey time: {journeyTime}</p>
            )}
          </div>
          <button
            id="btn-start-trip"
            onClick={startTrip}
            disabled={loading || !destination}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
            {loading ? 'Starting...' : 'Start Safe Journey'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TripControl;
