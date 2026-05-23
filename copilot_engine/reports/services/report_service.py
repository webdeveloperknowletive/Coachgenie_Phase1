import logging

from pathlib import Path
from typing import Optional

from copilot_engine.reports.schemas.report_schema import (
    ReportSchema,
)

from copilot_engine.reports.formatters.response_formatter import (
    ResponseFormatter,
)

from copilot_engine.reports.generators.pdf_generator import (
    PDFGenerator,
)

from copilot_engine.reports.builders.student_performance_builder import (
    StudentPerformanceReportBuilder,
)

from copilot_engine.reports.builders.attendance_report_builder import (
    AttendanceReportBuilder,
)

from copilot_engine.reports.builders.batch_performance_builder import (
    BatchPerformanceReportBuilder,
)

logger = logging.getLogger(__name__)


class ReportService:

    """
    Production-grade report orchestration service.

    Responsibilities:
    - Validate report schema
    - Coordinate formatting
    - Route generation
    - Handle observability
    """

    # =====================================================
    # GENERATE PDF REPORT
    # =====================================================

    @classmethod
    def generate_pdf_report(
        cls,
        *,
        report: ReportSchema,
        filename: Optional[str] = None,
    ) -> str:

        """
        Generate PDF report from structured schema.

        Returns:
            Generated PDF file path.
        """

        try:

            logger.info(
                "Starting PDF report generation",
                extra={
                    "report_title": (
                        report.title
                    ),
                    "report_type": (
                        report.metadata.report_type
                    ),
                    "user_id": (
                        report.metadata.user_id
                    ),
                    "trace_id": (
                        report.metadata.trace_id
                    ),
                },
            )

            # =============================================
            # FORMAT REPORT
            # =============================================

            formatted_content = (

                ResponseFormatter
                .format_report(report)

            )

            logger.info(
                "Report formatting completed",
                extra={
                    "report_title": (
                        report.title
                    ),
                },
            )

            # =============================================
            # GENERATE PDF
            # =============================================

            pdf_file_path = (

                PDFGenerator.generate(
                    content=formatted_content,
                    filename=filename,
                )

            )

            logger.info(
                "PDF report generated successfully",
                extra={
                    "file_path": (
                        pdf_file_path
                    ),
                    "report_title": (
                        report.title
                    ),
                },
            )

            return pdf_file_path

        except Exception:

            logger.exception(
                "PDF report generation failed",
                extra={
                    "report_title": (
                        report.title
                    ),
                    "trace_id": (
                        report.metadata.trace_id
                    ),
                },
            )

            raise

    # =====================================================
    # FUTURE GENERATORS
    # =====================================================

    @classmethod
    def generate_txt_report(
        cls,
        *,
        report: ReportSchema,
    ):

        raise NotImplementedError(
            "TXT report generation "
            "not implemented yet."
        )

    @classmethod
    def generate_markdown_report(
        cls,
        *,
        report: ReportSchema,
    ):

        raise NotImplementedError(
            "Markdown report generation "
            "not implemented yet."
        )
        
    @staticmethod
    async def generate_student_report(
        student_data: dict,
    ):

        builder = StudentPerformanceReportBuilder()

        report = await builder.build(
            student_data=student_data,
        )

        return ReportService.generate_pdf_report(
            report=report,
        )


    @staticmethod
    async def generate_attendance_report(
        attendance_data: dict,
    ):

        builder = AttendanceReportBuilder()

        report = await builder.build(
            attendance_data=attendance_data,
        )

        return ReportService.generate_pdf_report(
            report=report,
        )


    @staticmethod
    async def generate_batch_report(
        batch_data: dict,
    ):

        builder = BatchPerformanceReportBuilder()

        report = await builder.build(
            batch_data=batch_data,
        )

        return ReportService.generate_pdf_report(
            report=report,
        )