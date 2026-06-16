import os

frontend_path = r"C:\Users\mwiti\ZA.go.ke\frontend"
for root, dirs, files in os.walk(frontend_path):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        if file.endswith((".js", ".jsx")):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                if "shutdown" in content.lower():
                    print(f"File: {os.path.relpath(file_path, frontend_path)} contains shutdown")
            except Exception as e:
                print(f"Error reading {file}: {e}")
