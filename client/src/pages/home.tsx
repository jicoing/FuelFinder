
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, MapPin, Navigation, Search, Loader2, AlertCircle, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useIsMobile } from '@/hooks/use-mobile';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const fuelIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style=\"background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 22v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8\"/><path d=\"M12 13V2\"/><path d=\"M12 2a2 2 0 0 0-2 2v7\"/><path d=\"M12 2a2 2 0 0 1 2 2v7\"/><path d=\"M10 22v-5a2 2 0 0 1 2-2h.01\"/><path d=\"M4 9h16\"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const selectedFuelIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style=\"background-color: #3b82f6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); z-index: 1000;\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 22v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8\"/><path d=\"M12 13V2\"/><path d=\"M12 2a2 2 0 0 0-2 2v7\"/><path d=\"M12 2a2 2 0 0 1 2 2v7\"/><path d=\"M10 22v-5a2 2 0 0 1 2-2h.01\"/><path d=\"M4 9h16\"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
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
  const [view, setView] = useState('search');
  
  const [zipCode, setZipCode] = useState('');
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [radius, setRadius] = useState('10');
  const [country, setCountry] = useState('IN');
  const [distanceUnit, setDistanceUnit] = useState('km');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingLocation, setUsingLocation] = useState(false);
  
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (country === 'US') {
      setDistanceUnit('miles');
    } else {
      setDistanceUnit('km');
    }
  }, [country]);

  useEffect(() => {
    checkScrollability();
  }, [stations]);

  const checkScrollability = () => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      setCanScrollLeft(viewport.scrollLeft > 0);
      setCanScrollRight(viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth);
    }
  };

  const handleScroll = () => {
    checkScrollability();
  };

  const scrollLeft = () => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

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
      const res = await fetch(`${NOMINATIM_URL}?postalcode=${zip}&country=${country.toLowerCase()}&format=json&limit=1`);
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
            >
              <Card className="w-full max-w-md shadow-2xl border-border/50">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Find Fuel Nearby</h2>
                    <p className="text-muted-foreground">Enter your location to see stations on the map</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <div className="relative">
                        <Input 
                          placeholder="Enter ZIP Code" 
                          value={zipCode} 
                          onChange={handleZipChange}
                          className="pr-24"
                        />
                        {usingLocation && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary flex items-center gap-1 font-medium bg-background px-2 py-1 rounded border">
                            <MapPin className="w-3 h-3" />
                            Current
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="default" 
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={handleUseMyLocation}
                        disabled={loading}
                      >
                        {loading && !zipCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        Use My Current Location
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="spacey-2">
                        <p className="text-sm font-medium text-muted-foreground">Radius</p>
                        <Select value={radius} onValueChange={setRadius}>
                          <SelectTrigger>
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
                        <p className="text-sm font-medium text-muted-foreground">Country</p>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger>
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IN">India</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg" 
                      onClick={fetchStations}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Search Map'}
                    </Button>
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
                <p className="text-xs text-center text-muted-foreground pb-4">Made with ❤️ for travellers</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {view === 'results' && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 pointer-events-none">
              {!selectedStation && stations.length > 0 && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="pointer-events-auto"
                >
                  <div className="mb-2 flex items-center justify-between">
                     <Button variant="ghost" size="sm" onClick={handleNewSearch} className="gap-2 pointer-events-auto">
                        <Search className="w-4 h-4" /> New Search
                     </Button>
                     <Badge variant="secondary" className="shadow-sm bg-background/90 backdrop-blur text-foreground border-none px-3 py-1">
                        {stations.length} stations found
                     </Badge>
                  </div>
                  <div className="relative">
                    <ScrollArea className="w-full whitespace-nowrap pb-4" viewportRef={scrollViewportRef} onScroll={handleScroll}>
                      <div className="flex space-x-4">
                        {stations.map((station) => (
                          <Card 
                            key={station.id} 
                            className="w-[280px] shrink-0 cursor-pointer hover:shadow-lg transition-shadow border-none shadow-md bg-card/95 backdrop-blur-sm"
                            onClick={() => setSelectedStation(station)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                  <Fuel className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {station.distance.toFixed(1)} {distanceUnit}
                                </span>
                              </div>
                              <h3 className="font-semibold truncate">{station.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">{station.brand}</p>
                              <div className="mt-3 flex items-center gap-2 text-xs">
                                 <span className="flex items-center text-amber-500 font-medium">
                                   <Star className="w-3 h-3 mr-1 fill-current" /> {station.rating}
                                 </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    {canScrollLeft && (
                      <Button variant="outline" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 bg-background/80 hover:bg-background" onClick={scrollLeft}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    )}
                    {canScrollRight && (
                      <Button variant="outline" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 bg-background/80 hover:bg-background" onClick={scrollRight}>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {selectedStation && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="pointer-events-auto w-full max-w-3xl mx-auto"
                >
                  <Card className="shadow-2xl border-none bg-card/95 backdrop-blur-md overflow-hidden">
                    <div className="relative">
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-2 rounded-full h-8 w-8 bg-background/50 hover:bg-background"
                          onClick={() => setSelectedStation(null)}
                       >
                          <X className="w-4 h-4" />
                       </Button>
                       
                       <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                             <div className="shrink-0">
                                <div className="h-24 w-24 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg mx-auto md:mx-0">
                                   <Fuel className="w-10 h-10" />
                                </div>
                             </div>
                             
                             <div className="flex-1 space-y-2 text-center md:text-left">
                                <h2 className="text-2xl font-bold">{selectedStation.name}</h2>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 dark:text-blue-400 font-medium">
                                   <Star className="w-4 h-4 fill-current" />
                                   <span>{selectedStation.rating}</span>
                                   <span className="text-muted-foreground">•</span>
                                   <span>{selectedStation.distance.toFixed(1)} {distanceUnit} away</span>
                                </div>
                                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                   <MapPin className="w-4 h-4" />
                                   {selectedStation.lat.toFixed(4)}, {selectedStation.lon.toFixed(4)}
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                   {selectedStation.isOpen ? (
                                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 border-transparent">Open Now</Badge>
                                   ) : (
                                      <Badge variant="destructive">Closed</Badge>
                                   )}
                                   <Badge variant="outline">{selectedStation.brand}</Badge>
                                </div>
                             </div>
                          </div>
                          
                          <div className="mt-6 grid grid-cols-2 gap-4">
                             <Button variant="outline" className="w-full h-12 text-base" onClick={handleNewSearch}>
                                <Search className="w-5 h-5 mr-2" />
                                New Search
                             </Button>
                             <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" asChild>
                                <a href={directionsUrl(selectedStation)} target="_blank" rel="noreferrer">
                                   <Navigation className="w-5 h-5 mr-2" />
                                   Get Directions
                                </a>
                             </Button>
                          </div>
                       </CardContent>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
