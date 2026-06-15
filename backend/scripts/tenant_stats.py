import asyncio

from backend.app.services.tenant_provisioning import (
    get_tenant_stats
)


async def main():
    stats = await get_tenant_stats()

    print("\nCoach Genie Tenant Statistics")
    print("=" * 50)

    print(
        f"Total Tenants      : "
        f"{stats['total_tenants']}"
    )

    print(
        f"Active Tenants     : "
        f"{stats['active_tenants']}"
    )

    print(
        f"Inactive Tenants   : "
        f"{stats['inactive_tenants']}"
    )

    print(
        f"Total Users        : "
        f"{stats['total_users']}"
    )

    print(
        f"Average Users/Tenant : "
        f"{stats['avg_users_per_tenant']:.2f}"
    )

    print("\nPlan Distribution")
    print("-" * 50)

    for plan, count in stats["plans"].items():
        print(f"{plan:<15} : {count}")

    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())