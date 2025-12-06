import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, MapPin, Navigation, Search, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius in km
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

interface Station {
  id: number;
  name: string;
  brand: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

export default function Home() {
  const [zipCode, setZipCode] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radiusKm, setRadiusKm] = useState('20');
  const [brandFilter, setBrandFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [usingLocation, setUsingLocation] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setError('');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latVal = pos.coords.latitude.toFixed(6);
        const lonVal = pos.coords.longitude.toFixed(6);
        setLat(latVal);
        setLon(lonVal);
        setZipCode(''); // Clear ZIP when using geolocation
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

  const geocodeZip = async (zip: string): Promise<{ lat: string, lon: string } | null> => {
    try {
      const res = await fetch(`${NOMINATIM_URL}?postalcode=${zip}&format=json&limit=1`);
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
      }
      return null;
    } catch (e) {
      console.error('Geocoding error:', e);
      return null;
    }
  };

  const buildOverpassQuery = (latValue: string, lonValue: string, radiusMeters: number) => {
    return `
      [out:json];
      (
        node
          ["amenity"="fuel"]
          (around:${radiusMeters},${latValue},${lonValue});
      );
      out center;
    `;
  };

  const fetchStations = async () => {
    setError('');
    setStations([]);
    setHasSearched(true);
    
    let searchLat = lat;
    let searchLon = lon;

    setLoading(true);

    try {
      // If ZIP code is entered and we are not explicitly using "My Location" (or even if we are, prefer user input if they typed something new)
      // Logic: If user typed in ZIP input, try to geocode it.
      if (zipCode.trim()) {
        const coords = await geocodeZip(zipCode);
        if (coords) {
          searchLat = coords.lat;
          searchLon = coords.lon;
          // Update state to reflect the found coordinates
          setLat(searchLat);
          setLon(searchLon);
          setUsingLocation(false);
        } else {
          throw new Error('Could not find location for this ZIP code.');
        }
      } else if (!searchLat || !searchLon) {
        throw new Error('Please enter a ZIP code or use "My Location".');
      }

      const radiusMeters = parseInt(radiusKm) * 1000;
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
      
      const parsed: Station[] = elements
        .filter((el: any) => el.type === 'node')
        .map((el: any) => {
          const name = el.tags?.name || 'Unnamed fuel station';
          const brand = el.tags?.brand || 'Unknown brand';
          const distanceKm = haversineDistanceKm(
            parseFloat(searchLat),
            parseFloat(searchLon),
            el.lat,
            el.lon
          );
          return {
            id: el.id,
            name,
            brand,
            lat: el.lat,
            lon: el.lon,
            distanceKm
          };
        })
        .sort((a: Station, b: Station) => a.distanceKm - b.distanceKm);

      const filtered =
        brandFilter === 'all'
          ? parsed
          : parsed.filter(
              (s) =>
                s.brand.toLowerCase().includes(brandFilter.toLowerCase())
            );

      setStations(filtered);
    } catch (e: any) {
      setError(e.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const directionsUrl = (station: Station) =>
    `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat},${lon};${station.lat},${station.lon}`;

  // Clear "Using Location" state if user types in ZIP
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(e.target.value);
    if (e.target.value) {
      setUsingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern text-foreground flex flex-col items-center py-10 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Fuel className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Fuel Finder</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Locate the nearest fuel stations instantly using real-time OpenStreetMap data.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          {/* Search Panel */}
          <Card className="md:col-span-5 h-fit border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Search Parameters</CardTitle>
              <CardDescription>Enter a ZIP code or use your current location.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Input 
                      placeholder="Enter ZIP Code (e.g. 90210)" 
                      value={zipCode} 
                      onChange={handleZipChange}
                      className="pr-10 font-mono"
                    />
                    {usingLocation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary flex items-center gap-1 font-medium bg-background/80 px-1.5 py-0.5 rounded">
                        <MapPin className="w-3 h-3" />
                        Current
                      </div>
                    )}
                  </div>
                  
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink-0 mx-2 text-muted-foreground text-xs">OR</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <Button 
                    variant={usingLocation ? "default" : "secondary"}
                    className="w-full" 
                    onClick={handleUseMyLocation}
                    disabled={loading}
                  >
                    {loading && !zipCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Use My Current Location
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Radius (km)</Label>
                <Select value={radiusKm} onValueChange={setRadiusKm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="20">20 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand Filter</Label>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    <SelectItem value="shell">Shell</SelectItem>
                    <SelectItem value="bp">BP</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="esso">Esso</SelectItem>
                    <SelectItem value="texaco">Texaco</SelectItem>
                    <SelectItem value="chevron">Chevron</SelectItem>
                    <SelectItem value="mobil">Mobil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full mt-4" 
                size="lg" 
                onClick={fetchStations}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Find Stations
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="md:col-span-7 border-border/50 shadow-xl bg-card/50 backdrop-blur-sm flex flex-col min-h-[500px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    {stations.length > 0 
                      ? `Found ${stations.length} stations nearby` 
                      : hasSearched && !loading 
                        ? 'No stations found' 
                        : 'Ready to search'}
                  </CardDescription>
                </div>
                {stations.length > 0 && (
                  <Badge variant="outline" className="font-mono">
                    {stations.length} results
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[500px] px-6 pb-6">
                {stations.length === 0 && !loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50 py-20">
                    <Fuel className="h-16 w-16" />
                    <p>Enter a ZIP code or use your location to start</p>
                  </div>
                ) : (
                  <ul className="space-y-4 pt-2">
                    <AnimatePresence>
                      {stations.map((station, index) => (
                        <motion.li
                          key={station.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="border border-border/40 hover:bg-accent/5 transition-colors overflow-hidden">
                            <div className="p-4 flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="font-semibold text-base leading-none">
                                  {station.name}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="secondary" className="text-xs font-normal">
                                    {station.brand}
                                  </Badge>
                                  <span className="font-mono text-xs">
                                    {station.distanceKm.toFixed(2)} km
                                  </span>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="shrink-0 gap-2"
                                asChild
                              >
                                <a 
                                  href={directionsUrl(station)} 
                                  target="_blank" 
                                  rel="noreferrer"
                                >
                                  <Navigation className="h-3.5 w-3.5" />
                                  Directions
                                </a>
                              </Button>
                            </div>
                          </Card>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
