// Centralized SEO metadata for every route.
// This module is intentionally dependency-free so it can be imported by both
// the client (for runtime <head> updates) and the build script (for static
// per-route HTML generation + sitemap). Do not add browser/node-only imports.

export const SITE_URL = "https://www.findmyfuel.site";
export const SITE_NAME = "FindMyFuel";
export const OG_IMAGE = `${SITE_URL}/opengraph.png`;

export interface RouteSEO {
  /** Route path, matching the wouter route (no trailing slash, except "/"). */
  path: string;
  title: string;
  description: string;
  /** When true, the page is excluded from indexing, the sitemap and prerender. */
  noindex?: boolean;
  /** Relative priority used in the sitemap (0.0 - 1.0). */
  priority?: number;
  /** Sitemap change frequency hint. */
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
}

export const routeSeo: RouteSEO[] = [
  {
    path: "/",
    title:
      "FindMyFuel \u2013 Find Cheapest Fuel Stations Near You | Trip Cost Calculator",
    description:
      "Find the cheapest fuel stations nearby, calculate trip fuel costs, track mileage and save money on petrol & diesel. Free fuel station finder for India, US, UK & more.",
    priority: 1.0,
    changefreq: "daily",
  },
  {
    path: "/calculator",
    title:
      "Trip Fuel Cost Calculator \u2013 Estimate Petrol & Diesel Costs | FindMyFuel",
    description:
      "Calculate the fuel cost of any trip. Enter distance, mileage and fuel price to instantly estimate petrol or diesel expenses. Free and accurate trip cost calculator.",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/about",
    title: "About FindMyFuel \u2013 Fuel Price Finder & Savings App",
    description:
      "Learn about FindMyFuel, the free app that helps you locate nearby fuel stations, compare petrol and diesel prices, and track your fuel spending across 20+ countries.",
    priority: 0.6,
    changefreq: "monthly",
  },
  {
    path: "/contact",
    title: "Contact FindMyFuel \u2013 Support & Feedback",
    description:
      "Get in touch with the FindMyFuel team for support, feedback or feature requests. We'd love to hear how we can help you save more on fuel.",
    priority: 0.4,
    changefreq: "yearly",
  },
  {
    path: "/privacy",
    title: "Privacy Policy | FindMyFuel",
    description:
      "Read the FindMyFuel privacy policy to understand what data we collect, how it is used, and how we keep your information safe.",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    path: "/terms",
    title: "Terms of Service | FindMyFuel",
    description:
      "Review the terms of service for using FindMyFuel, the free fuel station finder and trip cost calculator.",
    priority: 0.3,
    changefreq: "yearly",
  },
  // Auth-gated / transactional pages — kept out of the index.
  { path: "/dashboard", title: "Dashboard | FindMyFuel", description: "Your personal fuel tracking dashboard.", noindex: true },
  { path: "/saved-stations", title: "Saved Stations | FindMyFuel", description: "Your saved fuel stations.", noindex: true },
  { path: "/payment-success", title: "Payment Successful | FindMyFuel", description: "Your payment was successful.", noindex: true },
  { path: "/auth/callback", title: "Signing in\u2026 | FindMyFuel", description: "Completing sign in.", noindex: true },
];

const DEFAULT_SEO: RouteSEO = routeSeo[0];

/** Absolute, canonical URL for a given route path. */
export function canonicalUrl(path: string): string {
  if (path === "/" || path === "") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Resolve the SEO metadata for a path, falling back to the home metadata. */
export function getSeoForPath(path: string): RouteSEO {
  const normalized =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return (
    routeSeo.find((r) => r.path === normalized) ?? {
      ...DEFAULT_SEO,
      // Unknown routes (e.g. 404) should not be indexed.
      path: normalized,
      noindex: true,
    }
  );
}

/** Routes that should be prerendered and listed in the sitemap. */
export function indexableRoutes(): RouteSEO[] {
  return routeSeo.filter((r) => !r.noindex);
}
