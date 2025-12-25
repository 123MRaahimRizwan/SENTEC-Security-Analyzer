
import { motion } from "framer-motion";
import { Database, Search, Brain, FileText, ArrowRight, ShieldCheck, Cpu } from "lucide-react";

export function RagPipelineVisual() {
  const steps = [
    { icon: Search, label: "Anomaly Detected", sub: "Trigger" },
    { icon: Database, label: "Vector Search", sub: "Knowledge Base" },
    { icon: Brain, label: "LLM Context", sub: "Analysis" },
    { icon: ShieldCheck, label: "Mitigation Plan", sub: "Output" },
  ];

  return (
    <div className="w-full py-6 px-4 bg-card/30 border-y border-border/50 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4 md:gap-0">
        {steps.map((step, i) => (
          <div key={i} className="contents">
            {/* Step Node */}
            <div className="flex flex-col items-center gap-3 relative group">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10"
              >
                <div className="h-14 w-14 rounded-xl bg-background border border-border flex items-center justify-center shadow-lg group-hover:border-primary/50 group-hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)] transition-all duration-300">
                  <step.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </motion.div>
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-foreground">{step.label}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{step.sub}</p>
              </div>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="hidden md:flex flex-1 items-center justify-center px-4 opacity-50">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: i * 0.2 + 0.2, duration: 0.4 }}
                  className="h-[2px] bg-border w-full relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent w-1/2 animate-shimmer" />
                </motion.div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-[-8px]" />
              </div>
            )}
            
            {/* Mobile Connector (Vertical) */}
            {i < steps.length - 1 && (
              <div className="md:hidden h-8 w-[2px] bg-border my-2 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary to-transparent h-1/2 animate-shimmer-vertical" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
