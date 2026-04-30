import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { adminApi } from "@/lib/api/admin";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminApi.login(password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      {/* Left: branding panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-foreground text-background overflow-hidden">
        <div aria-hidden className="absolute -inset-32 bg-spectral opacity-30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Logo height={24} />
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 ml-1">
            / Admin
          </span>
        </div>
        <div className="relative space-y-4 max-w-md">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] opacity-60">
            Platform console
          </p>
          <h2 className="text-4xl font-medium tracking-tight leading-tight text-balance">
            AI visibility <span className="font-serif-italic">intelligence</span> — track your store across every AI search model.
          </h2>
          <p className="text-sm opacity-70">
            Monitor queries, audit keywords, manage stores, and configure the pipeline from one place.
          </p>
        </div>
        <p className="relative text-[11px] font-mono uppercase tracking-widest opacity-50">
          v1.0 · all systems normal
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
              Enter your admin password.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-prism-3/10 border border-prism-3/20 text-sm text-prism-3">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Password
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter admin password"
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-surface border hairline focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-sm"
              />
            </label>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full group" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
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
