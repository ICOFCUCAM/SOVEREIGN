import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Home, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/tools";
import SpineMark from "@/components/brand/SpineMark";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Soft pillar-coloured ambience to match the brand */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-career/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[8%] h-72 w-72 rounded-full bg-publishing/10 blur-3xl" />
      </div>
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gold-gradient opacity-70" />

      <div className="relative z-10 mx-auto max-w-md text-center">
        <SpineMark size="md" animated className="mx-auto mb-7 justify-center" />
        <p className="font-serif text-5xl font-bold tracking-tightest text-foreground">404</p>
        <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight">This page wandered off</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground font-sans text-pretty">
          The page you’re looking for doesn’t exist or has moved. Let’s get you back to creating.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="hero"><Link to="/dashboard"><Home className="mr-1.5 h-4 w-4" /> Go to dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          <Button asChild variant="heroOutline"><Link to="/catalog"><Store className="mr-1.5 h-4 w-4" /> Browse marketplace</Link></Button>
        </div>
        <p className="mt-8 text-xs text-muted-foreground font-sans">{BRAND}</p>
      </div>
    </div>
  );
};

export default NotFound;
