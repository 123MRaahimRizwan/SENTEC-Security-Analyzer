
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { MOCK_ASSETS } from "@/lib/mock-data";
import { Search, AlertTriangle, CheckCircle, AlertCircle, Zap, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
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

// Format time to show in Pakistan timezone (UTC+5)
const formatScanTime = (timestamp: string) => {
  const scanned = new Date(timestamp);
  // Add 5 hours for Pakistan Standard Time (PKT = UTC+5)
  const pktTime = new Date(scanned.getTime() + (5 * 60 * 60 * 1000));
  return pktTime.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export default function Assets() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("api/assets"), { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch assets");
      }
      return res.json();
    },
    refetchInterval: 30000,
  });
  
  const { data: incidentsData } = useQuery({
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
  
  const assets = assetsData || [];
  const incidents = incidentsData || [];
  
  // Helper function to check if asset has high-risk attacks
  const hasHighRiskAttacks = (asset: any) => {
    const highRiskAttackTypes = ['SQL_INJECTION', 'XSS', 'COMMAND_INJECTION', 'PATH_TRAVERSAL', 'DOS', 'BRUTE_FORCE'];
    const assetIp = asset.ip;
    
    return incidents.some((incident: any) => {
      const description = incident.description || '';
      const title = (incident.title || '').toUpperCase();
      const isHighRisk = highRiskAttackTypes.some(attackType => 
        title.includes(attackType) || title.includes(attackType.replace('_', ' '))
      );
      const isFromThisAsset = description.includes(assetIp);
      return isHighRisk && isFromThisAsset;
    });
  };
  
  // Helper function to get adjusted vulnerability counts for an asset
  const getAdjustedVulnCounts = (asset: any) => {
    const highRiskAttackTypes = ['SQL_INJECTION', 'XSS', 'COMMAND_INJECTION', 'PATH_TRAVERSAL', 'DOS', 'BRUTE_FORCE'];
    const assetIp = asset.ip;
    
    // Count how many high-risk incidents this asset has
    const highRiskCount = incidents.filter((incident: any) => {
      const description = incident.description || '';
      const title = (incident.title || '').toUpperCase();
      const isHighRisk = highRiskAttackTypes.some(attackType => 
        title.includes(attackType) || title.includes(attackType.replace('_', ' '))
      );
      const isFromThisAsset = description.includes(assetIp);
      return isHighRisk && isFromThisAsset;
    }).length;
    
    // If there are high-risk attacks, reclassify them as critical/high
    if (highRiskCount > 0) {
      const remaining = Math.max(0, asset.lowVulns - highRiskCount);
      return {
        critical: asset.criticalVulns + highRiskCount,
        high: asset.highVulns,
        medium: asset.mediumVulns,
        low: remaining
      };
    }
    
    return {
      critical: asset.criticalVulns,
      high: asset.highVulns,
      medium: asset.mediumVulns,
      low: asset.lowVulns
    };
  };
  
  const criticalCount = assets.filter((a: any) => 
    a.status === 'critical' || hasHighRiskAttacks(a)
  ).length;
  const warningCount = assets.filter((a: any) => a.status === 'warning').length;
  const healthyCount = assets.filter((a: any) => a.status === 'healthy').length;

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
                  <div className="text-2xl font-bold font-mono">{assets.length}</div>
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
              {isLoading ? (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm col-span-2">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Loading assets...</p>
                  </CardContent>
                </Card>
              ) : assets.length > 0 ? assets.map((asset: any, idx: number) => {
                const vulnCounts = getAdjustedVulnCounts(asset);
                return (
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
                          {asset.ip && (
                            <p className="text-xs font-mono text-muted-foreground mt-1">IP: {asset.ip}</p>
                          )}
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
                          <p className="text-sm font-mono">{formatScanTime(asset.lastScanned)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Vulnerability Breakdown</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {vulnCounts.critical > 0 && (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                              {vulnCounts.critical} Critical
                            </Badge>
                          )}
                          {vulnCounts.high > 0 && (
                            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-[10px]">
                              {vulnCounts.high} High
                            </Badge>
                          )}
                          {vulnCounts.medium > 0 && (
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px]">
                              {vulnCounts.medium} Medium
                            </Badge>
                          )}
                          {vulnCounts.low > 0 && (
                            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-[10px]">
                              {vulnCounts.low} Low
                            </Badge>
                          )}
                          {asset.vulnerabilities === 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px]">
                              No Vulnerabilities
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
              }) : (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm col-span-2">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No assets detected</p>
                    <p className="text-xs text-muted-foreground mt-2">Upload log files to analyze assets</p>
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
