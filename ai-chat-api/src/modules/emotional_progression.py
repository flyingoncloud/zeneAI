"""
Emotional Progression Tracker for ZeneAI

Tracks emotional state changes across conversation to identify:
- Trajectory (escalating, de-escalating, stabilizing)
- Trends in intensity, clarity, complexity
- Significant emotional shifts

Storage: Session-based in Conversation.extra_data['emotional_states']
Limit: Last 20 snapshots per conversation
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session


class EmotionalProgressionTracker:
    """
    Tracks emotional trajectory across conversation
    Stores snapshots in Conversation.extra_data for lightweight persistence
    """

    def __init__(self, db_session: Session):
        """
        Initialize tracker with database session

        Args:
            db_session: SQLAlchemy session for database access
        """
        self.db_session = db_session
        self.max_states = 20  # Limit storage to last 20 emotional states
        self.min_states_for_analysis = 2  # Need at least 2 states for trend analysis

    def track_and_analyze(
        self,
        conversation_id: int,
        current_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Store current emotional state and analyze progression

        Args:
            conversation_id: Database ID of conversation
            current_state: Current psychological state with dimensions

        Returns:
            Progression analysis (trajectory, trends, shifts, confidence)
        """
        # Load conversation
        from src.database.models import Conversation
        conversation = self.db_session.query(Conversation).filter_by(id=conversation_id).first()

        if not conversation:
            return self._insufficient_data_result()

        # Load previous states
        previous_states = self._load_emotional_states(conversation)

        # Create current snapshot
        current_snapshot = self._create_snapshot(current_state)

        # Add to history
        previous_states.append(current_snapshot)

        # Limit to last N states
        if len(previous_states) > self.max_states:
            previous_states = previous_states[-self.max_states:]

        # Store updated states
        self._save_emotional_states(conversation, previous_states)

        # Analyze progression
        if len(previous_states) < self.min_states_for_analysis:
            return self._insufficient_data_result()

        progression = self.analyze_progression(current_snapshot, previous_states[:-1])

        return progression

    def analyze_progression(
        self,
        current_state: Dict[str, Any],
        previous_states: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze emotional progression from historical states

        Args:
            current_state: Current emotional snapshot
            previous_states: List of previous snapshots (excluding current)

        Returns:
            {
                "trajectory": "escalating|de-escalating|stabilizing",
                "intensity_trend": float,  # -1.0 to 1.0
                "clarity_trend": float,
                "shifts": [...],
                "confidence": float
            }
        """
        if len(previous_states) < 1:
            return self._insufficient_data_result()

        # Calculate trends for key dimensions
        intensity_values = [s["intensity"] for s in previous_states] + [current_state["intensity"]]
        clarity_values = [s["clarity"] for s in previous_states] + [current_state["clarity"]]

        intensity_trend = self._calculate_trend(intensity_values)
        clarity_trend = self._calculate_trend(clarity_values)

        # Determine overall trajectory
        trajectory = self._determine_trajectory(intensity_trend, intensity_values)

        # Detect significant shifts
        shifts = self._detect_shifts(previous_states[-min(2, len(previous_states)):], current_state)

        # Calculate confidence based on data points
        confidence = min(0.5 + (len(previous_states) * 0.1), 0.95)

        return {
            "trajectory": trajectory,
            "intensity_trend": round(intensity_trend, 2),
            "clarity_trend": round(clarity_trend, 2),
            "shifts": shifts,
            "confidence": round(confidence, 2)
        }

    def _create_snapshot(self, psychological_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create emotional state snapshot from psychological state

        Args:
            psychological_state: Full psychological analysis

        Returns:
            Lightweight snapshot for storage
        """
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "intensity": psychological_state.get("emotional_intensity", 0.0),
            "clarity": psychological_state.get("emotional_clarity", 0.5),
            "complexity": psychological_state.get("expression_complexity", 0.0),
            "awareness": psychological_state.get("self_awareness", 0.0),
            "valence": self._determine_valence(psychological_state)
        }

    def _determine_valence(self, psychological_state: Dict[str, Any]) -> str:
        """
        Determine emotional valence (positive/negative/neutral)

        This is a simplified heuristic based on intensity and indicators
        Can be enhanced with more sophisticated sentiment analysis
        """
        indicators = psychological_state.get("indicators", {})
        intensity = psychological_state.get("emotional_intensity", 0.0)

        # High intensity + certain indicators = likely negative
        if intensity >= 0.7 and indicators.get("high_intensity"):
            return "negative"

        # Low intensity + high clarity = likely neutral/calm
        if intensity < 0.3 and psychological_state.get("emotional_clarity", 0.0) > 0.7:
            return "neutral"

        # Default to negative for now (most therapy conversations are about distress)
        # This can be enhanced with sentiment keyword analysis
        if intensity >= 0.5:
            return "negative"
        else:
            return "neutral"

    def _calculate_trend(self, values: List[float]) -> float:
        """
        Calculate linear trend from list of values

        Returns:
            Slope of trend line (-1.0 to 1.0)
            Positive = increasing, Negative = decreasing
        """
        if len(values) < 2:
            return 0.0

        n = len(values)
        x = list(range(n))
        y = values

        # Simple linear regression
        x_mean = sum(x) / n
        y_mean = sum(y) / n

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 0.0

        slope = numerator / denominator

        # Normalize to -1.0 to 1.0 range
        return max(-1.0, min(1.0, slope * n))

    def _determine_trajectory(self, intensity_trend: float, intensity_values: List[float]) -> str:
        """
        Determine overall emotional trajectory

        Args:
            intensity_trend: Trend slope for intensity
            intensity_values: List of intensity values

        Returns:
            "escalating", "de-escalating", or "stabilizing"
        """
        # Check recent volatility
        if len(intensity_values) >= 3:
            recent_variance = self._calculate_variance(intensity_values[-3:])
        else:
            recent_variance = 0.0

        # High variance = unstable, use trend
        if recent_variance > 0.1:
            if intensity_trend > 0.2:
                return "escalating"
            elif intensity_trend < -0.2:
                return "de-escalating"

        # Low variance = stable
        if abs(intensity_trend) < 0.15:
            return "stabilizing"

        # Moderate trend
        if intensity_trend > 0.2:
            return "escalating"
        elif intensity_trend < -0.2:
            return "de-escalating"

        return "stabilizing"

    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance of a list of values"""
        if len(values) < 2:
            return 0.0

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance

    def _detect_shifts(
        self,
        recent_states: List[Dict[str, Any]],
        current_state: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """
        Detect significant emotional shifts

        Args:
            recent_states: Last 1-2 emotional snapshots
            current_state: Current snapshot

        Returns:
            List of detected shifts with type and magnitude
        """
        if not recent_states:
            return []

        shifts = []
        prev_state = recent_states[-1]

        # Intensity shift
        intensity_delta = current_state["intensity"] - prev_state["intensity"]
        if abs(intensity_delta) >= 0.3:
            shift_type = "intensity_spike" if intensity_delta > 0 else "intensity_drop"
            shifts.append({
                "type": shift_type,
                "magnitude": round(abs(intensity_delta), 2)
            })

        # Clarity shift
        clarity_delta = current_state["clarity"] - prev_state["clarity"]
        if abs(clarity_delta) >= 0.3:
            shift_type = "clarity_increase" if clarity_delta > 0 else "clarity_decrease"
            shifts.append({
                "type": shift_type,
                "magnitude": round(abs(clarity_delta), 2)
            })

        # Valence shift
        if current_state["valence"] != prev_state["valence"]:
            shifts.append({
                "type": "valence_shift",
                "from": prev_state["valence"],
                "to": current_state["valence"]
            })

        return shifts

    def _load_emotional_states(self, conversation) -> List[Dict[str, Any]]:
        """
        Load emotional state history from conversation extra_data

        Args:
            conversation: Conversation object

        Returns:
            List of emotional snapshots
        """
        if not conversation.extra_data:
            return []

        return conversation.extra_data.get("emotional_states", [])

    def _save_emotional_states(self, conversation, states: List[Dict[str, Any]]):
        """
        Save emotional state history to conversation extra_data

        Args:
            conversation: Conversation object
            states: List of emotional snapshots to save
        """
        if conversation.extra_data is None:
            conversation.extra_data = {}

        conversation.extra_data["emotional_states"] = states
        # Mark the column as modified for SQLAlchemy to detect changes
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(conversation, "extra_data")
        self.db_session.commit()

    def _insufficient_data_result(self) -> Dict[str, Any]:
        """Return default result when insufficient data for analysis"""
        return {
            "trajectory": "insufficient_data",
            "intensity_trend": 0.0,
            "clarity_trend": 0.0,
            "shifts": [],
            "confidence": 0.0
        }

    def get_progression_summary(self, progression: Dict[str, Any], language: str = "zh") -> str:
        """
        Generate human-readable summary of emotional progression

        Args:
            progression: Progression analysis result
            language: "zh" or "en"

        Returns:
            Human-readable summary string
        """
        if progression["trajectory"] == "insufficient_data":
            return "数据不足" if language == "zh" else "Insufficient data"

        trajectory = progression["trajectory"]
        intensity_trend = progression["intensity_trend"]

        if language == "zh":
            trajectory_map = {
                "escalating": "情绪正在升高",
                "de-escalating": "情绪正在缓和",
                "stabilizing": "情绪趋于平稳"
            }
            summary = trajectory_map.get(trajectory, "")

            if intensity_trend > 0.3:
                summary += "，强度显著增加"
            elif intensity_trend < -0.3:
                summary += "，强度显著减弱"

        else:
            trajectory_map = {
                "escalating": "Emotions are escalating",
                "de-escalating": "Emotions are de-escalating",
                "stabilizing": "Emotions are stabilizing"
            }
            summary = trajectory_map.get(trajectory, "")

            if intensity_trend > 0.3:
                summary += ", intensity increasing significantly"
            elif intensity_trend < -0.3:
                summary += ", intensity decreasing significantly"

        return summary
