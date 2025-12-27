
import { Alert, Anomaly } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, BookOpen, CheckCircle, ChevronRight, ExternalLink, Shield, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface AlertCardProps {
  alert: Alert;
  index: number;
}

export function AlertCard({ alert, index }: AlertCardProps) {
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
              onClick={async () => {
                const payload = {
                  defect: alert.title,
                  event_id: alert.id,
                  source_ip: (alert as any).source ?? "0.0.0.0",
                  endpoint: "/",
                  query_params: {},
                  anomaly_score: alert.anomalies?.[0]?.deviation ?? 0,
                };
                try {
                  const res = await apiRequest("POST", "http://127.0.0.1:5000/api/analyze-alert", payload);
                  const json = await res.json();
                  alert("Analysis result:\n" + JSON.stringify(json, null, 2));
                } catch (e: any) {
                  alert("Analysis failed: " + e.message);
                }
              }}
            >
              Analyze with RAG
            </Button>

            <Button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/50" variant="outline">
              Initiate Response Playbook
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
