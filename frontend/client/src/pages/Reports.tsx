
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MOCK_REPORTS } from "@/lib/mock-data";
import { Search, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { motion } from "framer-motion";
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
                  <div className="text-2xl font-bold font-mono">5</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Recent Reports</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono text-primary">86</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Avg Security Score</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-mono">47</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Findings</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {MOCK_REPORTS.map((report, idx) => (
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
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 mt-2">
                            View Report →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
