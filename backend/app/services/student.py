# import uuid
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select, and_, func
# from app.models.student import Student
# from app.utils.exceptions import NotFoundError, ConflictError
# from app.utils.pagination import paginate
# from datetime import date


# async def get_students(db: AsyncSession, tenant_id: str, page: int,
#                        limit: int, search: str | None = None) -> dict:
#     conditions = [Student.tenant_id == tenant_id, Student.is_active == True]
#     if search:
#         conditions.append(Student.first_name.ilike(f"%{search}%"))

#     total = (await db.execute(
#         select(func.count()).select_from(Student).where(and_(*conditions))
#     )).scalar()

#     result = await db.execute(
#         select(Student).where(and_(*conditions))
#         .order_by(Student.created_at.desc())
#         .offset((page - 1) * limit).limit(limit)
#     )
#     return paginate(result.scalars().all(), total, page, limit)


# async def get_student(db: AsyncSession, tenant_id: str, student_id: str) -> Student:
#     result = await db.execute(
#         select(Student).where(
#             and_(Student.id == student_id, Student.tenant_id == tenant_id)
#         )
#     )
#     student = result.scalar_one_or_none()
#     if not student:
#         raise NotFoundError("Student")
#     return student






# # async def update_student(db: AsyncSession, tenant_id: str,
# #                          student_id: str, data: dict) -> Student:
# #     student = await get_student(db, tenant_id, student_id)
# #     # for key, value in data.items():
# #     allowed_fields = {
# #     "first_name",
# #     "last_name",
# #     "email",
# #     "phone",
# #     "current_class",
# #     "date_of_birth",
# #     "parent_name",
# #     "parent_phone",
# # }
# # for key, value in data.items():
# #     if key in allowed_fields and value is not None:
# #         setattr(student, key, value)
# #         # if value is not None:
# #         #     setattr(student, key, value)
# #     # await db.flush()
# #     await db.commit()
# #     await db.refresh(student)
# #     return student
# async def update_student(
#     db: AsyncSession,
#     tenant_id: str,
#     student_id: str,
#     data: dict
# ) -> Student:

#     student = await get_student(db, tenant_id, student_id)

#     allowed_fields = {
#         "first_name",
#         "last_name",
#         "email",
#         "phone",
#         "current_class",
#         "date_of_birth",
#         "parent_name",
#         "parent_phone",
#     }

#     for key, value in data.items():
#         if key in allowed_fields and value is not None:
#             setattr(student, key, value)

#     await db.commit()
#     await db.refresh(student)

#     return student

# async def deactivate_student(db: AsyncSession, tenant_id: str, student_id: str):
#     student = await get_student(db, tenant_id, student_id)

#     student.is_active = False

#     await db.commit()
#     await db.refresh(student)

#     return student

# # async def deactivate_student(db: AsyncSession, tenant_id: str, student_id: str):
# #     student = await get_student(db, tenant_id, student_id)
# #     student.is_active = False
# #     await db.flush()


import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload                          # ← ADD THIS
from app.models.student import Student
from app.utils.exceptions import NotFoundError, ConflictError
from app.utils.pagination import paginate
from datetime import date


async def get_students(db: AsyncSession, tenant_id: str, page: int,
                       limit: int, search: str | None = None) -> dict:
    conditions = [Student.tenant_id == tenant_id, Student.is_active == True]
    if search:
        conditions.append(Student.first_name.ilike(f"%{search}%"))

    total = (await db.execute(
        select(func.count()).select_from(Student).where(and_(*conditions))
    )).scalar()

    result = await db.execute(
        select(Student)
        .options(selectinload(Student.batch_enrollments))        # ← ADD THIS
        .where(and_(*conditions))
        .order_by(Student.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return paginate(result.scalars().all(), total, page, limit)


async def get_student(db: AsyncSession, tenant_id: str, student_id: str) -> Student:
    result = await db.execute(
        select(Student)
        .options(selectinload(Student.batch_enrollments))        # ← ADD THIS
        .where(
            and_(Student.id == student_id, Student.tenant_id == tenant_id)
        )
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student")
    return student


async def update_student(
    db: AsyncSession,
    tenant_id: str,
    student_id: str,
    data: dict
) -> Student:
    student = await get_student(db, tenant_id, student_id)

    allowed_fields = {
        "first_name", "last_name", "email", "phone",
        "current_class", "date_of_birth", "parent_name", "parent_phone",
    }

    for key, value in data.items():
        if key in allowed_fields and value is not None:
            setattr(student, key, value)

    await db.commit()
    await db.refresh(student, ["batch_enrollments"])             # ← ADD attribute_names
    return student


async def deactivate_student(db: AsyncSession, tenant_id: str, student_id: str):
    student = await get_student(db, tenant_id, student_id)
    student.is_active = False
    await db.commit()
    await db.refresh(student)
    return student