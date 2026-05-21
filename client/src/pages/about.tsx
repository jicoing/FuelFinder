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
            <strong className="text-foreground">findmyfuel</strong> is a powerful tool designed to help you save money on gas. Whether you're planning a road trip or just running errands around town, our app provides the tools you need to make informed decisions about your fuel consumption.
          </p>
          
          <div className="space-y-4">
            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Trip Fuel Cost Calculator</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our main feature is the Trip Fuel Cost Calculator. Simply enter your trip distance, your vehicle's fuel efficiency (MPG), and the current gas price, and we'll instantly calculate the estimated cost of your journey. This helps you budget for your trips and understand your vehicle's fuel expenses.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Nearby Gas Stations</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Using your device's location, <strong className="text-foreground">findmyfuel</strong> can quickly locate gas stations near you. We provide a map view to easily navigate to the station of your choice.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-semibold">Fuel Price Comparison <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-medium">Coming Soon</span></h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We are working hard to bring you real-time fuel price data. Soon, you'll be able to compare prices at different gas stations to ensure you're getting the best deal.
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