with open(r"C:\Users\mwiti\ZA.go.ke\backend\routes\adminRoutes.js", "r", encoding="utf-8") as f:
    for line in f:
        if "router." in line:
            print(line.strip())
