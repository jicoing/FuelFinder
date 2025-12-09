
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, ArrowRight, Wallet, Route, Trash2 } from "lucide-react";
import { Chart } from "@/components/ui/chart";

const TripCalculatorPage = () => {
  const [distance, setDistance] = useState("200");
  const [mileage, setMileage] = useState("40");
  const [fuelRate, setFuelRate] = useState("107");
  const [budget, setBudget] = useState("200");
  const [calculations, setCalculations] = useState([]);

  useEffect(() => {
    const savedCalculations = localStorage.getItem("tripCalculations");
    if (savedCalculations) {
      setCalculations(JSON.parse(savedCalculations));
    }
  }, []);

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
  }, [distance, mileage, fuelRate]);

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
  }, [budget, mileage, fuelRate]);

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

    calculations.forEach(calc => {
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
  }, [calculations]);

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

    calculations.forEach(calc => {
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
  }, [calculations]);

  const updateCalculations = (newCalculations) => {
    setCalculations(newCalculations);
    localStorage.setItem("tripCalculations", JSON.stringify(newCalculations));
  };

  const handleSaveCalculation = (type) => {
    const newCalculation = {
      type,
      timestamp: new Date().toISOString(),
      inputs: {
        distance,
        mileage,
        fuelRate,
        budget,
      },
      outputs: type === 'distanceToCost' ? distanceToCostResult : budgetToDistanceResult,
    };
    updateCalculations([newCalculation, ...calculations]);
  };

  const handleDeleteCalculation = (timestamp) => {
    const newCalculations = calculations.filter(calc => calc.timestamp !== timestamp);
    updateCalculations(newCalculations);
  };

  const handleDeleteAllCalculations = () => {
    updateCalculations([]);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle><Fuel className="w-6 h-6 mr-2" /></CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="distanceToCost">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="distanceToCost">
                <Route className="w-4 h-4 mr-2" />
                Distance to Cost
              </TabsTrigger>
              <TabsTrigger value="budgetToDistance">
                <Wallet className="w-4 h-4 mr-2" />
                Budget to Distance
              </TabsTrigger>
              <TabsTrigger value="charts">
                <Route className="w-4 h-4 mr-2" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="histogram">
                <Route className="w-4 h-4 mr-2" />
                Histogram
              </TabsTrigger>
            </TabsList>
            <TabsContent value="distanceToCost">
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label>Distance (km)</label>
                    <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} />
                  </div>
                  <div>
                    <label>Mileage (km/L)</label>
                    <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                  </div>
                  <div>
                    <label>Fuel Rate (₹/L)</label>
                    <Input type="number" value={fuelRate} onChange={(e) => setFuelRate(e.target.value)} />
                  </div>
                </div>
                {distanceToCostResult && (
                  <div className="pt-4">
                      <div className="flex items-center justify-center text-center">
                          <div className="text-center">
                              <p className="text-sm text-muted-foreground">Fuel Needed</p>
                              <p className="text-2xl font-bold">{distanceToCostResult.fuelNeeded.toFixed(2)} L</p>
                          </div>
                          <ArrowRight className="w-8 h-8 mx-6 text-muted-foreground" />
                          <div className="text-center">
                              <p className="text-sm text-muted-foreground">Total Cost</p>
                              <p className="text-2xl font-bold">₹{distanceToCostResult.totalCost.toFixed(2)}</p>
                          </div>
                      </div>
                  </div>
                )}
                <Button onClick={() => handleSaveCalculation('distanceToCost')} disabled={!distanceToCostResult}>
                  Save Calculation
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="budgetToDistance">
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label>Budget (₹)</label>
                    <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                  <div>
                    <label>Mileage (km/L)</label>
                    <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                  </div>
                  <div>
                    <label>Fuel Rate (₹/L)</label>
                    <Input type="number" value={fuelRate} onChange={(e) => setFuelRate(e.target.value)} />
                  </div>
                </div>
                {budgetToDistanceResult && (
                   <div className="pt-4">
                       <div className="flex items-center justify-center text-center">
                           <div className="text-center">
                               <p className="text-sm text-muted-foreground">Fuel Affordable</p>
                               <p className="text-2xl font-bold">{budgetToDistanceResult.fuelAffordable.toFixed(2)} L</p>
                           </div>
                           <ArrowRight className="w-8 h-8 mx-6 text-muted-foreground" />
                           <div className="text-center">
                               <p className="text-sm text-muted-foreground">Distance</p>
                               <p className="text-2xl font-bold">{budgetToDistanceResult.distance.toFixed(2)} km</p>
                           </div>
                       </div>
                   </div>
                )}
                <Button onClick={() => handleSaveCalculation('budgetToDistance')} disabled={!budgetToDistanceResult}>
                  Save Calculation
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="charts">
              <div className="space-y-4 pt-4">
                <Chart type='pie-chart' data={budgetChartData}/>
              </div>
            </TabsContent>
            <TabsContent value="histogram">
              <div className="space-y-4 pt-4">
                <Chart type='histogram' data={weeklyDistanceData} />
              </div>
            </TabsContent>
          </Tabs>

          {calculations.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">History</h3>
                <Button variant="destructive" size="sm" onClick={handleDeleteAllCalculations}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </div>
              <ul className="space-y-4">
                {calculations.map((calc) => (
                  <li key={calc.timestamp} className="p-4 bg-muted rounded-lg flex justify-between items-center">
                      <div>
                        {calc.type === 'distanceToCost' ? (
                          <div className="flex items-center space-x-4">
                            <Route className="w-6 h-6 text-primary"/>
                            <div>
                              <p><strong>{calc.inputs.distance} km</strong> <ArrowRight className="inline w-4 h-4"/> ₹{calc.outputs.totalCost.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">{calc.inputs.mileage} km/L at ₹{calc.inputs.fuelRate}/L</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(calc.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <Wallet className="w-6 h-6 text-primary"/>
                            <div>
                              <p><strong>₹{calc.inputs.budget}</strong> <ArrowRight className="inline w-4 h-4"/> {calc.outputs.distance.toFixed(2)} km</p>
                              <p className="text-sm text-muted-foreground">{calc.inputs.mileage} km/L at ₹{calc.inputs.fuelRate}/L</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(calc.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCalculation(calc.timestamp)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TripCalculatorPage;
