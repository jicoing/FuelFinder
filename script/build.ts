import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  canonicalUrl,
  indexableRoutes,
  OG_IMAGE,
  SITE_URL,
  type RouteSEO,
} from "../client/src/lib/seo-config";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("prerendering routes + sitemap...");
  await prerender();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

const DIST_PUBLIC = "dist/public";

/** Escape a string for safe insertion into an HTML attribute or text node. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Replace the content of the matched tag, or warn if it is missing. */
function replaceOrWarn(
  html: string,
  pattern: RegExp,
  replacement: string,
  label: string,
): string {
  if (!pattern.test(html)) {
    console.warn(`  [prerender] could not find ${label} tag to replace`);
    return html;
  }
  return html.replace(pattern, replacement);
}

/** Inject route-specific SEO metadata into the base index.html template. */
function applyMeta(template: string, route: RouteSEO): string {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const url = canonicalUrl(route.path);

  let html = template;
  html = replaceOrWarn(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, "title");
  html = replaceOrWarn(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`,
    "description",
  );
  html = replaceOrWarn(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`,
    "canonical",
  );
  html = replaceOrWarn(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${title}" />`,
    "og:title",
  );
  html = replaceOrWarn(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${description}" />`,
    "og:description",
  );
  html = replaceOrWarn(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${url}" />`,
    "og:url",
  );
  html = replaceOrWarn(
    html,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    "og:image",
  );
  html = replaceOrWarn(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${title}" />`,
    "twitter:title",
  );
  html = replaceOrWarn(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${description}" />`,
    "twitter:description",
  );
  return html;
}

/** Build a sitemap.xml string from the indexable routes. */
function buildSitemap(routes: RouteSEO[], lastmod: string): string {
  const urls = routes
    .map((route) => {
      const priority = (route.priority ?? 0.5).toFixed(1);
      const changefreq = route.changefreq ?? "monthly";
      return [
        "  <url>",
        `    <loc>${canonicalUrl(route.path)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Generates one static HTML file per indexable route with unique <head>
 * metadata, plus a sitemap.xml. This ensures crawlers and social scrapers
 * receive correct, page-specific tags on the first byte even though the body
 * is hydrated client-side.
 */
async function prerender() {
  const templatePath = path.join(DIST_PUBLIC, "index.html");
  const template = await readFile(templatePath, "utf-8");
  const routes = indexableRoutes();
  const lastmod = new Date().toISOString().slice(0, 10);

  for (const route of routes) {
    const html = applyMeta(template, route);
    if (route.path === "/") {
      await writeFile(templatePath, html, "utf-8");
    } else {
      const dir = path.join(DIST_PUBLIC, route.path);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "index.html"), html, "utf-8");
    }
    console.log(`  [prerender] ${route.path}`);
  }

  await writeFile(
    path.join(DIST_PUBLIC, "sitemap.xml"),
    buildSitemap(routes, lastmod),
    "utf-8",
  );
  console.log(`  [prerender] sitemap.xml (${routes.length} urls) -> ${SITE_URL}/sitemap.xml`);
}
