import asyncio
import argparse
import csv

from backend.app.services.tenant_provisioning import (
    create_tenant
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Bulk Create Tenants"
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

    print("\nStarting bulk tenant creation...\n")

    with open(args.file, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:

            try:
                result = await create_tenant(
                    tenant_name=row["name"],
                    subdomain=row["subdomain"],
                    admin_name=row["admin_name"],
                    admin_email=row["email"],
                    admin_password=row["password"],
                    plan=row.get("plan", "basic"),
                )

                success_count += 1

                print(
                    f"✓ Created: "
                    f"{result['tenant_name']}"
                )

            except Exception as e:

                failed_count += 1

                print(
                    f"✗ Failed: "
                    f"{row.get('name', 'Unknown')} "
                    f"-> {str(e)}"
                )

    print("\n" + "=" * 50)
    print("Bulk Import Completed")
    print("=" * 50)
    print(f"Successful : {success_count}")
    print(f"Failed     : {failed_count}")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())