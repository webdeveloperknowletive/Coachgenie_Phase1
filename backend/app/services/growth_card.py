from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.growth_card import GrowthCard
from app.utils.exceptions import NotFoundError
from app.utils.pagination import paginate



# async def auto_generate_growth_card(
#     db: AsyncSession,
#     tenant_id: str,
#     created_by: str,
#     student_id: str,
# ) -> GrowthCard:
#     from sqlalchemy import select, and_, func
#     from app.models.student import Student
#     from app.models.attendance import AttendanceRecord
#     from app.models.exam import ExamResult, Exam
#     from app.config import settings
#     import httpx
#     import json

#     # 1. Fetch student
#     result = await db.execute(
#         select(Student).where(
#             and_(Student.id == student_id, Student.tenant_id == tenant_id)
#         )
#     )
#     student = result.scalar_one_or_none()
#     if not student:
#         raise NotFoundError("Student")

#     student_name = f"{student.first_name} {student.last_name}".strip()

#     # 2. Fetch attendance
#     total_att = (await db.execute(
#         select(func.count()).select_from(AttendanceRecord).where(
#             and_(
#                 AttendanceRecord.tenant_id == tenant_id,
#                 AttendanceRecord.student_id == student_id,
#             )
#         )
#     )).scalar() or 0

#     present = (await db.execute(
#         select(func.count()).select_from(AttendanceRecord).where(
#             and_(
#                 AttendanceRecord.tenant_id == tenant_id,
#                 AttendanceRecord.student_id == student_id,
#                 AttendanceRecord.status == "present",
#             )
#         )
#     )).scalar() or 0

#     attendance_pct = round((present / total_att * 100), 1) if total_att > 0 else None

#     # 3. Fetch exam scores
#     rows = (await db.execute(
#         select(ExamResult, Exam)
#         .join(Exam, ExamResult.exam_id == Exam.id)
#         .where(
#             and_(
#                 ExamResult.tenant_id == tenant_id,
#                 ExamResult.student_id == student_id,
#             )
#         )
#         .order_by(Exam.scheduled_at.desc())
#         .limit(5)
#     )).all()

#     exam_data = []
#     for er, exam in rows:
#         if er.marks_obtained is not None and exam.total_marks:
#             pct = round((float(er.marks_obtained) / float(exam.total_marks)) * 100, 1)
#             exam_data.append({
#                 "name":  exam.title,
#                 "score": pct,
#                 "marks": f"{er.marks_obtained}/{exam.total_marks}",
#             })

#     avg_score = round(sum(e["score"] for e in exam_data) / len(exam_data), 1) if exam_data else None

#     # 4. Call Claude API
# #     prompt = f"""You are an academic coach writing a growth card for a student.

# # Student: {student_name}
# # Grade: {student.current_class or "N/A"}
# # Subjects: {", ".join(student.subjects or []) or "N/A"}
# # Attendance: {f"{attendance_pct}%" if attendance_pct is not None else "No data"}
# # Average Score: {f"{avg_score}%" if avg_score is not None else "No data"}
# # Recent Exams: {json.dumps(exam_data) if exam_data else "No exam data yet"}

# # Write a growth card with the following JSON structure (respond ONLY with valid JSON, no markdown):
# # {{
# #   "period_label": "current month and year like May 2026",
# #   "strengths": "2-3 sentences about what the student does well",
# #   "improvement_areas": "2-3 sentences about areas needing work",
# #   "tutor_remarks": "1-2 sentences of overall encouraging remarks for parents",
# #   "behavior_rating": 3
# # }}"""
#     prompt = f"""You are an academic coach writing a growth card for a student.

#     Student: {student_name}
#     Grade: {student.current_class or "N/A"}
#     Subjects: {", ".join(student.subjects or []) or "N/A"}
#     Attendance: {f"{attendance_pct}%" if attendance_pct is not None else "No data"}
#     Average Score: {f"{avg_score}%" if avg_score is not None else "No data"}
#     Recent Exams: {json.dumps(exam_data) if exam_data else "No exam data yet"}

#     Respond ONLY with a valid JSON object, no markdown, no explanation:
#     {{"period_label": "May 2026", "strengths": "2-3 sentences about strengths", "improvement_areas": "2-3 sentences about areas to improve", "tutor_remarks": "1-2 sentences for parents", "behavior_rating": 3}}"""

