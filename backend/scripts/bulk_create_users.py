import asyncio
import argparse
import csv

from backend.app.services.user_management import (
    create_user
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Bulk Create Users"
    )

    parser.add_argument(
        "--subdomain",
        required=True,
        help="Tenant subdomain"
    )

    parser.add_argument(
        "--file",
        required=True,
        help="CSV file path"
    )

    return parser.parse_args()


async def main():
    args = parse_args()

    success_count = 0
    failed_count = 0

    with open(
        args.file,
        "r",
        encoding="utf-8"
    ) as csv_file:

        reader = csv.DictReader(csv_file)

        for row in reader:

            try:

                await create_user(
                    subdomain=args.subdomain,
                    name=row["name"],
                    email=row["email"],
                    password=row["password"],
                    role=row.get(
                        "role",
                        "USER"
                    ),
                )

                success_count += 1

                print(
                    f"✓ Created: "
                    f"{row['email']}"
                )

            except Exception as e:

                failed_count += 1

                print(
                    f"✗ Failed: "
                    f"{row['email']} "
                    f"-> {str(e)}"
                )

    print("\n" + "=" * 50)
    print("Bulk User Import Completed")
    print("=" * 50)
    print(f"Success : {success_count}")
    print(f"Failed  : {failed_count}")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())