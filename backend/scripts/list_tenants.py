import asyncio

from backend.app.services.tenant_provisioning import (
    list_tenants
)


async def main():
    tenants = await list_tenants()

    if not tenants:
        print("\nNo tenants found.")
        return

    print("\nRegistered Tenants")
    print("=" * 120)

    for tenant in tenants:
        status = (
            "ACTIVE"
            if tenant["is_active"]
            else "INACTIVE"
        )

        print(
            f"{tenant['name']:<30}"
            f"{tenant['subdomain']:<20}"
            f"{tenant['plan']:<15}"
            f"{status:<15}"
            f"{tenant['created_at']}"
        )

    print("=" * 120)
    print(f"Total Tenants: {len(tenants)}")


if __name__ == "__main__":
    asyncio.run(main())