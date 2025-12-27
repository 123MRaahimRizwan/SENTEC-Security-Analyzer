
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
import jsPDF from 'jspdf';

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
                        const margin = 20;
                        let yPos = margin;
                        
                        // Helper function to check if we need a new page
                        const checkNewPage = (requiredSpace: number) => {
                          if (yPos + requiredSpace > pageHeight - margin) {
                            pdf.addPage();
                            yPos = margin;
                            return true;
                          }
                          return false;
                        };
                        
                        // Helper function to draw a colored box
                        const drawColoredBox = (x: number, y: number, width: number, height: number, color: number[]) => {
                          pdf.setFillColor(color[0], color[1], color[2]);
                          pdf.rect(x, y, width, height, 'F');
                        };
                        
                        // Helper function to draw section header
                        const drawSectionHeader = (title: string, y: number) => {
                          // Draw colored header background
                          pdf.setFillColor(59, 130, 246); // Blue color
                          pdf.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
                          
                          // Draw title
                          pdf.setTextColor(255, 255, 255);
                          pdf.setFontSize(14);
                          pdf.setFont('helvetica', 'bold');
                          pdf.text(title, margin + 2, y + 6);
                          
                          // Reset text color
                          pdf.setTextColor(40, 40, 40);
                          pdf.setFont('helvetica', 'normal');
                        };
                        
                        // Header with colored background
                        pdf.setFillColor(30, 41, 59); // Dark blue-gray
                        pdf.rect(0, 0, pageWidth, 35, 'F');
                        
                        // Title
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(22);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Security Report', margin, 20);
                        
                        // Subtitle
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(reportDetails.report.title, margin, 28);
                        
                        yPos = 45;
                        
                        // Metadata box
                        pdf.setFillColor(249, 250, 251); // Light gray
                        pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
                        pdf.setDrawColor(229, 231, 235);
                        pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'S');
                        
                        pdf.setTextColor(75, 85, 99);
                        pdf.setFontSize(9);
                        pdf.text(`Period: ${reportDetails.report.period}`, margin + 3, yPos + 8);
                        pdf.text(`Generated: ${new Date(reportDetails.report.generatedAt).toLocaleString()}`, margin + 3, yPos + 14);
                        pdf.text(`Report ID: ${reportDetails.report.id}`, margin + 3, yPos + 20);
                        
                        yPos += 32;
                        
                        // Executive Summary Section
                        drawSectionHeader('Executive Summary', yPos);
                        yPos += 12;
                        
                        // Summary metrics in a grid layout
                        const metrics = [
                          { label: 'Security Score', value: reportDetails.report.score, color: [59, 130, 246] },
                          { label: 'Total Findings', value: reportDetails.report.findings, color: [107, 114, 128] },
                          { label: 'Incidents', value: reportDetails.summary.total_incidents, color: [239, 68, 68] },
                          { label: 'Threats', value: reportDetails.summary.total_threats, color: [249, 115, 22] },
                          { label: 'Assets', value: reportDetails.summary.total_assets, color: [34, 197, 94] },
                          { label: 'Alerts', value: reportDetails.summary.total_alerts, color: [168, 85, 247] }
                        ];
                        
                        const boxWidth = (pageWidth - 2 * margin - 20) / 3;
                        const boxHeight = 25;
                        let col = 0;
                        let row = 0;
                        
                        metrics.forEach((metric, index) => {
                          const x = margin + 5 + col * (boxWidth + 5);
                          const y = yPos + row * (boxHeight + 5);
                          
                          // Draw colored box
                          pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
                          pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
                          pdf.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'FD');
                          
                          // Draw label
                          pdf.setTextColor(255, 255, 255);
                          pdf.setFontSize(8);
                          pdf.setFont('helvetica', 'normal');
                          pdf.text(metric.label, x + 3, y + 8);
                          
                          // Draw value
                          pdf.setFontSize(16);
                          pdf.setFont('helvetica', 'bold');
                          pdf.text(String(metric.value), x + 3, y + 18);
                          
                          // Reset text color
                          pdf.setTextColor(40, 40, 40);
                          
                          col++;
                          if (col >= 3) {
                            col = 0;
                            row++;
                          }
                        });
                        
                        yPos += (row + 1) * (boxHeight + 5) + 10;
                        
                        // Incidents Section
                        if (reportDetails.related_incidents && reportDetails.related_incidents.length > 0) {
                          checkNewPage(40);
                          drawSectionHeader(`Security Incidents (${reportDetails.related_incidents.length})`, yPos);
                          yPos += 12;
                          
                          pdf.setFontSize(10);
                          pdf.setFont('helvetica', 'bold');
                          
                          // Table header
                          pdf.setFillColor(243, 244, 246);
                          pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                          pdf.setTextColor(75, 85, 99);
                          pdf.setFontSize(9);
                          pdf.text('ID', margin + 2, yPos + 6);
                          pdf.text('Title', margin + 30, yPos + 6);
                          pdf.text('Severity', margin + 120, yPos + 6);
                          pdf.text('Status', margin + 160, yPos + 6);
                          yPos += 10;
                          
                          pdf.setFontSize(8);
                          pdf.setFont('helvetica', 'normal');
                          reportDetails.related_incidents.slice(0, 10).forEach((incident: any, index: number) => {
                            checkNewPage(12);
                            
                            // Alternate row colors
                            if ((index % 2) === 0) {
                              pdf.setFillColor(249, 250, 251);
                              pdf.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F');
                            }
                            
                            pdf.setTextColor(40, 40, 40);
                            pdf.text(incident.id.substring(0, 12), margin + 2, yPos);
                            pdf.text(incident.title.substring(0, 35), margin + 30, yPos);
                            
                            // Severity color coding
                            const severityColor = incident.severity?.toLowerCase() === 'critical' ? [239, 68, 68] :
                                                  incident.severity?.toLowerCase() === 'high' ? [249, 115, 22] :
                                                  incident.severity?.toLowerCase() === 'medium' ? [234, 179, 8] : [107, 114, 128];
                            pdf.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
                            pdf.roundedRect(margin + 120, yPos - 6, 25, 6, 2, 2, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.text(incident.severity || 'N/A', margin + 122, yPos - 1);
                            
                            pdf.setTextColor(75, 85, 99);
                            pdf.text(incident.status || 'N/A', margin + 160, yPos);
                            yPos += 10;
                          });
                          yPos += 5;
                        }
                        
                        // Threats Section
                        if (reportDetails.related_threats && reportDetails.related_threats.length > 0) {
                          checkNewPage(40);
                          drawSectionHeader(`Threat Intelligence (${reportDetails.related_threats.length})`, yPos);
                          yPos += 12;
                          
                          // Table header
                          pdf.setFillColor(243, 244, 246);
                          pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                          pdf.setTextColor(75, 85, 99);
                          pdf.setFontSize(9);
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('Threat', margin + 2, yPos + 6);
                          pdf.text('Type', margin + 100, yPos + 6);
                          pdf.text('Severity', margin + 140, yPos + 6);
                          pdf.text('Score', margin + 170, yPos + 6);
                          yPos += 10;
                          
                          pdf.setFontSize(8);
                          pdf.setFont('helvetica', 'normal');
                          reportDetails.related_threats.slice(0, 10).forEach((threat: any, index: number) => {
                            checkNewPage(12);
                            
                            // Alternate row colors
                            if ((index % 2) === 0) {
                              pdf.setFillColor(249, 250, 251);
                              pdf.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F');
                            }
                            
                            pdf.setTextColor(40, 40, 40);
                            pdf.text(threat.title.substring(0, 45), margin + 2, yPos);
                            pdf.text(threat.type || 'N/A', margin + 100, yPos);
                            
                            // Severity color coding
                            const severityColor = threat.severity?.toLowerCase() === 'critical' ? [239, 68, 68] :
                                                  threat.severity?.toLowerCase() === 'high' ? [249, 115, 22] :
                                                  threat.severity?.toLowerCase() === 'medium' ? [234, 179, 8] : [107, 114, 128];
                            pdf.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
                            pdf.roundedRect(margin + 140, yPos - 6, 25, 6, 2, 2, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.text((threat.severity || 'N/A').substring(0, 8), margin + 142, yPos - 1);
                            
                            pdf.setTextColor(59, 130, 246);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text(`${(threat.score * 100).toFixed(0)}%`, margin + 170, yPos);
                            pdf.setFont('helvetica', 'normal');
                            yPos += 10;
                          });
                          yPos += 5;
                        }
                        
                        // Assets Section
                        if (reportDetails.related_assets && reportDetails.related_assets.length > 0) {
                          checkNewPage(40);
                          drawSectionHeader(`Affected Assets (${reportDetails.related_assets.length})`, yPos);
                          yPos += 12;
                          
                          // Table header
                          pdf.setFillColor(243, 244, 246);
                          pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                          pdf.setTextColor(75, 85, 99);
                          pdf.setFontSize(9);
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('Asset Name', margin + 2, yPos + 6);
                          pdf.text('IP Address', margin + 80, yPos + 6);
                          pdf.text('Status', margin + 130, yPos + 6);
                          pdf.text('Vulnerabilities', margin + 170, yPos + 6);
                          yPos += 10;
                          
                          pdf.setFontSize(8);
                          pdf.setFont('helvetica', 'normal');
                          reportDetails.related_assets.slice(0, 15).forEach((asset: any, index: number) => {
                            checkNewPage(12);
                            
                            // Alternate row colors
                            if ((index % 2) === 0) {
                              pdf.setFillColor(249, 250, 251);
                              pdf.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F');
                            }
                            
                            pdf.setTextColor(40, 40, 40);
                            pdf.text((asset.name || 'N/A').substring(0, 35), margin + 2, yPos);
                            pdf.text((asset.ip || 'N/A').substring(0, 15), margin + 80, yPos);
                            
                            // Status color coding
                            const statusColor = asset.status?.toLowerCase() === 'at risk' ? [239, 68, 68] :
                                               asset.status?.toLowerCase() === 'monitored' ? [234, 179, 8] : [34, 197, 94];
                            pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
                            pdf.roundedRect(margin + 130, yPos - 6, 30, 6, 2, 2, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.text((asset.status || 'N/A').substring(0, 10), margin + 132, yPos - 1);
                            
                            pdf.setTextColor(75, 85, 99);
                            pdf.text(String(asset.vulnerabilities || 0), margin + 170, yPos);
                            yPos += 10;
                          });
                          yPos += 5;
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
