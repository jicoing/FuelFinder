import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Twitter, Zap, DollarSign, Gauge, Users, Crown, MapPin, NotebookPen } from "lucide-react";

/**
 * FuelBuddy — a friendly cartoon fuel-pump mascot rendered as inline SVG.
 * No external assets/dependencies; colors inherit the app theme via currentColor
 * and Tailwind classes. The gentle float is a pure-CSS keyframe animation.
 */
const FuelBuddy = () => (
  <div className="flex justify-center">
    <div className="fuelbuddy-float" aria-hidden="true">
      <svg width="140" height="160" viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
        <title>FindMyFuel mascot</title>
        {/* shadow */}
        <ellipse cx="62" cy="150" rx="40" ry="6" className="fill-foreground/10" />
        {/* pump body */}
        <rect x="24" y="34" width="76" height="104" rx="14" className="fill-primary/15 stroke-primary/40" strokeWidth="3" />
        {/* screen / face */}
        <rect x="36" y="48" width="52" height="40" rx="9" className="fill-card stroke-primary/40" strokeWidth="2.5" />
        {/* eyes */}
        <g className="fb-eye">
          <circle cx="52" cy="66" r="5" className="fill-primary" />
          <circle cx="53.5" cy="64.5" r="1.6" className="fill-card" />
        </g>
        <g className="fb-eye fb-eye--right">
          <circle cx="72" cy="66" r="5" className="fill-primary" />
          <circle cx="73.5" cy="64.5" r="1.6" className="fill-card" />
        </g>
        {/* smile */}
        <path d="M50 76 Q62 84 74 76" className="stroke-primary" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* price band */}
        <rect x="36" y="98" width="52" height="14" rx="5" className="fill-green-500/20" />
        <rect x="42" y="102" width="26" height="6" rx="3" className="fill-green-500/70" />
        {/* base */}
        <rect x="30" y="120" width="64" height="12" rx="5" className="fill-primary/25" />
        {/* nozzle arm */}
        <path d="M100 60 q24 0 24 24 v30" className="stroke-primary/50" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* nozzle / hand */}
        <rect x="114" y="112" width="20" height="14" rx="5" className="fill-primary" />
        {/* droplet */}
        <path d="M124 132 q-7 9 0 16 q7 -7 0 -16Z" className="fill-green-500 fb-drip" />
      </svg>
    </div>
  </div>
);

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
          <FuelBuddy />

          <p className="text-foreground/80 leading-relaxed text-center">
            <strong className="text-foreground">FindMyFuel</strong> is your pocket companion for spending less at the pump. Find the cheapest fuel stations near you, see live community-reported prices, log every fill-up, and watch your mileage and monthly spending come to life in clean, colorful charts. Whether you're on the daily commute or planning a road trip, FindMyFuel helps you make smarter fuel decisions across 20+ countries.
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

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-sky-500/10 rounded-lg">
                  <NotebookPen className="w-5 h-5 text-sky-500" />
                </div>
                <h2 className="text-lg font-semibold">Fuel Logging</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Record every fill-up in seconds — amount, price, fuel type, and odometer reading. Your history powers your efficiency charts and gives you a clear record of where your fuel budget goes.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="text-lg font-semibold">Saved Stations</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bookmark your favorite stations for one-tap access. Keep the spots you visit most always within reach, so you never have to search twice.
              </p>
            </div>

            <div className="p-5 bg-secondary/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="text-lg font-semibold">Premium</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Unlock unlimited saved stations, export your fuel history to CSV for tax or business reporting, and sync your data securely across all your devices.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/30">
            <h2 className="text-lg font-semibold mb-3">About the Developer</h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              <strong className="text-foreground">FindMyFuel</strong> is built and maintained by a solo developer who got tired of overpaying at the pump and having no idea where that money went. It's crafted to be fast, privacy-focused, and genuinely useful on every drive. Have a feature idea or feedback? I'd love to hear it.
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
