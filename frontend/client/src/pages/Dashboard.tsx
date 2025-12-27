
import { Sidebar } from "@/components/layout/Sidebar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { AnomalyChart } from "@/components/dashboard/AnomalyChart";
import { RagPipelineVisual } from "@/components/dashboard/RagPipelineVisual";
import { MOCK_ALERTS } from "@/lib/mock-data";
import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: alertsData } = useQuery({
    queryKey: ["http://127.0.0.1:5000/api/alerts"],
    queryFn: async () => {
      const res = await fetch("http://127.0.0.1:5000/api/alerts", { credentials: "include" });
      if (!res.ok) {
        const txt = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${txt}`);
      }
      return res.json();
    },
  });
  const alerts = alertsData ?? MOCK_ALERTS;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Always show the toggle button, even when sidebar is closed */}
      <button
        className="fixed top-4 left-4 z-40 p-2 rounded-full bg-background/60 border border-border shadow-sm transition-colors hover:bg-primary/10 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        style={{ transition: 'left 0.2s', left: sidebarOpen ? '272px' : '16px' }}
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </button>
      {sidebarOpen && <Sidebar />}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img src={generatedImage} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        </div>
        {/* Header */}
        <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-md px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs, IPs, or threat IDs..." 
                className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-9 font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse"></span>
            </div>
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Top Section: Metrics & Pipeline Visual */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Security Operations Center</h2>
                <p className="text-muted-foreground mt-1">Real-time threat monitoring and RAG-assisted analysis.</p>
              </div>
              <RagPipelineVisual />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 h-full">
                  <AnomalyChart />
                </div>
                <div className="space-y-4">
                   <div className="bg-card/40 border border-border p-6 rounded-lg backdrop-blur-sm h-full flex flex-col justify-center">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">System Health</h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end">
                           <span className="text-4xl font-mono font-bold text-foreground">98.2%</span>
                           <span className="text-sm text-emerald-500 font-medium mb-1">Operational</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-[98.2%]"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                           <div>
                              <p className="text-xs text-muted-foreground">Active Threats</p>
                              <p className="text-2xl font-mono font-bold text-destructive">3</p>
                           </div>
                           <div>
                              <p className="text-xs text-muted-foreground">Analyzed Events</p>
                              <p className="text-2xl font-mono font-bold text-primary">1.2M</p>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            {/* Critical Alerts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-display font-semibold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
                    Critical Alerts
                 </h3>
                 <span className="text-xs font-mono text-muted-foreground">Prioritized by LLM Analysis</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {alerts.map((alert, index) => (
                  <AlertCard key={alert.id} alert={alert} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
