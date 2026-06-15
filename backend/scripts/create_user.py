import asyncio
import argparse

from backend.app.services.user_management import (
    create_user
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create a new user"
    )

    parser.add_argument(
        "--subdomain",
        required=True,
        help="Tenant subdomain"
    )

    parser.add_argument(
        "--name",
        required=True,
        help="User name"
    )

    parser.add_argument(
        "--email",
        required=True,
        help="User email"
    )

    parser.add_argument(
        "--password",
        required=True,
        help="User password"
    )

    parser.add_argument(
        "--role",
        default="USER",
        help="User role"
    )

    return parser.parse_args()


async def main():
    args = parse_args()

    result = await create_user(
        subdomain=args.subdomain,
        name=args.name,
        email=args.email,
        password=args.password,
        role=args.role,
    )

    print("\nUser Created Successfully")
    print("-" * 50)
    print(f"User ID : {result['user_id']}")
    print(f"Name    : {result['name']}")
    print(f"Email   : {result['email']}")
    print(f"Role    : {result['role']}")
    print(f"Tenant  : {result['tenant_name']}")
    print("-" * 50)


if __name__ == "__main__":
    asyncio.run(main())