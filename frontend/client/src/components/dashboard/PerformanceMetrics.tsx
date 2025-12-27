import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { Loader2, TrendingUp, AlertCircle, Shield, Clock, Star, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MetricsData {
  critical_alerts_accuracy: {
    total_alerts: number;
    critical_alerts: number;
    alerts_with_ground_truth?: number;
    exact_severity_accuracy?: number;
    close_severity_accuracy?: number;
    critical_alerts_accuracy?: number;
    critical_alerts_count?: number;
    critical_alerts_correctly_identified?: number;
    message?: string;
  };
  mitigation_relevance: {
    total_mitigations: number;
    avg_relevance_score?: number;
    avg_user_rating?: number;
    user_ratings_count?: number;
    avg_citation_score?: number;
    relevance_grade?: string;
    message?: string;
  };
  response_time_reduction: {
    total_analyses: number;
    avg_response_time_ms?: number;
    avg_response_time_seconds?: number;
    time_reduction_percent?: number;
    speedup_factor?: number;
    baseline_time_seconds?: number;
    message?: string;
  };
}

export function PerformanceMetrics() {
  const { data: metricsData, isLoading, error } = useQuery<MetricsData>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("api/metrics"), { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch metrics: ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-card/40 border-border/50">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !metricsData) {
    return (
      <Card className="bg-card/40 border-border/50">
        <CardContent className="p-8 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Unable to load performance metrics</p>
        </CardContent>
      </Card>
    );
  }

  const { critical_alerts_accuracy, mitigation_relevance, response_time_reduction } = metricsData;

  // Check if metrics have valid data (not N/A)
  const hasCriticalAlertsAccuracy = critical_alerts_accuracy.critical_alerts_accuracy !== null && critical_alerts_accuracy.critical_alerts_accuracy !== undefined;
  const hasMitigationRelevance = mitigation_relevance.avg_relevance_score !== null && mitigation_relevance.avg_relevance_score !== undefined;
  const hasResponseTimeReduction = response_time_reduction.time_reduction_percent !== null && response_time_reduction.time_reduction_percent !== undefined;

  // Count how many metrics have valid data
  const validMetricsCount = [hasCriticalAlertsAccuracy, hasMitigationRelevance, hasResponseTimeReduction].filter(Boolean).length;

  // Don't render anything if no metrics have valid data
  if (validMetricsCount === 0) {
    return null;
  }

  // Determine grid columns based on number of valid metrics
  const gridCols = validMetricsCount === 1 ? "grid-cols-1" : validMetricsCount === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-semibold flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          Performance Metrics
        </h3>
      </div>

      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {/* Critical Alerts Accuracy */}
        {hasCriticalAlertsAccuracy && (
          <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive" />
                Critical Alerts Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-mono font-bold text-foreground">
                    {critical_alerts_accuracy.critical_alerts_accuracy!.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Critical Alerts Identified</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Alerts:</span>
                    <span className="font-mono font-semibold">{critical_alerts_accuracy.total_alerts}</span>
                  </div>
                  {critical_alerts_accuracy.critical_alerts_count !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Critical Alerts:</span>
                      <span className="font-mono font-semibold text-destructive">
                        {critical_alerts_accuracy.critical_alerts_correctly_identified ?? 0} / {critical_alerts_accuracy.critical_alerts_count}
                      </span>
                    </div>
                  )}
                  {critical_alerts_accuracy.exact_severity_accuracy !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Exact Match:</span>
                      <span className="font-mono font-semibold">
                        {critical_alerts_accuracy.exact_severity_accuracy.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mitigation Relevance */}
        {hasMitigationRelevance && (
          <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Mitigation Relevance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-mono font-bold text-foreground">
                      {mitigation_relevance.avg_relevance_score!.toFixed(1)}%
                    </div>
                    {mitigation_relevance.relevance_grade && (
                      <Badge variant="outline" className="text-lg px-2 py-1">
                        {mitigation_relevance.relevance_grade}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Average Relevance Score</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Mitigations:</span>
                    <span className="font-mono font-semibold">{mitigation_relevance.total_mitigations}</span>
                  </div>
                  {mitigation_relevance.avg_user_rating && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Avg User Rating:</span>
                      <span className="font-mono font-semibold flex items-center gap-1">
                        {mitigation_relevance.avg_user_rating.toFixed(1)} / 5
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      </span>
                    </div>
                  )}
                  {mitigation_relevance.avg_citation_score !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Citation Score:</span>
                      <span className="font-mono font-semibold">
                        {mitigation_relevance.avg_citation_score.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Time Reduction */}
        {hasResponseTimeReduction && (
          <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <div className="text-3xl font-mono font-bold text-emerald-500">
                      {response_time_reduction.time_reduction_percent!.toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Time Reduction</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg Response:</span>
                    <span className="font-mono font-semibold">
                      {response_time_reduction.avg_response_time_seconds?.toFixed(2) ?? "N/A"}s
                    </span>
                  </div>
                  {response_time_reduction.speedup_factor && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Speedup:</span>
                      <span className="font-mono font-semibold text-emerald-500">
                        {response_time_reduction.speedup_factor.toFixed(1)}x
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Analyses:</span>
                    <span className="font-mono font-semibold">{response_time_reduction.total_analyses}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

