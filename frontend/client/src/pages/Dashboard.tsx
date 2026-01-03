
import { Sidebar } from "@/components/layout/Sidebar";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { AnomalyChart } from "@/components/dashboard/AnomalyChart";
import { RagPipelineVisual } from "@/components/dashboard/RagPipelineVisual";
import { PerformanceMetrics } from "@/components/dashboard/PerformanceMetrics";
// import { MOCK_ALERTS } from "@/lib/mock-data";
import { Bell, Search, User, Upload, FileText, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Shield, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import generatedImage from '@assets/generated_images/dark_cybersecurity_background_texture.png';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'idle' | 'uploading' | 'success' | 'error', message?: string, data?: any }>({ type: 'idle' });
  const [uploadedAlerts, setUploadedAlerts] = useState<any[]>([]);
  const [uploadedFileData, setUploadedFileData] = useState<any>(null); // Persistent upload data
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Sort uploaded alerts and limit to top 10
  const TOP_ALERTS_COUNT = 10;
  const sortedUploadedAlerts = useMemo(() => {
    if (uploadedAlerts.length === 0) return [];
    
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...uploadedAlerts].sort((a, b) => {
      // First sort by severity
      const aSev = severityOrder[a.severity as keyof typeof severityOrder] ?? 99;
      const bSev = severityOrder[b.severity as keyof typeof severityOrder] ?? 99;
      if (aSev !== bSev) return aSev - bSev;

      // Then by anomaly score (more negative = more dangerous)
      const aScore = (a as any).anomaly_score ?? 0;
      const bScore = (b as any).anomaly_score ?? 0;
      return aScore - bScore; // More negative is more dangerous
    });
    
    // Limit to top 10
    return sorted.slice(0, TOP_ALERTS_COUNT);
  }, [uploadedAlerts]);
  
  const hasFewerUploadedThanTop10 = uploadedAlerts.length > 0 && uploadedAlerts.length < TOP_ALERTS_COUNT;

  // Check backend connection on mount
  useQuery({
    queryKey: ["backend-health"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const healthUrl = getApiUrl("api/health");
        console.log("[DEBUG] Checking backend health at:", healthUrl);

        const res = await fetch(healthUrl, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
          }
        });

        clearTimeout(timeoutId);

        console.log("[DEBUG] Health check response:", res.status, res.statusText);

        if (res.ok) {
          const data = await res.json();
          console.log("[DEBUG] Backend is healthy:", data);
          setBackendConnected(true);
          return data;
        } else {
          const errorText = await res.text().catch(() => res.statusText);
          console.error("[ERROR] Health check failed:", res.status, errorText);
          setBackendConnected(false);
          throw new Error(`Backend health check failed: ${res.status} ${errorText}`);
        }
      } catch (error: any) {
        console.error("[ERROR] Health check error:", error);
        setBackendConnected(false);
        if (error.name === 'AbortError') {
          throw new Error("Backend connection timeout - server may be slow to respond");
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          throw new Error(`Cannot connect to backend at ${getApiUrl('')}. Is the server running?`);
        }
        throw error;
      }
    },
    retry: 2,
    retryDelay: 2000,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

        const res = await fetch(getApiUrl("api/upload-logs"), {
          method: "POST",
          body: formData,
          credentials: "include",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let error;
          try {
            error = await res.json();
          } catch {
            error = { error: res.statusText || `HTTP ${res.status}` };
          }
          const errorMessage = error.error || `Upload failed: ${res.statusText}`;
          const details = error.details || error.found_columns || error.required_columns || '';
          throw new Error(details ? `${errorMessage}\n\nDetails: ${JSON.stringify(details, null, 2)}` : errorMessage);
        }

        const data = await res.json();
        return data;
      } catch (error: any) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error('Upload timed out. The file might be too large. Please try with a smaller file.');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error(`Failed to connect to server. Make sure the backend is running on ${getApiUrl('')}`);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Store upload data persistently
      setUploadedFileData(data);
      setUploadStatus({
        type: 'success',
        message: `Successfully analyzed ${data.filename}. Found ${data.anomalies_detected} anomalies out of ${data.total_events} events.`,
        data: data
      });
      // Transform and store uploaded alerts
      if (data.alerts && data.alerts.length > 0) {
        const transformedAlerts = data.alerts.map((alert: any, index: number) => ({
          id: alert.id || `UPLOAD-${index}`,
          title: alert.title || alert.attack_type || "Security Alert",
          description: alert.description || `Anomaly detected: ${alert.attack_type}`,
          timestamp: alert.timestamp || new Date().toISOString(),
          severity: alert.severity || "medium",
          source: alert.source || "unknown",
          anomalies: [{
            id: `ANM-UPLOAD-${index}`,
            timestamp: alert.timestamp || new Date().toISOString(),
            metric: "Anomaly Score",
            value: Math.abs(alert.anomaly_score || 0) * 1000,
            baseline: 0,
            deviation: Math.abs(alert.anomaly_score || 0) * 100,
            severity: alert.severity || "medium"
          }],
          ragContext: {
            citation: "Security Policy",
            confidence: 0.85,
            summary: "Analysis pending - click 'Analyze with RAG' to get detailed analysis",
            sourceType: "internal_kb" as const
          },
          mitigationPlan: ["Click 'Analyze with RAG' to get mitigation recommendations"],
          status: "new" as const,
          defect: alert.defect,
          endpoint: alert.endpoint,
          query_params: alert.query_params,
          anomaly_score: alert.anomaly_score,
          uploaded_file: alert.uploaded_file || data.filename
        }));
        setUploadedAlerts(transformedAlerts);
      } else {
        // No anomalies detected - show empty state
        setUploadedAlerts([]);
      }
      // Refetch all related queries to show new uploaded data
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["threat-intel"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["anomaly-chart-data"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["backend-health"] });
      // Force refetch everything immediately
      queryClient.refetchQueries();
      // Clear success message after 5 seconds, but keep the data visible permanently
      setTimeout(() => {
        setUploadStatus(prev => {
          // Only clear the message, preserve all data
          if (prev.data) {
            return { ...prev, type: 'idle', message: undefined };
          }
          return prev;
        });
      }, 5000);
    },
    onError: (error: Error) => {
      setUploadStatus({ type: 'error', message: error.message });
      setTimeout(() => setUploadStatus({ type: 'idle' }), 5000);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadStatus({ type: 'uploading', message: `Processing ${file.name}...` });
      uploadMutation.mutate(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Don't auto-restore data on page load - user must upload a file to see data

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("api/alerts"), { credentials: "include" });
      if (!res.ok) {
        const txt = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${txt}`);
      }
      const data = await res.json();
      // Transform backend alerts to frontend format
      return data.map((alert: any, index: number) => ({
        id: alert.id || `ALT-${index}`,
        title: alert.title || alert.attack_type || "Security Alert",
        description: alert.description || `Anomaly detected: ${alert.attack_type}`,
        timestamp: alert.timestamp || new Date().toISOString(),
        severity: alert.severity || "medium",
        source: alert.source || "unknown",
        anomalies: [{
          id: `ANM-${index}`,
          timestamp: alert.timestamp || new Date().toISOString(),
          metric: "Anomaly Score",
          value: Math.abs(alert.anomaly_score || 0) * 1000,
          baseline: 0,
          deviation: Math.abs(alert.anomaly_score || 0) * 100,
          severity: alert.severity || "medium"
        }],
        ragContext: {
          citation: "Security Policy",
          confidence: 0.85,
          summary: "Analysis pending - click 'Analyze with RAG' to get detailed analysis",
          sourceType: "internal_kb" as const
        },
        mitigationPlan: ["Click 'Analyze with RAG' to get mitigation recommendations"],
        status: "new" as const,
        defect: alert.defect,
        endpoint: alert.endpoint,
        query_params: alert.query_params,
        anomaly_score: alert.anomaly_score
      }));
    },
    refetchInterval: 30000,
  });
  // const alerts = alertsData ?? MOCK_ALERTS;
  const alerts = alertsData ?? [];

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Sort all alerts by danger level (severity + anomaly score)
  const sortedAlerts = useMemo(() => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...alerts].sort((a, b) => {
      // First sort by severity
      const aSev = severityOrder[a.severity as keyof typeof severityOrder] ?? 99;
      const bSev = severityOrder[b.severity as keyof typeof severityOrder] ?? 99;
      if (aSev !== bSev) return aSev - bSev;

      // Then by anomaly score (more negative = more dangerous)
      const aScore = (a as any).anomaly_score ?? 0;
      const bScore = (b as any).anomaly_score ?? 0;
      return aScore - bScore; // More negative is more dangerous
    });
  }, [alerts]);

  // Always show top 10 alerts (or all if fewer than 10)
  const topAlerts = useMemo(() => {
    return sortedAlerts.slice(0, TOP_ALERTS_COUNT);
  }, [sortedAlerts]);
  
  // Check if we have fewer than 10 alerts
  const hasFewerThanTop10 = sortedAlerts.length > 0 && sortedAlerts.length < TOP_ALERTS_COUNT;

  // Group only the visible alerts by attack type for better organization
  const groupedAlerts = useMemo(() => {
    const groups: Record<string, typeof topAlerts> = {};
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    topAlerts.forEach(alert => {
      const attackType = (alert as any).attack_type || alert.title.split(' ')[0] || 'Unknown';
      if (!groups[attackType]) {
        groups[attackType] = [];
      }
      groups[attackType].push(alert);
    });

    // Sort each group by severity
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const aSev = severityOrder[a.severity as keyof typeof severityOrder] ?? 99;
        const bSev = severityOrder[b.severity as keyof typeof severityOrder] ?? 99;
        return aSev - bSev;
      });
    });

    // Sort groups by total count and highest severity
    const sortedGroups = Object.entries(groups).sort(([aKey, aAlerts], [bKey, bAlerts]) => {
      const aMaxSev = Math.min(...aAlerts.map(a => severityOrder[a.severity as keyof typeof severityOrder] ?? 99));
      const bMaxSev = Math.min(...bAlerts.map(a => severityOrder[a.severity as keyof typeof severityOrder] ?? 99));
      if (aMaxSev !== bMaxSev) return aMaxSev - bMaxSev;
      return bAlerts.length - aAlerts.length;
    });

    return sortedGroups;
  }, [topAlerts]);

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
            {/* Removed notification (Bell) and profile (User) icons */}
          </div>
        </header>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Backend Connection Warning */}
            {backendConnected === false && (
              <Card className="bg-destructive/10 border-destructive/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-destructive">Backend Server Not Connected</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Unable to connect to backend at {getApiUrl('')}. Please ensure the backend server is running.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start the backend with: <code className="bg-background px-1 rounded">cd backend && python app.py</code>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Section: Metrics & Pipeline Visual */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Security Operations Center</h2>
                  <p className="text-muted-foreground mt-1">Real-time threat monitoring and RAG-assisted analysis.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="log-file-upload"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus.type === 'uploading'}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {uploadStatus.type === 'uploading' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logs
                      </>
                    )}
                  </Button>
                  {uploadStatus.type !== 'idle' && (
                    <Card className={`border ${uploadStatus.type === 'success' ? 'border-emerald-500/50 bg-emerald-500/10' :
                        uploadStatus.type === 'error' ? 'border-destructive/50 bg-destructive/10' :
                          'border-primary/50 bg-primary/10'
                      }`}>
                      <CardContent className="p-3 flex items-center gap-2 text-sm">
                        {uploadStatus.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {uploadStatus.type === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                        {uploadStatus.type === 'uploading' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                        <span className={uploadStatus.type === 'error' ? 'text-destructive' : uploadStatus.type === 'success' ? 'text-emerald-500' : 'text-primary'}>
                          {uploadStatus.message}
                        </span>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              <RagPipelineVisual />
              
              {/* Performance Metrics */}
              <PerformanceMetrics />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 h-full">
                  <AnomalyChart enabled={true} />
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
                          <p className="text-2xl font-mono font-bold text-primary">{(uploadedFileData?.total_events ?? uploadStatus.data?.total_events ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Uploaded File Results */}
            {(uploadedFileData || uploadStatus.data) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-display font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Uploaded File Analysis Results
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setUploadedAlerts([]);
                      setUploadedFileData(null);
                      setUploadStatus({ type: 'idle' });
                      // Also clear backend data
                      try {
                        await fetch(getApiUrl("api/clear-all-data"), {
                          method: "POST",
                          credentials: "include"
                        });
                        // Invalidate all queries to refresh data
                        queryClient.invalidateQueries({ queryKey: ["alerts"] });
                        queryClient.invalidateQueries({ queryKey: ["incidents"] });
                        queryClient.invalidateQueries({ queryKey: ["threat-intel"] });
                        queryClient.invalidateQueries({ queryKey: ["assets"] });
                        queryClient.invalidateQueries({ queryKey: ["reports"] });
                        queryClient.invalidateQueries({ queryKey: ["anomaly-chart-data"] });
                      } catch (error) {
                        console.error("Failed to clear backend data:", error);
                      }
                    }}
                    className="text-xs"
                  >
                    Clear All Data
                  </Button>
                </div>
                <Card className="bg-card/40 border-primary/20">
                  <CardContent className="p-4">
                    {(() => {
                      const displayData = uploadedFileData || uploadStatus.data;
                      return (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wider">File Name</p>
                              <p className="font-mono font-semibold mt-1 break-all">{displayData.filename}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Events</p>
                              <p className="font-mono font-semibold text-foreground mt-1">{displayData.total_events}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wider">Anomalies Detected</p>
                              <p className="font-mono font-semibold text-destructive mt-1">{displayData.anomalies_detected}</p>
                            </div>
                            {displayData.summary && (
                              <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider">Anomaly Rate</p>
                                <p className="font-mono font-semibold text-primary mt-1">{displayData.summary.anomaly_rate}</p>
                              </div>
                            )}
                          </div>
                          {displayData.summary && (
                            <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-muted-foreground">Normal Events</p>
                                <p className="font-mono font-semibold text-emerald-500">{displayData.summary.normal_events}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Anomalous Events</p>
                                <p className="font-mono font-semibold text-destructive">{displayData.summary.anomalous_events}</p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
                {uploadedAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {hasFewerUploadedThanTop10 && (
                      <div className="text-xs text-muted-foreground text-center p-2 bg-orange-500/10 border border-orange-500/20 rounded">
                        Showing {uploadedAlerts.length} alert{uploadedAlerts.length !== 1 ? 's' : ''} (less than {TOP_ALERTS_COUNT} available)
                      </div>
                    )}
                    {uploadedAlerts.length > TOP_ALERTS_COUNT && (
                      <div className="text-xs text-muted-foreground text-center p-2 bg-card/40 border border-border/50 rounded">
                        Showing top {TOP_ALERTS_COUNT} most dangerous alerts out of {uploadedAlerts.length} total
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {sortedUploadedAlerts.map((alert, index) => (
                        <AlertCard key={`upload-${alert.id}`} alert={alert} index={index} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card className="bg-card/40 border-border/50">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No anomalies detected in uploaded file</p>
                      <p className="text-xs text-muted-foreground mt-2">All events appear to be normal</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Critical Alerts Section - Grouped */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
                  Security Alerts
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-muted-foreground">
                    Showing {topAlerts.length} of {sortedAlerts.length} alert{sortedAlerts.length !== 1 ? 's' : ''} • {groupedAlerts.length} type{groupedAlerts.length !== 1 ? 's' : ''}
                    {hasFewerThanTop10 && (
                      <span className="ml-2 text-orange-500">(Less than {TOP_ALERTS_COUNT} alerts available)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (expandedGroups.size === groupedAlerts.length) {
                          setExpandedGroups(new Set());
                        } else {
                          setExpandedGroups(new Set(groupedAlerts.map(([key]) => key)));
                        }
                      }}
                      className="text-xs"
                    >
                      {expandedGroups.size === groupedAlerts.length ? 'Collapse All' : 'Expand All'}
                    </Button>
                  </div>
                </div>
              </div>

              {alertsLoading ? (
                <Card className="bg-card/40 border-border/50">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Loading alerts...</p>
                  </CardContent>
                </Card>
              ) : alerts.length === 0 ? (
                <Card className="bg-card/40 border-border/50">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No alerts detected. System is healthy.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {groupedAlerts.map(([attackType, groupAlerts]) => {
                    const isExpanded = expandedGroups.has(attackType);
                    const criticalCount = groupAlerts.filter(a => a.severity === 'critical').length;
                    const highCount = groupAlerts.filter(a => a.severity === 'high').length;
                    const maxSeverity = groupAlerts.reduce((max, a) => {
                      const sev = a.severity === 'critical' ? 0 : a.severity === 'high' ? 1 : a.severity === 'medium' ? 2 : 3;
                      return sev < max ? sev : max;
                    }, 99);
                    const getSeverityStyles = (severity: number) => {
                      if (severity === 0) return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' };
                      if (severity === 1) return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' };
                      if (severity === 2) return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' };
                      return { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-border/20' };
                    };
                    const severityStyles = getSeverityStyles(maxSeverity);

                    return (
                      <Collapsible
                        key={attackType}
                        open={isExpanded}
                        onOpenChange={(open) => {
                          const newSet = new Set(expandedGroups);
                          if (open) {
                            newSet.add(attackType);
                          } else {
                            newSet.delete(attackType);
                          }
                          setExpandedGroups(newSet);
                        }}
                      >
                        <Card className="bg-card/40 border-border/50 backdrop-blur-sm overflow-hidden">
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="pb-3 hover:bg-card/60 transition-colors cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`h-10 w-10 rounded-lg ${severityStyles.bg} flex items-center justify-center`}>
                                    <Shield className={`h-5 w-5 ${severityStyles.text}`} />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <CardTitle className="text-base font-display flex items-center gap-2">
                                      {attackType}
                                      <Badge variant="outline" className="text-xs">
                                        {groupAlerts.length} alert{groupAlerts.length !== 1 ? 's' : ''}
                                      </Badge>
                                    </CardTitle>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                      {criticalCount > 0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                                          {criticalCount} Critical
                                        </span>
                                      )}
                                      {highCount > 0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                                          {highCount} High
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Activity className="h-3 w-3" />
                                        {groupAlerts.length} Total
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                                {groupAlerts.map((alert, index) => (
                                  <AlertCard key={alert.id} alert={alert} index={index} />
                                ))}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}

                  {/* Message when fewer than 10 alerts */}
                  {hasFewerThanTop10 && (
                    <Card className="bg-card/40 border-orange-500/20 backdrop-blur-sm">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-orange-500 font-medium">
                          Note: Only {sortedAlerts.length} alert{sortedAlerts.length !== 1 ? 's' : ''} available (showing all)
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Show More Button - Only show if there are more than 10 alerts */}
                  {sortedAlerts.length > TOP_ALERTS_COUNT && (
                    <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2">
                          Showing top {TOP_ALERTS_COUNT} most dangerous alerts out of {sortedAlerts.length} total
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use filters or search to explore additional alerts
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
