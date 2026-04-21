import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@qck.co");
  const [password, setPassword] = useState("••••••••");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: real admin auth
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      {/* Left: branding panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-foreground text-background overflow-hidden">
        <div aria-hidden className="absolute -inset-32 bg-spectral opacity-30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="size-8 bg-background rounded-full flex items-center justify-center">
            <div className="size-3 bg-spectral rounded-full" />
          </div>
          <span className="text-lg font-semibold">QCK</span>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 ml-1">
            / Admin
          </span>
        </div>
        <div className="relative space-y-4 max-w-md">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] opacity-60">
            Operator console
          </p>
          <h2 className="text-4xl font-medium tracking-tight leading-tight text-balance">
            Operate the QCK <span className="font-serif-italic">platform</span> — every model, every store, every query.
          </h2>
          <p className="text-sm opacity-70">
            Internal console for QCK staff: monitor system health, manage users and stores, configure AI providers.
          </p>
        </div>
        <p className="relative text-[11px] font-mono uppercase tracking-widest opacity-50">
          v2.4 · all systems normal
        </p>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-7 animate-fade-in-up">
          <div>
            <div className="size-10 rounded-2xl bg-surface-muted flex items-center justify-center mb-5">
              <Lock className="size-4" />
            </div>
            <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Mock console — no credentials needed.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Email
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-surface border hairline focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Password
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-surface border hairline focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-sm"
              />
            </label>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full group">
            Sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Returning to{" "}
            <a href="/" className="underline underline-offset-2 hover:text-foreground">
              qck.co landing
            </a>
            ?
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
