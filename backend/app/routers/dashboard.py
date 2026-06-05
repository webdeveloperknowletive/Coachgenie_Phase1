from fastapi import APIRouter, Depends
from app.dependencies import get_tenant, get_current_user, DB, require_roles
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
async def get_dashboard(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(get_current_user),
):
    role = current_user.role

    if role == "owner":
        data = await dashboard_service.get_owner_dashboard(db, str(tenant.id))
    elif role == "tutor":
        data = await dashboard_service.get_tutor_dashboard(
            db, str(tenant.id), str(current_user.id)
        )
    elif role == "counselor":
        data = await dashboard_service.get_counselor_dashboard(db, str(tenant.id))
    elif role == "student":
        # Get student record linked to this user
        from sqlalchemy import select, and_
        from app.models.student import Student
        result = await db.execute(
            select(Student).where(
                and_(
                    Student.tenant_id == tenant.id,
                    Student.user_id == current_user.id
                )
            )
        )
        student = result.scalar_one_or_none()
        if not student:
            return {"success": True, "data": {"message": "No student record linked to this account."}}
        data = await dashboard_service.get_student_dashboard(
            db, str(tenant.id), str(student.id)
        )
    elif role == "parent":
        # Get student linked to parent email
        from sqlalchemy import select, and_
        from app.models.student import Student
        result = await db.execute(
            select(Student).where(
                and_(
                    Student.tenant_id == tenant.id,
                    Student.parent_email == current_user.email
                )
            )
        )
        student = result.scalar_one_or_none()
        if not student:
            return {"success": True, "data": {"message": "No student linked to this parent account."}}
        data = await dashboard_service.get_student_dashboard(
            db, str(tenant.id), str(student.id)
        )
    else:
        data = {"message": "No dashboard available for this role."}

    return {"success": True, "role": role, "data": data}


@router.get("/owner")
async def owner_dashboard(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner")),
):
    data = await dashboard_service.get_owner_dashboard(db, str(tenant.id))
    return {"success": True, "data": data}


@router.get("/counselor")
async def counselor_dashboard(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("counselor")),
):
    data = await dashboard_service.get_counselor_dashboard(db, str(tenant.id))
    return {"success": True, "data": data}


@router.get("/tutor")
async def tutor_dashboard(
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(require_roles("owner", "tutor")),
):
    data = await dashboard_service.get_tutor_dashboard(
        db, str(tenant.id), str(current_user.id)
    )
    return {"success": True, "data": data}


@router.get("/student/{student_id}")
async def student_dashboard(
    student_id: str,
    db: DB,
    tenant=Depends(get_tenant),
    current_user=Depends(get_current_user),
):
    data = await dashboard_service.get_student_dashboard(
        db, str(tenant.id), student_id
    )
    return {"success": True, "data": data}
