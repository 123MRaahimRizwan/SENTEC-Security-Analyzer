
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MOCK_ASSETS } from "@/lib/mock-data";
import { Search, AlertTriangle, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

const statusIcons = {
  healthy: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  warning: <AlertCircle className="h-5 w-5 text-orange-500" />,
  critical: <AlertTriangle className="h-5 w-5 text-destructive" />
};

const statusBgColors = {
  healthy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  warning: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20"
};

const typeColors = {
  server: "bg-blue-500/10 text-blue-500",
  database: "bg-purple-500/10 text-purple-500",
  application: "bg-cyan-500/10 text-cyan-500",
  network: "bg-teal-500/10 text-teal-500"
};

export default function Assets() {
  const criticalCount = MOCK_ASSETS.filter(a => a.status === 'critical').length;
  const warningCount = MOCK_ASSETS.filter(a => a.status === 'warning').length;
  const healthyCount = MOCK_ASSETS.filter(a => a.status === 'healthy').length;

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
                placeholder="Search assets..." 
                className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-9 font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50">
              <Zap className="h-4 w-4" />
              Scan Now
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto z-10">
          <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight">Asset Inventory</h2>
              <p className="text-muted-foreground mt-1">Monitor vulnerabilities and security posture across all assets.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{MOCK_ASSETS.length}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Assets</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/10 border-destructive/20 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-destructive">{criticalCount}</div>
                  <p className="text-xs text-destructive uppercase tracking-widest mt-1">Critical Status</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500/10 border-orange-500/20 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-orange-500">{warningCount}</div>
                  <p className="text-xs text-orange-500 uppercase tracking-widest mt-1">Warning Status</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/10 border-emerald-500/20 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-emerald-500">{healthyCount}</div>
                  <p className="text-xs text-emerald-500 uppercase tracking-widest mt-1">Healthy</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {MOCK_ASSETS.map((asset, idx) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer group border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`border ${typeColors[asset.type]} text-[10px] font-mono uppercase`}>
                              {asset.type}
                            </Badge>
                            <Badge className={`border ${statusBgColors[asset.status]} text-[10px] font-mono uppercase`}>
                              {asset.status}
                            </Badge>
                          </div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {asset.name}
                          </h3>
                        </div>
                        <div>
                          {statusIcons[asset.status]}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Vulnerabilities</p>
                          <p className="text-2xl font-mono font-bold">{asset.vulnerabilities}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Last Scanned</p>
                          <p className="text-sm font-mono">{new Date(asset.lastScanned).toLocaleString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Vulnerability Breakdown</p>
                        <div className="flex items-center gap-2">
                          {asset.criticalVulns > 0 && (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                              {asset.criticalVulns} Critical
                            </Badge>
                          )}
                          {asset.highVulns > 0 && (
                            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-[10px]">
                              {asset.highVulns} High
                            </Badge>
                          )}
                          {asset.criticalVulns === 0 && asset.highVulns === 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px]">
                              No Critical/High
                            </Badge>
                          )}
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
