# ai/schemas/student_schema.py

from __future__ import annotations

from datetime import datetime
from uuid import UUID
from enum import Enum
from typing import List, Optional

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
)


# ==========================================================
# ENUMS
# ==========================================================

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TrendDirection(str, Enum):
    IMPROVING = "IMPROVING"
    DECLINING = "DECLINING"
    STABLE = "STABLE"


# ==========================================================
# BASE CONFIG
# ==========================================================

class BaseSchema(BaseModel):
    """
    Shared base schema config.
    """

    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        validate_assignment=True,
        from_attributes=True,
    )


# ==========================================================
# SUBJECT PERFORMANCE
# ==========================================================

class SubjectPerformance(BaseSchema):
    subject_name: str = Field(
        ...,
        description="Subject name",
        min_length=2,
        max_length=100,
    )

    marks_obtained: float = Field(
        ...,
        ge=0,
        le=100,
        description="Marks obtained by student",
    )

    class_average: float = Field(
        ...,
        ge=0,
        le=100,
        description="Class average marks",
    )

    attendance_percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Attendance percentage in subject",
    )

    improvement_delta: float = Field(
        ...,
        description="Improvement or decline delta",
    )

    latest_exam_name: str = Field(
        ...,
        description="Latest exam identifier",
    )


# ==========================================================
# PERFORMANCE METRICS
# ==========================================================

class StudentPerformanceMetrics(BaseSchema):
    student_id: UUID

    overall_percentage: float = Field(
        ...,
        ge=0,
        le=100,
    )

    class_rank: int = Field(
        ...,
        ge=1,
    )

    batch_rank: int = Field(
        ...,
        ge=1,
    )

    total_exams_attempted: int = Field(
        ...,
        ge=0,
    )

    subjects: List[SubjectPerformance]

    generated_at: datetime = Field(
        default_factory=datetime.utcnow,
    )


# ==========================================================
# ATTENDANCE
# ==========================================================

class AttendanceMetrics(BaseSchema):
    student_id: UUID

    overall_attendance_percentage: float = Field(
        ...,
        ge=0,
        le=100,
    )

    total_present_days: int = Field(
        ...,
        ge=0,
    )

    total_absent_days: int = Field(
        ...,
        ge=0,
    )

    late_arrivals: int = Field(
        ...,
        ge=0,
    )

    attendance_trend: TrendDirection

    warning_flag: bool = False


# ==========================================================
# IMPROVEMENT TRENDS
# ==========================================================

class ImprovementTrendPoint(BaseSchema):
    exam_name: str

    percentage: float = Field(
        ...,
        ge=0,
        le=100,
    )

    exam_date: datetime


class ImprovementTrendData(BaseSchema):
    student_id: UUID

    trend_direction: TrendDirection

    trend_summary: str

    data_points: List[ImprovementTrendPoint]


# ==========================================================
# RISK DETECTION
# ==========================================================

class RiskCandidate(BaseSchema):
    student_id: UUID

    student_name: str

    attendance_percentage: float = Field(
        ...,
        ge=0,
        le=100,
    )

    average_marks: float = Field(
        ...,
        ge=0,
        le=100,
    )

    risk_level: RiskLevel

    risk_reasons: List[str]


class InterventionRecommendation(BaseSchema):
    title: str

    description: str

    priority: RiskLevel

    recommended_action_by: Optional[str] = None


class StudentRiskAssessment(BaseSchema):
    student_id: UUID

    student_name: str

    risk_level: RiskLevel

    major_concerns: List[str]

    intervention_recommendations: List[
        InterventionRecommendation
    ]

    intervention_required: bool = True


# ==========================================================
# AI INSIGHTS
# ==========================================================

class AIStudentInsights(BaseSchema):
    strengths: List[str]

    weak_areas: List[str]

    behavioral_observations: List[str]

    attendance_insights: List[str]

    improvement_recommendations: List[str]

    parent_attention_points: List[str]

    motivational_feedback: str

    intervention_required: bool


# ==========================================================
# FINAL PERFORMANCE REPORT
# ==========================================================

class StudentPerformanceReport(BaseSchema):
    student_id: UUID

    raw_metrics: StudentPerformanceMetrics

    attendance_metrics: AttendanceMetrics

    ai_insights: AIStudentInsights

    report_generated_at: datetime = Field(
        default_factory=datetime.utcnow,
    )


# ==========================================================
# WEAK SUBJECT ANALYSIS
# ==========================================================

class WeakSubjectRecommendation(BaseSchema):
    subject_name: str

    weakness_reason: str

    recommended_strategy: str

    priority_level: RiskLevel


class WeakSubjectAnalysis(BaseSchema):
    student_id: UUID

    weak_subjects: List[
        WeakSubjectRecommendation
    ]

    overall_summary: str


# ==========================================================
# ATTENDANCE ANALYSIS REPORT
# ==========================================================

class AttendanceAnalysisReport(BaseSchema):
    student_id: UUID

    attendance_summary: str

    attendance_risk: RiskLevel

    attendance_insights: List[str]

    intervention_suggestions: List[str]


# ==========================================================
# IMPROVEMENT ANALYSIS REPORT
# ==========================================================

class ImprovementTrendReport(BaseSchema):
    student_id: UUID

    trend_direction: TrendDirection

    trend_summary: str

    key_improvements: List[str]

    key_declines: List[str]

    ai_recommendations: List[str]


# ==========================================================
# PARENT REPORT
# ==========================================================

class ParentFriendlyReport(BaseSchema):
    student_id: UUID

    student_name: str

    overall_summary: str

    strengths: List[str]

    areas_of_attention: List[str]

    teacher_recommendations: List[str]

    motivational_message: str


# ==========================================================
# STUDENT SUMMARY
# ==========================================================

class StudentSummaryData(BaseSchema):
    student_id: UUID

    student_name: str

    class_name: str

    overall_percentage: float

    attendance_percentage: float

    latest_exam_score: float

    behavioral_notes: Optional[str] = None


class StudentSummaryReport(BaseSchema):
    student_id: UUID

    executive_summary: str

    academic_summary: str

    attendance_summary: str

    behavioral_summary: str

    recommendations: List[str]


# ==========================================================
# RAW ANALYTICS WRAPPER
# ==========================================================

class RawStudentAnalytics(BaseSchema):
    performance: StudentPerformanceMetrics

    attendance: AttendanceMetrics


# ==========================================================
# VALIDATORS
# ==========================================================

class StudentNameMixin(BaseSchema):
    student_name: str

    @field_validator("student_name")
    @classmethod
    def validate_student_name(
        cls,
        value: str,
    ) -> str:

        cleaned = value.strip()

        if len(cleaned) < 2:
            raise ValueError(
                "Student name too short"
            )

        return cleaned