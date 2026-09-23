import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Copy, Check, Sparkles, RefreshCw, ShieldCheck,
  Lock, Unlock, Monitor, Smartphone, Terminal,
  Image as ImageIcon, Sun, ChevronDown, ChevronUp
} from 'lucide-react';

const INITIAL_TOKENS = {
  primary: "#06b6d4", secondary: "#a855f7", accent: "#f43f5e",
  surface: "#0f172a", background: "#020617", text: "#f8fafc",
};

export default function App() {
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [scales, setScales] = useState({});
  const [prompt, setPrompt] = useState("");
  const [paletteName, setPaletteName] = useState("Cyberpunk Engine");
  const [typography, setTypography] = useState({ headingFont: "'Space Grotesk'", bodyFont: "'Inter'" });
  const [wcag, setWcag] = useState({ ratio: 18.2, is_aa: true });
  const [locked, setLocked] = useState({});
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [previewTab, setPreviewTab] = useState("hero");
  const [expandedToken, setExpandedToken] = useState(null);
  const [showCodeInspector, setShowCodeInspector] = useState(false);

  useEffect(() => {
    const linkId = "studio-dynamic-fonts";
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${typography.headingFont.replace(/[']/g, '').replace(/\s+/g, "+")}:wght@600;800&family=${typography.bodyFont.replace(/[']/g, '').replace(/\s+/g, "+")}:wght@400;500;600&display=swap`;
  }, [typography]);

  const fetchPalette = useCallback(async (overridePrompt = prompt) => {
    setLoading(true);
    try {
      const lockedTokens = {};
      Object.keys(locked).forEach((key) => { if (locked[key]) lockedTokens[key] = tokens[key]; });

      const res = await fetch("http://127.0.0.1:8000/api/palettes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibe: overridePrompt, locked_tokens: lockedTokens })
      });

      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens);
        setScales(data.scales);
        setPaletteName(data.name);
        setWcag(data.wcag);
        setTypography(data.typography);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [locked, tokens, prompt]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT") {
        e.preventDefault(); fetchPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fetchPalette]);

  const copyToClipboard = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const getCSSVars = () => {
    let css = `:root {\n`;
    Object.entries(tokens).forEach(([k, v]) => { css += `  --color-${k}: ${v};\n`; });
    Object.entries(scales).forEach(([tokenKey, shadeObj]) => {
      css += `\n  /* ${tokenKey} shades */\n`;
      Object.entries(shadeObj).forEach(([weight, hex]) => {
        css += `  --color-${tokenKey}-${weight}: ${hex};\n`;
      });
    });
    css += `}`;
    return css;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-cyan-500 selection:text-black flex flex-col relative">

      <div className="max-w-7xl mx-auto w-full flex-1 space-y-10 pb-20">

        {/* Header & NLP Prompt */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold tracking-wide uppercase mb-2">
              <Sparkles className="w-4 h-4" /> Design System Copilot
            </div>
            <h1 className="text-3xl font-extrabold text-white">Semantic AI Studio</h1>
          </div>

          <div className="flex-1 max-w-xl flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-2xl shadow-inner">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPalette()}
              placeholder="Describe a vibe... (e.g. 'Luxury Fintech', 'Neon Cyberpunk')"
              className="flex-1 bg-transparent border-none text-sm text-white px-3 focus:outline-none placeholder-slate-500"
            />
            <button
              onClick={() => fetchPalette()}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Generate
            </button>
          </div>
        </header>

        {/* Tokens & Shade Scale Expander */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white capitalize">{paletteName}</h2>
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold border ${wcag?.is_aa ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300' : 'bg-rose-950/70 border-rose-700 text-rose-300'}`}>
              <ShieldCheck className="w-4 h-4" /> WCAG Contrast: {wcag?.ratio}:1
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(tokens).map(([name, hex]) => {
              const isLocked = !!locked[name];
              const isExpanded = expandedToken === name;
              return (
                <div key={name} className="flex flex-col">
                  <div className={`relative bg-slate-900 border rounded-2xl p-3 transition-all ${isLocked ? 'border-cyan-500 ring-1 ring-cyan-500/50' : 'border-slate-800'}`}>
                    <div className="h-20 w-full rounded-xl relative flex justify-end p-2 cursor-pointer shadow-inner" style={{ backgroundColor: hex }}>
                      <button onClick={(e) => { e.stopPropagation(); setLocked(prev => ({ ...prev, [name]: !prev[name] })); }} className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/70 shadow-md">
                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{name}</p>
                        <p className="text-xs font-mono font-medium text-slate-200">{hex}</p>
                      </div>
                      <button onClick={() => setExpandedToken(isExpanded ? null : name)} className="p-1 bg-slate-800 rounded text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 50-900 Shade Drawer */}
                  {isExpanded && scales[name] && (
                    <div className="mt-2 flex flex-col gap-1 bg-slate-900 border border-slate-800 p-2 rounded-xl animate-in fade-in slide-in-from-top-2">
                      {Object.entries(scales[name]).map(([weight, shadeHex]) => (
                        <div key={weight} className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(`${name}-${weight}`, shadeHex)}>
                          <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: shadeHex }} />
                          <span className="text-[10px] font-mono w-6 text-slate-500">{weight}</span>
                          <span className="text-[10px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{shadeHex}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Live UI Mockup */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setPreviewTab("hero")} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${previewTab === "hero" ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}><Monitor className="w-4 h-4" /> SaaS Platform</button>
              <button onClick={() => setPreviewTab("mobile")} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${previewTab === "mobile" ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}><Smartphone className="w-4 h-4" /> Mobile App</button>
            </div>
            <button onClick={() => setShowCodeInspector(!showCodeInspector)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" /> CSS Inspector
            </button>
          </div>

          <div className="rounded-3xl p-8 md:p-12 transition-colors duration-500 shadow-2xl border" style={{ backgroundColor: tokens.background, color: tokens.text, fontFamily: typography.bodyFont, borderColor: `${tokens.text}18` }}>
            {previewTab === "hero" ? (
              <div className="max-w-3xl mx-auto space-y-6 text-center py-10">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: tokens.secondary, color: tokens.surface }}>Design Tokens v2.0</span>
                <h3 className="text-4xl md:text-6xl font-black tracking-tight leading-tight" style={{ fontFamily: typography.headingFont }}>Build accessible software, faster.</h3>
                <p className="text-sm md:text-base opacity-80 max-w-xl mx-auto">This entire interface is bound dynamically to the API. Adjust the mood via NLP, verify contrast ratios, and copy CSS variables instantly.</p>
                <div className="flex justify-center gap-4 pt-4">
                  <button className="px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all" style={{ backgroundColor: tokens.primary, color: tokens.surface }}>Deploy System</button>
                  <button className="px-8 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-white/5" style={{ borderColor: tokens.primary, color: tokens.primary }}>View Docs</button>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-white/5 p-6 rounded-3xl border space-y-6" style={{ backgroundColor: tokens.surface, borderColor: `${tokens.text}10` }}>
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner" style={{ backgroundColor: tokens.primary, color: tokens.surface, fontFamily: typography.headingFont }}>AJ</div>
                  <div className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center" style={{ borderColor: tokens.text }}><Sparkles className="w-4 h-4 opacity-50" /></div>
                </div>
                <div>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Total Balance</p>
                  <h4 className="text-4xl font-black mt-1" style={{ fontFamily: typography.headingFont }}>$24,892.00</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button className="py-3 rounded-2xl text-xs font-bold shadow-md" style={{ backgroundColor: tokens.primary, color: tokens.surface }}>Send Money</button>
                  <button className="py-3 rounded-2xl text-xs font-bold shadow-md" style={{ backgroundColor: tokens.accent, color: tokens.surface }}>Request</button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Live CSS Code Inspector Drawer */}
      {showCodeInspector && (
        <div className="fixed bottom-0 left-0 right-0 h-80 bg-slate-900 border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
            <h3 className="text-sm font-bold flex items-center gap-2"><Terminal className="w-4 h-4 text-cyan-400" /> Live CSS Variables</h3>
            <div className="flex gap-3">
              <button onClick={() => copyToClipboard('css', getCSSVars())} className="text-xs bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                {copiedKey === 'css' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy All
              </button>
              <button onClick={() => setShowCodeInspector(false)} className="text-xs text-slate-400 hover:text-white px-2">Close</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-[#0d1117]">
            <pre className="text-[11px] md:text-xs font-mono text-cyan-300/80 leading-relaxed">
              {getCSSVars()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}