# Palette Studio Pro 🎨
### Full-Stack Intelligent Color Palette Extraction, Generation & Design Studio

[![Production Deploy](https://img.shields.io/badge/Deployment-Live-brightgreen?style=flat&logo=vercel&logoColor=white)](https://palette-studio-pro.vercel.app)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-black?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Hosted-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/Frontend-Vanilla%20%2F%20React-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub](https://img.shields.io/badge/GitHub-skyme--A%2Fpalette--studio--pro-181717?style=flat&logo=github&logoColor=white)](https://github.com/skyme-A/palette-studio-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready full-stack color system engine designed for designers and developers. **Palette Studio Pro** extracts harmonic color palettes from image inputs, generates WCAG-compliant accessible contrast schemes, and exports production tokens for modern design workflows.

🔗 **Live Production App:** [https://palette-studio-pro.vercel.app](https://palette-studio-pro.vercel.app)  
📂 **Source Code Repository:** [https://github.com/skyme-A/palette-studio-pro](https://github.com/skyme-A/palette-studio-pro)

---

## 📌 Features

- **Algorithmic Color Extraction:** Parses input imagery using computational clustering to isolate dominant and accent tonal values.
- **Harmonic Scheme Generator:** Instant generation of complementary, analogous, triadic, split-complementary, and monochromatic palettes.
- **WCAG Accessibility Engine:** Computes real-time foreground/background contrast ratios (AA/AAA compliance) for inclusive UI design.
- **Developer-Ready Token Export:** One-click copy/export to CSS custom properties (`--color-primary`), Tailwind config arrays, SCSS maps, and JSON design tokens.
- **Dual Cloud Architecture:** Fully configured for both Vercel serverless function routing (`api/index.py`) and persistent deployment via Render (`render.yaml`).

---

## 🛠️ Architecture & Tech Stack

- **Client (`/client`):** Responsive interface with interactive color pickers, real-time preview canvas, and dynamic clipboard utilities.
- **Backend (`/server` & `/api`):** Modular Python API running serverless entry points via `api/index.py` for sub-second cold starts.
- **Hosting & Infrastructure:** 
  - **Vercel:** Edge-routed serverless deployment configured via `vercel.json`.
  - **Render:** Cloud containerized deployment configured via `render.yaml`.
- **Core Runtime:** Python 3.10+, Standard Web APIs.

---

## 🚀 Live Demo & Deployment Setup

### Vercel Deployment (Default)
The repository is structured with `vercel.json` and `api/index.py` for direct serverless deployment:
- Entry point: `api/index.py`
- Routing: Configured to route incoming requests cleanly between static assets in `/client` and Python serverless endpoints in `/api`.

### Render Deployment (Alternative)
The included `render.yaml` blueprint provides turnkey configuration to host the backend and client as a managed web service on Render.

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/skyme-A/palette-studio-pro.git](https://github.com/skyme-A/palette-studio-pro.git)
cd palette-studio-pro