#     # try:
#         # async with httpx.AsyncClient(timeout=30.0) as client:
#         #     response = await client.post(
#         #         "https://api.anthropic.com/v1/messages",
#         #         headers={
#         #             "x-api-key":         settings.ANTHROPIC_API_KEY,
#         #             "anthropic-version": "2023-06-01",
#         #             "content-type":      "application/json",
#         #         },
#         #         json={
#         #             "model":      "claude-haiku-4-5-20251001",
#         #             "max_tokens": 500,
#         #             "messages":   [{"role": "user", "content": prompt}],
#         #         },
#         #     )
#         # data     = response.json()
#         # raw_text = data["content"][0]["text"]
#         # ai_data  = json.loads(raw_text)
#     try:
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             response = await client.post(
#                 "https://api.groq.com/openai/v1/chat/completions",
#                 headers={
#                     "Authorization": f"Bearer {settings.GROQ_API_KEY}",
#                     "Content-Type":  "application/json",
#                 },
#                 json={
#                     "model":    "llama3-8b-8192",
#                     "messages": [{"role": "user", "content": prompt}],
#                     "max_tokens": 500,
#                 },
#             )
#         print(f"[GROQ STATUS] {response.status_code}")
#         print(f"[GROQ RESPONSE] {response.text}")  # ← add this
#         data     = response.json()
#         raw_text = data["choices"][0]["message"]["content"]
#         ai_data  = json.loads(raw_text)
#     except Exception as e:
#         print(f"[AI ERROR] {e}")
#         ai_data = {
#             "period_label":      "Current Period",
#             "strengths":         "Student shows consistent effort and willingness to learn.",
#             "improvement_areas": "More practice and revision recommended.",
#             "tutor_remarks":     "Keep up the good work and stay consistent.",
#             "behavior_rating":   3,
#         }

#     # 5. Save to DB
#     card = GrowthCard(
#         tenant_id=          tenant_id,
#         student_id=         student_id,
#         created_by=         created_by,
#         period_label=       ai_data.get("period_label", "Current Period"),
#         academic_score=     avg_score,
#         attendance_percent= attendance_pct,
#         behavior_rating=    int(ai_data.get("behavior_rating", 3)),
#         strengths=          ai_data.get("strengths"),
#         improvement_areas=  ai_data.get("improvement_areas"),
#         tutor_remarks=      ai_data.get("tutor_remarks"),
#     )
#     db.add(card)
#     await db.flush()
#     return card

async def auto_generate_growth_card(
    db: AsyncSession,
    tenant_id: str,
    created_by: str,
    student_id: str,
) -> GrowthCard:
    from sqlalchemy import select, and_, func
    from app.models.student import Student
    from app.models.attendance import AttendanceRecord
    from app.models.exam import ExamResult, Exam
    from app.config import settings
    import httpx
    import json

    # 1. Fetch student
    result = await db.execute(
        select(Student).where(
            and_(Student.id == student_id, Student.tenant_id == tenant_id)
        )
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student")

    student_name = f"{student.first_name} {student.last_name}".strip()

    # 2. Fetch attendance
    total_att = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            and_(
                AttendanceRecord.tenant_id == tenant_id,
                AttendanceRecord.student_id == student_id,
            )
        )
    )).scalar() or 0

    present = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            and_(
                AttendanceRecord.tenant_id == tenant_id,
                AttendanceRecord.student_id == student_id,
                AttendanceRecord.status == "present",
            )
        )
    )).scalar() or 0

    attendance_pct = round((present / total_att * 100), 1) if total_att > 0 else None

    # 3. Fetch exam scores
    rows = (await db.execute(
        select(ExamResult, Exam)
        .join(Exam, ExamResult.exam_id == Exam.id)
        .where(
            and_(
                ExamResult.tenant_id == tenant_id,
                ExamResult.student_id == student_id,
            )
        )
        .order_by(Exam.scheduled_at.desc())
        .limit(5)
    )).all()

    exam_data = []
    for er, exam in rows:
        if er.marks_obtained is not None and exam.total_marks:
            pct = round((float(er.marks_obtained) / float(exam.total_marks)) * 100, 1)
            exam_data.append({
                "name":  exam.title,
                "score": pct,
                "marks": f"{er.marks_obtained}/{exam.total_marks}",
            })

    avg_score = round(sum(e["score"] for e in exam_data) / len(exam_data), 1) if exam_data else None

    # 4. Call Groq API
    ai_data = None
    try:
        prompt = (
            "You are an academic coach. Write a student growth card as a JSON object only.\n"
            "No explanation, no markdown, just the JSON.\n\n"
            f"Student: {student_name}\n"
            f"Grade: {student.current_class or 'N/A'}\n"
            f"Attendance: {f'{attendance_pct}%' if attendance_pct is not None else 'No data'}\n"
            f"Average Score: {f'{avg_score}%' if avg_score is not None else 'No data'}\n\n"
            "Return exactly this JSON structure:\n"
            '{"period_label":"May 2026","strengths":"write here","improvement_areas":"write here","tutor_remarks":"write here","behavior_rating":3}'
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages":    [{"role": "user", "content": prompt}],
                    "max_tokens":  400,
                    "temperature": 0.7,
                },
            )
        print(f"[GROQ STATUS] {response.status_code}")
        print(f"[GROQ RAW] {response.text[:500]}")
        data     = response.json()
        raw_text = data["choices"][0]["message"]["content"].strip()
        # Strip markdown if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        ai_data = json.loads(raw_text)
        print(f"[GROQ PARSED] {ai_data}")
    except Exception as e:
        print(f"[AI ERROR] {type(e).__name__}: {e}")

    if not ai_data:
        ai_data = {
            "period_label":      "Current Period",
            "strengths":         "Student shows consistent effort and willingness to learn.",
            "improvement_areas": "More practice and revision recommended.",
            "tutor_remarks":     "Keep up the good work and stay consistent.",
            "behavior_rating":   3,
        }

    # 5. Save to DB
    card = GrowthCard(
        tenant_id=          tenant_id,
        student_id=         student_id,
        created_by=         created_by,
        period_label=       ai_data.get("period_label", "Current Period"),
        academic_score=     avg_score,
        attendance_percent= attendance_pct,
        behavior_rating=    int(ai_data.get("behavior_rating", 3)),
        strengths=          ai_data.get("strengths"),
        improvement_areas=  ai_data.get("improvement_areas"),
        tutor_remarks=      ai_data.get("tutor_remarks"),
    )
    db.add(card)
    await db.flush()
    return card


