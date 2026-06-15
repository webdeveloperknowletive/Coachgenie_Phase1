import asyncio
import argparse

from backend.app.services.tenant_provisioning import (
    deactivate_tenant
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Deactivate a tenant"
    )

    parser.add_argument(
        "--subdomain",
        required=True,
        help="Tenant subdomain"
    )

    return parser.parse_args()


async def main():
    args = parse_args()

    result = await deactivate_tenant(
        subdomain=args.subdomain
    )

    print("\nTenant Deactivated Successfully")
    print("-" * 50)
    print(f"Tenant ID : {result['tenant_id']}")
    print(f"Name      : {result['tenant_name']}")
    print(f"Subdomain : {result['subdomain']}")
    print(f"Status    : INACTIVE")
    print("-" * 50)


if __name__ == "__main__":
    asyncio.run(main())