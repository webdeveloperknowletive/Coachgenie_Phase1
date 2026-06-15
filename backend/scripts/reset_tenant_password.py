import asyncio
import argparse

from backend.app.services.tenant_provisioning import (
    reset_tenant_password
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Reset tenant admin password"
    )

    parser.add_argument(
        "--email",
        required=True,
        help="User email"
    )

    parser.add_argument(
        "--password",
        required=False,
        help="New password (optional)"
    )

    return parser.parse_args()


async def main():
    args = parse_args()

    result = await reset_tenant_password(
        email=args.email,
        new_password=args.password
    )

    print("\nPassword Reset Successful")
    print("-" * 50)
    print(f"Email       : {result['email']}")
    print(f"Tenant Name : {result['tenant_name']}")
    print(f"New Password: {result['new_password']}")
    print("-" * 50)


if __name__ == "__main__":
    asyncio.run(main())