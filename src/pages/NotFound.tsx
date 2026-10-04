import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <Seo
        title="Page Not Found — Planz"
        description="The page you are looking for does not exist."
        path={location.pathname}
        noindex
      />
      <div className="max-w-md text-center animate-slide-up">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-primary/10 text-primary"><SearchX /></span>
        <p className="eyebrow mt-7 text-primary">Error 404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">This route is off the map.</h1>
        <p className="mb-7 mt-3 text-muted-foreground">The page may have moved, or the address may be incorrect.</p>
        <Button onClick={() => navigate('/')}><ArrowLeft /> Return to Planz</Button>
      </div>
    </div>
  );
};

export default NotFound;
