import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { MOCK_REPORTS } from "@/lib/mock-data";
import { Search, TrendingUp, TrendingDown, Minus, Download, AlertTriangle, Shield, Database, FileText, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';
import jsPDF from 'jspdf';

const typeColors: Record<string, string> = {
  security: "bg-primary/10 text-primary border-primary/20",
  compliance: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  threat: "bg-destructive/10 text-destructive border-destructive/20",
  trend: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

const trendIcons: Record<string, React.ReactElement> = {
  up: <TrendingUp className="h-5 w-5 text-destructive" />,
  down: <TrendingDown className="h-5 w-5 text-emerald-500" />,
  stable: <Minus className="h-5 w-5 text-muted-foreground" />
};

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  
  // Fetch all incidents separately to avoid date filtering issues
  const { data: allIncidentsData } = useQuery({
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
  
  const allIncidents = allIncidentsData || [];
  
  const reports = reportsData || [];
  
  // Calculate statistics
  const recentReports = reports.length;
  const avgSecurityScore = reports.length > 0 
    ? Math.round(reports.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / reports.length)
    : 0;
  const totalFindings = reports.reduce((sum: number, r: any) => sum + (r.findings || 0), 0);
  
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
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-display">{reportDetails.report.title}</DialogTitle>
                    <DialogDescription>
                      {reportDetails.report.period} • Generated: {new Date(reportDetails.report.generatedAt).toLocaleString()}
                    </DialogDescription>
                  </div>
                  <Button
                    onClick={() => {
                      const generatePDF = () => {
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pageWidth = 210;
                        const pageHeight = 297;
                        const margin = 15;
                        let yPos = margin;
                        
                        // Helper function to check if we need a new page
                        const checkNewPage = (requiredSpace: number) => {
                          if (yPos + requiredSpace > pageHeight - 20) {
                            pdf.addPage();
                            yPos = margin;
                            return true;
                          }
                          return false;
                        };
                        
                        // Helper function to draw a card-style box
                        const drawCard = (x: number, y: number, width: number, height: number, borderColor = [59, 130, 246]) => {
                          pdf.setFillColor(250, 250, 251);
                          pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                          pdf.setLineWidth(0.5);
                          pdf.roundedRect(x, y, width, height, 2, 2, 'FD');
                          pdf.setLineWidth(0.2);
                        };
                        
                        // Helper function to draw section header
                        const drawSectionHeader = (title: string, y: number) => {
                          pdf.setFontSize(11);
                          pdf.setFont('helvetica', 'bold');
                          pdf.setTextColor(30, 41, 59);
                          pdf.text(title, margin, y);
                          
                          pdf.setDrawColor(226, 232, 240);
                          pdf.setLineWidth(0.5);
                          pdf.line(margin, y + 1, pageWidth - margin, y + 1);
                          
                          pdf.setTextColor(40, 40, 40);
                          pdf.setFont('helvetica', 'normal');
                        };
                        
                        // Header
                        pdf.setFillColor(30, 41, 59);
                        pdf.rect(0, 0, pageWidth, 40, 'F');
                        
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(20);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(reportDetails.report.title, margin, 18);
                        
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`${reportDetails.report.period} • Generated: ${new Date(reportDetails.report.generatedAt).toLocaleString()}`, margin, 28);
                        pdf.text(`Report ID: ${reportDetails.report.id}`, margin, 35);
                        
                        yPos = 50;
                        
                        // Summary Card (matching the UI grid)
                        pdf.setTextColor(100, 116, 139);
                        pdf.setFontSize(9);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text('REPORT SUMMARY', margin, yPos);
                        yPos += 5;
                        
                        drawCard(margin, yPos, pageWidth - 2 * margin, 35, [59, 130, 246]);
                        
                        // Summary metrics in 4-column grid
                        const summaryMetrics = [
                          { label: 'SECURITY SCORE', value: reportDetails.report.score, color: [59, 130, 246] },
                          { label: 'FINDINGS', value: reportDetails.report.findings, color: [71, 85, 105] },
                          { label: 'CRITICAL', value: allIncidents.filter((i: any) => {
                            const title = (i.title || '').toUpperCase();
                            return ['SQL_INJECTION', 'XSS', 'COMMAND_INJECTION', 'PATH_TRAVERSAL', 'DOS', 'BRUTE_FORCE'].some(
                              attackType => title.includes(attackType) || title.includes(attackType.replace('_', ' '))
                            );
                          }).length, color: [239, 68, 68] },
                          { label: 'THREATS', value: reportDetails.summary.total_threats, color: [249, 115, 22] }
                        ];
                        
                        const colWidth = (pageWidth - 2 * margin) / 4;
                        summaryMetrics.forEach((metric, idx) => {
                          const x = margin + (colWidth * idx) + 5;
                          const y = yPos + 8;
                          
                          pdf.setFontSize(7);
                          pdf.setTextColor(100, 116, 139);
                          pdf.text(metric.label, x, y);
                          
                          pdf.setFontSize(20);
                          pdf.setFont('helvetica', 'bold');
                          pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
                          pdf.text(String(metric.value), x, y + 14);
                          pdf.setFont('helvetica', 'normal');
                        });
                        
                        yPos += 42;
                        
                        // Related Incidents Section (matching UI card layout)
                        if (reportDetails.related_incidents && reportDetails.related_incidents.length > 0) {
                          checkNewPage(25);
                          drawSectionHeader(`Related Incidents (${reportDetails.related_incidents.length})`, yPos);
                          yPos += 6;
                          
                          reportDetails.related_incidents.forEach((incident: any) => {
                            checkNewPage(28);
                            
                            // Draw incident card
                            drawCard(margin, yPos, pageWidth - 2 * margin, 25, [226, 232, 240]);
                            
                            // Incident ID and badges
                            pdf.setFontSize(7);
                            pdf.setTextColor(100, 116, 139);
                            pdf.text(incident.id, margin + 3, yPos + 6);
                            
                            // Severity badge
                            const sevColor = incident.severity === 'critical' ? [239, 68, 68] :
                                           incident.severity === 'high' ? [249, 115, 22] :
                                           incident.severity === 'medium' ? [234, 179, 8] : [107, 114, 128];
                            pdf.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
                            pdf.roundedRect(margin + 30, yPos + 2.5, 18, 5, 1, 1, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(6);
                            pdf.text(incident.severity?.toUpperCase() || 'N/A', margin + 31, yPos + 5.5);
                            
                            // Status badge
                            pdf.setFillColor(226, 232, 240);
                            pdf.setDrawColor(203, 213, 225);
                            pdf.roundedRect(margin + 50, yPos + 2.5, 15, 5, 1, 1, 'FD');
                            pdf.setTextColor(71, 85, 105);
                            pdf.text(incident.status?.toUpperCase() || 'N/A', margin + 51, yPos + 5.5);
                            
                            // Incident title
                            pdf.setFontSize(9);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setTextColor(30, 41, 59);
                            pdf.text(incident.title.substring(0, 60), margin + 3, yPos + 13);
                            pdf.setFont('helvetica', 'normal');
                            
                            // Description
                            pdf.setFontSize(7);
                            pdf.setTextColor(100, 116, 139);
                            const descLines = pdf.splitTextToSize(incident.description, pageWidth - 2 * margin - 10);
                            pdf.text(descLines.slice(0, 2), margin + 3, yPos + 18);
                            
                            yPos += 28;
                          });
                        }
                        
                        // Related Threats Section (matching UI card layout)
                        if (reportDetails.related_threats && reportDetails.related_threats.length > 0) {
                          checkNewPage(25);
                          drawSectionHeader(`Threat Intelligence (${reportDetails.related_threats.length})`, yPos);
                          yPos += 6;
                          
                          reportDetails.related_threats.forEach((threat: any) => {
                            checkNewPage(28);
                            
                            drawCard(margin, yPos, pageWidth - 2 * margin, 25, [226, 232, 240]);
                            
                            // Type badge
                            const typeColors: Record<string, number[]> = {
                              cve: [239, 68, 68],
                              ioc: [59, 130, 246],
                              threat_feed: [249, 115, 22],
                              tactic: [168, 85, 247]
                            };
                            const tColor = typeColors[threat.type] || [107, 114, 128];
                            pdf.setFillColor(tColor[0], tColor[1], tColor[2]);
                            pdf.roundedRect(margin + 3, yPos + 3, 15, 5, 1, 1, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(6);
                            pdf.text(threat.type?.toUpperCase() || 'N/A', margin + 4, yPos + 6);
                            
                            // Severity badge
                            const sevColor = threat.severity === 'critical' ? [239, 68, 68] :
                                           threat.severity === 'high' ? [249, 115, 22] : [234, 179, 8];
                            pdf.setFillColor(226, 232, 240);
                            pdf.setDrawColor(sevColor[0], sevColor[1], sevColor[2]);
                            pdf.roundedRect(margin + 20, yPos + 3, 18, 5, 1, 1, 'FD');
                            pdf.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
                            pdf.text(threat.severity?.toUpperCase() || 'N/A', margin + 21, yPos + 6);
                            
                            // Confidence score (right side)
                            pdf.setFontSize(14);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setTextColor(59, 130, 246);
                            pdf.text(`${(threat.score * 100).toFixed(0)}%`, pageWidth - margin - 15, yPos + 10);
                            pdf.setFontSize(6);
                            pdf.setTextColor(100, 116, 139);
                            pdf.text('CONFIDENCE', pageWidth - margin - 18, yPos + 14);
                            pdf.setFont('helvetica', 'normal');
                            
                            // Title
                            pdf.setFontSize(9);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setTextColor(30, 41, 59);
                            pdf.text(threat.title.substring(0, 55), margin + 3, yPos + 14);
                            pdf.setFont('helvetica', 'normal');
                            
                            // Description
                            pdf.setFontSize(7);
                            pdf.setTextColor(100, 116, 139);
                            const descLines = pdf.splitTextToSize(threat.description, pageWidth - 2 * margin - 40);
                            pdf.text(descLines.slice(0, 2), margin + 3, yPos + 19);
                            
                            yPos += 28;
                          });
                        }
                        
                        // Related Assets Section (matching UI 2-column grid)
                        if (reportDetails.related_assets && reportDetails.related_assets.length > 0) {
                          checkNewPage(25);
                          drawSectionHeader(`Affected Assets (${reportDetails.related_assets.length})`, yPos);
                          yPos += 6;
                          
                          const cardWidth = (pageWidth - 2 * margin - 4) / 2;
                          let col = 0;
                          
                          reportDetails.related_assets.forEach((asset: any, idx: number) => {
                            if (col === 0) checkNewPage(18);
                            
                            const x = col === 0 ? margin : margin + cardWidth + 4;
                            
                            drawCard(x, yPos, cardWidth, 15, [226, 232, 240]);
                            
                            // Asset name
                            pdf.setFontSize(8);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setTextColor(30, 41, 59);
                            pdf.text(asset.name?.substring(0, 20) || 'N/A', x + 2, yPos + 5);
                            pdf.setFont('helvetica', 'normal');
                            
                            // IP
                            if (asset.ip) {
                              pdf.setFontSize(7);
                              pdf.setTextColor(100, 116, 139);
                              pdf.text(`IP: ${asset.ip}`, x + 2, yPos + 9);
                            }
                            
                            // Status badge (right side)
                            const statusColor = asset.status === 'critical' ? [239, 68, 68] :
                                              asset.status === 'warning' ? [249, 115, 22] : [34, 197, 94];
                            pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
                            pdf.roundedRect(x + cardWidth - 22, yPos + 2, 20, 4, 1, 1, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(6);
                            pdf.text(asset.status?.toUpperCase() || 'N/A', x + cardWidth - 21, yPos + 5);
                            
                            // Vulnerabilities count
                            pdf.setFontSize(7);
                            pdf.setTextColor(100, 116, 139);
                            pdf.text(`${asset.vulnerabilities || 0} vulns`, x + cardWidth - 21, yPos + 9);
                            
                            col++;
                            if (col >= 2) {
                              col = 0;
                              yPos += 18;
                            }
                          });
                          
                          if (col > 0) yPos += 18;
                        }
                        
                        // Related Alerts Section
                        if (reportDetails.related_alerts && reportDetails.related_alerts.length > 0) {
                          checkNewPage(25);
                          drawSectionHeader(`Key Alerts (${Math.min(reportDetails.related_alerts.length, 10)})`, yPos);
                          yPos += 6;
                          
                          reportDetails.related_alerts.slice(0, 10).forEach((alert: any) => {
                            checkNewPage(18);
                            
                            drawCard(margin, yPos, pageWidth - 2 * margin, 15, [226, 232, 240]);
                            
                            // Title
                            pdf.setFontSize(8);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setTextColor(30, 41, 59);
                            pdf.text(alert.title?.substring(0, 60) || 'N/A', margin + 3, yPos + 5);
                            pdf.setFont('helvetica', 'normal');
                            
                            // Description
                            pdf.setFontSize(7);
                            pdf.setTextColor(100, 116, 139);
                            pdf.text(alert.description?.substring(0, 80) || 'N/A', margin + 3, yPos + 9);
                            
                            // Severity badge (right side)
                            const sevColor = alert.severity === 'critical' ? [239, 68, 68] :
                                           alert.severity === 'high' ? [249, 115, 22] :
                                           alert.severity === 'medium' ? [234, 179, 8] : [107, 114, 128];
                            pdf.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
                            pdf.roundedRect(pageWidth - margin - 22, yPos + 2, 20, 4, 1, 1, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(6);
                            pdf.text(alert.severity?.toUpperCase() || 'N/A', pageWidth - margin - 21, yPos + 5);
                            
                            // Anomaly score
                            if (alert.anomaly_score != null) {
                              pdf.setFontSize(7);
                              pdf.setTextColor(100, 116, 139);
                              pdf.text(`Score: ${alert.anomaly_score.toFixed(2)}`, pageWidth - margin - 22, yPos + 9);
                            }
                            
                            yPos += 18;
                          });
                        }
                        
                        // Footer on all pages
                        const totalPages = pdf.getNumberOfPages();
                        for (let i = 1; i <= totalPages; i++) {
                          pdf.setPage(i);
                          
                          // Footer line
                          pdf.setDrawColor(229, 231, 235);
                          pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
                          
                          // Footer text
                          pdf.setFontSize(8);
                          pdf.setTextColor(156, 163, 175);
                          pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                          pdf.text('Generated by Sentinel-RAG Security Analyzer', pageWidth / 2, pageHeight - 5, { align: 'center' });
                        }
                        
                        // Save PDF
                        const filename = `${reportDetails.report.title.replace(/[^a-z0-9]/gi, '_')}_${new Date(reportDetails.report.generatedAt).toISOString().split('T')[0]}.pdf`;
                        pdf.save(filename);
                      };
                      
                      generatePDF();
                    }}
                    variant="outline"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
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
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
                        <p className="text-3xl font-mono font-bold text-destructive mt-2">
                          {allIncidents.filter((i: any) => {
                            const title = (i.title || '').toUpperCase();
                            return ['SQL_INJECTION', 'XSS', 'COMMAND_INJECTION', 'PATH_TRAVERSAL', 'DOS', 'BRUTE_FORCE'].some(
                              attackType => title.includes(attackType) || title.includes(attackType.replace('_', ' '))
                            );
                          }).length}
                        </p>
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
