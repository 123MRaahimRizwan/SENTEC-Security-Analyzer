
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { MOCK_REPORTS } from "@/lib/mock-data";
import { Search, TrendingUp, TrendingDown, Minus, Download, AlertTriangle, Shield, Database, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { useState } from "react";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

const typeColors = {
  security: "bg-primary/10 text-primary border-primary/20",
  compliance: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  threat: "bg-destructive/10 text-destructive border-destructive/20",
  trend: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

const trendIcons = {
  up: <TrendingUp className="h-5 w-5 text-destructive" />,
  down: <TrendingDown className="h-5 w-5 text-emerald-500" />,
  stable: <Minus className="h-5 w-5 text-muted-foreground" />
};

export default function Reports() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("api/reports"), { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch reports");
      }
      return res.json();
    },
    refetchInterval: 30000,
  });
  
  const { data: reportDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["report-details", selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return null;
      const res = await fetch(getApiUrl(`api/reports/${selectedReportId}`), { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch report details");
      }
      return res.json();
    },
    enabled: !!selectedReportId,
  });
  
  const reports = reportsData || [];
  
  // Calculate statistics
  const recentReports = reports.length;
  const avgSecurityScore = reports.length > 0 
    ? Math.round(reports.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / reports.length)
    : 0;
  const totalFindings = reports.reduce((sum: number, r: any) => sum + (r.findings || 0), 0);
  
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
                placeholder="Search reports..." 
                className="pl-9 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-9 font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/50">
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto z-10">
          <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight">Security Reports</h2>
              <p className="text-muted-foreground mt-1">View detailed security assessments, compliance reports, and trend analysis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{recentReports}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Recent Reports</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-primary">{avgSecurityScore}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Avg Security Score</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">{totalFindings}</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Findings</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Loading reports...</p>
                  </CardContent>
                </Card>
              ) : reports.length > 0 ? reports.map((report: any, idx: number) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer group border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`border ${typeColors[report.type]} text-[10px] font-mono uppercase`}>
                              {report.type}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{report.id}</span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {report.title}
                          </h3>
                        </div>
                        <div className="text-right space-y-3 flex-shrink-0">
                          {trendIcons[report.trend]}
                          <div>
                            <div className="text-2xl font-mono font-bold text-primary">{report.score}</div>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Period: {report.period}</p>
                          <p className="text-muted-foreground">{report.findings} Key Findings</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Generated: {new Date(report.generatedAt).toLocaleDateString()}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary/80 mt-2"
                            onClick={() => setSelectedReportId(report.id)}
                          >
                            View Report →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )) : (
                <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No reports generated</p>
                    <p className="text-xs text-muted-foreground mt-2">Upload log files to generate security reports</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Report Details Dialog */}
      <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailsLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading report details...</p>
            </div>
          ) : reportDetails ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">{reportDetails.report.title}</DialogTitle>
                <DialogDescription>
                  {reportDetails.report.period} • Generated: {new Date(reportDetails.report.generatedAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Report Summary */}
                <Card className="bg-card/40 border-primary/20">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Security Score</p>
                        <p className="text-3xl font-mono font-bold text-primary mt-2">{reportDetails.report.score}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Findings</p>
                        <p className="text-3xl font-mono font-bold text-foreground mt-2">{reportDetails.report.findings}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Incidents</p>
                        <p className="text-3xl font-mono font-bold text-destructive mt-2">{reportDetails.summary.total_incidents}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Threats</p>
                        <p className="text-3xl font-mono font-bold text-orange-500 mt-2">{reportDetails.summary.total_threats}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Related Incidents */}
                {reportDetails.related_incidents && reportDetails.related_incidents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Related Incidents ({reportDetails.related_incidents.length})
                    </h3>
                    <div className="space-y-2">
                      {reportDetails.related_incidents.map((incident: any) => (
                        <Card key={incident.id} className="bg-card/40 border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-muted-foreground">{incident.id}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {incident.severity}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {incident.status}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold">{incident.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{incident.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Related Threats */}
                {reportDetails.related_threats && reportDetails.related_threats.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Threat Intelligence ({reportDetails.related_threats.length})
                    </h3>
                    <div className="space-y-2">
                      {reportDetails.related_threats.map((threat: any) => (
                        <Card key={threat.id} className="bg-card/40 border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="text-xs">{threat.type}</Badge>
                                  <Badge variant="outline" className="text-xs">{threat.severity}</Badge>
                                </div>
                                <p className="text-sm font-semibold">{threat.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{threat.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-mono font-bold text-primary">{(threat.score * 100).toFixed(0)}%</p>
                                <p className="text-xs text-muted-foreground">Confidence</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Related Assets */}
                {reportDetails.related_assets && reportDetails.related_assets.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Affected Assets ({reportDetails.related_assets.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {reportDetails.related_assets.map((asset: any) => (
                        <Card key={asset.id} className="bg-card/40 border-border/50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">{asset.name}</p>
                                {asset.ip && <p className="text-xs font-mono text-muted-foreground">IP: {asset.ip}</p>}
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-xs">{asset.status}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">{asset.vulnerabilities} vulns</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Related Alerts */}
                {reportDetails.related_alerts && reportDetails.related_alerts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Key Alerts ({reportDetails.related_alerts.length})
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {reportDetails.related_alerts.map((alert: any, idx: number) => (
                        <Card key={alert.id || idx} className="bg-card/40 border-border/50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{alert.title}</p>
                                <p className="text-xs text-muted-foreground">{alert.description}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-xs">{alert.severity}</Badge>
                                <p className="text-xs font-mono text-muted-foreground mt-1">
                                  Score: {alert.anomaly_score?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
