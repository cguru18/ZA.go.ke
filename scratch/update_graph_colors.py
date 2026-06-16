import json
import os

graph_path = r"C:\Users\mwiti\Downloads\Obsidian\mySpace\.obsidian\graph.json"

with open(graph_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Define new color groups for ACTE
# RGB values calculated from hex:
# #8b5cf6 (Violet) -> 9133302
# #3b82f6 (Blue)   -> 3900150
# #10b981 (Green)  -> 1096065
new_groups = [
    {
        "query": "path:02-Projects/ACTE/Codebase-Mirror/Backend",
        "color": {
            "a": 1,
            "rgb": 9133302
        }
    },
    {
        "query": "path:02-Projects/ACTE/Codebase-Mirror/Frontend",
        "color": {
            "a": 1,
            "rgb": 3900150
        }
    },
    {
        "query": "tag:#project/acte",
        "color": {
            "a": 1,
            "rgb": 1096065
        }
    }
]

# Avoid duplicates by checking if queries already exist
existing_queries = {g["query"] for g in data.get("colorGroups", [])}

added_count = 0
for group in new_groups:
    if group["query"] not in existing_queries:
        data.setdefault("colorGroups", []).insert(0, group) # Insert at start for precedence
        added_count += 1

if added_count > 0:
    with open(graph_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"[+] Successfully added {added_count} color groups to graph.json")
else:
    print("[*] Color groups already exist in graph.json")
