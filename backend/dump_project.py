import os

EXCLUDE = ["venv", "__pycache__", "migrations"]

with open("project_dump.txt", "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk("."):
        if any(ex in root for ex in EXCLUDE):
            continue

        for file in files:
            path = os.path.join(root, file)
            out.write(f"\n===== {path} =====\n")
            try:
                with open(path, "r", encoding="utf-8") as f:
                    out.write(f.read())
            except:
                out.write("[binary file skipped]")
