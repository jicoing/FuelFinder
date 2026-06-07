import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Twitter, Zap, DollarSign, Gauge, Users } from "lucide-react";

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
            <CardTitle className="text-2xl font-bold tracking-tight">About <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">FindMyFuel</span></CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8 relative">
          <p className="text-foreground/80 leading-relaxed">
            <strong className="text-foreground">FindMyFuel</strong> helps you find the cheapest fuel stations nearby, track your fuel efficiency, and save money on every fill-up. Whether you're commuting daily or planning a road trip, we provide the tools to make informed decisions about your fuel expenses across 20+ countries.
          </p>

          <div className="flex justify-center md:justify-start">
            <a 
              href="https://www.producthunt.com/products/findmyfuel-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-findmyfuel-2" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1156251&theme=light&t=1779793659056" 
                alt="FindMyFuel on Product Hunt" 
                style={{ width: '250px', height: '54px' }}
                width="250" 
                height="54" 
              />
            </a>
          </div>
          
          <div className="space-y-4">
            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Fuel Station Finder</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Search for nearby fuel stations using your GPS location or ZIP code. View results on an interactive map with distance, ratings, and one-tap Google Maps directions.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold">Crowdsourced Fuel Prices</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                See real fuel prices reported by other users. Report the current price when you fill up to help the community find the cheapest petrol and diesel nearby.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Gauge className="w-5 h-5 text-violet-500" />
                </div>
                <h2 className="text-lg font-semibold">Fuel Efficiency Dashboard</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track your vehicle's km/L efficiency, cost per kilometer, and monthly spending trends. Visualize your consumption with daily and monthly charts to identify savings opportunities.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Trip Cost Calculator</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your trip distance, vehicle mileage, and fuel rate to instantly calculate the estimated cost. Or enter a budget to see how far you can go. Supports all major currencies and units.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-semibold">20+ Countries Supported</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Works in India, United States, United Kingdom, UAE, Canada, Australia, Singapore, Saudi Arabia, and more. Automatic currency, distance units, and fuel type adaptation.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/30">
            <h2 className="text-lg font-semibold mb-3">About the Developer</h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              <strong className="text-foreground">FindMyFuel</strong> is built and maintained by a solo developer passionate about helping people save money on fuel. Have questions or feedback?
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
