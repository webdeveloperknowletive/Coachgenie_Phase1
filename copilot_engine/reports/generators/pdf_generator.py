from pathlib import Path
from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException
from reportlab.lib.styles import StyleSheet1
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
)

from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)

from reportlab.lib.enums import (
    TA_CENTER,
    TA_LEFT,
)

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from copilot_engine.core.logging_config import (
    logging,
)

logger = logging.getLogger(__name__)


class PDFGenerator:

    """
    Production-grade PDF generator.

    Responsibilities:
    - Render formatted report text into PDFs
    - Handle layout consistency
    - Ensure future extensibility
    """

    OUTPUT_DIR = "generated_reports"

    # =====================================================
    # PUBLIC GENERATOR
    # =====================================================

    @classmethod
    def generate(
        cls,
        *,
        content: str,
        filename: Optional[str] = None,
    ) -> str:

        """
        Generate PDF report.

        Returns:
            Generated PDF file path.
        """

        try:

            # =====================================================
            # OUTPUT DIRECTORY (SAFE)
            # =====================================================
            output_dir = Path(cls.OUTPUT_DIR)
            output_dir.mkdir(parents=True, exist_ok=True)

            # =====================================================
            # SAFE FILENAME GENERATION
            # =====================================================
            if not filename:
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                filename = f"report_{timestamp}"

            if not filename.endswith(".pdf"):
                filename += ".pdf"

            file_path = output_dir / filename

            # =====================================================
            # DOCUMENT SETUP (ISOLATED PER REQUEST)
            # =====================================================
            document = SimpleDocTemplate(
                str(file_path),
                pagesize=A4,
                rightMargin=40,
                leftMargin=40,
                topMargin=50,
                bottomMargin=40,
            )

            # =====================================================
            # FRESH STYLES (NO GLOBAL MUTATION)
            # =====================================================
            styles = cls._build_styles()

            # =====================================================
            # STORY BUILDING
            # =====================================================
            story: List = []

            for line in content.splitlines():

                line = line.strip()

                # -------------------------
                # EMPTY LINE
                # -------------------------
                if not line:
                    story.append(Spacer(1, 10))
                    continue

                # -------------------------
                # SECTION DIVIDER
                # -------------------------
                if line.startswith("=") and len(line) > 20:
                    story.append(Spacer(1, 12))
                    continue

                # -------------------------
                # TITLE
                # -------------------------
                if cls._is_title(line):
                    story.append(
                        Paragraph(line, styles["CustomTitle"])
                    )
                    story.append(Spacer(1, 14))
                    continue

                # -------------------------
                # HEADING
                # -------------------------
                if cls._is_section_header(line):
                    story.append(
                        Paragraph(line, styles["CustomHeading"])
                    )
                    story.append(Spacer(1, 10))
                    continue

                # -------------------------
                # BODY TEXT
                # -------------------------
                story.append(
                    Paragraph(line, styles["CustomBody"])
                )
                story.append(Spacer(1, 8))

            # =====================================================
            # BUILD PDF
            # =====================================================
            document.build(story)

            # =====================================================
            # LOG SUCCESS
            # =====================================================
            logger.info(
                "PDF report generated successfully",
                extra={"file_path": str(file_path)},
            )

            return (
                f"http://127.0.0.1:8001/generated-reports/"
                f"{file_path.name}"
            )

        except Exception as e:

            # =====================================================
            # LOG FULL TRACE (CRITICAL FOR DEBUGGING)
            # =====================================================
            logger.exception("Failed to generate PDF report")

            # DO NOT expose internal errors in production
            raise HTTPException(
                status_code=500,
                detail="PDF generation failed. Check server logs."
            )

    # =====================================================
    # STYLE SYSTEM
    # =====================================================

    @classmethod
    def _build_styles(cls):

        # ✅ fully isolated stylesheet
        styles = StyleSheet1()

        # Title
        styles.add(ParagraphStyle(
            name="CustomTitle",
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=20,
        ))

        # Heading
        styles.add(ParagraphStyle(
            name="CustomHeading",
            fontSize=14,
            leading=18,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#111827"),
            spaceBefore=10,
            spaceAfter=10,
        ))

        # Body
        styles.add(ParagraphStyle(
            name="CustomBody",
            fontSize=11,
            leading=18,
            alignment=TA_LEFT,
            textColor=colors.black,
        ))

        return styles

    # =====================================================
    # TITLE DETECTION
    # =====================================================

    @classmethod
    def _is_title(
        cls,
        line: str,
    ) -> bool:

        return (
            line.isupper()
            and len(line.split()) > 2
        )

    # =====================================================
    # SECTION HEADER DETECTION
    # =====================================================

    @classmethod
    def _is_section_header(
        cls,
        line: str,
    ) -> bool:

        headers = {
            "SUMMARY",
            "STRENGTHS",
            "WEAKNESSES",
            "RECOMMENDATIONS",
            "AREAS TO IMPROVE",
            "OBSERVATIONS",
            "PERFORMANCE ANALYSIS",
        }

        return (
            line.upper()
            in headers
        )