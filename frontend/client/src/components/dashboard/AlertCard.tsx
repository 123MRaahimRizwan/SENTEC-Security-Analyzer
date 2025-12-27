
import { Alert, Anomaly } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, BookOpen, CheckCircle, ChevronRight, ExternalLink, Shield, ShieldCheck, Zap, Brain, Loader2, Star } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface AlertCardProps {
  alert: Alert;
  index: number;
}

export function AlertCard({ alert, index }: AlertCardProps) {
  const [llmResponse, setLlmResponse] = useState<any>(null);
  const [loadingLlm, setLoadingLlm] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const queryClient = useQueryClient();

  const fetchLlmResponse = async () => {
    setLoadingLlm(true);
    try {
      const payload = {
        defect: (alert as any).defect ?? 0,
        event_id: alert.id,
        source_ip: (alert as any).source ?? "0.0.0.0",
        endpoint: (alert as any).endpoint ?? "/",
        query_params: (alert as any).query_params ?? "",
        anomaly_score: (alert as any).anomaly_score ?? alert.anomalies?.[0]?.deviation ?? 0,
      };
      
      const res = await apiRequest("POST", getApiUrl("api/analyze-alert"), payload);
      const json = await res.json();
      
      if (json.error) {
        setLlmResponse({ error: json.error, details: json.details });
      } else {
        setLlmResponse(json);
      }
      setDialogOpen(true);
    } catch (e: any) {
      setLlmResponse({ error: "Failed to fetch LLM response", details: e.message });
      setDialogOpen(true);
    } finally {
      setLoadingLlm(false);
    }
  };

  const submitMitigationFeedback = async (rating: number) => {
    if (submittingRating || !llmResponse) return;
    
    setSubmittingRating(true);
    setUserRating(rating);
    
    try {
      await apiRequest("POST", getApiUrl("api/metrics/mitigation-feedback"), {
        alert_id: alert.id,
        rating: rating
      });
      
      // Invalidate metrics to refresh
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    } catch (e) {
      console.error("Failed to submit feedback:", e);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="border-l-4 border-l-destructive bg-card/50 backdrop-blur-sm overflow-hidden group hover:bg-card/80 transition-all duration-300 shadow-lg hover:shadow-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/10 uppercase tracking-widest text-[10px] font-mono">
                  {alert.severity}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">{alert.timestamp}</span>
                <span className="text-xs font-mono text-muted-foreground">ID: {alert.id}</span>
              </div>
              <CardTitle className="text-xl font-display text-foreground group-hover:text-primary transition-colors">
                {alert.title}
              </CardTitle>
            </div>
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <CardDescription className="text-muted-foreground/80 mt-2">
            {alert.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Anomaly Highlight */}
          <div className="bg-background/50 rounded-md p-3 border border-border/50 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-3 w-3" />
              <span className="text-xs uppercase font-semibold tracking-wider">Detected Anomaly</span>
            </div>
            <div className="flex justify-between items-center font-mono text-xs">
              <span>{alert.anomalies[0].metric}: <span className="text-foreground">{alert.anomalies[0].value.toLocaleString()}</span></span>
              <span className="text-destructive">+{alert.anomalies[0].deviation}% Deviation</span>
            </div>
          </div>

          {/* RAG Context Section */}
          <div className="relative pl-4 border-l-2 border-primary/30 space-y-3">
            <div className="absolute -left-[5px] -top-1 h-2 w-2 rounded-full bg-primary animate-ping opacity-75"></div>
            <div className="absolute -left-[5px] -top-1 h-2 w-2 rounded-full bg-primary"></div>
            
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">RAG Intelligence Enrichment</span>
            </div>

            <div className="bg-primary/5 rounded border border-primary/10 p-3">
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                "{alert.ragContext.summary}"
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-primary/70">
                <BookOpen className="h-3 w-3" />
                <span className="font-mono">Source: {alert.ragContext.citation}</span>
                <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">
                  {(alert.ragContext.confidence * 100).toFixed(0)}% Confidence
                </Badge>
              </div>
            </div>
          </div>

          {/* Mitigation Plan */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Recommended Mitigation
            </h4>
            <ul className="space-y-2">
              {alert.mitigationPlan.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-4 bg-muted/20 border-t border-border/50">
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/50"
              variant="outline"
              onClick={fetchLlmResponse}
              disabled={loadingLlm}
            >
              {loadingLlm ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze with RAG
                </>
              )}
            </Button>

            <Button 
              className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-50"
              variant="outline"
              disabled={!llmResponse}
              onClick={() => {
                if (llmResponse) {
                  setDialogOpen(true);
                }
              }}
            >
              <Brain className="mr-2 h-4 w-4" />
              View LLM Response
            </Button>

            <Button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/50" variant="outline">
              Initiate Response Playbook
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>

        {/* Dialog must be outside CardFooter for proper rendering */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                LLM Security Analysis Response
              </DialogTitle>
              <DialogDescription>
                Detailed threat analysis and mitigation recommendations from RAG-enhanced LLM
              </DialogDescription>
            </DialogHeader>
            
            {loadingLlm ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Analyzing threat with LLM...</span>
              </div>
            ) : llmResponse?.error ? (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h3 className="font-semibold text-destructive mb-2">Error</h3>
                  <p className="text-sm text-destructive/80">{llmResponse.error}</p>
                  {llmResponse.details && (
                    <p className="text-xs text-muted-foreground mt-2">{llmResponse.details}</p>
                  )}
                </div>
              </div>
            ) : llmResponse ? (
              <div className="space-y-6">
                {/* Alert Type & Severity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Alert Type</p>
                    <p className="font-semibold text-foreground">{llmResponse.alert_type || "Unknown"}</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Severity</p>
                    <Badge 
                      variant="outline" 
                      className={`${
                        llmResponse.severity?.toLowerCase() === 'critical' ? 'border-destructive text-destructive' :
                        llmResponse.severity?.toLowerCase() === 'high' ? 'border-orange-500 text-orange-500' :
                        'border-yellow-500 text-yellow-500'
                      }`}
                    >
                      {llmResponse.severity || "Unknown"}
                    </Badge>
                  </div>
                </div>

                {/* Classification */}
                {llmResponse.classification && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Classification</p>
                    <Badge variant={llmResponse.classification === "True Positive" ? "destructive" : "secondary"}>
                      {llmResponse.classification}
                    </Badge>
                  </div>
                )}

                {/* Analysis */}
                {llmResponse.analysis && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">Security Analysis</h3>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {llmResponse.analysis}
                    </p>
                  </div>
                )}

                {/* MITRE Technique */}
                {llmResponse.mitre_technique && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">MITRE ATT&CK Technique</p>
                    <p className="font-mono text-sm text-foreground">{llmResponse.mitre_technique}</p>
                  </div>
                )}

                {/* CVEs */}
                {llmResponse.cves && llmResponse.cves.length > 0 && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Related CVEs</p>
                    <div className="flex flex-wrap gap-2">
                      {llmResponse.cves.map((cve: string, i: number) => (
                        <Badge key={i} variant="outline" className="font-mono">
                          {cve}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* CWE */}
                {llmResponse.cwe && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">CWE</p>
                    <p className="font-mono text-sm text-foreground">{llmResponse.cwe}</p>
                  </div>
                )}

                {/* Mitigations */}
                {llmResponse.mitigations && llmResponse.mitigations.length > 0 && (
                  <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <h3 className="font-semibold text-foreground">Recommended Mitigations</h3>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-4">
                      {llmResponse.mitigations.map((mitigation: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{mitigation}</span>
                        </li>
                      ))}
                    </ul>
                    {/* User Feedback Rating */}
                    <div className="pt-3 border-t border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Rate this analysis:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => submitMitigationFeedback(star)}
                            disabled={submittingRating}
                            className={`transition-all ${
                              userRating && star <= userRating
                                ? 'text-yellow-500'
                                : 'text-muted-foreground/30 hover:text-yellow-500/50'
                            } ${submittingRating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                            title={`Rate ${star} out of 5`}
                          >
                            <Star 
                              className={`h-5 w-5 ${
                                userRating && star <= userRating ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        ))}
                        {userRating && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Rated {userRating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Citations */}
                {llmResponse.citations && Array.isArray(llmResponse.citations) && llmResponse.citations.length > 0 && (
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">Citations</h3>
                    </div>
                    <ul className="space-y-2">
                      {llmResponse.citations.map((citation: any, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="font-mono">•</span>
                          <span>
                            {typeof citation === 'string' 
                              ? citation 
                              : `${citation.source || 'Unknown'}${citation.chunk_id !== undefined ? ` (Chunk ${citation.chunk_id})` : ''}${citation.score !== undefined ? ` - Score: ${citation.score.toFixed(2)}` : ''}`
                            }
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Analyze with RAG" to get LLM analysis</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    </motion.div>
  );
}
