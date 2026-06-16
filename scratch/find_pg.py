with open(r"C:\Users\mwiti\ZA.go.ke\backend\routes\adminRoutes.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "pg" in line:
            print(f"{i+1}: {line.strip()}")
