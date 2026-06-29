# scripts/create_tenant.py

import asyncio
import argparse

from app.services.tenant_provisioning import provision_tenant


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create a new Coach Genie tenant"
    )

    parser.add_argument(
        "--name",
        required=True,
        help="Institute name"
    )

    parser.add_argument(
        "--subdomain",
        required=True,
        help="Institute subdomain"
    )

    parser.add_argument(
        "--email",
        required=True,
        help="Admin email"
    )

    parser.add_argument(
        "--admin-name",
        default="Admin",
        help="Admin user name"
    )

    parser.add_argument(
        "--password",
        required=True,
        help="Admin password"
    )

    parser.add_argument(
        "--plan",
        default="basic",
        help="Subscription plan"
    )

    return parser.parse_args()


async def main():
    args = parse_args()

    result = await provision_tenant(
        tenant_name=args.name,
        subdomain=args.subdomain,
        admin_name=args.admin_name,
        admin_email=args.email,
        admin_password=args.password,
        plan=args.plan,
    )

    print("\nTenant created successfully")
    print("-" * 50)
    print(f"Tenant ID : {result['tenant_id']}")
    print(f"Institute : {result['tenant_name']}")
    print(f"Subdomain : {result['subdomain']}")
    print(f"Admin     : {result['admin_email']}")
    print(f"Plan      : {result['plan']}")
    print("-" * 50)


if __name__ == "__main__":
    asyncio.run(main())
