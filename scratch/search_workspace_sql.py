import os

workspace_path = r"C:\Users\mwiti\ZA.go.ke"
keywords = ["postgres", "supabase", "pg", "sequelize", "prisma"]

for root, dirs, files in os.walk(workspace_path):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        if file.endswith((".js", ".jsx", ".json", ".md")):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                found = [kw for kw in keywords if kw in content.lower()]
                if found:
                    print(f"File: {os.path.relpath(file_path, workspace_path)} contains {found}")
            except Exception as e:
                print(f"Error reading {file}: {e}")
