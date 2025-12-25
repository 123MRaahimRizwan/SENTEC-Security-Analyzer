
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { MOCK_ANOMALY_DATA } from "@/lib/mock-data";

export function AnomalyChart() {
  return (
    <Card className="h-full border-border bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-lg">Network Traffic Anomaly Detection</CardTitle>
            <CardDescription>Real-time deviation analysis (Last 24h)</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
            Live Monitoring
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_ANOMALY_DATA}>
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
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}MB`}
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
                name="Actual Traffic"
              />
              {/* Anomaly Threshold Lines */}
              <ReferenceLine x="14:00" stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'top', value: 'Anomaly Detected', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground bg-muted/20 p-2 rounded">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <p>
            Spike at 14:00 exceeds the dynamic baseline by {'>'}300%, triggering <span className="text-destructive font-mono font-bold">ALT-2024-001</span>. RAG pipeline automatically queried relevant CVEs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
