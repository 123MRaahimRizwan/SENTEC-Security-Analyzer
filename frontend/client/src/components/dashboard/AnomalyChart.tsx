
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
// import { MOCK_ANOMALY_DATA } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";

interface AnomalyChartProps {
  enabled?: boolean;
}

export function AnomalyChart({ enabled = true }: AnomalyChartProps = {}) {
  const { data: chartResponse, isLoading } = useQuery({
    queryKey: ["anomaly-chart-data"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("api/anomaly-chart-data"), { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch chart data");
      }
      return res.json();
    },
    enabled: enabled, // Only fetch if enabled
    refetchInterval: enabled ? 60000 : false, // Refetch every 60s instead of 30s
    staleTime: 50000, // Consider data fresh for 50s
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Handle both new format (with data, attack_lines, time_range) and legacy format (array)
  const chartData = chartResponse?.data || (Array.isArray(chartResponse) ? chartResponse : []);
  const attackLines = chartResponse?.attack_lines || [];
  const timeRange = chartResponse?.time_range || { min: null, max: null };
  
  // Determine time range description
  let timeDescription = "Real-time deviation analysis";
  if (timeRange.min && timeRange.max) {
    try {
      const minDate = new Date(timeRange.min);
      const maxDate = new Date(timeRange.max);
      const diffHours = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        timeDescription = `Analysis over ${Math.round(diffHours)} hours`;
      } else {
        const diffDays = Math.round(diffHours / 24);
        timeDescription = `Analysis over ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      }
    } catch {
      timeDescription = "Real-time deviation analysis";
    }
  }

  return (
    <Card className="h-full border-border bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-lg">Network Traffic Anomaly Detection</CardTitle>
            <CardDescription>{timeDescription}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
            {isLoading ? "Loading..." : "Live Monitoring"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
                formatter={(value: any, name: string) => {
                  if (name === 'Anomalies') return [`${value} attacks`, 'Anomalies'];
                  return [value, name];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="baseline" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBaseline)" 
                name="Baseline Pattern"
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                name="Anomaly Score"
              />
              {/* Horizontal lines for each attack time bucket */}
              {Array.from(new Set(attackLines.map((a: any) => a.time))).map((time: string, index: number) => {
                const attacksAtTime = attackLines.filter((a: any) => a.time === time);
                const maxScore = Math.max(...attacksAtTime.map((a: any) => a.score || 0));
                return (
                  <ReferenceLine 
                    key={`attack-line-${time}-${index}`}
                    x={time} 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ 
                      position: 'top', 
                      value: `${attacksAtTime.length} attack${attacksAtTime.length > 1 ? 's' : ''}`, 
                      fill: 'hsl(var(--destructive))', 
                      fontSize: 9,
                      offset: 5
                    }} 
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No anomaly data available</p>
                <p className="text-xs mt-1">Upload log files to see anomaly detection results</p>
              </div>
            </div>
          )}
        </div>
        {chartData && chartData.length > 0 && (
          <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground bg-muted/20 p-2 rounded">
            <Info className="h-4 w-4 shrink-0 text-primary" />
            <p>
              Real-time anomaly detection from uploaded log files. RAG pipeline automatically queries relevant security policies.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
