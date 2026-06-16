import os

backend_dir = r"C:\Users\mwiti\ZA.go.ke\backend"
for root, dirs, files in os.walk(backend_dir):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for f in files:
        print(os.path.join(root, f))
