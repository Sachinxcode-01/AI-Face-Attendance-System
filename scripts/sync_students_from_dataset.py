import os
import csv
import re

def sync_students():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    dataset_dir = os.path.join(data_dir, "dataset")
    students_csv_path = os.path.join(data_dir, "students.csv")

    if not os.path.exists(dataset_dir):
        print(f"[ERROR] Dataset directory not found at: {dataset_dir}")
        return

    # Load existing student data if present
    existing_students = {}
    if os.path.exists(students_csv_path):
        with open(students_csv_path, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                roll = row.get("Roll No", "").strip()
                if roll:
                    existing_students[roll] = row

    # Parse dataset directory for student folders (Format: Name_RollNo or FirstName_LastName_RollNo)
    dataset_folders = [f for f in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, f))]
    
    updated_rows = []
    
    for folder in sorted(dataset_folders):
        # Extract Roll No and Name
        if "_" in folder:
            parts = folder.rsplit("_", 1)
            name_part = parts[0]
            roll_part = parts[1]
        else:
            name_part = folder
            roll_part = "000"

        roll_no = roll_part.strip()
        name = name_part.strip()

        # Check if student exists in current CSV
        if roll_no in existing_students:
            existing_data = existing_students[roll_no]
            # Use existing contact info if available, update name if needed
            updated_rows.append({
                "Roll No": roll_no,
                "Name": existing_data.get("Name", "").strip() or name,
                "Mobile": existing_data.get("Mobile", "").strip(),
                "Email": existing_data.get("Email", "").strip() or "update_email@college.edu",
                "Parent_Phone": existing_data.get("Parent_Phone", "").strip()
            })
        else:
            # New student from dataset
            updated_rows.append({
                "Roll No": roll_no,
                "Name": name,
                "Mobile": "",
                "Email": "update_email@college.edu",
                "Parent_Phone": ""
            })

    # Write updated list back to students.csv
    fieldnames = ["Roll No", "Name", "Mobile", "Email", "Parent_Phone"]
    with open(students_csv_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)

    print(f"[SUCCESS] Successfully updated {students_csv_path} with {len(updated_rows)} students from dataset.")

if __name__ == "__main__":
    sync_students()
