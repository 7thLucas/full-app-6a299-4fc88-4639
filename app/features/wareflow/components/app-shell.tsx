import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { useConfigurables } from "~/modules/configurables";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const ICON = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  inbound: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
    </svg>
  ),
  storage: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" /><path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 12h6" />
    </svg>
  ),
  outbound: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V9" /><path d="m7 14 5-5 5 5" /><path d="M5 3h14" />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: ICON.dashboard },
  { to: "/inbound", label: "Inbound", icon: ICON.inbound },
  { to: "/storage", label: "Storage", icon: ICON.storage },
  { to: "/outbound", label: "Outbound", icon: ICON.outbound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { config, loading } = useConfigurables();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const appName = (!loading && config?.appName && !config.appName.startsWith("FILL_"))
    ? config.appName
    : "WareFlow";
  const tagline = config?.tagline && !config.tagline.startsWith("FILL_")
    ? config.tagline
    : "Known location, dock to truck.";
  const logoUrl =
    config?.logoUrl && !config.logoUrl.startsWith("FILL_") ? config.logoUrl : "";
  const facility =
    config?.warehouseName && !config.warehouseName.startsWith("FILL_")
      ? config.warehouseName
      : "";

  const currentTitle =
    NAV.find((n) => location.pathname.startsWith(n.to))?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Brand appName={appName} tagline={tagline} logoUrl={logoUrl} />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>
        {facility ? (
          <div className="border-t border-sidebar-border px-5 py-4">
            <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/50">
              Facility
            </p>
            <p className="mt-0.5 text-sm font-medium text-sidebar-foreground">
              {facility}
            </p>
          </div>
        ) : null}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar text-sidebar-foreground">
            <Brand appName={appName} tagline={tagline} logoUrl={logoUrl} />
            <nav className="flex-1 space-y-1 px-3 py-4" onClick={() => setMobileOpen(false)}>
              {NAV.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold tracking-tight">{currentTitle}</h1>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function Brand({
  appName,
  tagline,
  logoUrl,
}: {
  appName: string;
  tagline: string;
  logoUrl: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        {logoUrl ? (
          <img src={logoUrl} alt={appName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-base font-black">{appName.charAt(0)}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-sidebar-foreground">{appName}</p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">{tagline}</p>
      </div>
    </div>
  );
}

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )
      }
    >
      <span className="shrink-0">{item.icon}</span>
      {item.label}
    </NavLink>
  );
}
