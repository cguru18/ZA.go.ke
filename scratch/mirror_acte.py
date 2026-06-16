import os

# Source files mapping
src_root = r"C:\Users\mwiti\ACTE"
vault_root = r"C:\Users\mwiti\Downloads\Obsidian\mySpace\02-Projects\ACTE\Codebase-Mirror"

backend_files = {
    "schema.prisma": (r"acte-backend-service\prisma\schema.prisma", "prisma", []),
    "db.ts": (r"acte-backend-service\src\config\database.ts", "typescript", []),
    "setupTrigger.ts": (r"acte-backend-service\src\config\setupTrigger.ts", "typescript", []),
    "ingestController.ts": (r"acte-backend-service\src\controllers\ingestController.ts", "typescript", ["[[ledgerController.ts]]"]),
    "ingestRoutes.ts": (r"acte-backend-service\src\routes\ingestRoutes.ts", "typescript", [])
}

frontend_files = {
    "FinanceGraphCanvas.tsx": (r"acte-mobile-client\src\components\charts\FinanceGraphCanvas.tsx", "tsx", ["[[financeStore.ts]]", "[[useFinanceStore.ts]]"]),
    "sqliteService.ts": (r"acte-mobile-client\src\services\sqliteService.ts", "typescript", []),
    "smsListener.ts": (r"acte-mobile-client\src\services\smsListener.ts", "typescript", ["[[ingestController.ts]]"]),
    "fifoEngine.ts": (r"acte-mobile-client\src\services\fifoEngine.ts", "typescript", []),
    "mockSeeder.ts": (r"acte-mobile-client\src\services\mockSeeder.ts", "typescript", []),
    "financeStore.ts": (r"acte-mobile-client\src\store\financeStore.ts", "typescript", []),
    "App.tsx": (r"acte-mobile-client\App.tsx", "tsx", [])
}

# Create output directories
os.makedirs(os.path.join(vault_root, "Backend"), exist_ok=True)
os.makedirs(os.path.join(vault_root, "Frontend"), exist_ok=True)

# Helper to generate Markdown content
def generate_md(filename, code, lang, rel_links):
    links_str = " ".join(rel_links)
    content = f"""---
tags: [project/acte, system/source-code]
---

Upstream link: [[ACTE-Core-Blueprint]]
{"Relational links: " + links_str if rel_links else ""}

# `{filename}`

```{lang}
{code}
```
"""
    return content

# Process Backend Files
for name, (path, lang, links) in backend_files.items():
    src_path = os.path.join(src_root, path)
    dest_path = os.path.join(vault_root, "Backend", f"{name}.md")
    try:
        with open(src_path, "r", encoding="utf-8") as f:
            code = f.read()
        md_content = generate_md(name, code, lang, links)
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"[+] Mirrored backend file: {name}")
    except Exception as e:
        print(f"[-] Error mirroring {name}: {e}")

# Create ledgerController.ts.md placeholder
ledger_controller_content = """---
tags: [project/acte, system/source-code]
---

Upstream link: [[ACTE-Core-Blueprint]]

# `ledgerController.ts`

> [!NOTE]
> **Modular Architecture Consolidation**
> In release `v1.0.0`, the ledger line balance and double-entry transaction write operations are executed atomically within the `ingestController.ts` Fastify webhook wrapper.
> This file is a placeholder mapping subsequent engineering updates where the double-entry database writer is decoupled into a dedicated helper module.
"""
with open(os.path.join(vault_root, "Backend", "ledgerController.ts.md"), "w", encoding="utf-8") as f:
    f.write(ledger_controller_content)
print("[+] Created ledgerController.ts.md placeholder")

# Process Frontend Files
for name, (path, lang, links) in frontend_files.items():
    src_path = os.path.join(src_root, path)
    dest_path = os.path.join(vault_root, "Frontend", f"{name}.md")
    try:
        with open(src_path, "r", encoding="utf-8") as f:
            code = f.read()
        md_content = generate_md(name, code, lang, links)
        # Handle useFinanceStore alias in financeStore.ts.md
        if name == "financeStore.ts":
            md_content = "Alias: [[useFinanceStore.ts]]\n" + md_content
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"[+] Mirrored frontend file: {name}")
    except Exception as e:
        print(f"[-] Error mirroring {name}: {e}")

# Generate ACTE-Code-Summary-Index.md
summary_index = """# ACTE - Code Summary Index
**Metadata**
- **Tags:** #project/acte/index
- **Project Index:** [[ACTE-Architecture-Blueprint]]
- **Master Index:** [[mySpace-Main-Index]]

---

## 1. Architectural Summary & Port Directory

| Mirrored File Name | Code Layer / Type | Primary Responsibility | Port / System Scope |
| :--- | :--- | :--- | :--- |
| [[schema.prisma]] | Database Schema | PostgreSQL relational models & Chart of Accounts definition | PostgreSQL DB Layer |
| [[db.ts]] | DB Config | Supabase PostgreSQL Connection Pooler | Supabase Proxy (max: 5) |
| [[setupTrigger.ts]] | Database Migration | Installs deferrable constraint trigger for double-entry parity | PostgreSQL Triggers |
| [[ingestController.ts]] | Fastify Controller | M-Pesa webhooks signature verification & idempotency validation | HTTP Ingest Gateway |
| [[ledgerController.ts]] | Fastify Controller | (Future Scope) Decoupled balanced accounting writer | HTTP Ingest Gateway |
| [[ingestRoutes.ts]] | Fastify Router | API route registration for incoming mobile money callbacks | Port `5050` (`/api/v1`) |
| [[FinanceGraphCanvas.tsx]] | UI Component | Force-directed financial nodes visualizer (D3 + Reanimated) | React Native Canvas View |
| [[sqliteService.ts]] | Local Storage | Encrypted local SQLite DB cache for offline-first resilience | SQLite (expo-sqlite) |
| [[smsListener.ts]] | local service | Intercepts Pochi la Biashara SMS confirmations and logs transactions | Android native service |
| [[fifoEngine.ts]] | local service | Evaluates Cost of Goods Sold (COGS) utilizing FIFO queues | Local CPU calculation |
| [[mockSeeder.ts]] | local service | Seeds mock inventory data and records manual sales offline | Local CPU execution |
| [[financeStore.ts]] | Zustand State | Handles global application layout state and SQLite syncing | Client State Manager |
| [[App.tsx]] | Client Entry | Root view rendering overview statistics and action panels | Port `8081` (Expo CLI) |
"""

with open(r"C:\Users\mwiti\Downloads\Obsidian\mySpace\02-Projects\ACTE\ACTE-Code-Summary-Index.md", "w", encoding="utf-8") as f:
    f.write(summary_index)
print("[+] Created ACTE-Code-Summary-Index.md")
