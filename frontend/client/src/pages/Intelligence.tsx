
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { MOCK_THREAT_INTEL } from "@/lib/mock-data";
import { Search, TrendingUp, Eye, RefreshCw, AlertTriangle, Shield, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { useState } from "react";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

const typeColors = {
  cve: "bg-destructive/10 text-destructive border-destructive/20",
  ioc: "bg-primary/10 text-primary border-primary/20",
  threat_feed: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  tactic: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

export default function Intelligence() {
  const [selectedThreat, setSelectedThreat] = useState<any | null>(null);
  
  const { data: threatIntelData, isLoading } = useQuery({
    queryKey: ["threat-intel"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("api/threat-intel"), { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch threat intelligence");
      }
      return res.json();
    },
    refetchInterval: 30000,
  });
  
  const threatIntel = threatIntelData || [];
  
  // Calculate statistics
  const criticalCVEs = threatIntel.filter((t: any) => t.type === 'cve' && t.severity === 'critical').length;
  const activeFeeds = threatIntel.filter((t: any) => t.type === 'threat_feed').length;
  const threatSources = threatIntel.length;
  const coverageScore = threatIntel.length > 0 ? Math.min(100, Math.round((threatIntel.reduce((sum: number, t: any) => sum + (t.score || 0), 0) / threatIntel.length) * 100)) : 0;
  
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
                  <div className="text-2xl font-bold font-mono text-destructive">{criticalCVEs}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Critical CVEs</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{activeFeeds}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Active Feeds</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-primary">{threatSources}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Threat Sources</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{coverageScore}%</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Coverage Score</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Loading threat intelligence...</p>
                  </CardContent>
                </Card>
              ) : threatIntel.length > 0 ? threatIntel.map((intel: any, idx: number) => (
                <motion.div
                  key={intel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className="bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer group border-l-4 border-l-primary"
                    onClick={() => setSelectedThreat(intel)}
                  >
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
              )) : (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No threat intelligence detected</p>
                    <p className="text-xs text-muted-foreground mt-2">Upload log files to analyze threats</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Threat Details Dialog */}
      <Dialog open={!!selectedThreat} onOpenChange={(open) => !open && setSelectedThreat(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedThreat && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">{selectedThreat.title}</DialogTitle>
                <DialogDescription>
                  {selectedThreat.type.replace('_', ' ').toUpperCase()} • {selectedThreat.severity.toUpperCase()} • Updated: {new Date(selectedThreat.lastUpdated).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Threat Overview */}
                <Card className="bg-card/40 border-primary/20">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                        <Badge className={`mt-2 ${typeColors[selectedThreat.type]}`}>
                          {selectedThreat.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Severity</p>
                        <Badge variant="outline" className="mt-2 border-destructive/50 text-destructive bg-destructive/10">
                          {selectedThreat.severity}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</p>
                        <p className="text-2xl font-mono font-bold text-primary mt-2">{(selectedThreat.score * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Sources</p>
                        <p className="text-2xl font-mono font-bold text-foreground mt-2">{selectedThreat.sources}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Threat Description
                  </h3>
                  <Card className="bg-card/40 border-border/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-foreground">{selectedThreat.description}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Threat Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Threat Details
                  </h3>
                  <Card className="bg-card/40 border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Threat ID</p>
                          <p className="font-mono font-semibold mt-1">{selectedThreat.id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
                          <p className="font-mono font-semibold mt-1">{new Date(selectedThreat.lastUpdated).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Threat Type</p>
                          <p className="font-semibold mt-1 capitalize">{selectedThreat.type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence Score</p>
                          <p className="font-mono font-semibold text-primary mt-1">{(selectedThreat.score * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Recommended Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommended Actions</h3>
                  <Card className="bg-card/40 border-border/50">
                    <CardContent className="p-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Monitor network traffic for patterns matching this threat type</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Review security policies related to {selectedThreat.type.replace('_', ' ')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Check affected assets and endpoints for similar indicators</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Update threat intelligence feeds and security rules</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
