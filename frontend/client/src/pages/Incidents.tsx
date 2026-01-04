
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { MOCK_INCIDENTS } from "@/lib/mock-data";
import { Search, Clock, Users, AlertTriangle, CheckCircle, Filter, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

const statusColors = {
  open: "bg-destructive/10 text-destructive border-destructive/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-muted/10 text-muted-foreground border-muted/20"
};

export default function Incidents() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("api/incidents"), { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch incidents");
      }
      return res.json();
    },
    refetchInterval: 30000,
  });
  
  const incidents = incidentsData || [];
  
  // Calculate statistics
  const activeIncidents = incidents.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length;
  const resolvedIncidents = incidents.filter((i: any) => i.status === 'resolved' || i.status === 'closed').length;
  
  // Count incidents related to high-risk attack types (matches threat intel critical CVEs)
  const highRiskAttackTypes = ['SQL_INJECTION', 'XSS', 'COMMAND_INJECTION', 'PATH_TRAVERSAL', 'DOS', 'BRUTE_FORCE'];
  const criticalIncidents = incidents.filter((i: any) => {
    const title = (i.title || '').toUpperCase();
    return (i.status === 'open' || i.status === 'in_progress') && 
           highRiskAttackTypes.some(attackType => 
             title.includes(attackType) || title.includes(attackType.replace('_', ' '))
           );
  }).length;
  
  const resolutionRate = incidents.length > 0 ? Math.round((resolvedIncidents / incidents.length) * 100) : 0;
  
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
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
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img src={generatedImage} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        </div>

        <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-md px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search incidents..." 
                className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-9 font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto z-10">
          <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight">Incident Management</h2>
              <p className="text-muted-foreground mt-1">Track and manage security incidents across your infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{activeIncidents}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Active Incidents</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{resolvedIncidents}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Resolved</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-destructive">{criticalIncidents}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">High-Risk Attacks</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{resolutionRate}%</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Resolution Rate</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Loading incidents...</p>
                  </CardContent>
                </Card>
              ) : incidents.length > 0 ? incidents.map((incident: any, idx: number) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-l-4 border-l-primary bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{incident.id}</span>
                            <Badge className={`border ${statusColors[incident.status]} text-[10px] font-mono uppercase`}>
                              {incident.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/10 uppercase tracking-widest text-[10px] font-mono">
                              {incident.severity}
                            </Badge>
                          </div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {incident.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{incident.description}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <span className="text-xs font-mono text-muted-foreground block">{incident.createdAt.split('T')[0]}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Assigned: {incident.assignedTo}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{incident.affectedAssets} Assets Impacted</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{incident.timeline.length} Timeline Events</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )) : (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No incidents detected</p>
                    <p className="text-xs text-muted-foreground mt-2">Upload log files to detect security incidents</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
