import os
import csv
import re


def sync_students():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    dataset_dir = os.path.join(data_dir, "dataset")
    students_csv_path = os.path.join(data_dir, "students.csv")
    credentials_csv_path = os.path.join(data_dir, "student_credentials.csv")

    if not os.path.exists(dataset_dir):
        print(f"[ERROR] Dataset directory not found at: {dataset_dir}")
        return

    # Load existing student data if present
    existing_students = {}
    if os.path.exists(students_csv_path):
        with open(students_csv_path, mode="r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                roll = row.get("Roll No", "").strip()
                if roll:
                    existing_students[roll] = row

    # Load existing student credentials if present
    existing_credentials = {}
    if os.path.exists(credentials_csv_path):
        with open(credentials_csv_path, mode="r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                roll = row.get("Roll_No", "").strip()
                if roll:
                    existing_credentials[roll] = row

    # Parse dataset directory for student folders (Format: Name_RollNo)
    dataset_folders = [
        f for f in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, f))
    ]

    updated_rows = []
    updated_credentials = []

    for folder in sorted(dataset_folders):
        # Extract Roll No and Name
        if "_" in folder:
            parts = folder.rsplit("_", 1)
            name_part = parts[0].replace("_", " ")
            roll_part = parts[1]
        else:
            name_part = folder
            roll_part = "000"

        roll_no = roll_part.strip()
        name = name_part.strip()

        # Determine clean default email
        default_email = f"{name.lower().replace(' ', '')}.{roll_no.lower()}@smartface.pro"

        # Check if student exists in current CSV
        if roll_no in existing_students:
            existing_data = existing_students[roll_no]
            current_email = existing_data.get("Email", "").strip()
            if not current_email or current_email == "update_email@college.edu":
                email = default_email
            else:
                email = current_email

            updated_rows.append(
                {
                    "Roll No": roll_no,
                    "Name": existing_data.get("Name", "").strip() or name,
                    "Mobile": existing_data.get("Mobile", "").strip(),
                    "Email": email,
                    "Parent_Phone": existing_data.get("Parent_Phone", "").strip(),
                }
            )
        else:
            # New student from dataset
            updated_rows.append(
                {
                    "Roll No": roll_no,
                    "Name": name,
                    "Mobile": "",
                    "Email": default_email,
                    "Parent_Phone": "",
                }
            )

        # Sync credentials
        digits = "".join(filter(str.isdigit, roll_no))[-3:] or "001"
        default_password = f"{name.split()[0]}#{digits}"
        if roll_no in existing_credentials:
            cred_data = existing_credentials[roll_no]
            cred_email = cred_data.get("Email", "").strip() or updated_rows[-1]["Email"]
            cred_password = cred_data.get("Password", "").strip() or default_password
            updated_credentials.append(
                {"Roll_No": roll_no, "Email": cred_email, "Password": cred_password}
            )
        else:
            updated_credentials.append(
                {
                    "Roll_No": roll_no,
                    "Email": updated_rows[-1]["Email"],
                    "Password": default_password,
                }
            )

    # Write updated list back to students.csv
    fieldnames = ["Roll No", "Name", "Mobile", "Email", "Parent_Phone"]
    with open(students_csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)

    # Write updated credentials back to student_credentials.csv
    cred_fieldnames = ["Roll_No", "Email", "Password"]
    with open(credentials_csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cred_fieldnames)
        writer.writeheader()
        writer.writerows(updated_credentials)

    print(f"[SUCCESS] Successfully updated {students_csv_path} with {len(updated_rows)} students.")
    print(
        f"[SUCCESS] Successfully updated {credentials_csv_path} with {len(updated_credentials)} credentials."
    )


if __name__ == "__main__":
    sync_students()
