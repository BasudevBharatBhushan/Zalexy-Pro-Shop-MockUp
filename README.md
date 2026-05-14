# StrikePOS (Zalexy Pro Shop Mockup)

This is a complete, data-seeded version of the StrikePOS system.

## 🚀 Quick Start (Windows / Mac)
### Option A: Portable Launcher (Windows Only)
Simply double-click **`LaunchStrikePOS.bat`** in the root folder. It will handle the setup and open the app for you.

### Option B: Manual Setup
1. **Install Dependencies**: `npm install`
2. **Setup Database**: `npx prisma generate`
3. **Run Dev**: `npm run dev`

*The application will be available at http://localhost:3001*

## 🖥️ Desktop Application (Tauri)
We have integrated **Tauri** to allow StrikePOS to run as a native desktop application.

### To run in Desktop Mode (Dev):
```bash
npm run tauri dev
```

### To build a standalone Windows (.exe):
1. **Prerequisite**: Install [Rust](https://rustup.rs/) on your Windows machine.
2. Run: `npm run tauri build`
3. The executable will be generated in `src-tauri/target/release/bundle/msi/`.


## 📁 Project Highlights
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (via Prisma) - File is at `./db/custom.db`
- **Styling**: Tailwind CSS + Shadcn UI
- **Data**: Pre-seeded with 19+ orders, multiple customers, and apparel variants.

## 📄 Documentation
- `strikepos_workflow_guide.md`: Step-by-step functional workflow.
- `strikepos_user_manual.md`: Comprehensive user & role-based guide.
