const SiteFooter = () => (
  <footer className="px-6 md:px-10 py-10 border-t hairline bg-surface">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2.5">
        <div className="size-6 bg-foreground rounded-full flex items-center justify-center">
          <div className="size-2 bg-spectral rounded-full" />
        </div>
        <span className="font-mono text-xs font-bold tracking-tight">QCK / 2025</span>
      </div>
      <div className="flex gap-7 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        <a href="https://qck.co/" target="_blank" rel="noreferrer" className="hover:text-foreground">
          qck.co
        </a>
        <a href="#" className="hover:text-foreground">Privacy</a>
        <a href="#" className="hover:text-foreground">API</a>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
