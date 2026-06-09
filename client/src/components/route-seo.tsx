import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  canonicalUrl,
  getSeoForPath,
  OG_IMAGE,
} from "@/lib/seo-config";

const ROBOTS_INDEX = "index, follow, max-image-preview:large, max-snippet:-1";
const ROBOTS_NOINDEX = "noindex, nofollow";

/** Create or update a <meta name="..."> tag. */
function setNamedMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Create or update a <meta property="..."> tag (Open Graph). */
function setPropertyMeta(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Create or update the canonical <link>. */
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Keeps document <head> metadata in sync with the active route.
 *
 * Crawlers that render JS get accurate per-page metadata, and the prebuilt
 * static HTML (see script/build.ts) ensures non-rendering crawlers and social
 * scrapers also receive correct tags on first byte.
 */
export function RouteSeo() {
  const [location] = useLocation();

  useEffect(() => {
    const seo = getSeoForPath(location);
    const url = canonicalUrl(location);

    document.title = seo.title;
    setNamedMeta("description", seo.description);
    setNamedMeta(
      "robots",
      seo.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX,
    );

    setPropertyMeta("og:title", seo.title);
    setPropertyMeta("og:description", seo.description);
    setPropertyMeta("og:url", url);
    setPropertyMeta("og:image", OG_IMAGE);

    setNamedMeta("twitter:title", seo.title);
    setNamedMeta("twitter:description", seo.description);

    setCanonical(url);
  }, [location]);

  return null;
}
