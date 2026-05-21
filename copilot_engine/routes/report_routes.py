import logging

from pathlib import Path

from fastapi import (
    APIRouter,
    HTTPException,
)

from fastapi.responses import (
    FileResponse,
)

from reports.schemas.report_schema import (
    ReportSchema,
)

from reports.services.report_service import (
    ReportService,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# =========================================================
# GENERATE PDF REPORT
# =========================================================

@router.post(
    "/generate-pdf",
    response_class=FileResponse,
)
async def generate_pdf_report(
    report: ReportSchema,
):

    """
    Generate downloadable PDF report.
    """

    try:

        logger.info(
            "Received PDF report request",
            extra={
                "report_title": (
                    report.title
                ),
                "report_type": (
                    report.metadata.report_type
                ),
            },
        )

        # =============================================
        # GENERATE PDF
        # =============================================

        pdf_file_path = (

            ReportService
            .generate_pdf_report(
                report=report,
            )

        )

        file_path = Path(
            pdf_file_path
        )

        # =============================================
        # VALIDATE FILE
        # =============================================

        if not file_path.exists():

            raise HTTPException(
                status_code=500,
                detail=(
                    "Generated PDF file "
                    "does not exist."
                ),
            )

        logger.info(
            "Returning generated PDF",
            extra={
                "file_path": str(
                    file_path
                ),
            },
        )

        # =============================================
        # DOWNLOAD RESPONSE
        # =============================================

        return FileResponse(
            path=str(file_path),

            media_type=(
                "application/pdf"
            ),

            filename=file_path.name,
        )

    except HTTPException:

        raise

    except Exception:

        logger.exception(
            "Failed to generate PDF report"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "PDF report."
            ),
        )