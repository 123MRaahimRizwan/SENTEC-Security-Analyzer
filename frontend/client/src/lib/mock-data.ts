
import { AlertTriangle, ShieldAlert, ShieldCheck, Activity, Database, FileText, Lock, Globe } from "lucide-react";

export interface Anomaly {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  baseline: number;
  deviation: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RagContext {
  citation: string;
  confidence: number;
  summary: string;
  sourceType: 'internal_kb' | 'cve_db' | 'threat_feed';
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  anomalies: Anomaly[];
  ragContext: RagContext;
  mitigationPlan: string[];
  status: 'new' | 'investigating' | 'resolved';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  timeline: { time: string; action: string; actor: string }[];
  assignedTo: string;
  affectedAssets: number;
}

export interface ThreatIntel {
  id: string;
  type: 'cve' | 'ioc' | 'threat_feed' | 'tactic';
  title: string;
  description: string;
  severity: string;
  sources: number;
  lastUpdated: string;
  score: number;
}

export interface Asset {
  id: string;
  name: string;
  type: 'server' | 'database' | 'application' | 'network';
  status: 'healthy' | 'warning' | 'critical';
  vulnerabilities: number;
  lastScanned: string;
  criticalVulns: number;
  highVulns: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'security' | 'compliance' | 'threat' | 'trend';
  generatedAt: string;
  period: string;
  findings: number;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

export const MOCK_ALERTS: Alert[] = [
  {
    id: "ALT-2024-001",
    title: "Unusual Outbound Traffic to Known Malicious IP",
    description: "Detected a spike in outbound traffic (4.2GB) to IP 192.168.x.x originating from Database Server DB-04.",
    timestamp: "2024-12-24T08:42:00Z",
    severity: "critical",
    source: "Network Flow Logs",
    anomalies: [
      {
        id: "ANM-8821",
        timestamp: "2024-12-24T08:40:00Z",
        metric: "Outbound Bytes",
        value: 4500000000,
        baseline: 200000000,
        deviation: 2150,
        severity: "critical"
      }
    ],
    ragContext: {
      citation: "INT-KB-772: Data Exfiltration Patterns (Page 4, Para 2)",
      confidence: 0.94,
      summary: "Pattern matches known 'Slow-drip' exfiltration techniques observed in APT29 campaigns, but accelerated. High correlation with recent CVE-2024-XXXX exploitation reports.",
      sourceType: "internal_kb"
    },
    mitigationPlan: [
      "Isolate Database Server DB-04 from the network immediately via VLAN ACLs.",
      "Initiate forensic snapshot of DB-04 memory and disk.",
      "Block destination IP 192.168.x.x at the perimeter firewall.",
      "Reset credentials for all service accounts associated with DB-04."
    ],
    status: "new"
  },
  {
    id: "ALT-2024-002",
    title: "Privilege Escalation Attempt on Domain Controller",
    description: "Multiple failed authentication attempts followed by a successful login with 'Admin' privileges from a non-standard workstation.",
    timestamp: "2024-12-24T09:15:00Z",
    severity: "high",
    source: "Active Directory Logs",
    anomalies: [
      {
        id: "ANM-8822",
        timestamp: "2024-12-24T09:14:00Z",
        metric: "Auth Failures",
        value: 45,
        baseline: 2,
        deviation: 2150,
        severity: "high"
      }
    ],
    ragContext: {
      citation: "MITRE ATT&CK T1078.002: Valid Accounts: Domain Accounts",
      confidence: 0.89,
      summary: "Behavior indicates potential Pass-the-Hash attack or Brute Force leading to credential compromise.",
      sourceType: "threat_feed"
    },
    mitigationPlan: [
      "Lock the compromised user account 'svc_backup_admin'.",
      "Revoke current Kerberos Ticket Granting Tickets (TGT).",
      "Force password rotation for all Domain Admin accounts.",
      "Review logon sessions on workstation WS-HR-02."
    ],
    status: "investigating"
  },
  {
    id: "ALT-2024-003",
    title: "Unexpected Configuration Change in Production S3 Bucket",
    description: "Public access block removed from 'prod-fin-data' bucket via API call.",
    timestamp: "2024-12-24T10:00:00Z",
    severity: "critical",
    source: "CloudTrail",
    anomalies: [
      {
        id: "ANM-8823",
        timestamp: "2024-12-24T10:00:00Z",
        metric: "API Write Actions",
        value: 1,
        baseline: 0,
        deviation: 100,
        severity: "critical"
      }
    ],
    ragContext: {
      citation: "Corp Policy CP-Cloud-04: S3 Security Baselines",
      confidence: 0.98,
      summary: "Direct violation of 'No Public Access' policy for financial data containers. Previous incident INC-2023-094 involved similar misconfiguration.",
      sourceType: "internal_kb"
    },
    mitigationPlan: [
      "Re-apply 'Block Public Access' setting on bucket 'prod-fin-data' immediately.",
      "Identify IAM user 'dev_ops_jdoe' and temporarily suspend access keys.",
      "Scan bucket for any access during the exposure window.",
      "Notify Compliance Officer regarding potential data exposure."
    ],
    status: "new"
  }
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-2024-042",
    title: "APT29 Lateral Movement - Data Exfiltration Detected",
    description: "High-confidence APT29 campaign with sustained lateral movement and data exfiltration via encrypted channels.",
    createdAt: "2024-12-24T08:40:00Z",
    severity: "critical",
    status: "in_progress",
    affectedAssets: 8,
    assignedTo: "Alice Chen",
    timeline: [
      { time: "08:40", action: "Initial detection of anomalous outbound traffic", actor: "Sentinel AI" },
      { time: "08:42", action: "Security team notified, incident escalated", actor: "System" },
      { time: "09:00", action: "Forensic analysis initiated on DB-04", actor: "Alice Chen" },
      { time: "09:15", action: "Secondary spike detected on 3 additional servers", actor: "Sentinel AI" },
      { time: "09:30", action: "Isolated affected segment from network", actor: "Alice Chen" }
    ]
  },
  {
    id: "INC-2024-041",
    title: "Ransomware Deployment Prevention - Group Policy Modification",
    description: "Detected attempts to modify Group Policy for privilege escalation, blocked by EDR.",
    createdAt: "2024-12-23T14:20:00Z",
    severity: "high",
    status: "resolved",
    affectedAssets: 12,
    assignedTo: "Bob Rodriguez",
    timeline: [
      { time: "14:20", action: "GP modification attempt detected", actor: "Sentinel AI" },
      { time: "14:22", action: "EDR blocked execution", actor: "Endpoint Security" },
      { time: "14:30", action: "User workstation isolated", actor: "Bob Rodriguez" },
      { time: "15:00", action: "User account reviewed and reset", actor: "Bob Rodriguez" },
      { time: "16:15", action: "Incident closed - no data compromise", actor: "Bob Rodriguez" }
    ]
  },
  {
    id: "INC-2024-040",
    title: "Supply Chain Compromise - Trojanized Package Detection",
    description: "Identified trojanized npm package in development environment with command execution capabilities.",
    createdAt: "2024-12-22T10:15:00Z",
    severity: "high",
    status: "resolved",
    affectedAssets: 5,
    assignedTo: "Carol West",
    timeline: [
      { time: "10:15", action: "Malicious package detected in dependency scan", actor: "Sentinel AI" },
      { time: "10:20", action: "Dev environment quarantined", actor: "Carol West" },
      { time: "11:00", action: "Source code review for impacts", actor: "Carol West" },
      { time: "13:45", action: "Package removed, dependencies updated", actor: "Carol West" },
      { time: "14:30", action: "Deployment pipeline re-enabled", actor: "Carol West" }
    ]
  },
  {
    id: "INC-2024-039",
    title: "Credential Harvesting - Phishing Campaign Detected",
    description: "Macro-enabled Office document targeting finance team with credential stealer.",
    createdAt: "2024-12-21T09:30:00Z",
    severity: "high",
    status: "closed",
    affectedAssets: 23,
    assignedTo: "David Kim",
    timeline: [
      { time: "09:30", action: "Phishing email detected by mail gateway", actor: "Email Security" },
      { time: "09:32", action: "Message quarantined across organization", actor: "System" },
      { time: "10:00", action: "User awareness message sent", actor: "David Kim" },
      { time: "11:15", action: "Hunt for similar messages in inbox", actor: "David Kim" },
      { time: "13:00", action: "Incident closed - no credentials harvested", actor: "David Kim" }
    ]
  }
];

export const MOCK_THREAT_INTEL: ThreatIntel[] = [
  {
    id: "CVE-2024-12345",
    type: "cve",
    title: "CVE-2024-12345: Critical RCE in Apache OpenOffice",
    description: "Unauthenticated remote code execution via malformed ODF documents. Active exploitation observed in the wild.",
    severity: "critical",
    sources: 12,
    lastUpdated: "2024-12-24T08:00:00Z",
    score: 9.8
  },
  {
    id: "IOC-IP-192168",
    type: "ioc",
    title: "C2 Infrastructure - APT29 Botnet Nodes",
    description: "High-confidence command and control server IPs linked to APT29 campaigns targeting financial sector.",
    severity: "high",
    sources: 8,
    lastUpdated: "2024-12-24T06:30:00Z",
    score: 0.95
  },
  {
    id: "FEED-Emotet",
    type: "threat_feed",
    title: "Emotet Malware Botnet - Operational Update",
    description: "Emotet botnet resurged with new distribution methods. 2.4M infected hosts identified globally.",
    severity: "critical",
    sources: 24,
    lastUpdated: "2024-12-24T09:15:00Z",
    score: 0.92
  },
  {
    id: "TACTIC-T1098",
    type: "tactic",
    title: "MITRE ATT&CK T1098: Account Manipulation",
    description: "Adversaries may manipulate accounts to maintain access. Observed in 67% of recent breach investigations.",
    severity: "high",
    sources: 156,
    lastUpdated: "2024-12-24T05:00:00Z",
    score: 0.89
  },
  {
    id: "CVE-2024-11111",
    type: "cve",
    title: "CVE-2024-11111: Windows Privilege Escalation",
    description: "Local privilege escalation in Windows kernel component. Patch available.",
    severity: "high",
    sources: 9,
    lastUpdated: "2024-12-23T14:00:00Z",
    score: 8.1
  },
  {
    id: "FEED-TA505",
    type: "threat_feed",
    title: "TA505 Campaign - Clop Ransomware Distribution",
    description: "TA505 distribution network updated with Clop ransomware payloads. Targeting managed service providers.",
    severity: "critical",
    sources: 18,
    lastUpdated: "2024-12-24T07:45:00Z",
    score: 0.91
  }
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: "AST-001",
    name: "prod-web-01",
    type: "server",
    status: "healthy",
    vulnerabilities: 2,
    lastScanned: "2024-12-24T02:15:00Z",
    criticalVulns: 0,
    highVulns: 0
  },
  {
    id: "AST-002",
    name: "prod-db-04",
    type: "database",
    status: "critical",
    vulnerabilities: 8,
    lastScanned: "2024-12-24T08:40:00Z",
    criticalVulns: 2,
    highVulns: 3
  },
  {
    id: "AST-003",
    name: "api-gateway",
    type: "application",
    status: "warning",
    vulnerabilities: 5,
    lastScanned: "2024-12-23T22:30:00Z",
    criticalVulns: 0,
    highVulns: 2
  },
  {
    id: "AST-004",
    name: "vpn-endpoint",
    type: "network",
    status: "healthy",
    vulnerabilities: 1,
    lastScanned: "2024-12-24T01:45:00Z",
    criticalVulns: 0,
    highVulns: 0
  },
  {
    id: "AST-005",
    name: "mail-server",
    type: "server",
    status: "warning",
    vulnerabilities: 4,
    lastScanned: "2024-12-23T20:00:00Z",
    criticalVulns: 0,
    highVulns: 1
  },
  {
    id: "AST-006",
    name: "auth-sso",
    type: "application",
    status: "healthy",
    vulnerabilities: 1,
    lastScanned: "2024-12-24T03:00:00Z",
    criticalVulns: 0,
    highVulns: 0
  },
  {
    id: "AST-007",
    name: "storage-01",
    type: "server",
    status: "critical",
    vulnerabilities: 6,
    lastScanned: "2024-12-24T08:00:00Z",
    criticalVulns: 1,
    highVulns: 2
  },
  {
    id: "AST-008",
    name: "backup-vault",
    type: "database",
    status: "healthy",
    vulnerabilities: 0,
    lastScanned: "2024-12-24T04:30:00Z",
    criticalVulns: 0,
    highVulns: 0
  }
];

