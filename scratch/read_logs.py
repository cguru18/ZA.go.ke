import json

log_path = r"C:\Users\mwiti\.gemini\antigravity\brain\09397605-57cc-4b41-8d23-fc56e2b608bf\.system_generated\logs\transcript.jsonl"
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        step = json.loads(line)
        if step.get("type") == "USER_INPUT":
            content = step.get("content", "")
            if "skills" in content.lower():
                print(f"Step {step.get('step_index')}: {content}")
