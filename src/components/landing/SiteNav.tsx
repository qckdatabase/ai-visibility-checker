import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SiteNav = () => {
  return (
    <nav className="sticky top-0 z-40 px-6 md:px-10 py-5 flex items-center justify-between glass-panel border-b">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="size-8 bg-foreground rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
          <div className="size-3 bg-spectral rounded-full" />
        </div>
        <span className="text-lg font-semibold tracking-tight">QCK</span>
        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-muted text-muted-foreground ml-1">
          AI Visibility
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#methodology" className="hover:text-foreground transition-colors">
            Methodology
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
        </div>
        <Button variant="primary" size="sm" asChild>
          <a href="https://qck.co/" target="_blank" rel="noreferrer">
            Get Started
          </a>
        </Button>
      </div>
    </nav>
  );
};

export default SiteNav;
