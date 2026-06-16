with open(r"C:\Users\mwiti\ZA.go.ke\frontend\src\pages\AdminDashboard.jsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "shutdown" in line.lower() or "api/" in line:
            print(f"{i+1}: {line.strip()}")
