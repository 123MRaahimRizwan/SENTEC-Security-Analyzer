
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MOCK_THREAT_INTEL } from "@/lib/mock-data";
import { Search, TrendingUp, Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

const typeColors = {
  cve: "bg-destructive/10 text-destructive border-destructive/20",
  ioc: "bg-primary/10 text-primary border-primary/20",
  threat_feed: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  tactic: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

export default function Intelligence() {
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
                placeholder="Search threats, CVEs, IOCs..." 
                className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-9 font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto z-10">
          <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight">Threat Intelligence</h2>
              <p className="text-muted-foreground mt-1">Monitor CVEs, IOCs, threat feeds, and MITRE ATT&CK tactics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-destructive">2</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Critical CVEs</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">6</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Active Feeds</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-primary">127</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Threat Sources</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">84%</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Coverage Score</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {MOCK_THREAT_INTEL.map((intel, idx) => (
                <motion.div
                  key={intel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer group border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`border ${typeColors[intel.type]} text-[10px] font-mono uppercase`}>
                              {intel.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/10 uppercase tracking-widest text-[10px] font-mono">
                              {intel.severity}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground ml-auto">{intel.id}</span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {intel.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{intel.description}</p>
                        </div>
                        <div className="text-right space-y-3 flex-shrink-0">
                          <div className="flex items-center justify-end gap-2">
                            {intel.type === 'cve' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                            {intel.type === 'ioc' && <Eye className="h-5 w-5 text-primary" />}
                            {intel.type === 'threat_feed' && <TrendingUp className="h-5 w-5 text-orange-500" />}
                          </div>
                          <div>
                            <div className="text-2xl font-mono font-bold text-primary">{(intel.score * 100).toFixed(0)}</div>
                            <p className="text-xs text-muted-foreground">Confidence</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{intel.sources} Sources</span>
                        <span className="text-muted-foreground">Updated: {new Date(intel.lastUpdated).toLocaleString()}</span>
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
