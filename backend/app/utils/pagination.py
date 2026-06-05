def paginate(data: list, total: int, page: int, limit: int) -> dict:
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }
