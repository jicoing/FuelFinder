import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, ArrowRight, Wallet, Route, Trash2, Loader2, MapPin, Navigation, Search, Crosshair, X } from "lucide-react";
import { Chart } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCountryPreference, countryData } from "@/hooks/use-country-preference";
import { useAuth } from "@/lib/auth-context";
import { useTripCalculations } from "@/lib/useTripCalculations";
import { AuthModal } from "@/components/auth-modal";
import { useToast } from "@/hooks/use-toast";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

// Straight-line distance fallback when road routing is unavailable.
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "km" | "miles" = "km",
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = unit === "miles" ? 3959 : 6371;
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

const TripCalculatorPage = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const {
    calculations,
    saveCalculation,
    deleteCalculation,
    deleteAllCalculations,
  } = useTripCalculations();

  const [distance, setDistance] = useState("200");
  const [mileage, setMileage] = useState("40");
  const [fuelRate, setFuelRate] = useState("107");
  const [budget, setBudget] = useState("200");
  const { country, setCountry } = useCountryPreference();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(country);

  // ---- Travel Planner state ----
  const [originMode, setOriginMode] = useState<"location" | "zip">("location");
  const [originZip, setOriginZip] = useState("");
  const [originLabel, setOriginLabel] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [destQuery, setDestQuery] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [destLabel, setDestLabel] = useState("");

  const [isPlanning, setIsPlanning] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planResult, setPlanResult] = useState<
    { distance: number; fuelNeeded: number; totalCost: number; isApprox: boolean } | null
  >(null);

  useEffect(() => {
    const savedMileage = localStorage.getItem("mileage");
    if (savedMileage) {
      setMileage(savedMileage);
    }
    const savedFuelRate = localStorage.getItem("fuelRate");
    if (savedFuelRate) {
      setFuelRate(savedFuelRate);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mileage", mileage);
  }, [mileage]);

  useEffect(() => {
    localStorage.setItem("fuelRate", fuelRate);
  }, [fuelRate]);

  const units = useMemo(() => {
    return countryData[country] || countryData.IN;
  }, [country]);

  // Debounced destination autocomplete via Nominatim.
  useEffect(() => {
    const q = destQuery.trim();
    // If the query exactly matches an already-selected destination, don't search.
    if (!q || q.length < 3 || q === destLabel) {
      setDestSuggestions([]);
      return;
    }

    setIsSearchingDest(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const countryParam = country ? `&countrycodes=${country.toLowerCase()}` : "";
        const res = await fetch(
          `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5${countryParam}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const data = await res.json();
          setDestSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
        }
      } catch (e: any) {
        if (e.name !== "AbortError") console.error("Destination search error:", e);
      } finally {
        setIsSearchingDest(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destQuery, country, destLabel]);

  const selectDestination = (suggestion: any) => {
    setDestCoords({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setDestLabel(suggestion.display_name);
    setDestQuery(suggestion.display_name);
    setShowSuggestions(false);
    setDestSuggestions([]);
    setPlanResult(null);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setPlanError("Geolocation is not supported by this browser.");
      return;
    }
    setPlanError("");
    setIsPlanning(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setOriginLabel("Your current location");
        setOriginZip("");
        setIsPlanning(false);
      },
      (err) => {
        setPlanError("Unable to get location: " + err.message);
        setIsPlanning(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const geocodeZip = async (zip: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const res = await fetch(
        `${NOMINATIM_URL}?postalcode=${encodeURIComponent(zip)}&country=${country?.toLowerCase() || ""}&format=json&limit=1`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }
      const countryName = country ? countryData[country]?.name || "" : "";
      const fallbackRes = await fetch(
        `${NOMINATIM_URL}?q=${encodeURIComponent(zip + (countryName ? ", " + countryName : ""))}&format=json&limit=1`,
      );
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }
      return null;
    } catch (e) {
      console.error("Geocoding error:", e);
      return null;
    }
  };

  const handlePlanTrip = async () => {
    setPlanError("");
    setPlanResult(null);

    const m = parseFloat(mileage);
    const r = parseFloat(fuelRate);
    if (!(m > 0) || !(r > 0)) {
      setPlanError("Please enter a valid mileage and fuel rate.");
      return;
    }

    if (!destCoords) {
      setPlanError("Please search and select a destination.");
      return;
    }

    setIsPlanning(true);
    try {
      // Resolve the origin coordinates.
      let origin = originCoords;
      if (originMode === "zip") {
        if (!originZip.trim()) {
          setPlanError("Please enter your starting ZIP / postal code.");
          setIsPlanning(false);
          return;
        }
        origin = await geocodeZip(originZip.trim());
        if (!origin) {
          setPlanError("Could not find that ZIP / postal code. Try a different value.");
          setIsPlanning(false);
          return;
        }
        setOriginCoords(origin);
        setOriginLabel(originZip.trim());
      }

      if (!origin) {
        setPlanError("Please set your starting point (use your location or enter a ZIP).");
        setIsPlanning(false);
        return;
      }

      const unit = units.distance === "miles" ? "miles" : "km";
      let distance: number | null = null;
      let isApprox = false;

      // Try OSRM road routing first.
      try {
        const res = await fetch(
          `${OSRM_URL}/${origin.lon},${origin.lat};${destCoords.lon},${destCoords.lat}?overview=false`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.routes?.length > 0) {
            const meters = data.routes[0].distance;
            distance = unit === "miles" ? meters / 1609.34 : meters / 1000;
          }
        }
      } catch (e) {
        console.error("Routing error:", e);
      }

      // Fallback to straight-line distance.
      if (distance === null) {
        distance = haversineDistance(origin.lat, origin.lon, destCoords.lat, destCoords.lon, unit);
        isApprox = true;
      }

      const fuelNeeded = distance / m;
      const totalCost = fuelNeeded * r;
      setPlanResult({ distance, fuelNeeded, totalCost, isApprox });
    } catch (e) {
      console.error("Trip planning error:", e);
      setPlanError("Something went wrong while planning your trip. Please try again.");
    } finally {
      setIsPlanning(false);
    }
  };

  const clearDestination = () => {
    setDestQuery("");
    setDestLabel("");
    setDestCoords(null);
    setDestSuggestions([]);
    setShowSuggestions(false);
    setPlanResult(null);
  };

  const handleSavePlannedTrip = async () => {
    if (!planResult) return;
    if (!user) {
      setIsAuthOpen(true);
      toast({
        title: "Sign in to save",
        description: "Create a free account to save your trips and sync them across devices.",
      });
      return;
    }

    const input = {
      type: "distanceToCost" as const,
      distance: planResult.distance,
      mileage: parseFloat(mileage),
      fuelRate: parseFloat(fuelRate),
      countryCode: country || "IN",
      currency: units.currency,
      volumeUnit: units.volume,
      distanceUnit: units.distance,
      originLabel: originLabel || (originMode === "zip" ? originZip.trim() : undefined),
      destinationLabel: destLabel || undefined,
    };
    const output = { fuelNeeded: planResult.fuelNeeded, totalCost: planResult.totalCost };

    const result = await saveCalculation(input, output);
    if (result && result.error) {
      toast({
        title: "Failed to save trip",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Trip saved",
        description: destLabel
          ? `Trip to ${destLabel.split(",")[0]} added to your history.`
          : "Your planned trip has been added to your history.",
      });
    }
  };

  // Normalize DB records and local storage calculations to a unified layout
  const normalizedCalculations = useMemo(() => {
    return calculations.map((calc: any) => {
      const isDbRecord = 'user_id' in calc;
      if (isDbRecord) {
        return {
          timestamp: calc.created_at || new Date().toISOString(),
          type: calc.type,
          inputs: {
            distance: calc.distance?.toString() || "",
            mileage: calc.mileage?.toString() || "",
            fuelRate: calc.fuel_rate?.toString() || "",
            budget: calc.budget?.toString() || "",
            country: calc.country_code || "IN",
            originLabel: calc.origin_label || undefined,
            destinationLabel: calc.destination_label || undefined,
          },
          outputs: {
            fuelNeeded: calc.fuel_needed !== null && calc.fuel_needed !== undefined ? Number(calc.fuel_needed) : undefined,
            totalCost: calc.total_cost !== null && calc.total_cost !== undefined ? Number(calc.total_cost) : undefined,
            fuelAffordable: calc.fuel_affordable !== null && calc.fuel_affordable !== undefined ? Number(calc.fuel_affordable) : undefined,
            distance: calc.distance_covered !== null && calc.distance_covered !== undefined ? Number(calc.distance_covered) : undefined,
          }
        };
      }
      return calc;
    });
  }, [calculations]);

  const distanceToCostResult = useMemo(() => {
    const d = parseFloat(distance);
    const m = parseFloat(mileage);
    const r = parseFloat(fuelRate);
    if (d > 0 && m > 0 && r > 0) {
      const fuelNeeded = d / m;
      const totalCost = fuelNeeded * r;
      return { fuelNeeded, totalCost };
    }
    return null;
  }, [distance, mileage, fuelRate, country]);

  const budgetToDistanceResult = useMemo(() => {
    const b = parseFloat(budget);
    const m = parseFloat(mileage);
    const r = parseFloat(fuelRate);
    if (b > 0 && m > 0 && r > 0) {
      const fuelAffordable = b / r;
      const distance = fuelAffordable * m;
      return { fuelAffordable, distance };
    }
    return null;
  }, [budget, mileage, fuelRate, country]);

  const weeklyDistanceData = useMemo(() => {
    const weeklyData = [
      { day: "Sun", distance: 0 },
      { day: "Mon", distance: 0 },
      { day: "Tue", distance: 0 },
      { day: "Wed", distance: 0 },
      { day: "Thu", distance: 0 },
      { day: "Fri", distance: 0 },
      { day: "Sat", distance: 0 },
    ];

    normalizedCalculations.forEach(calc => {
      const date = new Date(calc.timestamp);
      const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
      
      let distance = 0;
      if (calc.type === 'distanceToCost') {
        distance = parseFloat(calc.inputs.distance);
      } else if (calc.type === 'budgetToDistance') {
        distance = parseFloat(calc.outputs.distance);
      }

      if (!isNaN(distance)) {
        weeklyData[dayOfWeek].distance += distance;
      }
    });

    return weeklyData;
  }, [normalizedCalculations]);

  const budgetChartData = useMemo(() => {
    const dailyBudgetData = [
      { name: "Sun", value: 0 },
      { name: "Mon", value: 0 },
      { name: "Tue", value: 0 },
      { name: "Wed", value: 0 },
      { name: "Thu", value: 0 },
      { name: "Fri", value: 0 },
      { name: "Sat", value: 0 },
    ];

    normalizedCalculations.forEach(calc => {
      const date = new Date(calc.timestamp);
      const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
      
      let budget = 0;
      if (calc.type === 'distanceToCost') {
        budget = parseFloat(calc.outputs.totalCost);
      } else if (calc.type === 'budgetToDistance') {
        budget = parseFloat(calc.inputs.budget);
      }

      if (!isNaN(budget)) {
        dailyBudgetData[dayOfWeek].value += budget;
      }
    });

    return dailyBudgetData.filter(day => day.value > 0);
  }, [normalizedCalculations]);

  const handleSaveCalculation = async (type) => {
    if (!user) {
      setIsAuthOpen(true);
      toast({
        title: "Sign in to save",
        description: "Create a free account to save your calculations and sync them across devices.",
      });
      return;
    }
    const input = {
      type,
      distance: type === 'distanceToCost' ? parseFloat(distance) : undefined,
      mileage: parseFloat(mileage),
      fuelRate: parseFloat(fuelRate),
      budget: type === 'budgetToDistance' ? parseFloat(budget) : undefined,
      countryCode: country || 'IN',
      currency: units.currency,
      volumeUnit: units.volume,
      distanceUnit: units.distance,
    };

    const output = type === 'distanceToCost' 
      ? { fuelNeeded: distanceToCostResult?.fuelNeeded, totalCost: distanceToCostResult?.totalCost }
      : { fuelAffordable: budgetToDistanceResult?.fuelAffordable, distance: budgetToDistanceResult?.distance };

    const result = await saveCalculation(input, output);
    if (result && result.error) {
      toast({
        title: "Failed to save calculation",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Calculation saved",
        description: "Your calculation has been successfully synced with your account.",
      });
    }
  };

  const handleDeleteCalculation = async (timestamp) => {
    await deleteCalculation(timestamp);
    toast({
      title: "Calculation deleted",
      description: "The calculation has been removed from your history.",
    });
  };

  const handleDeleteAllCalculations = async () => {
    await deleteAllCalculations();
    toast({
      title: "All calculations deleted",
      description: "Your calculation history has been completely cleared.",
    });
  };

  const handleCountryChange = (newCountry) => {
    if (normalizedCalculations.length > 0) {
      setSelectedCountry(newCountry);
      setIsDialogOpen(true);
    } else {
      setCountry(newCountry);
    }
  };

  const confirmCountryChange = () => {
    setCountry(selectedCountry);
    handleDeleteAllCalculations();
    setIsDialogOpen(false);
  };

  const cancelCountryChange = () => {
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-md flex flex-col justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border">
                <AlertDialogHeader>
                <AlertDialogTitle className="text-xl">Change Country?</AlertDialogTitle>
                <AlertDialogDescription className="text-foreground/70">
                    Changing the country will delete all your saved trip history. This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelCountryChange} className="hover:bg-accent/50 transition-colors">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmCountryChange} className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>
        <CardHeader className="border-b border-border/30 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Fuel className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Trip Calculator</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Calculate fuel costs and plan your trips</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="mb-6">
            <Select onValueChange={handleCountryChange} value={country || 'IN'}>
              <SelectTrigger className="w-[200px] h-11 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent style={{ maxHeight: '20rem', overflowY: 'auto' }}>
                {Object.entries(countryData).map(([code, data]) => (
                  <SelectItem key={code} value={code}>{data.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs defaultValue="travelPlanner" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-secondary/30 rounded-xl mb-6">
              <TabsTrigger value="travelPlanner" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5 transition-all">
                <Navigation className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Travel Planner</span>
                <span className="sm:hidden">Planner</span>
              </TabsTrigger>
              <TabsTrigger value="distanceToCost" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5 transition-all">
                <Route className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Distance to Cost</span>
                <span className="sm:hidden">Cost</span>
              </TabsTrigger>
              <TabsTrigger value="budgetToDistance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5 transition-all">
                <Wallet className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Budget to Distance</span>
                <span className="sm:hidden">Distance</span>
              </TabsTrigger>
              <TabsTrigger value="charts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5 transition-all">
                <Route className="w-4 h-4 mr-2" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="histogram" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg py-2.5 transition-all">
                <Route className="w-4 h-4 mr-2" />
                Histogram
              </TabsTrigger>
            </TabsList>
            <TabsContent value="travelPlanner">
              <div className="space-y-6 pt-2">
                {/* Point A - Origin */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold">A</span>
                    Starting Point
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={originMode === "location" ? "default" : "outline"}
                      onClick={() => setOriginMode("location")}
                      className="flex-1 h-11"
                    >
                      <Crosshair className="w-4 h-4 mr-2" />
                      My Location
                    </Button>
                    <Button
                      type="button"
                      variant={originMode === "zip" ? "default" : "outline"}
                      onClick={() => setOriginMode("zip")}
                      className="flex-1 h-11"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Enter ZIP
                    </Button>
                  </div>

                  {originMode === "location" ? (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={isPlanning}
                        variant="secondary"
                        className="h-11"
                      >
                        {isPlanning && !originCoords ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4 mr-2" />
                        )}
                        Use my current location
                      </Button>
                      {originCoords && originLabel === "Your current location" && (
                        <span className="text-sm text-green-500 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> Location set
                        </span>
                      )}
                    </div>
                  ) : (
                    <Input
                      type="text"
                      value={originZip}
                      onChange={(e) => {
                        setOriginZip(e.target.value);
                        setOriginCoords(null);
                      }}
                      placeholder={`Enter ZIP / postal code`}
                      className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base"
                    />
                  )}
                </div>

                {/* Point B - Destination with autocomplete */}
                <div className="space-y-3 relative">
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold">B</span>
                    Destination
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={destQuery}
                      onChange={(e) => {
                        setDestQuery(e.target.value);
                        setDestCoords(null);
                      }}
                      onFocus={() => destSuggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Search for a destination..."
                      className="h-12 pl-9 pr-10 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base"
                    />
                    {isSearchingDest ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                    ) : destQuery ? (
                      <button
                        type="button"
                        onClick={clearDestination}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>

                  {showSuggestions && destSuggestions.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                      {destSuggestions.map((s) => (
                        <li key={s.place_id}>
                          <button
                            type="button"
                            onClick={() => selectDestination(s)}
                            className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors flex items-start gap-3 border-b border-border/20 last:border-b-0"
                          >
                            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm text-foreground/90 leading-snug">{s.display_name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {destCoords && (
                    <p className="text-xs text-green-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Destination selected
                    </p>
                  )}
                </div>

                {/* Vehicle inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Mileage ({units.mileage})</label>
                    <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Fuel Rate ({units.currency}/{units.volume})</label>
                    <Input type="number" value={fuelRate} onChange={(e) => setFuelRate(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                </div>

                {planError && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{planError}</p>
                )}

                <Button
                  onClick={handlePlanTrip}
                  disabled={isPlanning}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300"
                >
                  {isPlanning ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Navigation className="w-5 h-5 mr-2" />}
                  Calculate Trip
                </Button>

                {planResult && (
                  <div className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center bg-gradient-to-br from-primary/5 to-secondary/30 rounded-2xl p-6 border border-primary/10">
                        <div className="flex justify-center mb-2 text-primary"><Route className="w-6 h-6" /></div>
                        <p className="text-sm text-muted-foreground mb-1">Distance</p>
                        <p className="text-2xl font-bold tracking-tight">{planResult.distance.toFixed(1)} {units.distance}</p>
                      </div>
                      <div className="text-center bg-gradient-to-br from-primary/5 to-secondary/30 rounded-2xl p-6 border border-primary/10">
                        <div className="flex justify-center mb-2 text-primary"><Fuel className="w-6 h-6" /></div>
                        <p className="text-sm text-muted-foreground mb-1">Fuel Needed</p>
                        <p className="text-2xl font-bold tracking-tight">{planResult.fuelNeeded.toFixed(2)} {units.volume}</p>
                      </div>
                      <div className="text-center bg-gradient-to-br from-primary/5 to-secondary/30 rounded-2xl p-6 border border-primary/10">
                        <div className="flex justify-center mb-2 text-primary"><Wallet className="w-6 h-6" /></div>
                        <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                        <p className="text-2xl font-bold tracking-tight">{units.currency}{planResult.totalCost.toFixed(2)}</p>
                      </div>
                    </div>
                    {planResult.isApprox && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        * Road route unavailable — showing approximate straight-line distance.
                      </p>
                    )}
                    <Button
                      onClick={handleSavePlannedTrip}
                      className="w-full h-12 mt-4 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300"
                    >
                      <Route className="w-5 h-5 mr-2" />
                      Save Trip to History
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="distanceToCost">
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Distance ({units.distance})</label>
                    <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Mileage ({units.mileage})</label>
                    <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Fuel Rate ({units.currency}/{units.volume})</label>
                    <Input type="number" value={fuelRate} onChange={(e) => setFuelRate(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                </div>
                {distanceToCostResult && (
                  <div className="pt-4">
                      <div className="flex items-center justify-center text-center bg-gradient-to-br from-primary/5 to-secondary/30 rounded-2xl p-6 md:p-8 border border-primary/10">
                          <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Fuel Needed</p>
                              <p className="text-3xl font-bold tracking-tight">{distanceToCostResult.fuelNeeded.toFixed(2)} {units.volume}</p>
                          </div>
                          <ArrowRight className="w-10 h-10 mx-8 text-primary/60" />
                          <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                              <p className="text-3xl font-bold tracking-tight">{units.currency}{distanceToCostResult.totalCost.toFixed(2)}</p>
                          </div>
                      </div>
                  </div>
                )}
                <Button onClick={() => handleSaveCalculation('distanceToCost')} disabled={!distanceToCostResult} className="h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300">
                  Save Calculation
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="budgetToDistance">
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Budget ({units.currency})</label>
                    <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Mileage ({units.mileage})</label>
                    <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-medium text-foreground/80">Fuel Rate ({units.currency}/{units.volume})</label>
                    <Input type="number" value={fuelRate} onChange={(e) => setFuelRate(e.target.value)} className="h-12 bg-secondary/50 border-border/50 focus:bg-secondary/30 transition-colors text-base" />
                  </div>
                </div>
                {budgetToDistanceResult && (
                   <div className="pt-4">
                       <div className="flex items-center justify-center text-center bg-gradient-to-br from-primary/5 to-secondary/30 rounded-2xl p-6 md:p-8 border border-primary/10">
                           <div className="text-center">
                               <p className="text-sm text-muted-foreground mb-1">Fuel Affordable</p>
                               <p className="text-3xl font-bold tracking-tight">{budgetToDistanceResult.fuelAffordable.toFixed(2)} {units.volume}</p>
                           </div>
                           <ArrowRight className="w-10 h-10 mx-8 text-primary/60" />
                           <div className="text-center">
                               <p className="text-sm text-muted-foreground mb-1">Distance</p>
                               <p className="text-3xl font-bold tracking-tight">{budgetToDistanceResult.distance.toFixed(2)} {units.distance}</p>
                           </div>
                       </div>
                   </div>
                )}
                <Button onClick={() => handleSaveCalculation('budgetToDistance')} disabled={!budgetToDistanceResult} className="h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300">
                  Save Calculation
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="charts">
              <div className="space-y-4 pt-2">
                <Chart type='pie-chart' data={budgetChartData}/>
              </div>
            </TabsContent>
            <TabsContent value="histogram">
              <div className="space-y-4 pt-2">
                <Chart type='histogram' data={weeklyDistanceData} />
              </div>
            </TabsContent>
          </Tabs>

          {normalizedCalculations.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Calculation History</h3>
                <Button variant="destructive" size="sm" onClick={handleDeleteAllCalculations} className="bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </div>
              <ul className="space-y-3">
                {normalizedCalculations.map((calc) => {
                  const calcUnits = countryData[calc.inputs.country] || countryData.IN;
                  return (
                  <li key={calc.timestamp} className="p-5 bg-secondary/30 rounded-xl flex justify-between items-center border border-border/30 hover:bg-secondary/40 transition-colors">
                      <div>
                        {calc.type === 'distanceToCost' ? (
                          <div className="flex items-center space-x-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                              {calc.inputs.destinationLabel ? <Navigation className="w-5 h-5"/> : <Route className="w-5 h-5"/>}
                            </div>
                            <div>
                              {calc.inputs.destinationLabel && (
                                <p className="text-sm font-medium text-foreground/90 flex items-center gap-1 mb-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                  {(calc.inputs.originLabel || "Start").split(",")[0]}
                                  <ArrowRight className="inline w-3.5 h-3.5 mx-0.5 text-muted-foreground" />
                                  {calc.inputs.destinationLabel.split(",")[0]}
                                </p>
                              )}
                              <p className="font-semibold text-base">{calc.inputs.distance} {calcUnits.distance} <ArrowRight className="inline w-4 h-4 mx-1.5 text-muted-foreground"/> {calcUnits.currency}{Number(calc.outputs.totalCost || 0).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">{calc.inputs.mileage} {calcUnits.mileage} at {calcUnits.currency}{calc.inputs.fuelRate}/{calcUnits.volume}</p>
                              <p className="text-xs text-muted-foreground mt-1.5">{new Date(calc.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                              <Wallet className="w-5 h-5"/>
                            </div>
                            <div>
                              <p className="font-semibold text-base">{calcUnits.currency}{calc.inputs.budget} <ArrowRight className="inline w-4 h-4 mx-1.5 text-muted-foreground"/> {Number(calc.outputs.distance || 0).toFixed(2)} {calcUnits.distance}</p>
                              <p className="text-sm text-muted-foreground">{calc.inputs.mileage} {calcUnits.mileage} at {calcUnits.currency}{calc.inputs.fuelRate}/{calcUnits.volume}</p>
                              <p className="text-xs text-muted-foreground mt-1.5">{new Date(calc.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCalculation(calc.timestamp)} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </li>
                )})}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TripCalculatorPage;
