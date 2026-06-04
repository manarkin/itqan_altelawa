# 🕌 سجل حلقاتي القرآني | Quranic Sessions Hub

Welcome to **Quranic Sessions Hub**, a highly polished, responsive web application designed for students and teachers to track and manage physical or digital Quran recitation circles (حلقات التلاوة والترتيل).

This workspace is fully optimized to be opened and edited seamlessly inside **Visual Studio Code (VS Code)**.

---

## 🛠️ VS Code Quick Start (البدء السريع ببرنامج VS Code)

Follow these steps to open and run the project locally on your computer:

### 1. Requirements
Ensure you have the following installed:
* **Node.js** (v18 or higher recommended)
* **npm** (comes packaged with Node.js)
* **VS Code**

### 2. Open in VS Code
1. Open VS Code.
2. Select **File > Open Folder...** (أو "فتح مجلد" من قائمة ملف).
3. Choose the directory containing this project.

### 3. Install Recommended Extensions
When you open this workspace for the first time, VS Code will prompt you with a notification in the bottom-right corner:
> *"Folder contains recommended extensions for this workspace."*
>
Click **Install All** to automatically setup:
* **Tailwind CSS IntelliSense** — For responsive autocompletion with Tailwind design variables.
* **Prettier** — For elegant, deterministic automatic formatting.
* **ESLint** — To spot typescript or logical bugs instantly.

### 4. Install Dependencies
Open the built-in VS Code Terminal (`Ctrl + ~` or `Cmd + ~`) and install packages:
```bash
npm install
```

### 5. Start Active Local Development
Run the local dev server in the terminal:
```bash
npm run dev
```
The server will boot up and be accessible locally at `http://localhost:3000`.

---

## 📂 Project Structure (بنية الملفات والمجلدات)

Here is a guide to help you navigate files inside the editor:

* **`.vscode/`** — Workspace configurations, debug scripts, and extension recommendations.
* **`src/`** — Core application code.
  * **`src/main.tsx`** — React launcher entry.
  * **`src/App.tsx`** — Application dashboard router and login portal.
  * **`src/types.ts`** — TypeScript interface types including session structures.
  * **`src/data.ts`** — Prepopulated static mock-data and session objects.
  * **`src/components/`** — Visual dashboard screens.
    * **`MySession.tsx`** — Main user screen containing Quranic sessions view, personalized themes, customizable colors, responsive banners, and teacher utility toolsets.
  * **`src/index.css`** — Global styling, typography imports (Inter & JetBrains Mono), and Tailwind design parameters.
* **`package.json`** — Script instructions and dependency tracking.
* **`metadata.json`** — Application metadata.

---

## 🎨 Theme Customization (تخصيص المظهر والصورة)

We have implemented an elegant custom styling dynamic where modifying session themes instantly adapts color tokens across all lists, badges, borders, buttons, and visual overlays:
* Teachers can directly configure both the **Primary Accent Color** (using preset tiles or custom hex-code input) and choose or specify a custom **Cover Banner Theme Photo Background**.
* The application reads these records dynamically and injects responsive CSS variable overrides at runtime.

---

## 🚀 Key Scripts (أوامر التشغيل)

You can call these scripts inside the VS Code terminal:

* **`npm run dev`** — Starts the local live-reload development server.
* **`npm run build`** — Compiles the codebase into highly optimized browser static files inside `dist/`.
* **`npm run lint`** — Performs deep static analysis compilation tests to assert Type-safety.
* **`npm run clean`** — Sweeps build outputs.

---

## 🔮 Future Development Guidelines (إرشادات التطوير المستقبلية)

To guarantee that the codebase remains fully compatible with VS Code and standard build tools for future revisions:
1. **Maintain Type Safety**: Always introduce types or interfaces directly inside `src/types.ts`.
2. **Dynamic Styling**: When applying dynamic style colors, bind them through inline variables (e.g. `style={{ backgroundColor: color }}`) or customized inline style blocks rather than generating class names that Tailwind's parser cannot detect.
3. **Global CSS**: Do not create additional loose `.css` files. Place all structural rules inside `src/index.css`.
4. **Icons**: Import all icons strictly from `lucide-react` to keep layout representations light and standardized.
