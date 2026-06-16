import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\mwiti\ZA.go.ke\backend\routes\adminRoutes.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "pool" in line.lower() or "pg" in line.lower() or "db" in line.lower() or "connect" in line.lower():
        print(f"{i+1}: {line.strip()}")
