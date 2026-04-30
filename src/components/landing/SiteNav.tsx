import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const SiteNav = () => {
  return (
    <nav className="sticky top-0 z-40 px-6 md:px-10 py-3.5 flex items-center justify-between bg-foreground text-background">
      <Link to="/" className="flex items-center gap-3 group">
        <Logo height={22} className="transition-transform group-hover:scale-105" />
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-qck-dark-blue text-background/90">
          AI Visibility
        </span>
      </Link>

      <div className="flex items-center gap-7">
        <div className="hidden md:flex items-center gap-7 text-sm text-background/80">
          <a href="#methodology" className="hover:text-background transition-colors">
            Methodology
          </a>
          <a href="#features" className="hover:text-background transition-colors">
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
