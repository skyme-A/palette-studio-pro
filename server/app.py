import colorsys
import math
import random
import io
import os
from typing import Dict, Optional, Any
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Design Token Copilot API")

# Allow Dev server CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Color Science & Shades -----------------

def hex_to_rgb(hex_code: str):
    h = hex_code.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))

def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{max(0, min(255, int(r))):02x}{max(0, min(255, int(g))):02x}{max(0, min(255, int(b))):02x}"

def generate_shades(hex_color: str) -> Dict[str, str]:
    r, g, b = hex_to_rgb(hex_color)
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    
    # Tailwind-style lightness distribution
    steps = {
        "50": 0.95, "100": 0.90, "200": 0.80, "300": 0.70,
        "400": 0.60, "500": 0.50, "600": 0.40, "700": 0.30,
        "800": 0.20, "900": 0.10, "950": 0.05
    }
    
    shades = {}
    for weight, target_l in steps.items():
        rgb = [int(c * 255) for c in colorsys.hls_to_rgb(h, target_l, s)]
        shades[weight] = rgb_to_hex(*rgb)
    return shades

def get_luminance(hex_code: str) -> float:
    r, g, b = [x / 255.0 for x in hex_to_rgb(hex_code)]
    gamma = lambda c: c / 12.92 if c <= 0.03928 else math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b)

def get_contrast_ratio(hex1: str, hex2: str) -> float:
    lum1, lum2 = get_luminance(hex1), get_luminance(hex2)
    return round((max(lum1, lum2) + 0.05) / (min(lum1, lum2) + 0.05), 2)

def auto_tune_contrast(text_hex: str, bg_hex: str, target: float = 4.6) -> str:
    if get_contrast_ratio(text_hex, bg_hex) >= target:
        return text_hex
    bg_lum = get_luminance(bg_hex)
    r, g, b = hex_to_rgb(text_hex)
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    step = 0.05 if bg_lum < 0.5 else -0.05
    for _ in range(20):
        l = max(0.02, min(0.98, l + step))
        candidate = rgb_to_hex(*[int(c * 255) for c in colorsys.hls_to_rgb(h, l, s)])
        if get_contrast_ratio(candidate, bg_hex) >= target:
            return candidate
    return "#ffffff" if bg_lum < 0.5 else "#09090b"

# ----------------- Semantic NLP Prompt Engine -----------------

def parse_semantic_vibe(vibe: str):
    v = vibe.lower()
    if any(x in v for x in ["luxury", "gold", "wealth", "premium"]): return 0.12, "analogous"
    if any(x in v for x in ["cyberpunk", "neon", "synth", "future"]): return 0.85, "triadic"
    if any(x in v for x in ["nature", "forest", "eco", "mint"]): return 0.35, "analogous"
    if any(x in v for x in ["ocean", "water", "tech", "cloud"]): return 0.58, "complementary"
    if any(x in v for x in ["sunset", "fire", "warm", "spicy"]): return 0.04, "analogous"
    if any(x in v for x in ["dark", "obsidian", "void"]): return random.random(), "monochromatic"
    return random.random(), "complementary"

def generate_palette_engine(vibe: str, harmony_override: str) -> Dict[str, Any]:
    base_hue, suggested_harmony = parse_semantic_vibe(vibe)
    active_harmony = harmony_override if harmony_override != "auto" else suggested_harmony
    is_dark = "dark" in vibe.lower() or random.choice([True, False])

    if active_harmony == "analogous":
        sec_hue, acc_hue = (base_hue + 0.08) % 1.0, (base_hue + 0.16) % 1.0
    elif active_harmony == "triadic":
        sec_hue, acc_hue = (base_hue + 0.33) % 1.0, (base_hue + 0.66) % 1.0
    elif active_harmony == "monochromatic":
        sec_hue, acc_hue = base_hue, base_hue
    else:
        sec_hue, acc_hue = (base_hue + 0.10) % 1.0, (base_hue + 0.50) % 1.0

    primary = rgb_to_hex(*[int(c * 255) for c in colorsys.hls_to_rgb(base_hue, 0.55, 0.75)])
    secondary = rgb_to_hex(*[int(c * 255) for c in colorsys.hls_to_rgb(sec_hue, 0.50, 0.65)])
    accent = rgb_to_hex(*[int(c * 255) for c in colorsys.hls_to_rgb(acc_hue, 0.60, 0.85)])

    if is_dark:
        bg, surf = colorsys.hls_to_rgb(base_hue, 0.06, 0.18), colorsys.hls_to_rgb(base_hue, 0.12, 0.24)
        text_hex = "#f8fafc"
    else:
        bg, surf = colorsys.hls_to_rgb(base_hue, 0.96, 0.12), (1.0, 1.0, 1.0)
        text_hex = "#0f172a"

    tokens = {
        "primary": primary, "secondary": secondary, "accent": accent,
        "surface": rgb_to_hex(*[int(c * 255) for c in surf]),
        "background": rgb_to_hex(*[int(c * 255) for c in bg]),
        "text": text_hex,
    }
    
    # Generate scales
    scales = {k: generate_shades(v) for k, v in tokens.items()}
    
    return tokens, scales, active_harmony

# ----------------- Endpoints -----------------

class GenerateRequest(BaseModel):
    vibe: str = ""
    harmony: str = "auto"
    locked_tokens: Dict[str, str] = {}

@app.post("/api/palettes/generate")
def generate(req: GenerateRequest):
    tokens, scales, active_harmony = generate_palette_engine(req.vibe, req.harmony)
    
    for k, v in req.locked_tokens.items():
        if v:
            tokens[k] = v
            scales[k] = generate_shades(v)

    typography = random.choice([
        {"heading": "Syne", "body": "Inter", "headingFont": "Syne", "bodyFont": "Inter"},
        {"heading": "Space Grotesk", "body": "JetBrains Mono", "headingFont": "'Space Grotesk'", "bodyFont": "'JetBrains Mono'"},
        {"heading": "Playfair Display", "body": "DM Sans", "headingFont": "'Playfair Display'", "bodyFont": "'DM Sans'"}
    ])

    return {
        "name": f"{req.vibe.title() if req.vibe else 'Generated'} {active_harmony.title()}",
        "tokens": tokens,
        "scales": scales,
        "typography": typography,
        "wcag": {
            "ratio": get_contrast_ratio(tokens["text"], tokens["background"]),
            "is_aa": get_contrast_ratio(tokens["text"], tokens["background"]) >= 4.5
        }
    }

class AutoFixRequest(BaseModel):
    text: str
    background: str

@app.post("/api/palettes/auto-fix")
def auto_fix(req: AutoFixRequest):
    fixed = auto_tune_contrast(req.text, req.background)
    return {"text": fixed, "ratio": get_contrast_ratio(fixed, req.background)}

# ----------------- Production Static Mount -----------------
# Serve React Build when accessing the root
CLIENT_DIST = os.path.join(os.path.dirname(__file__), "..", "client", "dist")

if os.path.isdir(CLIENT_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(CLIENT_DIST, "assets")), name="assets")
    
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        return FileResponse(os.path.join(CLIENT_DIST, "index.html"))