export const MOCK_REPORTS: Report[] = [
  {
    id: "RPT-2024-034",
    title: "Weekly Security Assessment - Week 52",
    type: "security",
    generatedAt: "2024-12-23T18:00:00Z",
    period: "Dec 16 - Dec 23, 2024",
    findings: 12,
    score: 84,
    trend: "down"
  },
  {
    id: "RPT-2024-035",
    title: "Compliance Report - SOC 2 Type II",
    type: "compliance",
    generatedAt: "2024-12-20T10:00:00Z",
    period: "Q4 2024",
    findings: 3,
    score: 92,
    trend: "stable"
  },
  {
    id: "RPT-2024-036",
    title: "Threat Intelligence Summary - December",
    type: "threat",
    generatedAt: "2024-12-24T08:00:00Z",
    period: "December 2024",
    findings: 18,
    score: 78,
    trend: "up"
  },
  {
    id: "RPT-2024-037",
    title: "Vulnerability Trend Analysis - YTD",
    type: "trend",
    generatedAt: "2024-12-21T15:30:00Z",
    period: "Jan - Dec 2024",
    findings: 156,
    score: 71,
    trend: "down"
  },
  {
    id: "RPT-2024-038",
    title: "Incident Response Metrics - Monthly",
    type: "security",
    generatedAt: "2024-12-01T09:00:00Z",
    period: "November 2024",
    findings: 8,
    score: 88,
    trend: "up"
  }
];

export const MOCK_ANOMALY_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  baseline: 20 + Math.random() * 10,
  value: 20 + Math.random() * 15 + (i === 14 ? 60 : 0) + (i === 15 ? 40 : 0),
}));
