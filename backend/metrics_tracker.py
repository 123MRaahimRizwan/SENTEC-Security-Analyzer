"""
Performance Metrics Tracker
Tracks Critical Alerts Accuracy, Mitigation Relevance, and Response Time Reduction
"""
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict
import json

class MetricsTracker:
    """Tracks performance metrics for the security threat prioritizer"""
    
    def __init__(self):
        # Critical Alerts Accuracy
        self.alert_accuracy_data: List[Dict[str, Any]] = []
        
        # Mitigation Relevance (user feedback + LLM-based scoring)
        self.mitigation_feedback: List[Dict[str, Any]] = []
        self.mitigation_scores: List[float] = []
        
        # Response Time Reduction
        self.analysis_times: List[Dict[str, Any]] = []
        
        # Severity mapping for accuracy calculation
        self.severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    
    def track_alert_analysis(self, 
                            alert_id: str, 
                            predicted_severity: str,
                            actual_severity: Optional[str] = None,
                            alert_type: Optional[str] = None,
                            event_id: Optional[str] = None) -> None:
        """
        Track alert analysis for accuracy calculation
        
        Args:
            alert_id: Unique identifier for the alert
            predicted_severity: Severity predicted by LLM (critical/high/medium/low)
            actual_severity: Actual severity from ground truth (if available)
            alert_type: Type of attack detected
            event_id: Event ID for matching with ground truth
        """
        record = {
            "alert_id": alert_id,
            "predicted_severity": predicted_severity.lower(),
            "actual_severity": actual_severity.lower() if actual_severity else None,
            "alert_type": alert_type,
            "event_id": event_id,
            "timestamp": datetime.now().isoformat(),
            "is_critical": predicted_severity.lower() == "critical"
        }
        
        # Calculate accuracy if we have ground truth
        if actual_severity:
            predicted_rank = self.severity_order.get(predicted_severity.lower(), 99)
            actual_rank = self.severity_order.get(actual_severity.lower(), 99)
            
            # Exact match
            record["severity_match"] = predicted_severity.lower() == actual_severity.lower()
            
            # Within one level (critical-high, high-medium, medium-low)
            record["severity_close"] = abs(predicted_rank - actual_rank) <= 1
            
            # Critical alerts accuracy: did we correctly identify critical threats?
            record["critical_accurate"] = (
                actual_severity.lower() == "critical" and 
                predicted_severity.lower() in ["critical", "high"]
            )
        else:
            record["severity_match"] = None
            record["severity_close"] = None
            record["critical_accurate"] = None
        
        self.alert_accuracy_data.append(record)
    
    def track_mitigation_relevance(self,
                                  alert_id: str,
                                  mitigations: List[str],
                                  citations: List[Dict[str, Any]],
                                  llm_confidence: Optional[float] = None,
                                  user_rating: Optional[int] = None) -> None:
        """
        Track mitigation relevance based on citations and user feedback
        
        Args:
            alert_id: Alert identifier
            mitigations: List of mitigation recommendations
            citations: List of citation objects with scores
            llm_confidence: Confidence score from LLM (if available)
            user_rating: User rating (1-5 stars, optional)
        """
        # Calculate citation-based relevance score (0-1)
        citation_scores = [c.get("score", 0) for c in citations if isinstance(c, dict)]
        avg_citation_score = sum(citation_scores) / len(citation_scores) if citation_scores else 0
        
        # Combine with LLM confidence if available
        if llm_confidence is not None:
            relevance_score = (avg_citation_score * 0.6) + (llm_confidence * 0.4)
        else:
            relevance_score = avg_citation_score
        
        # Normalize user rating to 0-1 scale
        user_score = (user_rating - 1) / 4 if user_rating and 1 <= user_rating <= 5 else None
        
        record = {
            "alert_id": alert_id,
            "timestamp": datetime.now().isoformat(),
            "mitigation_count": len(mitigations),
            "citation_avg_score": avg_citation_score,
            "llm_confidence": llm_confidence,
            "relevance_score": relevance_score,
            "user_rating": user_rating,
            "user_score": user_score
        }
        
        self.mitigation_feedback.append(record)
        self.mitigation_scores.append(relevance_score)
    
    def track_analysis_time(self,
                           alert_id: str,
                           start_time: float,
                           end_time: float,
                           analysis_type: str = "rag_llm") -> None:
        """
        Track time taken for alert analysis
        
        Args:
            alert_id: Alert identifier
            start_time: Start timestamp (from time.time())
            end_time: End timestamp (from time.time())
            analysis_type: Type of analysis (rag_llm, anomaly_detection, etc.)
        """
        duration_ms = (end_time - start_time) * 1000  # Convert to milliseconds
        
        record = {
            "alert_id": alert_id,
            "analysis_type": analysis_type,
            "duration_ms": duration_ms,
            "duration_seconds": duration_ms / 1000,
            "timestamp": datetime.now().isoformat()
        }
        
        self.analysis_times.append(record)
    
    def get_critical_alerts_accuracy(self) -> Dict[str, Any]:
        """
        Calculate critical alerts accuracy metrics
        
        Returns:
            Dictionary with accuracy statistics
        """
        if not self.alert_accuracy_data:
            return {
                "total_alerts": 0,
                "critical_alerts": 0,
                "accuracy": None,
                "message": "No alert data available"
            }
        
        total_alerts = len(self.alert_accuracy_data)
        critical_alerts = sum(1 for r in self.alert_accuracy_data if r.get("is_critical", False))
        
        # Only calculate accuracy for records with ground truth
        records_with_ground_truth = [r for r in self.alert_accuracy_data if r.get("actual_severity")]
        
        if not records_with_ground_truth:
            return {
                "total_alerts": total_alerts,
                "critical_alerts": critical_alerts,
                "accuracy": None,
                "accuracy_with_ground_truth": None,
                "message": "No ground truth data available for accuracy calculation"
            }
        
        # Exact severity match accuracy
        exact_matches = sum(1 for r in records_with_ground_truth if r.get("severity_match", False))
        exact_accuracy = (exact_matches / len(records_with_ground_truth)) * 100 if records_with_ground_truth else 0
        
        # Close severity accuracy (within one level)
        close_matches = sum(1 for r in records_with_ground_truth if r.get("severity_close", False))
        close_accuracy = (close_matches / len(records_with_ground_truth)) * 100 if records_with_ground_truth else 0
        
        # Critical alerts accuracy (correctly identified critical threats)
        critical_with_truth = [r for r in records_with_ground_truth if r.get("actual_severity") == "critical"]
        critical_accurate = sum(1 for r in critical_with_truth if r.get("critical_accurate", False))
        critical_accuracy = (critical_accurate / len(critical_with_truth)) * 100 if critical_with_truth else None
        
        return {
            "total_alerts": total_alerts,
            "critical_alerts": critical_alerts,
            "alerts_with_ground_truth": len(records_with_ground_truth),
            "exact_severity_accuracy": round(exact_accuracy, 2),
            "close_severity_accuracy": round(close_accuracy, 2),
            "critical_alerts_accuracy": round(critical_accuracy, 2) if critical_accuracy else None,
            "critical_alerts_count": len(critical_with_truth),
            "critical_alerts_correctly_identified": critical_accurate
        }
    
    def get_mitigation_relevance(self) -> Dict[str, Any]:
        """
        Calculate mitigation relevance metrics
        
        Returns:
            Dictionary with relevance statistics
        """
        if not self.mitigation_feedback:
            return {
                "total_mitigations": 0,
                "avg_relevance_score": None,
                "message": "No mitigation data available"
            }
        
        total_mitigations = len(self.mitigation_feedback)
        avg_relevance = sum(self.mitigation_scores) / len(self.mitigation_scores) if self.mitigation_scores else 0
        
        # User ratings (if any)
        user_ratings = [r.get("user_rating") for r in self.mitigation_feedback if r.get("user_rating")]
        avg_user_rating = sum(user_ratings) / len(user_ratings) if user_ratings else None
        
        # Citation scores
        citation_scores = [r.get("citation_avg_score", 0) for r in self.mitigation_feedback]
        avg_citation_score = sum(citation_scores) / len(citation_scores) if citation_scores else 0
        
        return {
            "total_mitigations": total_mitigations,
            "avg_relevance_score": round(avg_relevance * 100, 2),  # Convert to percentage
            "avg_user_rating": round(avg_user_rating, 2) if avg_user_rating else None,
            "user_ratings_count": len(user_ratings),
            "avg_citation_score": round(avg_citation_score * 100, 2),
            "relevance_grade": self._get_relevance_grade(avg_relevance)
        }
    
    def get_response_time_metrics(self) -> Dict[str, Any]:
        """
        Calculate response time reduction metrics
        
        Returns:
            Dictionary with response time statistics
        """
        if not self.analysis_times:
            return {
                "total_analyses": 0,
                "avg_response_time_ms": None,
                "avg_response_time_seconds": None,
                "message": "No analysis time data available"
            }
        
        total_analyses = len(self.analysis_times)
        durations = [r.get("duration_ms", 0) for r in self.analysis_times]
        avg_duration_ms = sum(durations) / len(durations) if durations else 0
        avg_duration_seconds = avg_duration_ms / 1000
        
        # Calculate percentiles
        sorted_durations = sorted(durations)
        p50 = sorted_durations[len(sorted_durations) // 2] if sorted_durations else 0
        p95 = sorted_durations[int(len(sorted_durations) * 0.95)] if sorted_durations else 0
        
        # Estimate baseline (manual analysis: 30 minutes average)
        baseline_time_seconds = 30 * 60  # 30 minutes
        baseline_time_ms = baseline_time_seconds * 1000
        time_reduction_seconds = baseline_time_seconds - avg_duration_seconds
        time_reduction_percent = ((baseline_time_seconds - avg_duration_seconds) / baseline_time_seconds) * 100 if baseline_time_seconds > 0 else 0
        
        return {
            "total_analyses": total_analyses,
            "avg_response_time_ms": round(avg_duration_ms, 2),
            "avg_response_time_seconds": round(avg_duration_seconds, 2),
            "median_response_time_ms": round(p50, 2),
            "p95_response_time_ms": round(p95, 2),
            "baseline_time_seconds": baseline_time_seconds,
            "time_reduction_seconds": round(time_reduction_seconds, 2),
            "time_reduction_percent": round(time_reduction_percent, 2),
            "speedup_factor": round(baseline_time_seconds / avg_duration_seconds, 2) if avg_duration_seconds > 0 else None
        }
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all performance metrics in one call"""
        return {
            "critical_alerts_accuracy": self.get_critical_alerts_accuracy(),
            "mitigation_relevance": self.get_mitigation_relevance(),
            "response_time_reduction": self.get_response_time_metrics(),
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_relevance_grade(self, score: float) -> str:
        """Convert relevance score (0-1) to letter grade"""
        if score >= 0.9:
            return "A+"
        elif score >= 0.8:
            return "A"
        elif score >= 0.7:
            return "B"
        elif score >= 0.6:
            return "C"
        elif score >= 0.5:
            return "D"
        else:
            return "F"
    
    def clear_metrics(self) -> None:
        """Clear all metrics data"""
        self.alert_accuracy_data.clear()
        self.mitigation_feedback.clear()
        self.mitigation_scores.clear()
        self.analysis_times.clear()

# Global instance
metrics_tracker = MetricsTracker()

