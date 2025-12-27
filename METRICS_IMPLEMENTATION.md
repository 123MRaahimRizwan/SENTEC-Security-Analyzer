# Performance Metrics Implementation

## Overview
All three missing performance metrics have been successfully implemented:
1. **Critical Alerts Accuracy** - Tracks how accurately the system identifies critical threats
2. **Mitigation Relevance** - Measures the quality and relevance of LLM-generated mitigation plans
3. **Response Time Reduction** - Tracks analysis speed improvements

## Implementation Details

### 1. Critical Alerts Accuracy Tracking

**Backend (`backend/metrics_tracker.py`)**:
- Compares predicted severity (from LLM) vs actual severity (from ground truth)
- Calculates multiple accuracy metrics:
  - Exact severity match accuracy
  - Close severity accuracy (within one level)
  - Critical alerts accuracy (correctly identified critical threats)
- Tracks all alerts with their predicted and actual severities

**Integration (`backend/app.py`)**:
- Automatically tracks every alert analysis
- Maps ground truth attack types to expected severities
- Stores metrics for accuracy calculation

**Frontend (`frontend/client/src/components/dashboard/PerformanceMetrics.tsx`)**:
- Displays critical alerts accuracy percentage
- Shows total alerts analyzed
- Displays breakdown of critical alerts correctly identified

### 2. Mitigation Relevance Scoring

**Backend (`backend/metrics_tracker.py`)**:
- Calculates relevance score based on:
  - Citation scores (0-1, from vector similarity)
  - LLM confidence (if available)
  - User ratings (1-5 stars, optional)
- Combines citation scores and LLM confidence (weighted average)
- Converts scores to letter grades (A+ to F)
- Tracks average user ratings

**Integration (`backend/app.py`)**:
- Tracks mitigation relevance for every analysis
- Extracts citation scores from RAG retrieval
- API endpoint for user feedback submission

**Frontend**:
- **PerformanceMetrics Component**: Displays average relevance score, grade, and user ratings
- **AlertCard Component**: Star rating widget (1-5 stars) for users to rate mitigation quality
- User feedback is submitted via `/api/metrics/mitigation-feedback` endpoint

### 3. Response Time Reduction Metrics

**Backend (`backend/metrics_tracker.py`)**:
- Tracks analysis time from start to completion
- Calculates:
  - Average response time (seconds and milliseconds)
  - Median and P95 response times
  - Time reduction percentage (vs 30-minute baseline)
  - Speedup factor (how many times faster)
- Baseline: 30 minutes (typical manual analysis time)

**Integration (`backend/app.py`)**:
- Tracks start/end time for every `/api/analyze-alert` call
- Stores duration in milliseconds
- Calculates reduction metrics automatically

**Frontend (`frontend/client/src/components/dashboard/PerformanceMetrics.tsx`)**:
- Displays time reduction percentage
- Shows average response time
- Displays speedup factor (e.g., "50x faster")
- Shows total analyses performed

## API Endpoints

### GET `/api/metrics`
Returns all performance metrics:
```json
{
  "critical_alerts_accuracy": {
    "total_alerts": 100,
    "critical_alerts": 25,
    "critical_alerts_accuracy": 92.5,
    "exact_severity_accuracy": 78.3,
    ...
  },
  "mitigation_relevance": {
    "total_mitigations": 100,
    "avg_relevance_score": 85.2,
    "relevance_grade": "B",
    "avg_user_rating": 4.2,
    ...
  },
  "response_time_reduction": {
    "total_analyses": 100,
    "avg_response_time_seconds": 2.5,
    "time_reduction_percent": 99.86,
    "speedup_factor": 720.0,
    ...
  }
}
```

### POST `/api/metrics/mitigation-feedback`
Submit user feedback on mitigation relevance:
```json
{
  "alert_id": "alert_123",
  "rating": 5  // 1-5 stars
}
```

### POST `/api/metrics/clear`
Clear all metrics data (for testing/reset)

## Dashboard Display

The **PerformanceMetrics** component is displayed on the Dashboard, showing:
- Three metric cards (Critical Alerts Accuracy, Mitigation Relevance, Response Time)
- Real-time updates (refreshes every 30 seconds)
- Color-coded indicators (red for accuracy, yellow for relevance, green for speed)
- Detailed breakdowns in each card

## User Feedback

Users can rate mitigation quality directly in the AlertCard dialog:
- 5-star rating system
- Ratings are submitted to backend
- Metrics automatically update to reflect user feedback
- Average user rating is displayed in metrics dashboard

## Data Flow

1. **Alert Analysis** → Metrics tracked automatically
2. **User Rates Mitigation** → Feedback stored → Metrics updated
3. **Dashboard Refreshes** → Fetches latest metrics → Displays updated stats

## Files Created/Modified

**New Files**:
- `backend/metrics_tracker.py` - Core metrics tracking logic
- `frontend/client/src/components/dashboard/PerformanceMetrics.tsx` - Metrics display component
- `METRICS_IMPLEMENTATION.md` - This documentation

**Modified Files**:
- `backend/app.py` - Integrated metrics tracking, added API endpoints
- `frontend/client/src/components/dashboard/AlertCard.tsx` - Added user feedback rating
- `frontend/client/src/pages/Dashboard.tsx` - Added PerformanceMetrics component

## Usage

1. **Automatic Tracking**: Metrics are tracked automatically when alerts are analyzed
2. **View Metrics**: Metrics appear on the Dashboard automatically
3. **Provide Feedback**: Click stars in AlertCard to rate mitigation quality
4. **Reset Metrics**: Use `/api/metrics/clear` endpoint (or restart server for in-memory storage)

## Notes

- Metrics are stored in-memory (cleared on server restart)
- For production, consider persisting to database
- Ground truth data is loaded from `dataset/ground_truth.json` on startup
- Baseline time for response time calculation is 30 minutes (configurable)

