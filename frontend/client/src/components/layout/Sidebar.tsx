
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { ShieldAlert, LayoutDashboard, Database, Activity, Settings, Lock, FileText, Menu } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: ShieldAlert, label: "Incidents", href: "/incidents" },
    { icon: Activity, label: "Intelligence", href: "/intel" },
    { icon: Database, label: "Assets", href: "/assets" },
    { icon: FileText, label: "Reports", href: "/reports" },
  ];

  return (
    <aside className="flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 z-30 md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-wider text-sidebar-foreground">SENTINEL</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Threat Intel</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 group block",
              location === item.href 
                ? "bg-sidebar-accent text-primary border-r-2 border-primary" 
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-colors",
              location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-sidebar-accent/30 border border-sidebar-border">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="font-mono text-xs font-bold">JD</span>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </div> */}
    </aside>
  );
}
