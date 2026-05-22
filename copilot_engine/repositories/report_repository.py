# ai/repositories/report_repository.py

import logging

from uuid import UUID
from typing import (
    Optional,
    List,
)

from sqlalchemy import (
    select,
    desc,
)

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from sqlalchemy.exc import (
    SQLAlchemyError,
)

from copilot_engine.schemas.models.ai_generated_reports import (
    AIGeneratedReport,
)

from copilot_engine.core.exception import (
    DatabaseOperationError,
)

logger = logging.getLogger(
    __name__
)


class ReportRepository:

    def __init__(
        self,
        db: AsyncSession,
    ):

        self.db = db

    # =====================================================
    # CREATE REPORT
    # =====================================================

    async def create_report(
        self,
        *,
        student_id: UUID,
        report_type: str,
        generated_by: UUID,
        summary: str,
        report_json: dict,
    ) -> AIGeneratedReport:

        logger.info(
            "Creating AI generated report",
            extra={
                "student_id": str(student_id),
                "report_type": report_type,
            },
        )

        try:

            report = AIGeneratedReport(
                student_id=student_id,
                report_type=report_type,
                generated_by=generated_by,
                summary=summary,
                report_json=report_json,
            )

            self.db.add(report)

            await self.db.flush()

            await self.db.refresh(report)

            logger.info(
                "AI report created successfully",
                extra={
                    "report_id": str(report.id),
                },
            )

            return report

        except SQLAlchemyError as error:

            logger.exception(
                "Failed to create AI report"
            )

            raise DatabaseOperationError(
                message="Failed to create report",
                metadata={
                    "error": str(error),
                },
            ) from error

    # =====================================================
    # GET REPORT BY ID
    # =====================================================

    async def get_report_by_id(
        self,
        report_id: UUID,
    ) -> Optional[AIGeneratedReport]:

        try:

            query = (
                select(AIGeneratedReport)
                .where(
                    AIGeneratedReport.id
                    == report_id
                )
            )

            result = await self.db.execute(
                query
            )

            return result.scalar_one_or_none()

        except SQLAlchemyError as error:

            logger.exception(
                "Failed to fetch report"
            )

            raise DatabaseOperationError(
                message="Failed to fetch report",
                metadata={
                    "report_id": str(report_id),
                    "error": str(error),
                },
            ) from error

    # =====================================================
    # GET STUDENT REPORTS
    # =====================================================

    async def get_student_reports(
        self,
        student_id: UUID,
        limit: int = 20,
    ) -> List[AIGeneratedReport]:

        try:

            query = (
                select(AIGeneratedReport)
                .where(
                    AIGeneratedReport.student_id
                    == student_id
                )
                .order_by(
                    desc(
                        AIGeneratedReport.created_at
                    )
                )
                .limit(limit)
            )

            result = await self.db.execute(
                query
            )

            return list(
                result.scalars().all()
            )

        except SQLAlchemyError as error:

            logger.exception(
                "Failed to fetch student reports"
            )

            raise DatabaseOperationError(
                message="Failed to fetch reports",
                metadata={
                    "student_id": str(student_id),
                    "error": str(error),
                },
            ) from error