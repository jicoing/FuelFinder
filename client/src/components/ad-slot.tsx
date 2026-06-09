import { useEffect, useRef, type CSSProperties } from "react";
import { useAuth } from "@/lib/auth-context";

// Your AdSense publisher ID.
const AD_CLIENT = "ca-pub-7683469708400234";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  /** The ad unit's slot ID from your AdSense dashboard (data-ad-slot). */
  slot: string;
  /** Ad format. "auto" works for responsive units. */
  format?: string;
  /** Enable full-width responsive behaviour. */
  responsive?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a Google AdSense ad unit, but ONLY for free (non-premium) users.
 *
 * - Premium users (and users whose status is still loading) see nothing,
 *   so no ad request is ever made for them.
 * - Each mounted unit is initialised exactly once to avoid AdSense's
 *   "All 'ins' elements already have ads" error during SPA navigation.
 */
export function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  className,
  style,
}: AdSlotProps) {
  const { isPremium, isLoading } = useAuth();
  const pushed = useRef(false);

  // Free users only: wait until we know the status, then exclude premium.
  const shouldShow = !isLoading && !isPremium;

  useEffect(() => {
    if (!shouldShow || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Script not loaded yet or blocked by an ad blocker — fail silently.
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`.trim()}
      style={{ display: "block", ...style }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
