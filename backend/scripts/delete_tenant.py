import asyncio
import argparse

from backend.app.services.tenant_provisioning import (
    delete_tenant
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Delete a tenant"
    )

    parser.add_argument(
        "--subdomain",
        required=True,
        help="Tenant subdomain"
    )

    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Confirm deletion"
    )

    return parser.parse_args()


async def main():
    args = parse_args()

    if not args.confirm:
        print(
            "\nDeletion requires "
            "--confirm flag."
        )
        return

    result = await delete_tenant(
        subdomain=args.subdomain
    )

    print("\nTenant Deleted Successfully")
    print("-" * 50)
    print(f"Tenant ID : {result['tenant_id']}")
    print(f"Name      : {result['tenant_name']}")
    print(f"Subdomain : {result['subdomain']}")
    print("-" * 50)


if __name__ == "__main__":
    asyncio.run(main())