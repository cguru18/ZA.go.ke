with open(r"C:\Users\mwiti\Downloads\Obsidian\mySpace\02-Projects\AquaServe\Codebase-Mirror\server\server.js.md", "r", encoding="utf-8") as f:
    content = f.read()

keywords = ["postgres", "supabase", "pg", "sql", "pool"]
for kw in keywords:
    if kw in content.lower():
        print(f"Found keyword: {kw}")
