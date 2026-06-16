import os

backend_path = r"C:\Users\mwiti\ZA.go.ke\backend"
keywords = ["postgres", "supabase", "pool", "pg", "sql", "db"]

for root, dirs, files in os.walk(backend_path):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        if file.endswith(".js"):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                found = [kw for kw in keywords if kw in content.lower()]
                if found:
                    print(f"File: {os.path.relpath(file_path, backend_path)} contains {found}")
            except Exception as e:
                print(f"Error reading {file}: {e}")
