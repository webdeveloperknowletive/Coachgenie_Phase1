import asyncio
import argparse

from backend.app.services.tenant_provisioning import (
    get_tenant_details
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Get tenant details"
    )

    parser.add_argument(
        "--subdomain",
        required=True,
        help="Tenant subdomain"
    )

    return parser.parse_args()


async def main():
    args = parse_args()

    details = await get_tenant_details(
        subdomain=args.subdomain
    )

    print("\nTenant Details")
    print("=" * 60)

    print(f"Tenant ID      : {details['tenant_id']}")
    print(f"Name           : {details['name']}")
    print(f"Subdomain      : {details['subdomain']}")
    print(f"Plan           : {details['plan']}")
    print(f"Status         : {details['status']}")
    print(f"Created At     : {details['created_at']}")

    print("\nUsers")
    print("-" * 60)

    print(f"Total Users    : {details['total_users']}")

    print("\nAdmins")
    print("-" * 60)

    for admin in details["admins"]:
        print(
            f"{admin['name']} "
            f"({admin['email']})"
        )

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())