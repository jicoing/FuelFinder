import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, Twitter, Zap } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>
        <CardHeader className="border-b border-border/30 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Fuel className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">About <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">findmyfuel</span></CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8 relative">
          <p className="text-foreground/80 leading-relaxed">
            <strong className="text-foreground">findmyfuel</strong> is a comprehensive tool designed to help you manage your fuel expenses and optimize your journeys. From finding nearby stations to tracking your long-term fuel consumption, we provide the insights you need.
          </p>
          
          <div className="space-y-4">
            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Fuel className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Fuel Station Locator</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Using precise geolocation or ZIP codes, find fuel stations in your area. View them on an interactive map, check distance, and get instant navigation.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Trip Fuel Cost Calculator</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Estimate the cost of your trips by inputting distance, vehicle efficiency, and fuel prices to budget accurately before you hit the road.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Fuel Logging & History</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track every fill-up. Save stations, record amount, price, and mileage for each trip, and view a comprehensive history of your fuel consumption with detailed rate analysis.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/30">
            <h2 className="text-lg font-semibold mb-3">About the Developer</h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              <strong className="text-foreground">findmyfuel</strong> is developed and maintained by a passionate solo developer. Have questions or feedback? I'd love to hear from you!
            </p>
            <a 
              href="https://twitter.com/jicoing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Twitter className="w-5 h-5" />
              <span className="font-medium">@jicoing</span>
             </a>
           </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;