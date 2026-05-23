
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, MapPin, Navigation, Search, Loader2, AlertCircle, X, Star, ChevronLeft, ChevronRight, Calculator, Bookmark, Plus, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCountryPreference, countryData } from '@/hooks/use-country-preference';
import { useSavedStations } from '@/lib/useSavedStations';
import { useFuelLogs } from '@/lib/useFuelLogs';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/auth-modal';
import { useToast } from '@/hooks/use-toast';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const fuelIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M12 13V2"/><path d="M12 2a2 2 0 0 0-2 2v7"/><path d="M12 2a2 2 0 0 1 2 2v7"/><path d="M10 22v-5a2 2 0 0 1 2-2h.01"/><path d="M4 9h16"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const selectedFuelIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.95); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.3); z-index: 1000;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M12 13V2"/><path d="M12 2a2 2 0 0 0-2 2v7"/><path d="M12 2a2 2 0 0 1 2 2v7"/><path d="M10 22v-5a2 2 0 0 1 2-2h.01"/><path d="M4 9h16"/></svg></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44]
});

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function haversineDistance(lat1, lon1, lat2, lon2, unit = 'km') {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = unit === 'miles' ? 3959 : 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function Home() {
  const [location, navigate] = useLocation();
  const [view, setView] = useState('search');
  const { user } = useAuth();
  const { toast } = useToast();
  const { savedStations, saveStation, removeStation } = useSavedStations();
  const { addLog, logs, loading: logsLoading } = useFuelLogs();
  const { country, setCountry } = useCountryPreference();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [stationForLog, setStationForLog] = useState<{id?: string; name: string; brand?: string; lat: number; lon: number} | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const [logFormData, setLogFormData] = useState({
    filled_at: new Date().toISOString().slice(0, 16),
    fuel_type: 'petrol' as const,
    amount: '',
    price: '',
    mileage: '',
    notes: '',
  });

   const [isSubmittingLog, setIsSubmittingLog] = useState(false);

   const [zipCode, setZipCode] = useState('');

  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [radius, setRadius] = useState('10');
  const [distanceUnit, setDistanceUnit] = useState('km');

  // Get currency symbol based on selected country
  const currency = useMemo(() => {
    const countryCode = country || 'IN';
    return (countryData as any)[countryCode]?.currency || '$';
  }, [country]);

  const metrics = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        totalFuel: 0,
        totalStations: 0,
        totalDistance: 0,
        totalSpent: 0,
        avgPricePerL: 0,
      };
    }

    const totalFuel = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
    const stationIds = new Set(logs.map(log => log.station_id).filter(Boolean));
    const totalStations = stationIds.size;

    // Sum all individual mileage entries (distance between fill-ups)
    const totalDistance = logs.reduce((sum, log) => sum + (log.mileage || 0), 0);

    const totalSpent = logs.reduce((sum, log) => sum + (log.price || 0), 0);
    const avgPricePerL = totalFuel > 0 ? totalSpent / totalFuel : 0;

    return { totalFuel, totalStations, totalDistance, totalSpent, avgPricePerL };
  }, [logs]);

   const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingLocation, setUsingLocation] = useState(false);
  
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  const isMobile = useIsMobile();
  
  const [isCountryChangeDialogOpen, setIsCountryChangeDialogOpen] = useState(false);
  const [nextCountry, setNextCountry] = useState<string | null>(null);

  useEffect(() => {
    if (country === 'US') {
      setDistanceUnit('miles');
    } else {
      setDistanceUnit('km');
    }
    setZipCode('');
  }, [country]);

  useEffect(() => {
    const handleGoHome = () => {
      setView('search');
      setStations([]);
      setSelectedStation(null);
      setError('');
    };
    window.addEventListener('findmyfuel:go-home', handleGoHome);
    return () => window.removeEventListener('findmyfuel:go-home', handleGoHome);
  }, []);

  useEffect(() => {
    if (location === '/') {
      setView('search');
      setStations([]);
      setSelectedStation(null);
      setError('');
    }
  }, [location]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setError('');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setZipCode('');
        setUsingLocation(true);
        setLoading(false);
      },
      (err) => {
        setError('Unable to get location: ' + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const geocodeZip = async (zip) => {
    try {
      // 1. Structured postcode search with country constraint (e.g. IN)
      const res = await fetch(`${NOMINATIM_URL}?postalcode=${zip}&country=${country?.toLowerCase() || ''}&format=json&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }

      // 2. Structured postcode search without country constraint
      const fallbackRes = await fetch(`${NOMINATIM_URL}?postalcode=${zip}&format=json&limit=1`);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.length > 0) {
          return { lat: parseFloat(fallbackData[0].lat), lon: parseFloat(fallbackData[0].lon) };
        }
      }

      // 3. Free-form query search with ZIP + country name (e.g., "560001, India")
      const countryName = country ? (countryData[country]?.name || '') : '';
      if (countryName) {
        const textCountryRes = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(zip + ', ' + countryName)}&format=json&limit=1`);
        if (textCountryRes.ok) {
          const textCountryData = await textCountryRes.json();
          if (textCountryData && textCountryData.length > 0) {
            return { lat: parseFloat(textCountryData[0].lat), lon: parseFloat(textCountryData[0].lon) };
          }
        }
      }

      // 4. Free-form query search with just ZIP code text
      const textRes = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(zip)}&format=json&limit=1`);
      if (textRes.ok) {
        const textData = await textRes.json();
        if (textData && textData.length > 0) {
          return { lat: parseFloat(textData[0].lat), lon: parseFloat(textData[0].lon) };
        }
      }

      return null;
    } catch (e) {
      console.error('Geocoding error:', e);
      return null;
    }
  };

  const buildOverpassQuery = (latValue, lonValue, radiusMeters) => {
    return `
      [out:json];
      (
        node
          [\"amenity\"=\"fuel\"]
          (around:${radiusMeters},${latValue},${lonValue});
      );
      out center;
    `;
  };

  const fetchStations = async () => {
    setError('');
    setStations([]);
    setSelectedStation(null);
    
    let searchLat = lat;
    let searchLon = lon;

    setLoading(true);

    try {
      if (zipCode.trim()) {
        const coords = await geocodeZip(zipCode);
        if (coords) {
          searchLat = coords.lat;
          searchLon = coords.lon;
          setLat(searchLat);
          setLon(searchLon);
          setUsingLocation(false);
        } else {
          throw new Error('Could not find location for this ZIP code.');
        }
      } else if (searchLat === null || searchLon === null) {
        throw new Error('Please enter a ZIP code or use \"My Location\".');
      }

      const radiusMeters = parseInt(radius) * (distanceUnit === 'miles' ? 1609.34 : 1000);
      const query = buildOverpassQuery(searchLat, searchLon, radiusMeters);
      
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Overpass API error: ${res.status}`);
      }
      
      const data = await res.json();
      const elements = data.elements || [];
      
      const parsed = elements
        .filter((el) => el.type === 'node')
        .map((el) => {
          const name = el.tags?.name || 'Unnamed fuel station';
          const brand = el.tags?.brand || 'Unknown brand';
          const distance = haversineDistance(
            searchLat,
            searchLon,
            el.lat,
            el.lon,
            distanceUnit
          );
          return {
            id: el.id,
            name,
            brand,
            lat: el.lat,
            lon: el.lon,
            distance,
            rating: (Math.random() * 2 + 3).toFixed(1), 
            isOpen: Math.random() > 0.2 
          };
        })
        .sort((a, b) => a.distance - b.distance);

      setStations(parsed);
      setView('results');
    } catch (e) {
      setError(e.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setView('search');
    setStations([]);
    setSelectedStation(null);
  };

  const directionsUrl = (station) =>
    `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${station.lat},${station.lon}`;

  const handleZipChange = (e) => {
    setZipCode(e.target.value);
    if (e.target.value) {
      setUsingLocation(false);
    }
  };
  
  const handleCountryChange = (value) => {
    const tripHistory = localStorage.getItem("tripCalculations");
    if (tripHistory) {
      setNextCountry(value);
      setIsCountryChangeDialogOpen(true);
    } else {
      setCountry(value);
    }
  };


  const handleSaveStation = async (station) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    const isSaved = savedStations.find(s => s.lat === station.lat && s.lon === station.lon);
    
    if (isSaved) {
      const result = await removeStation(isSaved.id);
      if (result?.error) {
        toast({
          title: "Failed to remove station",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Station removed",
          description: "The station has been removed from your saved list.",
        });
      }
    } else {
      const result = await saveStation({
        name: station.name,
        brand: station.brand,
        lat: station.lat,
        lon: station.lon,
      });
      
      if (result?.error) {
        toast({
          title: "Failed to save station",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Station saved",
          description: "This station has been saved to your profile.",
        });
      }
    }
  };

   const handleAddLog = async (station) => {
     if (!user) {
       setIsAuthOpen(true);
       return;
     }

     // Check if station is saved, if not save it first
     let stationId = savedStations.find(s => s.lat === station.lat && s.lon === station.lon)?.id;

     if (!stationId) {
       const result = await saveStation({
         name: station.name,
         brand: station.brand,
         lat: station.lat,
         lon: station.lon,
       });

       if (result?.error) {
         toast({
           title: "Failed to save station",
           description: result.error.message,
           variant: "destructive",
         });
         return;
       }

       if (result?.data) {
         stationId = result.data.id;
       }
     }

    if (stationId) {
      setStationForLog({ ...station, id: stationId });
      setIsAddLogOpen(true);
    }
  };

   const handleSubmitLog = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!stationForLog) return;

     setIsSubmittingLog(true);
     try {
       const result = await addLog({
         station_id: stationForLog.id!,
         filled_at: logFormData.filled_at,
         fuel_type: logFormData.fuel_type,
         amount: parseFloat(logFormData.amount),
         price: parseFloat(logFormData.price),
         currency: currency,
         mileage: logFormData.mileage ? parseFloat(logFormData.mileage) : null,
         notes: logFormData.notes || null,
       });

       if (result?.error) {
         toast({
           title: 'Failed to add fuel log',
           description: result.error.message,
           variant: 'destructive',
         });
       } else {
         toast({
           title: 'Fuel log added',
           description: `Logged ${logFormData.amount}L at ${stationForLog.name}`,
         });
         setIsAddLogOpen(false);
         setStationForLog(null);
       }
     } catch (error) {
       toast({
         title: 'Error',
         description: 'An unexpected error occurred',
         variant: 'destructive',
       });
     } finally {
       setIsSubmittingLog(false);
     }
   };

  return (
    <div className="h-full w-full bg-background text-foreground flex flex-col overflow-hidden">
      <main className="flex-1 relative">
        
        <div className="absolute inset-0 z-0">
           <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={4} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={isMobile}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              
              {view === 'results' && lat && lon && (
                <>
                  <MapUpdater center={[lat, lon]} zoom={13} />
                  <Circle 
                    center={[lat, lon]} 
                    radius={parseInt(radius) * (distanceUnit === 'miles' ? 1609.34 : 1000)}
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1 }} 
                  />
                  
                  <Marker position={[lat, lon]}>
                    <Popup>You are here</Popup>
                  </Marker>

                  {stations.map((station) => (
                    <Marker 
                      key={station.id} 
                      position={[station.lat, station.lon]}
                      icon={selectedStation?.id === station.id ? selectedFuelIcon : fuelIcon}
                      eventHandlers={{
                        click: () => setSelectedStation(station),
                      }}
                    />
                  ))}
                </>
              )}
            </MapContainer>
        </div>

        <AnimatePresence>
          {view === 'search' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-between gap-3 sm:gap-5 bg-background/45 backdrop-blur-md px-3 py-3 sm:px-4 sm:py-6 overflow-y-auto"
            >
              <div className="hidden h-4 shrink-0 sm:block" />

              <motion.div
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md"
              >
              <Card className="relative w-full shadow-2xl border border-border/50 bg-card/85 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-emerald-500" />
                <CardContent className="relative space-y-4 p-4 sm:space-y-6 sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <motion.div
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.35 }}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:px-3 sm:text-xs"
                      >
                        <Fuel className="h-3.5 w-3.5" />
                        Live fuel station finder
                      </motion.div>
                      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Find Fuel Nearby</h2>
                      <p className="text-xs text-muted-foreground sm:text-sm">Discover the best fuel stations around you</p>
                    </div>
                    <Link href="/calculator">
                      <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors">
                        <Calculator className="w-5 h-5 text-primary" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-2.5 sm:space-y-3">
                      <p className="text-xs font-medium text-foreground/80 sm:text-sm">Location</p>
                      <div className="relative">
                        <Input 
                          placeholder="Enter ZIP Code" 
                          value={zipCode} 
                          onChange={handleZipChange}
                          className="h-11 pr-20 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base sm:h-12 sm:pr-24"
                        />
                        {usingLocation && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-primary flex items-center gap-1 font-semibold bg-primary/10 px-2 py-1 rounded-md border border-primary/20 sm:right-3 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs sm:rounded-lg">
                            <MapPin className="w-3.5 h-3.5" />
                            Current
                          </div>
                        )}
                      </div>
                       <Button 
                         variant={usingLocation ? "default" : "outline"}
                         className={`w-full h-11 text-sm font-medium transition-all duration-300 sm:h-12 sm:text-base ${
                           usingLocation 
                             ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl shadow-lg shadow-primary/25' 
                             : 'bg-transparent hover:bg-accent border-border/50 hover:border-primary/50'
                         }`}
                         onClick={handleUseMyLocation}
                         disabled={loading}
                       >
                         {loading && !zipCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                         {usingLocation ? "Current Location Active" : "Use My Current Location"}
                       </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground/80 sm:text-sm">Radius</p>
                        <Select value={radius} onValueChange={setRadius}>
                          <SelectTrigger className="h-11 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors sm:h-12">
                            <SelectValue placeholder="Radius" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 {distanceUnit}</SelectItem>
                            <SelectItem value="10">10 {distanceUnit}</SelectItem>
                            <SelectItem value="20">20 {distanceUnit}</SelectItem>
                            <SelectItem value="50">50 {distanceUnit}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground/80 sm:text-sm">Country</p>
                        <Select value={country || 'IN'} onValueChange={handleCountryChange}>
                          <SelectTrigger className="h-11 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors sm:h-12">
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent style={{ maxHeight: '20rem', overflowY: 'auto' }}>
                            {Object.entries(countryData).map(([code, data]) => (
                                <SelectItem key={code} value={code}>{data.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 sm:h-12 sm:text-base"
                      onClick={fetchStations}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                      Search Map
                    </Button>
                    
                    {error && (
                      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm flex flex-col gap-2">
                          <span>{error}</span>
                          {error.includes('Could not find location') && (
                            <span className="text-xs text-muted-foreground">
                              Tip: Try changing the country above and search again
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                 </CardContent>
                 <div className="px-4 pb-4 sm:px-8 sm:pb-6">
                   <p className="text-xs text-center text-muted-foreground">Made with care for travellers worldwide</p>
                 </div>
              </Card>
              </motion.div>

              <motion.div
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grid w-full max-w-2xl grid-cols-3 gap-2"
              >
                {[
                  { icon: MapPin, label: 'Nearby stations' },
                  { icon: Bookmark, label: 'Save favorites' },
                  { icon: Navigation, label: 'Quick directions' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.26 + index * 0.06, duration: 0.35 }}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-border/40 bg-card/75 px-2 text-center text-[11px] font-medium text-foreground/80 shadow-sm backdrop-blur sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{item.label}</span>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42, duration: 0.4 }}
                className="shrink-0 px-2 text-center text-[11px] text-foreground/65 sm:text-xs"
              >
                <span>Copyright {new Date().getFullYear()} findmyfuel. Created by </span>
                <a
                  href="https://jicoing.site"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  jicoing
                </a>
              </motion.footer>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AlertDialog open={isCountryChangeDialogOpen} onOpenChange={setIsCountryChangeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Country?</AlertDialogTitle>
              <AlertDialogDescription>
                Changing the country will erase your currently saved trip history. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNextCountry(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (nextCountry) {
                    setCountry(nextCountry);
                    localStorage.removeItem("tripCalculations");
                  }
                  setNextCountry(null);
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

<AnimatePresence>
          {view === 'results' && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-6 pointer-events-none">
              {!selectedStation && stations.length > 0 && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-auto"
                >
                  <div className="mb-2 flex items-center justify-between">
                     <Button variant="ghost" size="sm" onClick={handleNewSearch} className="gap-2 pointer-events-auto text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-colors">
                        <Search className="w-4 h-4" /> New Search
                     </Button>
                     <Badge variant="secondary" className="shadow-sm bg-card/90 backdrop-blur text-foreground border-border/50 px-4 py-1.5 text-sm font-medium">
                        {stations.length} stations found
                     </Badge>
                  </div>
                  <div className="relative pointer-events-auto w-full">
                    <Carousel 
                      setApi={setCarouselApi}
                      opts={{ 
                        align: "start",
                        loop: false,
                        dragFree: true, // Allow smooth free dragging on mobile
                      }} 
                      className="w-full"
                    >
                      <CarouselContent className="-ml-3 pb-4">
                        {stations.map((station) => (
                          <CarouselItem key={station.id} className="pl-3 basis-[85%] sm:basis-[320px]">
                            <div className="h-full">
                              <Card 
                                className="cursor-pointer hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98] transition-all duration-300 border border-border/30 bg-card/90 backdrop-blur-sm overflow-hidden group h-full"
                                onClick={() => {
                                  if (!isMobile || !carouselApi || carouselApi.clickAllowed()) {
                                    setSelectedStation(station);
                                  }
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <CardContent className="p-5 relative">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                                      <Fuel className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                                      {station.distance.toFixed(1)} {distanceUnit}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-base truncate pr-2">{station.name}</h3>
                                  <p className="text-sm text-muted-foreground truncate mt-0.5">{station.brand}</p>
                                  <div className="mt-3 flex items-center gap-2 text-sm">
                                     <span className="flex items-center text-amber-500 font-semibold">
                                       <Star className="w-3.5 h-3.5 mr-1 fill-current" /> {station.rating}
                                     </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CarouselItem>
                        ))}
                        <CarouselItem key="static-saved-stations" className="pl-3 basis-[85%] sm:basis-[320px]">
                          <div className="h-full">
                            <Card 
                              className="cursor-pointer hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98] transition-all duration-300 border border-border/30 bg-card/90 backdrop-blur-sm overflow-hidden group h-full border-dashed"
                              onClick={() => {
                                if (!isMobile || !carouselApi || carouselApi.clickAllowed()) {
                                  navigate('/saved-stations');
                                }
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <CardContent className="p-5 relative flex flex-col items-center justify-center h-full text-center space-y-4">
                                <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform duration-300">
                                  <Bookmark className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                  <h3 className="font-bold text-lg">Saved Stations</h3>
                                  <p className="text-sm text-muted-foreground">View all your favorite fuel stations in one place</p>
                                </div>
                                <div className="mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 group-hover:translate-x-1 transition-transform">
                                  View all <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </CarouselItem>
                      </CarouselContent>
                      <CarouselPrevious className="hidden md:flex -left-4 bg-card/90 backdrop-blur border-border/50" />
                      <CarouselNext className="hidden md:flex -right-4 bg-card/90 backdrop-blur border-border/50" />
                    </Carousel>
                  </div>
                </motion.div>
              )}

              {selectedStation && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-auto w-full max-w-3xl mx-auto"
                >
                  <Card className="max-h-[78dvh] overflow-y-auto shadow-2xl border border-border/30 bg-card/95 backdrop-blur-xl sm:max-h-none sm:overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                    <div className="relative">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="absolute right-12 top-2 rounded-full h-9 w-9 bg-background/50 backdrop-blur hover:bg-background transition-colors z-10"
                         onClick={() => handleSaveStation(selectedStation)}
                       >
                         <Bookmark className={`w-4 h-4 ${savedStations.some(s => s.lat === selectedStation?.lat && s.lon === selectedStation?.lon) ? 'fill-primary text-primary' : ''}`} />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="absolute right-2 top-2 rounded-full h-9 w-9 bg-background/50 backdrop-blur hover:bg-background transition-colors z-10"
                         onClick={() => setSelectedStation(null)}
                      >
                         <X className="w-4 h-4" />
                      </Button>
                      
                      <CardContent className="p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
                           <div className="shrink-0">
                              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white shadow-xl shadow-primary/30 mx-auto md:mx-0 group-hover:scale-105 transition-transform duration-300 sm:h-28 sm:w-28 sm:rounded-2xl">
                                 <Fuel className="h-9 w-9 sm:h-12 sm:w-12" />
                              </div>
                           </div>
                           
                           <div className="flex-1 space-y-2 text-center md:text-left sm:space-y-3">
                             <h2 className="text-xl font-bold tracking-tight md:text-3xl">{selectedStation.name}</h2>
                             <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-foreground/70 md:justify-start">
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                <span className="font-semibold text-amber-500">{selectedStation.rating}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{selectedStation.distance.toFixed(1)} {distanceUnit} away</span>
                             </div>
                             <p className="text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-2 sm:text-sm">
                                <MapPin className="w-4 h-4" />
                                {selectedStation.lat.toFixed(4)}, {selectedStation.lon.toFixed(4)}
                             </p>
                             <div className="flex items-center justify-center md:justify-start gap-2.5 mt-3">
                                {selectedStation.isOpen ? (
                                   <Badge className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-transparent text-white shadow-sm">Open Now</Badge>
                                ) : (
                                   <Badge variant="destructive">Closed</Badge>
                                )}
                                <Badge variant="outline" className="bg-secondary/30">{selectedStation.brand}</Badge>
                             </div>
                           </div>
                        </div>
                        
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                           <motion.div whileTap={{ scale: 0.95 }} className="w-full">
                             <Button 
                               className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 sm:h-14 sm:text-base" 
                               onClick={() => handleAddLog(selectedStation)}
                             >
                                <Plus className="w-4 h-4 mr-2 sm:h-5 sm:w-5 sm:mr-2.5" />
                                Add Log
                             </Button>
                           </motion.div>
                           <motion.div whileTap={{ scale: 0.95 }} className="w-full">
                             <Button className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 sm:h-14 sm:text-base" asChild>
                                <a href={directionsUrl(selectedStation)} target="_blank" rel="noreferrer">
                                   <Navigation className="w-4 h-4 mr-2 sm:h-5 sm:w-5 sm:mr-2.5" />
                                   Get Directions
                                </a>
                             </Button>
                           </motion.div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              )}
              {user && !logsLoading && logs.length > 0 && null}
            </div>
          )}
        </AnimatePresence>

        <Dialog open={isAddLogOpen} onOpenChange={setIsAddLogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Fuel Log</DialogTitle>
              <DialogDescription>
                Record a fuel fill-up at {stationForLog?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitLog}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="filled_at">Date & Time</Label>
                  <Input
                    id="filled_at"
                    type="datetime-local"
                    value={logFormData.filled_at}
                    onChange={(e) => setLogFormData({ ...logFormData, filled_at: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <Select
                    value={logFormData.fuel_type}
                    onValueChange={(value: any) => setLogFormData({ ...logFormData, fuel_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (L)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={logFormData.amount}
                      onChange={(e) => setLogFormData({ ...logFormData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Total Price ({currency})</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={logFormData.price}
                      onChange={(e) => setLogFormData({ ...logFormData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mileage">Mileage (km, optional)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    step="0.1"
                    min="0"
                    value={logFormData.mileage}
                    onChange={(e) => setLogFormData({ ...logFormData, mileage: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={logFormData.notes}
                    onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
                    placeholder="Any additional details..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddLogOpen(false)} disabled={isSubmittingLog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingLog}>
                  {isSubmittingLog && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                  Save Log
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
      </main>
    </div>
  );
}