async def get_student_growth_cards(
    db: AsyncSession,
    tenant_id: str,
    student_id: str
) -> list:
    result = await db.execute(
        select(GrowthCard).where(
            and_(
                GrowthCard.tenant_id == tenant_id,
                GrowthCard.student_id == student_id
            )
        ).order_by(GrowthCard.created_at.desc())
    )
    return result.scalars().all()


async def get_growth_card(
    db: AsyncSession,
    tenant_id: str,
    card_id: str
) -> GrowthCard:
    result = await db.execute(
        select(GrowthCard).where(
            and_(
                GrowthCard.id == card_id,
                GrowthCard.tenant_id == tenant_id
            )
        )
    )
    card = result.scalar_one_or_none()
    if not card:
        raise NotFoundError("Growth Card")
    return card


async def create_growth_card(
    db: AsyncSession,
    tenant_id: str,
    created_by: str,
    data: dict
) -> GrowthCard:
    card = GrowthCard(
        tenant_id=tenant_id,
        created_by=created_by,
        **data
    )
    db.add(card)
    await db.flush()
    return card


async def update_growth_card(
    db: AsyncSession,
    tenant_id: str,
    card_id: str,
    data: dict
) -> GrowthCard:
    card = await get_growth_card(db, tenant_id, card_id)
    for key, value in data.items():
        if value is not None:
            setattr(card, key, value)

    # If parent marked as seen
    if data.get("parent_seen") is True:
        card.parent_seen_at = datetime.now(timezone.utc)

    await db.flush()
    return card


async def get_all_growth_cards(
    db: AsyncSession,
    tenant_id: str,
    page: int,
    limit: int
) -> dict:
    conditions = [GrowthCard.tenant_id == tenant_id]
    total = (await db.execute(
        select(func.count()).select_from(GrowthCard).where(and_(*conditions))
    )).scalar()

    result = await db.execute(
        select(GrowthCard).where(and_(*conditions))
        .order_by(GrowthCard.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return paginate(result.scalars().all(), total, page, limit)
