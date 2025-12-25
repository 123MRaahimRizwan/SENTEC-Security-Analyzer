
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MOCK_INCIDENTS } from "@/lib/mock-data";
import { Search, Clock, Users, AlertTriangle, CheckCircle, Filter } from "lucide-react";
import { motion } from "framer-motion";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

const statusColors = {
  open: "bg-destructive/10 text-destructive border-destructive/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-muted/10 text-muted-foreground border-muted/20"
};

export default function Incidents() {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img src={generatedImage} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        </div>

        <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-md px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4 w-1/3">
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
                  <div className="text-2xl font-bold font-mono">4</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Active Incidents</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">28</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Resolved (30d)</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-primary">2.3h</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Avg Response Time</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">94%</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Resolution Rate</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {MOCK_INCIDENTS.map((incident, idx) => (
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
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
