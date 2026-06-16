with open(r"C:\Users\mwiti\ZA.go.ke\backend\routes\adminRoutes.js", "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("router.post('/shutdown'")
if start != -1:
    print(content[start:start+3000])
else:
    print("Not found")
