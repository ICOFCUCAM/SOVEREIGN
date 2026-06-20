import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Reset scroll to the top on every route change. Without this, navigating from
// a long page (e.g. the marketplace) to another lands the user mid-scroll —
// a classic SPA rough edge. Respects in-page hash links.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return; // let anchor links scroll to their target
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
};

export default ScrollToTop;
