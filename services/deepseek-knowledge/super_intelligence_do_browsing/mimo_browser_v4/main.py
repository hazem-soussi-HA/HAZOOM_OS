"""MiMo Browser v4 — Main Application Entry Point.
A personal intelligent browser for navigating the WWW with full comfort."""
from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import sys
import time
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from bs4 import BeautifulSoup

# ── Core ──
from mimo_browser_v4.config import BrowserConfig, BrowserMode, TaskContext

# ── Network ──
from mimo_browser_v4.network import DNSOverHTTPS, ConnectionManager, RequestInterceptor

# ── Security ──
from mimo_browser_v4.security.filters import FilterEngine
from mimo_browser_v4.security.fingerprint import FingerprintGuard
from mimo_browser_v4.security.credentials import CredentialVault
from mimo_browser_v4.security.permissions import PermissionManager
from mimo_browser_v4.security.middleware import (
    AuthMiddleware, RateLimiter, SharedSession, validate_proxy_url,
)

# ── Intelligence ──
from mimo_browser_v4.intelligence.brain import Brain
from mimo_browser_v4.intelligence.planner import Planner
from mimo_browser_v4.intelligence.analyzer import PageAnalyzer
from mimo_browser_v4.intelligence.smart_bar import SmartBar
from mimo_browser_v4.intelligence.link_preview import LinkPreview
from mimo_browser_v4.intelligence.insights import PageInsights
from mimo_browser_v4.intelligence.sidebar import AISidebar
from mimo_browser_v4.intelligence.memory import SessionMemory

# ── Browser ──
from mimo_browser_v4.browser.engine import BrowserEngine
from mimo_browser_v4.browser.history import HistoryManager
from mimo_browser_v4.browser.reader import ReaderMode
from mimo_browser_v4.browser.workspace import WorkspaceManager
from mimo_browser_v4.browser.notes import NotesManager
from mimo_browser_v4.browser.bookmarks import BookmarkManager
from mimo_browser_v4.browser.cookie_manager import CookieManager
from mimo_browser_v4.browser.extension_manager import ExtensionManager
from mimo_browser_v4.browser.devtools import DevTools, generate_devtools_js
from mimo_browser_v4.browser.file_menu import (
    generate_print_styles, get_file_menu_actions, get_edit_menu_actions, get_view_menu_actions,
)

# ── AI ──
from mimo_browser_v4.intelligence.ai_features import AIBrain

# ── HAZOOM reward engine + optional real LLM backend ──
from mimo_browser_v4.hazoom_rewards import rewards as hazoom
from mimo_browser_v4 import llm as llm_backend

logger = logging.getLogger("mimo.v4")


# ══════════════════════════════════════════════════════════════
# DASHBOARD HTML — Embedded in main.py for single-file deployment
# ══════════════════════════════════════════════════════════════

DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MiMo Browser v4 — Personal Intelligent Browser</title>
<style>
:root{--bg:#0a0a0f;--bg2:#12121a;--bg3:#1a1a2e;--surface:#16213e;--border:#1e2a4a;--accent:#00d4ff;--accent2:#7b2ff7;--accent3:#ff6b35;--text:#e0e0e0;--text-dim:#667788;--text-bright:#fff;--success:#00ff88;--warning:#ffaa00;--danger:#ff4455;--font:'Segoe UI',system-ui,sans-serif;--mono:'Cascadia Code','Fira Code',monospace;--radius:8px;--radius-lg:12px;--transition:0.2s ease;--shadow:0 4px 24px rgba(0,0,0,.4)}
[data-theme="light"]{--bg:#f5f5f5;--bg2:#fff;--bg3:#e8e8e8;--surface:#fff;--border:#ddd;--text:#333;--text-dim:#888;--text-bright:#000}
[data-theme="midnight"]{--bg:#050510;--bg2:#0a0a20;--bg3:#0f0f30;--surface:#151540;--border:#202050}
[data-theme="forest"]{--bg:#0a1a0a;--bg2:#122012;--bg3:#1a2e1a;--surface:#1e3a1e;--border:#2a4a2a;--accent:#44ff88}
[data-theme="ocean"]{--bg:#0a1520;--bg2:#122030;--bg3:#1a2e40;--surface:#1e3a50;--border:#2a4a60;--accent:#00aaff}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--text);overflow:hidden;height:100vh;display:flex;flex-direction:column}
.header{background:linear-gradient(135deg,var(--bg3),var(--surface));padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;min-height:52px;z-index:100}
.logo{font-size:18px;font-weight:800;color:var(--accent);letter-spacing:-.5px}
.logo span{color:var(--accent2)}
.version{font-size:10px;color:var(--text-dim);background:var(--bg2);padding:2px 6px;border-radius:3px}
.tab-bar{display:flex;align-items:center;gap:2px;flex:1;overflow-x:auto;scrollbar-width:none;padding:0 4px}
.tab-bar::-webkit-scrollbar{display:none}
.tab{display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;max-width:180px;min-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:var(--transition);position:relative;top:1px}
.tab:hover{background:var(--surface)}
.tab.active{background:var(--surface);border-bottom-color:var(--surface);color:var(--accent)}
.tab .close-tab{opacity:0;margin-left:4px;font-size:14px;color:var(--text-dim)}
.tab:hover .close-tab{opacity:1}
.tab .close-tab:hover{color:var(--danger)}
.new-tab-btn{padding:6px 10px;background:transparent;border:1px dashed var(--border);color:var(--text-dim);border-radius:6px;cursor:pointer;font-size:16px;transition:var(--transition)}
.new-tab-btn:hover{border-color:var(--accent);color:var(--accent)}
.nav-bar{display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface);border-bottom:1px solid var(--border)}
.nav-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);cursor:pointer;font-size:16px;transition:var(--transition)}
.nav-btn:hover{background:var(--bg3);color:var(--accent)}
.nav-btn.active-btn{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.url-bar{flex:1;display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:6px 14px;transition:var(--transition)}
.url-bar:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px rgba(0,212,255,.15)}
.url-bar .security-icon{font-size:14px}
.url-bar input{flex:1;background:transparent;border:none;color:var(--text);font-size:13px;outline:none}
.url-bar input::placeholder{color:var(--text-dim)}
.main-layout{display:grid;grid-template-columns:280px 1fr 320px;flex:1;overflow:hidden}
.main-layout.no-sidebar{grid-template-columns:280px 1fr}
.main-layout.no-sidebar .ai-sidebar{display:none}
.left-sidebar{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.sidebar-tabs{display:flex;border-bottom:1px solid var(--border)}
.sidebar-tab{flex:1;padding:10px 4px;text-align:center;font-size:11px;color:var(--text-dim);cursor:pointer;transition:var(--transition);border-bottom:2px solid transparent;text-transform:uppercase;letter-spacing:.5px}
.sidebar-tab:hover{color:var(--text)}
.sidebar-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.sidebar-content{flex:1;overflow-y:auto;padding:12px}
.panel-card{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:10px;margin-bottom:8px}
.panel-card h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:8px}
.quick-link{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;transition:var(--transition);font-size:12px}
.quick-link:hover{background:var(--surface)}
.quick-link .favicon{width:16px;height:16px;border-radius:3px}
.bookmark-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:12px;transition:var(--transition)}
.bookmark-item:hover{background:var(--surface)}
.history-item{display:flex;align-items:center;justify-content:space-between;padding:5px 8px;border-radius:4px;cursor:pointer;font-size:11px;transition:var(--transition)}
.history-item:hover{background:var(--surface)}
.history-item .time{color:var(--text-dim);font-size:10px}
.content-area{display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
.page-toolbar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg2);border-bottom:1px solid var(--border)}
.page-content{flex:1;overflow-y:auto;padding:16px;font-family:var(--mono);font-size:12px;line-height:1.6;white-space:pre-wrap;color:var(--text-dim)}
.ai-sidebar{background:var(--bg2);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.ai-header{padding:12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.ai-header h3{font-size:13px;color:var(--accent)}
.ai-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.ai-msg{padding:8px 10px;border-radius:var(--radius);font-size:12px;line-height:1.5}
.ai-msg.user{background:var(--surface);align-self:flex-end;max-width:85%}
.ai-msg.bot{background:var(--bg);border:1px solid var(--border);align-self:flex-start;max-width:90%}
.ai-msg .role{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:4px}
.ai-input-area{padding:10px;border-top:1px solid var(--border);display:flex;gap:6px}
.ai-input-area input{flex:1;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:20px;color:var(--text);font-size:12px;outline:none}
.ai-input-area input:focus{border-color:var(--accent)}
.ai-input-area button{padding:8px 14px;background:var(--accent);color:var(--bg);border:none;border-radius:20px;cursor:pointer;font-size:12px;font-weight:600}
.ai-suggestions{padding:8px 12px;display:flex;flex-wrap:wrap;gap:4px}
.ai-suggestion{padding:4px 8px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:10px;cursor:pointer;transition:var(--transition)}
.ai-suggestion:hover{border-color:var(--accent);color:var(--accent)}
.command-palette-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:1000;justify-content:center;padding-top:15vh}
.command-palette-overlay.open{display:flex}
.command-palette{width:560px;max-width:90vw;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);overflow:hidden}
.command-palette input{width:100%;padding:14px 16px;background:var(--bg);border:none;border-bottom:1px solid var(--border);color:var(--text);font-size:14px;outline:none}
.command-list{max-height:400px;overflow-y:auto}
.command-item{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;transition:var(--transition);font-size:13px}
.command-item:hover,.command-item.selected{background:var(--surface)}
.command-item .cmd-icon{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:var(--bg);border-radius:6px;font-size:14px}
.command-item .cmd-info{flex:1}
.command-item .cmd-name{font-weight:500}
.command-item .cmd-desc{font-size:11px;color:var(--text-dim)}
.command-item .cmd-shortcut{font-size:10px;color:var(--text-dim);background:var(--bg);padding:2px 6px;border-radius:3px;font-family:var(--mono)}
.status-bar{display:flex;align-items:center;justify-content:space-between;padding:4px 12px;background:var(--surface);border-top:1px solid var(--border);font-size:10px;color:var(--text-dim)}
.status-bar .left{display:flex;align-items:center;gap:12px}
.status-bar .right{display:flex;align-items:center;gap:12px}
.status-indicator{display:flex;align-items:center;gap:4px}
.status-dot{width:6px;height:6px;border-radius:50%}
.status-dot.green{background:var(--success)}
.status-dot.yellow{background:var(--warning)}
.status-dot.red{background:var(--danger)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.stat-box{text-align:center;padding:8px 4px;background:var(--bg);border:1px solid var(--border);border-radius:6px}
.stat-box .val{font-size:18px;font-weight:700;color:var(--accent)}
.stat-box .label{font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px}
.btn{padding:6px 12px;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;transition:var(--transition)}
.btn-primary{background:var(--accent);color:var(--bg)}
.btn-primary:hover{filter:brightness(1.1)}
.btn-secondary{background:var(--surface);color:var(--text);border:1px solid var(--border)}
.btn-secondary:hover{background:var(--bg3)}
.btn-danger{background:var(--danger);color:#fff}
.btn-sm{padding:4px 8px;font-size:10px}
.btn-block{width:100%}
.brightness-control{display:flex;align-items:center;gap:4px;padding:0 8px;background:var(--bg);border:1px solid var(--border);border-radius:12px;font-size:11px;color:var(--text-dim)}
.brightness-control input[type=range]{width:60px;height:4px;accent-color:var(--accent);cursor:pointer}
.brightness-control .brightness-val{min-width:32px;text-align:center;font-family:var(--mono);font-size:10px;color:var(--text-dim)}
.input-group{margin-bottom:8px}
.input-group label{display:block;font-size:10px;color:var(--text-dim);margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
.input-group input,.input-group select,.input-group textarea{width:100%;padding:6px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:12px;outline:none;transition:var(--transition)}
.input-group input:focus,.input-group select:focus,.input-group textarea:focus{border-color:var(--accent)}
.input-group textarea{min-height:50px;resize:vertical;font-family:var(--mono)}
.reader-banner{display:none;padding:8px 16px;background:var(--surface);border-bottom:1px solid var(--border);align-items:center;gap:12px;font-size:12px}
.reader-banner.active{display:flex}
.reader-banner .exit-reader{margin-left:auto}
.workspace-tabs{display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap}
.workspace-tab{padding:4px 10px;background:var(--bg);border:1px solid var(--border);border-radius:4px;font-size:11px;cursor:pointer;transition:var(--transition)}
.workspace-tab:hover,.workspace-tab.active{border-color:var(--accent);color:var(--accent)}
.loading-bar{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .3s ease;z-index:200}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn .2s ease}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--text-dim)}
</style>
</head>
<body data-theme="dark">
<div class="loading-bar" id="loadingBar" style="width:0%"></div>
<div class="header">
  <div class="logo">Mi<span>Mo</span></div>
  <div class="version">v4.0</div>
  <div class="tab-bar" id="tabBar">
    <div class="tab active" data-tab="0" onclick="switchTab(0)"><span>New Tab</span><span class="close-tab" onclick="event.stopPropagation();closeTab(0)">×</span></div>
    <div class="new-tab-btn" onclick="newTab()">+</div>
  </div>
  <div style="display:flex;gap:6px;align-items:center">
    <div class="nav-btn" onclick="toggleCommandPalette()" title="Command Palette (Ctrl+K)">⌘</div>
    <div class="nav-btn" onclick="toggleTheme()" title="Theme">🎨</div>
    <div class="nav-btn" onclick="toggleSettings()" title="Settings">⚙</div>
    <div class="nav-btn" id="hazoomPill" onclick="toggleHazoom()" title="HAZOOM rewards">🪙 <span id="hazoomBal">0</span></div>
  </div>
</div>
<div class="nav-bar">
  <div class="nav-btn" onclick="doAction('back')" title="Back">←</div>
  <div class="nav-btn" onclick="doAction('forward')" title="Forward">→</div>
  <div class="nav-btn" onclick="doAction('refresh')" title="Refresh">↻</div>
  <div class="url-bar"><span class="security-icon" id="securityIcon">🔒</span><input id="urlInput" type="text" placeholder="Enter URL, search, or command... (Ctrl+K for palette)" onkeydown="if(event.key==='Enter')navigateToUrl()"></div>
  <div class="nav-btn" onclick="doAction('reader')" title="Reader Mode" id="readerBtn">📖</div>
  <div class="nav-btn" onclick="doAction('split')" title="Split View" id="splitBtn">⬜</div>
  <div class="nav-btn" onclick="toggleAISidebar()" title="AI Sidebar (Ctrl+Shift+A)" id="aiBtn">🤖</div>
  <div class="nav-btn" onclick="doAction('bookmark')" title="Bookmark">⭐</div>
  <div class="nav-btn" onclick="doAction('download')" title="Downloads">⬇</div>
</div>
<div class="reader-banner" id="readerBanner"><span>📖 Reader Mode</span><span id="readerInfo" style="color:var(--text-dim);font-size:11px"></span><div style="margin-left:auto;display:flex;gap:6px;align-items:center"><select id="readerTheme" onchange="updateReaderTheme()" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:2px 6px;border-radius:3px;font-size:11px"><option value="light">Light</option><option value="dark" selected>Dark</option><option value="sepia">Sepia</option><option value="midnight">Midnight</option></select><button class="btn btn-sm btn-secondary exit-reader" onclick="doAction('reader')">Exit</button></div></div>
<div class="main-layout" id="mainLayout">
  <div class="left-sidebar">
    <div class="sidebar-tabs">
      <div class="sidebar-tab active" onclick="switchSidebarTab('quick',this)">⚡ Quick</div>
      <div class="sidebar-tab" onclick="switchSidebarTab('bookmarks',this)">⭐</div>
      <div class="sidebar-tab" onclick="switchSidebarTab('history',this)">🕐</div>
      <div class="sidebar-tab" onclick="switchSidebarTab('workspaces',this)">💼</div>
      <div class="sidebar-tab" onclick="switchSidebarTab('notes',this)">📝</div>
      <div class="sidebar-tab" onclick="switchSidebarTab('basic',this)">🔷 BASIC</div>
    </div>
    <div class="sidebar-content" id="sidebarContent">
      <div id="panel-quick">
        <div class="panel-card"><h4>⚡ Quick Links</h4>
          <div class="quick-link" onclick="navigateTo('https://duckduckgo.com')"><span class="favicon">🦆</span> DuckDuckGo</div>
          <div class="quick-link" onclick="navigateTo('https://www.youtube.com')"><span class="favicon">▶</span> YouTube</div>
          <div class="quick-link" onclick="navigateTo('https://github.com')"><span class="favicon">🐙</span> GitHub</div>
          <div class="quick-link" onclick="navigateTo('https://stackoverflow.com')"><span class="favicon">📚</span> Stack Overflow</div>
          <div class="quick-link" onclick="navigateTo('https://www.wikipedia.org')"><span class="favicon">📖</span> Wikipedia</div>
          <div class="quick-link" onclick="navigateTo('https://news.ycombinator.com')"><span class="favicon">🔥</span> Hacker News</div>
          <div class="quick-link" onclick="navigateTo('https://www.reddit.com')"><span class="favicon">🤖</span> Reddit</div>
          <div class="quick-link" onclick="navigateTo('https://twitter.com')"><span class="favicon">🐦</span> Twitter/X</div>
        </div>
        <div class="panel-card"><h4>📊 Stats</h4>
          <div class="stats-grid">
            <div class="stat-box"><div class="val" id="sTasks">0</div><div class="label">Tasks</div></div>
            <div class="stat-box"><div class="val" id="sOk" style="color:var(--success)">0</div><div class="label">OK</div></div>
            <div class="stat-box"><div class="val" id="sErr" style="color:var(--danger)">0</div><div class="label">Failed</div></div>
            <div class="stat-box"><div class="val" id="sMem" style="color:var(--warning)">0</div><div class="label">Memories</div></div>
          </div>
        </div>
        <div class="panel-card"><h4>🔒 Security</h4>
          <div style="font-size:11px">
            <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Ad Block</span><span style="color:var(--success)">Active</span></div>
            <div style="display:flex;justify-content:space-between;padding:3px 0"><span>DoH</span><span style="color:var(--success)">Active</span></div>
            <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Fingerprint</span><span style="color:var(--success)">Protected</span></div>
            <div style="display:flex;justify-content:space-between;padding:3px 0"><span>HTTPS-Only</span><span style="color:var(--success)">Enforced</span></div>
          </div>
        </div>
      </div>
      <div id="panel-bookmarks" style="display:none"><div class="panel-card"><h4>⭐ Bookmarks</h4><div class="input-group"><input id="bmSearch" type="text" placeholder="Search..." oninput="searchBookmarks()"></div><div id="bookmarksList"></div></div></div>
      <div id="panel-history" style="display:none"><div class="panel-card"><h4>🕐 History</h4><div id="historyList"></div></div><button class="btn btn-danger btn-sm btn-block" onclick="clearHistory()">Clear History</button></div>
      <div id="panel-workspaces" style="display:none"><div class="panel-card"><h4>💼 Workspaces</h4><div class="workspace-tabs" id="workspaceTabs"></div><div style="margin-top:8px"><div class="input-group"><input id="wsName" type="text" placeholder="Workspace name..."></div><button class="btn btn-primary btn-sm btn-block" onclick="saveWorkspace()">Save Current</button></div></div></div>
      <div id="panel-notes" style="display:none"><div class="panel-card"><h4>📝 Quick Notes</h4><div class="input-group"><input id="noteUrl" type="text" placeholder="Page URL..."></div><div class="input-group"><textarea id="noteText" placeholder="Your note..."></textarea></div><button class="btn btn-primary btn-sm btn-block" onclick="saveNote()">Save Note</button></div><div id="notesList"></div></div>
      <div id="panel-basic" style="display:none">
        <div class="panel-card"><h4>🔷 MiMo BASIC</h4>
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px">Write & run BASIC programs with encrypted storage</div>
          <button class="btn btn-primary btn-sm btn-block" onclick="basicNew()">➕ New Program</button>
          <button class="btn btn-secondary btn-sm btn-block" onclick="basicLoad()" style="margin-top:4px">📂 Load Program</button>
          <button class="btn btn-secondary btn-sm btn-block" onclick="basicSave()" style="margin-top:4px">💾 Save Encrypted</button>
          <button class="btn btn-secondary btn-sm btn-block" onclick="basicRun()" style="margin-top:4px">▶ Run</button>
          <button class="btn btn-secondary btn-sm btn-block" onclick="basicStop()" style="margin-top:4px">⏹ Stop</button>
        </div>
        <div class="panel-card"><h4>📚 Demos</h4>
          <div class="quick-link" onclick="basicLoadDemo('hello')">👋 Hello World</div>
          <div class="quick-link" onclick="basicLoadDemo('graphics')">🎨 Graphics</div>
          <div class="quick-link" onclick="basicLoadDemo('stars')">⭐ Starfield</div>
          <div class="quick-link" onclick="basicLoadDemo('maze')">🌀 Maze</div>
          <div class="quick-link" onclick="basicLoadDemo('bounce')">🏀 Bounce</div>
          <div class="quick-link" onclick="basicLoadDemo('encrypt')">🔐 Encrypt</div>
        </div>
        <div class="panel-card"><h4>📦 My Programs</h4>
          <div id="basicProgramList" style="font-size:11px;color:var(--text-dim)">Loading...</div>
        </div>
        <div class="panel-card"><h4>🔗 Share</h4>
          <button class="btn btn-secondary btn-sm btn-block" onclick="basicExport()">📤 Export Encrypted</button>
          <div class="input-group" style="margin-top:4px"><textarea id="basicImportBlob" placeholder="Paste encrypted blob..." style="min-height:60px;font-size:10px"></textarea></div>
          <button class="btn btn-secondary btn-sm btn-block" onclick="basicImport()" style="margin-top:4px">📥 Import</button>
        </div>
      </div>
    </div>
  </div>
  <div class="content-area">
    <div class="page-toolbar">
      <span id="pageTitle" style="font-size:13px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">New Tab</span>
      <span id="pageMeta" style="font-size:10px;color:var(--text-dim);margin-right:8px"></span>
      <div id="securityBadge" style="font-size:11px;padding:2px 8px;border-radius:3px;background:var(--bg);color:var(--success);border:1px solid var(--border)">🔒 HTTPS</div>
      <div class="nav-btn" onclick="doAction('zoom_out')" title="Zoom Out" style="width:28px;height:28px;font-size:13px">−</div>
      <span id="zoomLevel" style="font-size:11px;color:var(--text-dim);min-width:36px;text-align:center">100%</span>
      <div class="nav-btn" onclick="doAction('zoom_in')" title="Zoom In" style="width:28px;height:28px;font-size:13px">+</div>
      <div class="brightness-control" title="Screen Brightness">
        <span>☀</span>
        <input type="range" id="brightnessSlider" min="20" max="150" value="100" oninput="setBrightness(this.value)">
        <span class="brightness-val" id="brightnessVal">100%</span>
      </div>
    </div>
    <iframe id="pageContent" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" style="flex:1;border:none;width:100%;background:#fff" src="about:blank"></iframe>
  </div>
  <div class="ai-sidebar" id="aiSidebar">
    <div class="ai-header"><h3>🤖 MiMo AI</h3><div class="nav-btn" onclick="toggleAISidebar()" style="width:24px;height:24px;font-size:12px">✕</div></div>
    <div class="ai-suggestions"><div class="ai-suggestion" onclick="aiAsk('Summarize this page')">📝 Summarize</div><div class="ai-suggestion" onclick="aiAsk('Key points')">🔑 Key Points</div><div class="ai-suggestion" onclick="aiAsk('Reading time')">⏱ Reading Time</div><div class="ai-suggestion" onclick="aiAsk('Security check')">🔒 Security</div><div class="ai-suggestion" onclick="aiAsk('Extract links')">🔗 Links</div><div class="ai-suggestion" onclick="aiAsk('Tech stack')">🔧 Tech Stack</div></div>
    <div class="ai-messages" id="aiMessages"></div>
    <div class="ai-input-area"><input id="aiInput" type="text" placeholder="Ask about this page..." onkeydown="if(event.key==='Enter')sendAIMessage()"><button onclick="sendAIMessage()">Send</button></div>
  </div>
</div>
<div class="command-palette-overlay" id="commandPalette" onclick="if(event.target===this)toggleCommandPalette()">
  <div class="command-palette"><input id="commandInput" type="text" placeholder="Type a command or search..." oninput="filterCommands()" onkeydown="handleCommandKey(event)"><div class="command-list" id="commandList"></div></div>
</div>
<div class="status-bar">
  <div class="left"><div class="status-indicator"><div class="status-dot green" id="statusDot"></div><span id="statusText">Ready</span></div><span id="currentUrl">No URL</span></div>
  <div class="right"><span id="loadTime"></span><span id="requestCount"></span><span id="blockedCount" style="color:var(--warning)"></span><span id="clock" style="font-family:var(--mono)"></span></div>
</div>
<script>
let state={tabs:[{id:0,url:'',title:'New Tab',active:true}],activeTab:0,stats:{tasks:0,ok:0,err:0,memories:0},zoom:100,brightness:100,readerMode:false,aiOpen:true,theme:'dark',bookmarks:[],history:[],workspaces:[],notes:{},blockedCount:0,requestCount:0,loadStart:0};
try{let b=localStorage.getItem('mimo_brightness');if(b){state.brightness=parseInt(b);document.getElementById('brightnessSlider').value=state.brightness;document.getElementById('brightnessVal').textContent=state.brightness+'%';applyBrightness(state.brightness)}}catch(e){}
const COMMANDS=[
  {icon:'🌐',name:'Navigate to URL',desc:'Enter a web address',shortcut:'Ctrl+L',action:'focusUrl'},
  {icon:'🔍',name:'Search Web',desc:'Search with Google',shortcut:'',action:'focusUrl'},
  {icon:'📖',name:'Toggle Reader Mode',desc:'Clean reading view',shortcut:'Ctrl+Shift+R',action:'reader'},
  {icon:'🤖',name:'Toggle AI Sidebar',desc:'Show/hide AI panel',shortcut:'Ctrl+Shift+A',action:'toggleAI'},
  {icon:'⭐',name:'Bookmark This Page',desc:'Save to bookmarks',shortcut:'Ctrl+D',action:'bookmark'},
  {icon:'🕐',name:'Show History',desc:'Browse history',shortcut:'Ctrl+H',action:'showHistory'},
  {icon:'💼',name:'Workspaces',desc:'Manage workspaces',shortcut:'',action:'showWorkspaces'},
  {icon:'📝',name:'Quick Note',desc:'Add a note',shortcut:'',action:'showNotes'},
  {icon:'🎨',name:'Change Theme',desc:'Switch visual theme',shortcut:'',action:'cycleTheme'},
  {icon:'🛠',name:'DevTools',desc:'Developer tools',shortcut:'F12',action:'devtools'},
  {icon:'🔒',name:'Security Info',desc:'Page security details',shortcut:'',action:'securityInfo'},
  {icon:'📊',name:'Page Insights',desc:'Reading time, word count, etc.',shortcut:'',action:'pageInsights'},
  {icon:'🔗',name:'Extract Links',desc:'List all links on page',shortcut:'',action:'extractLinks'},
  {icon:'🗑',name:'Clear History',desc:'Delete all history',shortcut:'',action:'clearHistory'},
  {icon:'💾',name:'Save Workspace',desc:'Save current session',shortcut:'',action:'saveWorkspace'},
  {icon:'🔧',name:'Settings',desc:'Browser settings',shortcut:'Ctrl+,',action:'settings'},
  {icon:'☀️',name:'Brightness Up',desc:'Increase screen brightness',shortcut:'',action:'brightness_up'},
  {icon:'🌙',name:'Brightness Down',desc:'Decrease screen brightness',shortcut:'',action:'brightness_down'},
  {icon:'🔆',name:'Reset Brightness',desc:'Reset to 100% brightness',shortcut:'',action:'brightness_reset'},
];
setInterval(()=>{document.getElementById('clock').textContent=new Date().toLocaleTimeString()},1000);
document.getElementById('clock').textContent=new Date().toLocaleTimeString();

function switchTab(id){state.tabs.forEach(t=>t.active=false);let tab=state.tabs.find(t=>t.id===id);if(tab){tab.active=true;state.activeTab=id}renderTabs();if(tab&&tab.url){document.getElementById('urlInput').value=tab.url;document.getElementById('currentUrl').textContent=tab.url;document.getElementById('pageTitle').textContent=tab.title}else{document.getElementById('urlInput').value='';document.getElementById('currentUrl').textContent='No URL';document.getElementById('pageTitle').textContent='New Tab'}}
function newTab(){let id=state.tabs.length>0?Math.max(...state.tabs.map(t=>t.id))+1:0;state.tabs.forEach(t=>t.active=false);state.tabs.push({id,url:'',title:'New Tab',active:true});state.activeTab=id;renderTabs();document.getElementById('urlInput').value='';document.getElementById('urlInput').focus()}
function closeTab(id){if(state.tabs.length<=1)return;let idx=state.tabs.findIndex(t=>t.id===id);state.tabs=state.tabs.filter(t=>t.id!==id);if(state.activeTab===id){let newActive=state.tabs[Math.max(0,idx-1)];newActive.active=true;state.activeTab=newActive.id}renderTabs()}
function renderTabs(){let bar=document.getElementById('tabBar');let tabs=state.tabs.map(t=>{let label=t.title.length>20?t.title.substring(0,20)+'...':t.title;return `<div class="tab ${t.active?'active':''}" data-tab="${t.id}" onclick="switchTab(${t.id})"><span>${label}</span><span class="close-tab" onclick="event.stopPropagation();closeTab(${t.id})">×</span></div>`}).join('');bar.innerHTML=tabs+'<div class="new-tab-btn" onclick="newTab()">+</div>'}

function navigateToUrl(){let input=document.getElementById('urlInput').value.trim();if(!input)return;let url=input;if(!input.startsWith('http')){if(input.includes('.')&&!input.includes(' ')){url='https://'+input}else{url='/api/search?q='+encodeURIComponent(input)}}navigateTo(url)}
function navigateTo(url){state.loadStart=Date.now();state.stats.tasks++;state.requestCount++;updateStats();showLoading(true);setStatus('Loading...','yellow');document.getElementById('urlInput').value=url;document.getElementById('currentUrl').textContent=url;let tab=state.tabs.find(t=>t.active);if(tab){tab.url=url;tab.title=url}document.getElementById('pageTitle').textContent=url;renderTabs();let iframe=document.getElementById('pageContent');if(url.startsWith('/api/search')){iframe.src=url}else{iframe.src='/api/proxy?url='+encodeURIComponent(url)}iframe.onload=function(){showLoading(false);state.stats.ok++;setStatus('Loaded','green');let elapsed=Date.now()-state.loadStart;document.getElementById('loadTime').textContent=Math.round(elapsed)+'ms';document.getElementById('requestCount').textContent=state.requestCount+' req';applyBrightness(state.brightness);try{let t=iframe.contentDocument.title;if(t){document.getElementById('pageTitle').textContent=t;if(tab)tab.title=t;renderTabs()}}catch(e){};updateStats()};iframe.onerror=function(){showLoading(false);state.stats.err++;setStatus('Error','red');updateStats()}}

// Listen for navigation messages from iframe
window.addEventListener('message',function(e){if(e.data&&e.data.type==='mimo-navigate'){document.getElementById('urlInput').value=e.data.url;document.getElementById('currentUrl').textContent=e.data.url;if(e.data.title){document.getElementById('pageTitle').textContent=e.data.title}let tab=state.tabs.find(t=>t.active);if(tab){tab.url=e.data.url;tab.title=e.data.title||e.data.url}renderTabs()}});

function doAction(action){const a={back:()=>window.history.back(),forward:()=>window.history.forward(),refresh:()=>{let u=document.getElementById('urlInput').value;if(u)navigateTo(u)},reader:()=>toggleReader(),split:()=>{document.getElementById('splitBtn').classList.toggle('active-btn')},bookmark:()=>quickAddBookmark(),download:()=>alert('Downloads panel'),zoom_in:()=>{state.zoom=Math.min(200,state.zoom+10);document.getElementById('zoomLevel').textContent=state.zoom+'%'},zoom_out:()=>{state.zoom=Math.max(50,state.zoom-10);document.getElementById('zoomLevel').textContent=state.zoom+'%'},brightness_up:()=>setBrightness(Math.min(150,state.brightness+10)),brightness_down:()=>setBrightness(Math.max(20,state.brightness-10)),brightness_reset:()=>setBrightness(100),devtools:()=>alert('DevTools panel')};if(a[action])a[action]()}
function setBrightness(val){state.brightness=parseInt(val);document.getElementById('brightnessSlider').value=state.brightness;document.getElementById('brightnessVal').textContent=state.brightness+'%';applyBrightness(state.brightness);try{localStorage.setItem('mimo_brightness',state.brightness)}catch(e){}}
function applyBrightness(val){let iframe=document.getElementById('pageContent');if(iframe){iframe.style.filter='brightness('+val+'%)';iframe.style.webkitFilter='brightness('+val+'%)'}}
function toggleReader(){state.readerMode=!state.readerMode;document.getElementById('readerBanner').classList.toggle('active',state.readerMode);document.getElementById('readerBtn').classList.toggle('active-btn',state.readerMode);if(state.readerMode){let url=document.getElementById('urlInput').value;if(!url){alert('Navigate to a page first');return}fetch('/api/reader',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})}).then(r=>r.json()).then(data=>{if(data.success&&data.result){let iframe=document.getElementById('pageContent');let doc=iframe.contentDocument||iframe.contentWindow.document;doc.open();doc.write(data.result.body_html||JSON.stringify(data.result,null,2));doc.close();document.getElementById('readerInfo').textContent=(data.result.word_count||0)+' words · '+(data.result.reading_time||0)+' min read'}else{alert('Reader mode failed: '+(data.error||'unknown'))}})}else{let url=document.getElementById('urlInput').value;if(url){let iframe=document.getElementById('pageContent');iframe.src='/api/proxy?url='+encodeURIComponent(url)}}}

function toggleAISidebar(){state.aiOpen=!state.aiOpen;let layout=document.getElementById('mainLayout');if(state.aiOpen){layout.classList.remove('no-sidebar')}else{layout.classList.add('no-sidebar')}document.getElementById('aiBtn').classList.toggle('active-btn',state.aiOpen)}
function aiAsk(q){document.getElementById('aiInput').value=q;sendAIMessage()}
function sendAIMessage(){let input=document.getElementById('aiInput');let msg=input.value.trim();if(!msg)return;input.value='';let msgs=document.getElementById('aiMessages');msgs.innerHTML+=`<div class="ai-msg user"><div class="role">You</div>${msg}</div>`;msgs.scrollTop=msgs.scrollHeight;fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:msg,url:document.getElementById('urlInput').value})}).then(r=>r.json()).then(data=>{let response=data.result||data.error||'No response';msgs.innerHTML+=`<div class="ai-msg bot"><div class="role">MiMo AI</div>${response}</div>`;msgs.scrollTop=msgs.scrollHeight}).catch(e=>{msgs.innerHTML+=`<div class="ai-msg bot"><div class="role">MiMo AI</div>Error: ${e.message}</div>`;msgs.scrollTop=msgs.scrollHeight})}

function toggleCommandPalette(){let cp=document.getElementById('commandPalette');cp.classList.toggle('open');if(cp.classList.contains('open')){document.getElementById('commandInput').value='';document.getElementById('commandInput').focus();renderCommands(COMMANDS)}}
function renderCommands(cmds){document.getElementById('commandList').innerHTML=cmds.map((c,i)=>`<div class="command-item ${i===0?'selected':''}" onclick="executeCommand('${c.action}')"><div class="cmd-icon">${c.icon}</div><div class="cmd-info"><div class="cmd-name">${c.name}</div><div class="cmd-desc">${c.desc}</div></div>${c.shortcut?`<div class="cmd-shortcut">${c.shortcut}</div>`:''}</div>`).join('')}
function filterCommands(){let q=document.getElementById('commandInput').value.toLowerCase();renderCommands(COMMANDS.filter(c=>c.name.toLowerCase().includes(q)||c.desc.toLowerCase().includes(q)))}
function handleCommandKey(e){if(e.key==='Enter'){let sel=document.querySelector('.command-item.selected');if(sel){let action=sel.querySelector('.cmd-name').textContent;let cmd=COMMANDS.find(c=>c.name===action);if(cmd)executeCommand(cmd.action)}}if(e.key==='Escape')toggleCommandPalette()}
function executeCommand(action){toggleCommandPalette();const m={focusUrl:()=>document.getElementById('urlInput').focus(),reader:()=>toggleReader(),toggleAI:()=>toggleAISidebar(),bookmark:()=>quickAddBookmark(),showHistory:()=>switchSidebarTab('history',document.querySelectorAll('.sidebar-tab')[2]),showWorkspaces:()=>switchSidebarTab('workspaces',document.querySelectorAll('.sidebar-tab')[3]),showNotes:()=>switchSidebarTab('notes',document.querySelectorAll('.sidebar-tab')[4]),cycleTheme:()=>toggleTheme(),devtools:()=>doAction('devtools'),securityInfo:()=>alert('Security: HTTPS enabled, Ad block active, DoH active, Fingerprint protected'),pageInsights:()=>showPageInsights(),extractLinks:()=>extractLinks(),clearHistory:()=>clearHistory(),saveWorkspace:()=>saveWorkspace(),settings:()=>toggleSettings()};if(m[action])m[action]()}

function switchSidebarTab(tab,el){document.querySelectorAll('.sidebar-tab').forEach(t=>t.classList.remove('active'));if(el)el.classList.add('active');['quick','bookmarks','history','workspaces','notes','basic'].forEach(t=>{document.getElementById('panel-'+t).style.display=t===tab?'':'none'})}
const THEMES=['dark','light','midnight','forest','ocean'];function toggleTheme(){let idx=THEMES.indexOf(state.theme);state.theme=THEMES[(idx+1)%THEMES.length];document.body.setAttribute('data-theme',state.theme)}
function toggleSettings(){alert('MiMo Browser v4 Settings:\n\n• Theme: '+state.theme+'\n• Brightness: '+state.brightness+'%\n• Search Engine: DuckDuckGo (private)\n• Ad Block: Active ('+state.blockedCount+' blocked)\n• DoH: Active\n• Fingerprint: Protected\n• HTTPS-Only: Enforced\n\nSearch engines:\n• DuckDuckGo (default)\n• Startpage\n• Brave Search\n• SearX (self-hosted)')}

// ── HAZOOM reward / loyalty layer ──
let hazoomState={balance:0,total:0,streak:0,wallet:''};
function refreshHazoom(){fetch('/api/hazoom').then(r=>r.json()).then(d=>{if(d.success){hazoomState=d;document.getElementById('hazoomBal').textContent=d.balance;let badge=document.getElementById('hazoomPill');badge.title='HAZOOM: '+d.balance+' earned · '+d.streak+' day streak'+(d.linked_wallet?(' · wallet '+d.linked_wallet.slice(0,6)+'…'):'');}}).catch(()=>{})}
function toggleHazoom(){let w=document.getElementById('hazoomOverlay');if(w){w.style.display=w.style.display==='flex'?'none':'flex';if(w.style.display==='flex')renderHazoom();return;}
let o=document.createElement('div');o.id='hazoomOverlay';o.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);z-index:998;display:flex;align-items:center;justify-content:center;';
o.innerHTML=`<div style="width:420px;max-width:92vw;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:20px;box-shadow:var(--shadow)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="color:var(--accent);font-weight:700;font-size:16px">🪙 HAZOOM Rewards</span><button class="btn btn-sm btn-secondary" onclick="toggleHazoom()">✕</button></div><div id="hazoomBody"></div></div>`;
document.body.appendChild(o);renderHazoom();}
function renderHazoom(){fetch('/api/hazoom').then(r=>r.json()).then(d=>{if(!d.success)return;hazoomState=d;document.getElementById('hazoomBal').textContent=d.balance;let b=document.getElementById('hazoomBody');if(!b)return;let rewardRows=Object.entries(d.reward_table||{}).map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"><span style="color:var(--text-dim)">${k}</span><span style="color:var(--accent)">+${v}</span></div>`).join('');let hist=(d.transactions||[]).slice(0,8).map(t=>`<div style="display:flex;justify-content:space-between;font-size:10px;padding:2px 0"><span>${t.action}</span><span style="color:var(--success)">+${t.amount}</span></div>`).join('')||'<div style="color:var(--text-dim);font-size:11px">No activity yet</div>';
b.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px"><div class="panel-card" style="text-align:center"><div style="font-size:22px;font-weight:700;color:var(--accent)">${d.balance}</div><div class="label">Balance</div></div><div class="panel-card" style="text-align:center"><div style="font-size:22px;font-weight:700;color:var(--success)">${d.total_earned}</div><div class="label">Total Earned</div></div><div class="panel-card" style="text-align:center"><div style="font-size:22px;font-weight:700;color:var(--warning)">${d.streak}</div><div class="label">Day Streak</div></div></div>
<div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">${d.linked_wallet?('Wallet: '+d.linked_wallet.slice(0,10)+'…'):'No wallet linked'}</div>
<div style="display:flex;gap:6px;margin-bottom:12px"><button class="btn btn-primary btn-sm" onclick="hazoomCheckin()">Daily Check-in (+${ (d.reward_table&&d.reward_table.daily_streak)||10 })</button>${d.linked_wallet?'<button class="btn btn-danger btn-sm" onclick="hazoomUnlink()">Unlink Wallet</button>':'<button class="btn btn-secondary btn-sm" onclick="hazoomPromptLink()">Link Wallet</button>'}</div>
<div class="panel-card"><h4>How to earn</h4>${rewardRows}</div>
<div class="panel-card"><h4>Recent activity</h4>${hist}</div>
<div style="font-size:10px;color:var(--text-dim);margin-top:8px">HAZOOM is the browser's native reward token. Earn by browsing privately. Optional on-chain bridge available via HAZOOMCoin on Base.</div>`;});}
function hazoomCheckin(){fetch('/api/hazoom/checkin',{method:'POST'}).then(()=>renderHazoom()).catch(()=>{})}
function hazoomPromptLink(){let a=prompt('Paste your wallet address (0x…) to link HAZOOM earnings:');if(!a)return;fetch('/api/hazoom/wallet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:a})}).then(()=>renderHazoom()).catch(()=>alert('Link failed'));}
function hazoomUnlink(){fetch('/api/hazoom/wallet/disconnect',{method:'POST'}).then(()=>renderHazoom()).catch(()=>{})}
setInterval(refreshHazoom,5000);refreshHazoom();

function quickAddBookmark(){let url=document.getElementById('urlInput').value;let title=document.getElementById('pageTitle').textContent;if(!url)return;state.bookmarks.push({url,title,tags:[],time:new Date().toISOString()});renderBookmarks();updateStats()}
function renderBookmarks(){let list=document.getElementById('bookmarksList');if(!state.bookmarks.length){list.innerHTML='<div style="color:var(--text-dim);font-size:11px;padding:8px">No bookmarks yet</div>';return}list.innerHTML=state.bookmarks.map(b=>`<div class="bookmark-item" onclick="navigateTo('${b.url}')"><span>⭐</span><div><div>${b.title}</div></div></div>`).join('')}
function searchBookmarks(){let q=document.getElementById('bmSearch').value.toLowerCase();let f=state.bookmarks.filter(b=>b.title.toLowerCase().includes(q)||b.url.toLowerCase().includes(q));document.getElementById('bookmarksList').innerHTML=f.map(b=>`<div class="bookmark-item" onclick="navigateTo('${b.url}')"><span>⭐</span><div><div>${b.title}</div></div></div>`).join('')}
function clearHistory(){state.history=[];document.getElementById('historyList').innerHTML='<div style="color:var(--text-dim);font-size:11px;padding:8px">History cleared</div>'}
function saveWorkspace(){let name=document.getElementById('wsName').value.trim()||'Workspace '+(state.workspaces.length+1);state.workspaces.push({name,tabs:[...state.tabs],time:new Date().toISOString()});document.getElementById('workspaceTabs').innerHTML=state.workspaces.map((w,i)=>`<div class="workspace-tab" onclick="loadWorkspace(${i})">${w.name}</div>`).join('');document.getElementById('wsName').value=''}
function loadWorkspace(idx){let ws=state.workspaces[idx];if(!ws)return;state.tabs=ws.tabs;state.activeTab=state.tabs[0]?.id||0;renderTabs()}
function saveNote(){let url=document.getElementById('noteUrl').value.trim();let text=document.getElementById('noteText').value.trim();if(!url||!text)return;state.notes[url]=text;document.getElementById('noteUrl').value='';document.getElementById('noteText').value='';renderNotes()}
function renderNotes(){let list=document.getElementById('notesList');let entries=Object.entries(state.notes);if(!entries.length){list.innerHTML='<div style="color:var(--text-dim);font-size:11px;padding:8px">No notes yet</div>';return}list.innerHTML=entries.map(([url,text])=>`<div class="panel-card"><div style="font-size:10px;color:var(--accent);margin-bottom:4px">${url}</div><div style="font-size:11px">${text}</div></div>`).join('')}
function updateStats(){document.getElementById('sTasks').textContent=state.stats.tasks;document.getElementById('sOk').textContent=state.stats.ok;document.getElementById('sErr').textContent=state.stats.err;document.getElementById('sMem').textContent=state.stats.memories}
function setStatus(text,color){document.getElementById('statusText').textContent=text;document.getElementById('statusDot').className='status-dot '+color}
function showLoading(show){document.getElementById('loadingBar').style.width=show?'60%':'0%'}
function showPageInsights(){fetch('/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:document.getElementById('urlInput').value})}).then(r=>r.json()).then(data=>{if(data.success&&data.result){let i=data.result;let m='Page Insights:\n\n';if(i.reading_time)m+='Reading time: '+i.reading_time+' min\n';if(i.word_count)m+='Words: '+i.word_count+'\n';if(i.tech_stack&&i.tech_stack.length)m+='Tech: '+i.tech_stack.join(', ')+'\n';if(i.link_count)m+='Links: '+i.link_count+'\n';if(i.image_count)m+='Images: '+i.image_count+'\n';if(i.language)m+='Language: '+i.language+'\n';if(i.summary)m+='\nSummary:\n'+i.summary.substring(0,300);alert(m)}})}
function extractLinks(){let iframe=document.getElementById('pageContent');try{let doc=iframe.contentDocument||iframe.contentWindow.document;let links=Array.from(doc.querySelectorAll('a[href]')).map(a=>({text:a.textContent.trim().substring(0,60),url:a.href}));document.getElementById('pageContent').src='about:blank';let doc2=document.getElementById('pageContent').contentDocument;doc2.open();doc2.write('<pre style="padding:16px;font-family:monospace;font-size:12px;white-space:pre-wrap">'+JSON.stringify(links,null,2)+'</pre>');doc2.close()}catch(e){alert('Cannot extract: cross-origin restriction')}}

function extractLinks(){let iframe=document.getElementById('pageContent');try{let doc=iframe.contentDocument||iframe.contentWindow.document;let links=Array.from(doc.querySelectorAll('a[href]')).map(a=>({text:a.textContent.trim().substring(0,60),url:a.href}));document.getElementById('pageContent').src='about:blank';let doc2=document.getElementById('pageContent').contentDocument;doc2.open();doc2.write('<pre style="padding:16px;font-family:monospace;font-size:12px;white-space:pre-wrap">'+JSON.stringify(links,null,2)+'</pre>');doc2.close()}catch(e){alert('Cannot extract: cross-origin restriction')}}

// ── BASIC IDE ──
let basicEditor=null;
let basicCanvas=null;
let basicOutput=null;
let basicRunning=false;

function basicEnsureEditor(){
  if(basicEditor)return;
  // Create BASIC IDE overlay
  let existing=document.getElementById('basicIdeOverlay');
  if(existing){existing.style.display='flex';return;}
  let overlay=document.createElement('div');
  overlay.id='basicIdeOverlay';
  overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);z-index:999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML=`
    <div style="width:90%;height:90%;background:var(--bg);border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border)">
        <span style="color:var(--accent);font-weight:700;font-size:14px">🔷 MiMo BASIC IDE</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-primary btn-sm" onclick="basicRun()">▶ Run</button>
          <button class="btn btn-danger btn-sm" onclick="basicStop()">⏹ Stop</button>
          <button class="btn btn-secondary btn-sm" onclick="basicSave()">💾 Save</button>
          <button class="btn btn-secondary btn-sm" onclick="basicClose()">✕ Close</button>
        </div>
      </div>
      <div style="display:flex;flex:1;overflow:hidden">
        <div style="flex:1;display:flex;flex-direction:column;border-right:1px solid var(--border)">
          <div style="padding:6px 12px;background:var(--bg2);border-bottom:1px solid var(--border);font-size:10px;color:var(--text-dim);display:flex;justify-content:space-between">
            <span>Code Editor</span>
            <span id="basicStatus">Ready</span>
          </div>
          <textarea id="basicCodeEditor" style="flex:1;background:var(--bg);color:var(--text);border:none;padding:12px;font-family:var(--mono);font-size:13px;resize:none;outline:none;line-height:1.6" placeholder="' Write your BASIC program here&#10;10 PRINT &quot;HELLO MiMo!&quot;&#10;20 FOR I=1 TO 10&#10;30 PRINT I&#10;40 NEXT I&#10;50 END" spellcheck="false"></textarea>
        </div>
        <div style="flex:1;display:flex;flex-direction:column">
          <div style="padding:6px 12px;background:var(--bg2);border-bottom:1px solid var(--border);font-size:10px;color:var(--text-dim)">Canvas Output</div>
          <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#000;position:relative">
            <canvas id="basicCanvas" width="320" height="200" style="image-rendering:pixelated;max-width:100%;max-height:100%;border:1px solid #333"></canvas>
          </div>
          <div style="padding:6px 12px;background:var(--bg2);border-top:1px solid var(--border);font-size:10px;color:var(--text-dim)">Console Output</div>
          <div id="basicConsole" style="height:120px;background:var(--bg);color:var(--success);padding:8px;font-family:var(--mono);font-size:11px;overflow-y:auto;white-space:pre-wrap"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  basicEditor=document.getElementById('basicCodeEditor');
  basicCanvas=document.getElementById('basicCanvas');
  basicOutput=document.getElementById('basicConsole');
  // Close on overlay click
  overlay.addEventListener('click',e=>{if(e.target===overlay)basicClose();});
}

function basicClose(){
  let overlay=document.getElementById('basicIdeOverlay');
  if(overlay){overlay.style.display='none';}
  basicStop();
}

function basicNew(){
  basicEnsureEditor();
  basicEditor.value='10 REM NEW PROGRAM\n20 PRINT "HELLO MiMo BASIC!"\n30 END\n';
  basicOutput.textContent='';
  basicStatus('New program');
}

function basicStatus(msg){
  let s=document.getElementById('basicStatus');
  if(s)s.textContent=msg;
}

function basicRun(){
  basicEnsureEditor();
  let source=basicEditor.value;
  if(!source.trim()){alert('No code to run');return;}
  basicStop();
  basicOutput.textContent='';
  basicStatus('Running...');
  basicRunning=true;

  try {
    // Parse and execute BASIC using the HAZOOM BASIC interpreter
    if(typeof Tokenizer==='undefined'){
      // Load the BASIC interpreter scripts dynamically
      basicLoadScripts().then(()=>basicExecute(source)).catch(e=>{
        basicOutput.textContent='Error loading BASIC engine: '+e.message;
        basicStatus('Error');
        basicRunning=false;
      });
    } else {
      basicExecute(source);
    }
  } catch(e){
    basicOutput.textContent='ERROR: '+e.message;
    basicStatus('Error');
    basicRunning=false;
  }
}

function basicLoadScripts(){
  return new Promise((resolve,reject)=>{
    let scripts=[
      '/static/js/hazoom-basic/tokenizer.js',
      '/static/js/hazoom-basic/parser.js',
      '/static/js/hazoom-basic/hardware.js',
      '/static/js/hazoom-basic/interpreter.js'
    ];
    let loaded=0;
    scripts.forEach(src=>{
      let s=document.createElement('script');
      s.src=src;
      s.onload=()=>{loaded++;if(loaded===scripts.length)resolve();};
      s.onerror=()=>reject(new Error('Failed to load '+src));
      document.head.appendChild(s);
    });
  });
}

function basicExecute(source){
  try {
    let tokenizer=new Tokenizer(source);
    let tokens=tokenizer.tokenize();
    let parser=new Parser(tokens);
    let program=parser.parse();
    let hw=new VirtualHardware(basicCanvas);
    let interp=new Interpreter(hw);
    interp.setOutputCallback(text=>{basicOutput.textContent+=text;basicOutput.scrollTop=basicOutput.scrollHeight;});
    interp.load(program);
    interp.run();
    basicStatus('Running (60fps)');
  } catch(e){
    basicOutput.textContent='ERROR: '+e.message;
    basicStatus('Error');
    basicRunning=false;
  }
}

function basicStop(){
  basicRunning=false;
  basicStatus('Stopped');
}

function basicSave(){
  basicEnsureEditor();
  let source=basicEditor.value;
  if(!source.trim()){alert('Nothing to save');return;}
  let name=prompt('Program name:','MyProgram');
  if(!name)return;
  fetch('/api/basic/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,source})})
    .then(r=>r.json()).then(data=>{
      if(data.success){alert('Saved encrypted: '+name);basicRefreshList();}
      else alert('Save failed: '+(data.error||'unknown'));
    });
}

function basicLoad(){
  basicEnsureEditor();
  fetch('/api/basic/list').then(r=>r.json()).then(data=>{
    if(!data.success||!data.programs.length){alert('No saved programs');return;}
    let names=data.programs.map(p=>p.name);
    let name=prompt('Load program:\n'+names.join('\n'));
    if(!name)return;
    fetch('/api/basic/load',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})})
      .then(r=>r.json()).then(data=>{
        if(data.success&&data.program){
          basicEditor.value=data.program.source;
          basicOutput.textContent='';
          basicStatus('Loaded: '+name);
        }else alert('Load failed');
      });
  });
}

function basicLoadDemo(name){
  basicEnsureEditor();
  fetch('/api/basic/demo?name='+name).then(r=>r.json()).then(data=>{
    if(data.success){
      basicEditor.value=data.source;
      basicOutput.textContent='';
      basicStatus('Demo: '+name);
    }
  });
}

function basicRefreshList(){
  fetch('/api/basic/list').then(r=>r.json()).then(data=>{
    let list=document.getElementById('basicProgramList');
    if(!list)return;
    if(!data.success||!data.programs.length){list.innerHTML='<div style="color:var(--text-dim)">No saved programs</div>';return;}
    list.innerHTML=data.programs.map(p=>`<div class="quick-link" onclick="basicLoadByName('${p.name}')">📄 ${p.name} (${p.lines||'?'} lines)</div>`).join('');
  });
}

function basicLoadByName(name){
  basicEnsureEditor();
  fetch('/api/basic/load',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})})
    .then(r=>r.json()).then(data=>{
      if(data.success&&data.program){basicEditor.value=data.program.source;basicOutput.textContent='';basicStatus('Loaded: '+name);}
    });
}

function basicExport(){
  basicEnsureEditor();
  let name=prompt('Export program name:');
  if(!name)return;
  fetch('/api/basic/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})})
    .then(r=>r.json()).then(data=>{
      if(data.success){
        prompt('Encrypted share blob (copy this):',data.blob);
      }else alert('Export failed: '+(data.error||'unknown'));
    });
}

function basicImport(){
  let blob=document.getElementById('basicImportBlob').value.trim();
  if(!blob){alert('Paste an encrypted blob first');return;}
  fetch('/api/basic/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({blob})})
    .then(r=>r.json()).then(data=>{
      if(data.success){alert('Imported: '+data.name);basicRefreshList();}
      else alert('Import failed: '+(data.error||'unknown'));
    });
}

// Load BASIC program list on startup
setTimeout(basicRefreshList,1000);

document.addEventListener('keydown',e=>{if(e.key==='k'&&e.ctrlKey){e.preventDefault();toggleCommandPalette()}if(e.key==='a'&&e.ctrlKey&&e.shiftKey){e.preventDefault();toggleAISidebar()}if(e.key==='r'&&e.ctrlKey&&e.shiftKey){e.preventDefault();toggleReader()}if(e.key==='d'&&e.ctrlKey){e.preventDefault();quickAddBookmark()}if(e.key==='l'&&e.ctrlKey){e.preventDefault();document.getElementById('urlInput').focus()}if(e.key==='F12'){e.preventDefault();doAction('devtools')}if(e.key==='B'&&e.ctrlKey&&e.shiftKey){e.preventDefault();basicEnsureEditor()}});
renderTabs();renderBookmarks();renderNotes();updateStats();
setInterval(()=>{fetch('/api/stats').then(r=>r.json()).then(data=>{if(data.memories!==undefined){state.stats.memories=data.memories;updateStats()}if(data.blocked_count!==undefined){document.getElementById('blockedCount').textContent=data.blocked_count+' blocked'}}).catch(()=>{})},5000);
</script>
</body>
</html>"""


# ══════════════════════════════════════════════════════════════
# MiMo Browser v4 — Main Application
# ══════════════════════════════════════════════════════════════

class MiMoBrowser:
    """Main browser application that ties all 6 layers together."""

    def __init__(self, config: BrowserConfig | None = None) -> None:
        self.config = config or BrowserConfig()
        self.start_time = time.time()

        # Network layer
        self.dns = DNSOverHTTPS(self.config.doh_provider) if self.config.doh_enabled else None
        self.conn = ConnectionManager(self.config.max_concurrent_tabs)
        self.interceptor = None

        # Security layer
        self.filters = FilterEngine()  # Already loads default blocklist in __init__
        self.fingerprint = FingerprintGuard() if self.config.fingerprint_protection else None
        self.credentials = CredentialVault(master_password="mimo-v4-default")
        self.permissions = PermissionManager(password="mimo-v4-default")
        self.interceptor = RequestInterceptor(
            filter_engine=self.filters if self.config.ad_block_enabled else None,
            fingerprint_guard=self.fingerprint,
        )

        # Intelligence layer
        self.brain = Brain()
        self.planner = Planner()
        self.analyzer = PageAnalyzer()
        self.smart_bar = SmartBar()
        self.link_preview = LinkPreview()
        self.insights_engine = PageInsights()
        self.ai_sidebar = AISidebar()
        self.memory = SessionMemory()

        # Browser layer
        self.engine = BrowserEngine(self.config)
        self.history = HistoryManager(path="./data/history.json", password="mimo-v4-key")
        self.reader = ReaderMode()
        self.workspaces = WorkspaceManager()
        self.notes = NotesManager()
        self.bookmarks = BookmarkManager()

        # ── New Modules (v4.1) ──
        self.cookies = CookieManager(storage_path="./data/cookies.json")
        self.extensions = ExtensionManager(storage_path="./data/extensions.json")
        self.devtools = DevTools()
        self.ai = AIBrain()

        # BASIC IDE
        from mimo_browser_v4.basic_ide import BasicEncryptedStorage
        self.basic_storage = BasicEncryptedStorage(
            path="./data/basic_programs",
            password="mimo-basic-v4-key"
        )

        # Stats
        self._task_count = 0
        self._success_count = 0
        self._error_count = 0

    def initialize(self) -> None:
        """Initialize all browser components."""
        logger.info("Initializing MiMo Browser v4...")
        self.engine.start()
        logger.info("Browser engine started")
        logger.info("MiMo Browser v4 initialized successfully")

    def shutdown(self) -> None:
        """Gracefully shutdown all components."""
        logger.info("Shutting down MiMo Browser v4...")
        try:
            self.engine.stop()
        except Exception:
            pass
        logger.info("MiMo Browser v4 shutdown complete")

    def navigate(self, url: str) -> dict[str, Any]:
        """Navigate to URL with full intelligence pipeline."""
        self._task_count += 1
        start = time.time()

        try:
            # 1. Smart bar interpretation
            interpreted = self.smart_bar.interpret_input(url)
            target_url = interpreted.get("value", url)

            # 2. DNS resolution (DoH)
            if self.dns:
                parsed = urlparse(target_url)
                if parsed.hostname:
                    try:
                        dns_result = self._run_dns(parsed.hostname)
                        if not dns_result.get("resolved"):
                            logger.warning("DNS resolution failed for %s, continuing anyway", parsed.hostname)
                    except Exception as dns_err:
                        logger.warning("DNS check failed: %s", dns_err)

            # 3. Ad/tracker blocking check
            if self.interceptor and self.interceptor.should_block(target_url):
                return {"success": False, "error": "Blocked by ad/tracker filter", "blocked": True}

            # 4. Navigate via engine (sync API)
            self.engine.navigate(target_url)
            current_url = self.engine.get_url()

            # 5. Get page content
            content = self.engine.get_content()

            # 6. Analyze page
            page_type = self.analyzer.detect_page_type(content)
            word_count = self.analyzer.extract_word_count(content)
            reading_time = self.analyzer.extract_reading_time(content)
            tech_stack = self.analyzer.detect_tech_stack(content)
            security = self.analyzer.get_security_rating(current_url, content)

            # 7. Extract structured data
            soup = BeautifulSoup(content, "lxml")
            title = ""
            if soup.title and soup.title.string:
                title = str(soup.title.string)
            meta = {}
            for m in soup.find_all("meta"):
                name = str(m.get("name") or m.get("property", ""))
                if name and m.get("content"):
                    meta[name] = str(m["content"])

            # 8. Extract links
            links = []
            for a in soup.find_all("a", href=True):
                href = str(a["href"])
                text = a.get_text(strip=True)
                if href.startswith(("http://", "https://")):
                    links.append({"url": href, "text": text})

            # 9. Interactive elements
            interactive = []
            for tag in soup.find_all(["a", "button", "input", "select", "textarea"]):
                info = {
                    "tag": tag.name,
                    "type": str(tag.get("type", "")),
                    "text": tag.get_text(strip=True)[:100]
                }
                if tag.get("id"):
                    info["selector"] = f"#{tag['id']}"
                interactive.append(info)

            # 10. Build response
            elapsed = round((time.time() - start) * 1000, 1)

            # 11. Record in history
            self.history.add_entry(current_url, title)

            # 12. Record in memory
            self.memory.remember(
                f"nav_{current_url}",
                {"action": "navigate", "url": current_url, "title": title},
                tags=["navigate", page_type],
            )

            self._success_count += 1

            return {
                "success": True,
                "url": current_url,
                "title": title,
                "page_type": page_type,
                "word_count": word_count,
                "reading_time": reading_time,
                "tech_stack": tech_stack,
                "security_rating": security,
                "text": self._extract_text(content),
                "links_count": len(links),
                "top_links": links[:20],
                "structured": {"title": title, "meta": meta},
                "interactive_count": len(interactive),
                "interactive_elements": interactive[:20],
                "load_time_ms": elapsed,
                "results": [{"success": True, "data": {"url": current_url, "page_type": page_type}}],
            }

        except Exception as e:
            self._error_count += 1
            logger.exception("Navigation failed: %s", url)
            return {"success": False, "error": str(e)}

    def _run_dns(self, hostname: str) -> dict:
        """Run DNS resolution in a new event loop."""
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(self.dns.resolve(hostname))
        finally:
            loop.close()

    def _extract_text(self, html: str) -> str:
        """Extract clean text from HTML."""
        soup = BeautifulSoup(html, "lxml")
        for tag in soup.find_all(["script", "style", "noscript", "iframe", "nav", "footer"]):
            tag.decompose()
        return soup.get_text(separator="\n", strip=True)[:5000]

    def reader_mode(self, url: str) -> dict[str, Any]:
        """Extract reader mode content from URL (uses proxy, not engine)."""
        import aiohttp
        import asyncio
        try:
            target_url = url
            if not target_url:
                return {"success": False, "error": "No URL to read"}

            async def fetch():
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate",
                }
                async with aiohttp.ClientSession() as session:
                    async with session.get(target_url, headers=headers, timeout=aiohttp.ClientTimeout(total=15), ssl=False) as resp:
                        return await resp.text()

            loop = asyncio.new_event_loop()
            try:
                html = loop.run_until_complete(fetch())
            finally:
                loop.close()

            result = self.reader.extract_content(html)
            hazoom.award("reader_mode")
            hazoom.daily_checkin()
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def ai_query(self, question: str, url: str = "") -> dict[str, Any]:
        """Process AI sidebar query (real LLM when configured, else heuristic)."""
        try:
            content = ""
            try:
                content = self.engine.get_content()
            except Exception:
                pass

            # ── HAZOOM: reward using the AI feature ──
            hazoom.award("ai_query")
            hazoom.daily_checkin()

            # ── Try the real LLM first (env-gated); fall back to heuristics ──
            if content and llm_backend.is_enabled():
                import asyncio
                loop = asyncio.new_event_loop()
                try:
                    answer = loop.run_until_complete(
                        llm_backend.ask(question, content, self.engine.get_url())
                    )
                finally:
                    loop.close()
                if answer:
                    return {"success": True, "result": answer, "engine": "llm"}

            if "summarize" in question.lower() or "summary" in question.lower():
                response = self.ai_sidebar.summarize_page(content) if content else "Navigate to a page first to summarize."
            elif "key point" in question.lower():
                response = self.ai_sidebar.summarize_page(content) if content else "Navigate to a page first."
            elif "reading time" in question.lower():
                if content:
                    mins = self.analyzer.extract_reading_time(content)
                    words = self.analyzer.extract_word_count(content)
                    response = f"Reading time: ~{mins} minutes ({words} words)"
                else:
                    response = "Navigate to a page first."
            elif "security" in question.lower():
                if content:
                    sec = self.analyzer.get_security_rating(url, content)
                    lines = ["Security Rating:"]
                    lines.append(f"  HTTPS: {'Yes' if sec.get('https') else 'No'}")
                    lines.append(f"  Trackers: {sec.get('tracker_count', 0)} detected")
                    lines.append(f"  Mixed Content: {'Yes' if sec.get('mixed_content') else 'No'}")
                    if sec.get("headers"):
                        lines.append(f"  Security Headers: {len(sec['headers'])} present")
                    response = "\n".join(lines)
                else:
                    response = "Navigate to a page first."
            elif "link" in question.lower():
                if content:
                    soup = BeautifulSoup(content, "lxml")
                    found_links = [str(a["href"]) for a in soup.find_all("a", href=True) if str(a["href"]).startswith("http")]
                    response = f"Found {len(found_links)} links:\n" + "\n".join(found_links[:15])
                else:
                    response = "Navigate to a page first."
            elif "translate" in question.lower():
                response = "Translation feature: Connect to a translation API for full support."
            elif "tech" in question.lower() or "stack" in question.lower() or "framework" in question.lower():
                if content:
                    tech = self.analyzer.detect_tech_stack(content)
                    response = f"Tech stack detected: {', '.join(tech)}" if tech else "No specific tech stack detected."
                else:
                    response = "Navigate to a page first."
            else:
                response = self.ai_sidebar.answer_question(content, question) if content else "Navigate to a page first, then ask questions about it."

            return {"success": True, "result": response, "engine": "heuristic"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def extract_data(self, selector: str = "body", url: str = "") -> dict[str, Any]:
        """Extract data from current or specified page."""
        try:
            if url:
                self.engine.navigate(url)
            content = self.engine.get_content()

            soup = BeautifulSoup(content, "lxml")
            elements = soup.select(selector)

            results = []
            for el in elements:
                results.append({
                    "tag": el.name,
                    "text": el.get_text(strip=True)[:500],
                    "html": str(el)[:1000],
                    "attrs": {k: str(v) for k, v in el.attrs.items()},
                })

            return {"success": True, "result": results, "count": len(results)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_insights(self, url: str = "") -> dict[str, Any]:
        """Get page insights."""
        try:
            if url:
                self.engine.navigate(url)
            content = self.engine.get_content()
            current_url = self.engine.get_url()

            result = self.insights_engine.get_insights(current_url, content)
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_stats(self) -> dict[str, Any]:
        """Get browser statistics."""
        uptime = round(time.time() - self.start_time, 0)
        return {
            "tasks": self._task_count,
            "success": self._success_count,
            "failed": self._error_count,
            "memories": self.memory.size,
            "uptime_s": uptime,
            "blocked_count": self.interceptor.get_stats()["blocked"] if self.interceptor else 0,
            "filter_stats": {
                "rules_loaded": self.filters.rules_loaded,
                "blocked_domains": self.filters.blocked_domains_count,
                "blocked_requests": self.filters.get_blocked_count(),
            },
            "hazoom": hazoom.snapshot(),
        }


# ══════════════════════════════════════════════════════════════
# HTTP Server (aiohttp)
# ══════════════════════════════════════════════════════════════

# Global browser instance for the server
_browser_instance: MiMoBrowser | None = None


def get_browser() -> MiMoBrowser:
    global _browser_instance
    if _browser_instance is None:
        _browser_instance = MiMoBrowser()
        _browser_instance.initialize()
    return _browser_instance


async def create_app(config: BrowserConfig | None = None, port: int = 8082) -> Any:
    """Create the aiohttp application."""
    from aiohttp import web

    browser = MiMoBrowser(config)
    browser.initialize()

    app = web.Application()
    app["port"] = port  # Store port for internal API calls (AI proxy)

    async def handle_index(request: web.Request) -> web.Response:
        resp = web.Response(text=DASHBOARD_HTML, content_type="text/html")
        resp.headers["X-Frame-Options"] = "SAMEORIGIN"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-XSS-Protection"] = "1; mode=block"
        resp.headers["Referrer-Policy"] = "no-referrer"
        resp.headers["X-Robots-Tag"] = "noindex, nofollow"
        resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        return resp

    async def handle_navigate(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            url = body.get("url", "")
            if not url:
                return web.json_response({"success": False, "error": "No URL"}, status=400)
            result = browser.navigate(url)
            return web.json_response(result)
        except Exception as e:
            logger.exception("Navigate error")
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_reader(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            url = body.get("url", "")
            result = browser.reader_mode(url)
            return web.json_response(result)
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_ai(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            question = body.get("question", "")
            url = body.get("url", "")
            if not question:
                return web.json_response({"success": False, "error": "No question"}, status=400)
            result = browser.ai_query(question, url)
            return web.json_response(result)
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_extract(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            selector = body.get("selector", "body")
            url = body.get("url", "")
            result = browser.extract_data(selector, url)
            return web.json_response(result)
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_insights(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            url = body.get("url", "")
            result = browser.get_insights(url)
            return web.json_response(result)
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_stats(request: web.Request) -> web.Response:
        return web.json_response(browser.get_stats())

    async def handle_action(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            action = body.get("action", "")
            if action == "back":
                browser.engine.back()
            elif action == "forward":
                browser.engine.forward()
            elif action == "refresh":
                browser.engine.refresh()
            elif action == "screenshot":
                browser.engine.screenshot("./downloads/screenshot.png")
                return web.json_response({"success": True, "result": {"path": "./downloads/screenshot.png"}})
            else:
                return web.json_response({"success": False, "error": f"Unknown action: {action}"}, status=400)
            return web.json_response({"success": True})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_search(request: web.Request) -> web.Response:
        """Private search endpoint — fetches DuckDuckGo HTML results, strips trackers, returns clean HTML."""
        from urllib.parse import quote
        import aiohttp
        import re

        query = request.query.get("q", "")
        if not query:
            return web.Response(text="Missing q parameter", status=400)

        # DuckDuckGo HTML version — no JS required, minimal tracking
        ddg_url = f"https://html.duckduckgo.com/html/?q={quote(query)}"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "DNT": "1",
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(ddg_url, headers=headers, timeout=aiohttp.ClientTimeout(total=6), ssl=True) as resp:
                    html = await resp.text()

            # Strip all scripts, styles, images — keep only text results
            # Remove script/style tags
            html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
            html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
            html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
            html = re.sub(r'<img[^>]*>', '', html, flags=re.IGNORECASE)
            html = re.sub(r'<noscript[^>]*>.*?</noscript>', '', html, flags=re.DOTALL | re.IGNORECASE)

            # Rewrite result links to go through our proxy
            def rewrite_result_link(m):
                url = m.group(1)
                if url.startswith('http'):
                    return f'href="/api/proxy?url={quote(url, safe="")}"'
                return m.group(0)

            html = re.sub(r'href="(https?://[^"]+)"', rewrite_result_link, html)

            # Remove all on* event handlers (privacy: no tracking events)
            html = re.sub(r'\son\w+="[^"]*"', '', html, flags=re.IGNORECASE)

            # Remove hidden inputs and tracking forms
            html = re.sub(r'<input[^>]*type="hidden"[^>]*>', '', html, flags=re.IGNORECASE)

            # Build clean search results page
            clean_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{query} — MiMo Search</title>
<style>
body{{font-family:'Segoe UI',system-ui,sans-serif;max-width:720px;margin:0 auto;padding:20px;background:#fff;color:#222}}
h1{{font-size:16px;color:#444;margin-bottom:4px}}
.search-info{{font-size:11px;color:#888;margin-bottom:16px}}
.result{{margin-bottom:16px;padding:8px 0;border-bottom:1px solid #eee}}
.result a{{color:#1a0dab;text-decoration:none;font-size:15px;display:block;margin-bottom:2px}}
.result a:hover{{text-decoration:underline}}
.result .url{{color:#006621;font-size:12px;margin-bottom:2px;word-break:break-all}}
.result .snippet{{color:#545454;font-size:13px;line-height:1.4}}
.privacy-badge{{position:fixed;bottom:12px;right:12px;background:#000;color:#fff;padding:4px 10px;border-radius:12px;font-size:10px;opacity:0.7}}
</style>
</head>
<body>
<h1>🔍 {query}</h1>
<div class="search-info">Private search via DuckDuckGo · 0 tracking · 0 cookies</div>
<div id="results">
{html}
</div>
<div class="privacy-badge">🔒 MiMo Private Search</div>
</body>
</html>"""

            resp_headers = {
                "X-Frame-Options": "SAMEORIGIN",
                "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "no-referrer",
                "X-Robots-Tag": "noindex, nofollow",
            }
            # HAZOOM: reward private search
            hazoom.award("private_search")
            hazoom.daily_checkin()
            return web.Response(text=clean_html, content_type="text/html", charset="utf-8", headers=resp_headers)

        except Exception as e:
            # Graceful degrade: still reward the private-search intent, return a
            # clean page instead of a hard 500 so the UI never wedges.
            logger.warning("Search backend unavailable for %s: %s", query, e)
            hazoom.award("private_search")
            hazoom.daily_checkin()
            page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{query} — MiMo Search</title>
<style>body{{font-family:'Segoe UI',system-ui,sans-serif;max-width:720px;margin:0 auto;padding:20px;background:#fff;color:#222}}</style>
</head><body>
<h1>🔍 {query}</h1>
<div class="search-info">Private search via DuckDuckGo · 0 tracking · 0 cookies</div>
<div style="padding:16px;background:#f5f5f5;border-radius:8px;color:#555">
  Search backend is temporarily unreachable from this server. Your privacy
  settings are intact and you still earned HAZOOM for searching privately.
  <br><br><a href="/api/search?q={quote(query)}" style="color:#1a0dab">↻ Retry</a>
</div>
</body></html>"""
            return web.Response(text=page, content_type="text/html", charset="utf-8", status=200)

    async def handle_proxy(request: web.Request) -> web.Response:
        """Proxy endpoint: fetches the target URL, rewrites ALL links to route through us, returns full HTML."""
        from urllib.parse import urlparse, urljoin, quote
        import aiohttp
        import re
        import ipaddress

        target_url = request.query.get("url", "")
        if not target_url:
            return web.Response(text="Missing url parameter", status=400)

        # Resolve protocol-relative URLs (//example.com/...) to https://
        if target_url.startswith("//"):
            target_url = "https:" + target_url

        # ── SSRF Protection: Validate URL scheme and block dangerous protocols ──
        parsed = urlparse(target_url)
        if parsed.scheme not in ("http", "https"):
            return web.Response(text=f"Blocked: scheme '{parsed.scheme}' not allowed", status=403)

        # Blocklib internal/private IP ranges to prevent SSRF
        import socket
        try:
            hostname = parsed.hostname
            if not hostname:
                return web.Response(text="Blocked: no hostname", status=403)
            # Resolve and check IP
            try:
                addr_info = socket.getaddrinfo(hostname, parsed.port or 443)
                for family, _, _, _, sockaddr in addr_info:
                    ip = ipaddress.ip_address(sockaddr[0])
                    if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                        return web.Response(text=f"Blocked: internal/private IP address", status=403)
            except socket.gaierror:
                return web.Response(text=f"Blocked: cannot resolve hostname", status=403)
        except Exception:
            return web.Response(text="Blocked: URL validation failed", status=403)

        # Block check
        if browser.interceptor and browser.interceptor.should_block(target_url):
            return web.Response(text=f"Blocked: {target_url}", status=403)

        try:
            # Fetch the page
            headers = dict(request.headers)
            headers.pop("Host", None)
            headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
            headers["Accept-Language"] = "en-US,en;q=0.9"
            # Don't request encoding — aiohttp handles it, and we don't want to forward raw gzip
            headers.pop("Accept-Encoding", None)

            async with aiohttp.ClientSession() as session:
                async with session.get(
                    target_url,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=20),
                    ssl=True,
                    allow_redirects=True,
                    max_line_size=8192,
                    max_field_size=8192,
                ) as resp:
                    content_type = resp.headers.get("Content-Type", "")

                    # For non-HTML content (images, CSS, JS, fonts, etc.), proxy directly
                    is_html = content_type.strip().startswith("text/html")
                    if not is_html:
                        # Size limit: 50MB max
                        content_length = resp.headers.get("Content-Length")
                        if content_length and int(content_length) > 50 * 1024 * 1024:
                            return web.Response(text="File too large (50MB limit)", status=413)
                        body = await resp.read()
                        if len(body) > 50 * 1024 * 1024:
                            return web.Response(text="File too large (50MB limit)", status=413)
                        response_headers = {}
                        for key in ["Content-Type", "Cache-Control", "Expires", "Last-Modified", "Content-Length"]:
                            if key in resp.headers:
                                response_headers[key] = resp.headers[key]
                        # Do NOT forward Content-Encoding — body is already decoded by aiohttp
                        response_headers.pop("Content-Encoding", None)
                        # Strip tracking headers for privacy
                        for h in ["Set-Cookie", "X-Forwarded-For", "X-Real-IP", "X-Request-ID",
                                  "X-Trace-ID", "X-Span-ID", "X-B3-TraceId", "X-DNS-Prefetch-Control"]:
                            response_headers.pop(h, None)
                        return web.Response(body=body, status=resp.status, headers=response_headers)

                    # ── HTML: full rewrite of ALL asset URLs ──
                    html = await resp.text()
                    if len(html) > 50 * 1024 * 1024:
                        return web.Response(text="Page too large (50MB limit)", status=413)
                    base_url = str(resp.url)
                    proxy_origin = f"{request.scheme}://{request.host}"

                    # Build the proxy URL rewriter
                    def make_proxy_url(abs_url: str) -> str:
                        """Convert an absolute URL to go through our proxy."""
                        if abs_url.startswith(("javascript:", "mailto:", "tel:", "data:", "#")):
                            return abs_url
                        return f"/api/proxy?url={quote(abs_url, safe='')}"

                    # Use BeautifulSoup for robust HTML parsing
                    from bs4 import BeautifulSoup, Comment

                    soup = BeautifulSoup(html, "html.parser")

                    # 1. Remove problematic elements that break proxied pages
                    for tag in soup.find_all(["script"]):
                        # Keep inline scripts but remove external ones that often block rendering
                        src = tag.get("src", "")
                        src_str = str(src) if src else ""
                        if src_str and ("analytics" in src_str or "tracking" in src_str or "ads" in src_str):
                            tag.decompose()
                    for tag in soup.find_all("noscript"):
                        tag.decompose()
                    for tag in soup.find_all(string=lambda t: isinstance(t, Comment) and "conditional" in t):
                        tag.extract()

                    # 2. Rewrite <img> tags: src, srcset, data-src, data-original, poster
                    for img in soup.find_all("img"):
                        for attr in ["src", "srcset", "data-src", "data-original", "data-lazy-src"]:
                            val = img.get(attr, "")
                            if val and not val.startswith("data:"):
                                if attr == "srcset":
                                    # srcset = "url1 1x, url2 2x, ..."
                                    parts = []
                                    for part in val.split(","):
                                        part = part.strip()
                                        if not part:
                                            continue
                                        pieces = part.split()
                                        if pieces:
                                            url = pieces[0]
                                            descriptor = " ".join(pieces[1:]) if len(pieces) > 1 else ""
                                            proxy = make_proxy_url(url)
                                            parts.append(f"{proxy} {descriptor}".strip())
                                    img[attr] = ", ".join(parts)
                                else:
                                    img[attr] = make_proxy_url(val)
                        # Remove lazy-loading classes that might hide images
                        img_classes = img.get("class", [])
                        if isinstance(img_classes, list):
                            filtered = [c for c in img_classes if c not in ("lazy", "lazyload", "lazyloaded")]
                            if filtered:
                                img["class"] = " ".join(filtered)
                            else:
                                del img["class"]

                    # 3. Rewrite <source> tags (inside <picture>, <video>, <audio>)
                    for source in soup.find_all("source"):
                        for attr in ["src", "srcset"]:
                            val = source.get(attr, "")
                            if val and not val.startswith("data:"):
                                if attr == "srcset":
                                    parts = []
                                    for part in val.split(","):
                                        part = part.strip()
                                        if not part:
                                            continue
                                        pieces = part.split()
                                        if pieces:
                                            url = pieces[0]
                                            descriptor = " ".join(pieces[1:]) if len(pieces) > 1 else ""
                                            proxy = make_proxy_url(url)
                                            parts.append(f"{proxy} {descriptor}".strip())
                                    source[attr] = ", ".join(parts)
                                else:
                                    source[attr] = make_proxy_url(val)

                    # 4. Rewrite <a href> and <form action>
                    for a in soup.find_all("a", href=True):
                        href = a["href"]
                        if href.startswith(("javascript:", "mailto:", "tel:", "data:", "#")):
                            continue
                        if href.startswith(("http://", "https://")):
                            a["href"] = make_proxy_url(href)
                        # Relative URLs work via the base tag

                    for form in soup.find_all("form", action=True):
                        action = form["action"]
                        if action.startswith(("http://", "https://")):
                            form["action"] = make_proxy_url(action)

                    # 5. Rewrite <link> tags (stylesheets, icons, preload, etc.)
                    for link in soup.find_all("link", href=True):
                        href = link["href"]
                        if href.startswith(("http://", "https://")):
                            link["href"] = make_proxy_url(href)

                    # 6. Rewrite <meta> refresh / og:image / etc.
                    for meta in soup.find_all("meta"):
                        if meta.get("http-equiv", "").lower() == "refresh":
                            content = meta.get("content", "")
                            # content = "5;url=https://..."
                            if "url=" in content.lower():
                                idx = content.lower().index("url=")
                                url_part = content[idx + 4:]
                                if url_part.startswith(("http://", "https://")):
                                    meta["content"] = content[:idx + 4] + make_proxy_url(url_part)
                        # og:image and similar
                        if meta.get("property", "") in ("og:image", "og:image:secure_url", "twitter:image"):
                            content = meta.get("content", "")
                            if content.startswith(("http://", "https://")):
                                meta["content"] = make_proxy_url(content)
                        if meta.get("name", "") == "twitter:image":
                            content = meta.get("content", "")
                            if content.startswith(("http://", "https://")):
                                meta["content"] = make_proxy_url(content)

                    # 7. Rewrite inline style="...url(...)..." attributes
                    for tag in soup.find_all(style=True):
                        style = tag["style"]
                        def rewrite_css_url(m):
                            url = m.group(2)
                            if url.startswith(("http://", "https://")):
                                return f"{m.group(1)}{make_proxy_url(url)}{m.group(3)}"
                            return m.group(0)
                        style = re.sub(r'(url\(\s*[\'"]?)(https?://[^\'")\s]+)([\'"]?\s*\))', rewrite_css_url, style)
                        tag["style"] = style

                    # 8. Rewrite <style> tag contents (CSS @import url(...))
                    for style_tag in soup.find_all("style"):
                        css = style_tag.string or ""
                        if css:
                            def rewrite_css_import(m):
                                url = m.group(2)
                                if url.startswith(("http://", "https://")):
                                    return f"{m.group(1)}{make_proxy_url(url)}{m.group(3)}"
                                return m.group(0)
                            css = re.sub(r'(url\(\s*[\'"]?)(https?://[^\'")\s]+)([\'"]?\s*\))', rewrite_css_import, css)
                            css = re.sub(r'(@import\s+[\'"])(https?://[^\'"]+)([\'"])', rewrite_css_import, css)
                            style_tag.string = css

                    # 9. Rewrite <video> and <audio> poster/src
                    for tag in soup.find_all(["video", "audio"]):
                        if tag.get("poster"):
                            tag["poster"] = make_proxy_url(tag["poster"])
                        if tag.get("src") and tag["src"].startswith(("http://", "https://")):
                            tag["src"] = make_proxy_url(tag["src"])

                    # 10. Rewrite <iframe> src
                    for iframe in soup.find_all("iframe", src=True):
                        src = iframe["src"]
                        if src.startswith(("http://", "https://")):
                            iframe["src"] = make_proxy_url(src)

                    # 11. Inject <base> tag so relative URLs resolve to the original site
                    # We do this via string insertion after serialization to avoid BS4 quirks
                    base_tag_str = f'<base href="{base_url}">'

                    # 12. Inject MiMo toolbar script
                    mimo_script = soup.new_tag("script")
                    mimo_script.string = """
                    (function(){
                        document.addEventListener('submit', function(e) {
                            var form = e.target;
                            if (form.method && form.method.toLowerCase() === 'post') {
                                // POST forms go through base href
                            }
                        });
                        window.addEventListener('load', function() {
                            if (window.parent && window.parent !== window) {
                                window.parent.postMessage({type:'mimo-navigate', url: location.href, title: document.title}, '*');
                            }
                        });
                        // Fix lazy-loaded images
                        document.addEventListener('DOMContentLoaded', function() {
                            var imgs = document.querySelectorAll('[data-src], [data-original], [data-lazy-src]');
                            for (var i = 0; i < imgs.length; i++) {
                                var img = imgs[i];
                                if (img.dataset.src && !img.src) img.src = img.dataset.src;
                                else if (img.dataset.original && !img.src) img.src = img.dataset.original;
                                else if (img.dataset.lazySrc && !img.src) img.src = img.dataset.lazySrc;
                            }
                        });
                    })();
                    """
                    if soup.head:
                        soup.head.append(mimo_script)

                    # 13. Remove original <base> tags (we inject our own after serialization)
                    for existing_base in soup.find_all("base"):
                        existing_base.decompose()

                    # Serialize back to HTML
                    html = str(soup)

                    # 11b. Inject <base> tag via string to avoid BS4 serialization quirks
                    html = html.replace("<head>", f"<head>{base_tag_str}", 1) if "<head>" in html else html
                    if "<head>" not in html and "<html>" in html:
                        html = html.replace("<html>", f"<html><head>{base_tag_str}</head>", 1)
                    elif "<head>" not in html:
                        html = f"<head>{base_tag_str}</head>{html}"

                    # 14. Inject devtools + extension scripts
                    extension_js = browser.extensions.get_content_scripts()
                    devtools_js = generate_devtools_js()
                    all_injection = f"{devtools_js}\n{extension_js}"
                    if "</head>" in html:
                        html = html.replace("</head>", f"{all_injection}</head>", 1)
                    elif "<head>" in html:
                        html = html.replace("<head>", f"<head>{all_injection}", 1)

                    # 15. Also do regex pass for anything BeautifulSoup might have missed
                    # (e.g., URLs in attribute values that BS4 didn't parse as attributes)
                    def regex_rewrite_attr(m):
                        attr_name = m.group(1)
                        quote = m.group(2)
                        url = m.group(3)
                        if url.startswith(("http://", "https://")):
                            return f'{attr_name}={quote}{make_proxy_url(url)}{quote}'
                        return m.group(0)

                    # Skip href from regex pass — BS4 already handles <a> and <link>
                    # and href in <base> tags should NOT be rewritten
                    for attr in ["src", "action", "data-src", "data-original", "poster"]:
                        html = re.sub(
                            rf'({attr}\s*=\s*)([\'\"])(https?://[^\'\"]+)\2',
                            regex_rewrite_attr,
                            html,
                            flags=re.IGNORECASE,
                        )

                    # Security + Privacy headers
                    resp_headers = {
                        "X-Frame-Options": "SAMEORIGIN",
                        "X-Content-Type-Options": "nosniff",
                        "X-XSS-Protection": "1; mode=block",
                        "Referrer-Policy": "no-referrer",
                        "X-Robots-Tag": "noindex, nofollow",
                        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
                        "X-DNS-Prefetch-Control": "off",
                    }

                    return web.Response(
                        text=html,
                        content_type="text/html",
                        charset="utf-8",
                        headers=resp_headers,
                    )

        except asyncio.TimeoutError:
            return web.Response(text=f"Timeout loading {target_url}", status=504)
        except Exception as e:
            logger.exception("Proxy error for %s", target_url)
            return web.Response(text=f"Error: {str(e)}", status=500)

    async def on_shutdown(app) -> None:
        browser.shutdown()

    # ── BASIC IDE API ──

    async def handle_basic_list(request: web.Request) -> web.Response:
        """List all stored BASIC programs."""
        try:
            programs = browser.basic_storage.list_programs()
            return web.json_response({"success": True, "programs": programs})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_basic_load(request: web.Request) -> web.Response:
        """Load a BASIC program (returns encrypted source)."""
        try:
            body = await request.json()
            name = body.get("name", "")
            program = browser.basic_storage.load(name)
            if program:
                return web.json_response({"success": True, "program": program.to_dict()})
            return web.json_response({"success": False, "error": "Program not found"}, status=404)
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_basic_save(request: web.Request) -> web.Response:
        """Save a BASIC program (encrypted storage)."""
        try:
            body = await request.json()
            name = body.get("name", "")
            source = body.get("source", "")
            if not name or not source:
                return web.json_response({"success": False, "error": "Name and source required"}, status=400)
            from mimo_browser_v4.basic_ide import BasicProgram
            program = BasicProgram(
                name=name,
                source=source,
                author=body.get("author", ""),
                description=body.get("description", ""),
                tags=body.get("tags", []),
            )
            ok = browser.basic_storage.save(program)
            if ok:
                hazoom.award("basic_publish")
                hazoom.daily_checkin()
            return web.json_response({"success": ok})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_basic_delete(request: web.Request) -> web.Response:
        """Delete a stored BASIC program."""
        try:
            body = await request.json()
            name = body.get("name", "")
            ok = browser.basic_storage.delete(name)
            return web.json_response({"success": ok})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_basic_demo(request: web.Request) -> web.Response:
        """Get a demo BASIC program."""
        try:
            name = request.query.get("name", "hello")
            from mimo_browser_v4.basic_ide import BasicDemoPrograms
            source = BasicDemoPrograms.get_demo(name)
            if source:
                return web.json_response({"success": True, "source": source, "name": name})
            return web.json_response({"success": False, "error": "Demo not found"}, status=404)
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_basic_export(request: web.Request) -> web.Response:
        """Export a BASIC program as shareable encrypted blob."""
        try:
            body = await request.json()
            name = body.get("name", "")
            program = browser.basic_storage.load(name)
            if not program:
                return web.json_response({"success": False, "error": "Not found"}, status=404)
            from mimo_browser_v4.security.crypto import encrypt_b64
            blob = encrypt_b64(json.dumps(program.to_dict()), "mimo-basic-share")
            return web.json_response({"success": True, "blob": blob, "name": name})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    async def handle_basic_import(request: web.Request) -> web.Response:
        """Import a BASIC program from encrypted blob."""
        try:
            body = await request.json()
            blob = body.get("blob", "")
            from mimo_browser_v4.security.crypto import decrypt_b64
            data = json.loads(decrypt_b64(blob, "mimo-basic-share"))
            from mimo_browser_v4.basic_ide import BasicProgram
            program = BasicProgram.from_dict(data)
            ok = browser.basic_storage.save(program)
            return web.json_response({"success": ok, "name": program.name})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=500)

    app.on_shutdown.append(on_shutdown)
    app.router.add_get("/", handle_index)
    app.router.add_get("/api/search", handle_search)
    app.router.add_get("/api/proxy", handle_proxy)
    app.router.add_post("/api/navigate", handle_navigate)
    app.router.add_post("/api/reader", handle_reader)
    app.router.add_post("/api/ai", handle_ai)
    app.router.add_post("/api/extract", handle_extract)
    app.router.add_post("/api/insights", handle_insights)
    app.router.add_get("/api/stats", handle_stats)
    app.router.add_post("/api/action", handle_action)

    # ── v4.1 API: Cookies, Extensions, DevTools, AI ──

    async def handle_cookies_list(request: web.Request) -> web.Response:
        domain = request.query.get("domain", "")
        if domain:
            cookies = browser.cookies.get_cookies(f"https://{domain}")
            return web.json_response({"success": True, "cookies": [c.to_dict() for c in cookies]})
        all_cookies = browser.cookies.list_all()
        return web.json_response({"success": True, "cookies": all_cookies, "stats": browser.cookies.stats})

    async def handle_cookies_clear(request: web.Request) -> web.Response:
        data = await request.json() if request.can_read_body else {}
        domain = data.get("domain", "")
        if domain:
            count = browser.cookies.clear_domain(domain)
        else:
            count = browser.cookies.clear_all()
        return web.json_response({"success": True, "cleared": count})

    async def handle_cookies_incognito(request: web.Request) -> web.Response:
        data = await request.json() if request.can_read_body else {}
        enabled = data.get("enabled", False)
        browser.cookies.set_incognito(enabled)
        return web.json_response({"success": True, "incognito": enabled})

    async def handle_extensions_list(request: web.Request) -> web.Response:
        exts = browser.extensions.list_extensions()
        return web.json_response({"success": True, "extensions": [e.to_dict() for e in exts], "stats": browser.extensions.stats})

    async def handle_extension_toggle(request: web.Request) -> web.Response:
        data = await request.json()
        ext_id = data.get("id", "")
        action = data.get("action", "toggle")
        if action == "enable":
            ok = browser.extensions.enable(ext_id)
        elif action == "disable":
            ok = browser.extensions.disable(ext_id)
        else:
            ext = browser.extensions.get_extension(ext_id)
            if ext:
                ok = browser.extensions.disable(ext_id) if ext.enabled else browser.extensions.enable(ext_id)
            else:
                ok = False
        return web.json_response({"success": ok})

    async def handle_devtools_console(request: web.Request) -> web.Response:
        level = request.query.get("level", "")
        limit = int(request.query.get("limit", "100"))
        messages = browser.devtools.get_console(level or None, limit)
        return web.json_response({"success": True, "messages": messages})

    async def handle_devtools_network(request: web.Request) -> web.Response:
        type_filter = request.query.get("type", "")
        limit = int(request.query.get("limit", "100"))
        requests = browser.devtools.get_network(type_filter or None, limit)
        return web.json_response({"success": True, "requests": requests, "stats": browser.devtools.stats})

    async def handle_devtools_security(request: web.Request) -> web.Response:
        url = request.query.get("url", "")
        headers_raw = request.query.get("headers", "{}")
        try:
            headers = json.loads(headers_raw)
        except Exception:
            headers = {}
        result = browser.devtools.analyze_page_security(url, headers)
        return web.json_response({"success": True, "security": result})

    async def handle_ai_summarize(request: web.Request) -> web.Response:
        data = await request.json()
        url = data.get("url", "")
        html = data.get("html", "")
        title = data.get("title", "")
        if not html and url:
            # Fetch the page directly with proper User-Agent
            import aiohttp
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15), ssl=True) as resp:
                    html = await resp.text()
        if not html:
            return web.json_response({"success": False, "error": "No HTML content"}, status=400)
        summary = browser.ai.summarize_page(title or url, html)
        return web.json_response({
            "success": True,
            "summary": {
                "title": summary.title,
                "text": summary.summary,
                "keyPoints": summary.key_points,
                "readingTime": summary.reading_time_min,
                "wordCount": summary.word_count,
                "sentiment": summary.sentiment,
                "topics": summary.topics,
                "language": summary.language,
            },
        })

    async def handle_ai_search(request: web.Request) -> web.Response:
        data = await request.json()
        query = data.get("query", "")
        if not query:
            return web.json_response({"success": False, "error": "No query"}, status=400)
        browser.ai.add_search_history(query)
        suggestions = browser.ai.get_suggestions(query)
        return web.json_response({
            "success": True,
            "query": query,
            "suggestions": [{"query": s.query, "type": s.type, "icon": s.icon} for s in suggestions],
        })

    async def handle_ai_analyze(request: web.Request) -> web.Response:
        data = await request.json()
        url = data.get("url", "")
        html = data.get("html", "")
        if not html and url:
            import aiohttp
            from urllib.parse import quote as _quote
            proxy_url = f"http://127.0.0.1:{request.app['port']}/api/proxy?url={_quote(url, safe='')}"
            async with aiohttp.ClientSession() as session:
                async with session.get(proxy_url, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                    html = await resp.text()
        if not html:
            return web.json_response({"success": False, "error": "No content"}, status=400)
        result = browser.ai.analyze_page(url, html)
        return web.json_response({"success": True, "analysis": result})

    async def handle_file_menu(request: web.Request) -> web.Response:
        return web.json_response({
            "success": True,
            "file": get_file_menu_actions(),
            "edit": get_edit_menu_actions(),
            "view": get_view_menu_actions(),
        })

    async def handle_brightness_get(request: web.Request) -> web.Response:
        return web.json_response({"success": True, "brightness": 100})

    async def handle_brightness_set(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            value = int(body.get("value", 100))
            value = max(20, min(150, value))
            return web.json_response({"success": True, "brightness": value})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=400)

    app.router.add_get("/api/cookies", handle_cookies_list)
    app.router.add_post("/api/cookies/clear", handle_cookies_clear)
    app.router.add_post("/api/cookies/incognito", handle_cookies_incognito)
    app.router.add_get("/api/extensions", handle_extensions_list)
    app.router.add_post("/api/extensions/toggle", handle_extension_toggle)
    app.router.add_get("/api/devtools/console", handle_devtools_console)
    app.router.add_get("/api/devtools/network", handle_devtools_network)
    app.router.add_get("/api/devtools/security", handle_devtools_security)
    app.router.add_post("/api/ai/summarize", handle_ai_summarize)
    app.router.add_post("/api/ai/search", handle_ai_search)
    app.router.add_post("/api/ai/analyze", handle_ai_analyze)
    app.router.add_get("/api/menu", handle_file_menu)
    app.router.add_get("/api/brightness", handle_brightness_get)
    app.router.add_post("/api/brightness", handle_brightness_set)

    # BASIC IDE routes
    app.router.add_get("/api/basic/list", handle_basic_list)
    app.router.add_post("/api/basic/load", handle_basic_load)
    app.router.add_post("/api/basic/save", handle_basic_save)
    app.router.add_post("/api/basic/delete", handle_basic_delete)
    app.router.add_get("/api/basic/demo", handle_basic_demo)
    app.router.add_post("/api/basic/export", handle_basic_export)
    app.router.add_post("/api/basic/import", handle_basic_import)

    # ── HAZOOM reward / loyalty routes ──
    async def handle_hazoom_balance(request: web.Request) -> web.Response:
        return web.json_response(hazoom.snapshot())

    async def handle_hazoom_history(request: web.Request) -> web.Response:
        limit = int(request.query.get("limit", "25"))
        return web.json_response(hazoom.history(limit))

    async def handle_hazoom_checkin(request: web.Request) -> web.Response:
        return web.json_response(hazoom.daily_checkin())

    async def handle_hazoom_connect(request: web.Request) -> web.Response:
        try:
            body = await request.json()
            address = (body.get("address") or "").strip()
            if not address or not address.startswith("0x") or len(address) < 10:
                return web.json_response({"success": False, "error": "Invalid wallet address"}, status=400)
            return web.json_response(hazoom.connect_wallet(address))
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)}, status=400)

    async def handle_hazoom_disconnect(request: web.Request) -> web.Response:
        return web.json_response(hazoom.disconnect_wallet())

    app.router.add_get("/api/hazoom", handle_hazoom_balance)
    app.router.add_get("/api/hazoom/history", handle_hazoom_history)
    app.router.add_post("/api/hazoom/checkin", handle_hazoom_checkin)
    app.router.add_post("/api/hazoom/wallet", handle_hazoom_connect)
    app.router.add_post("/api/hazoom/wallet/disconnect", handle_hazoom_disconnect)

    # Static files (BASIC interpreter, etc.)
    import os
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
    static_dir = os.path.normpath(static_dir)
    if os.path.isdir(static_dir):
        app.router.add_static("/static", static_dir)

    return app


def main() -> None:
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="MiMo Browser v4 — Personal Intelligent Browser")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind to")
    parser.add_argument("--ssl-cert", default=None, help="Path to SSL certificate (PEM)")
    parser.add_argument("--ssl-key", default=None, help="Path to SSL private key (PEM)")
    parser.add_argument("--auto-ssl", action="store_true", help="Auto-generate self-signed cert if not provided")
    parser.add_argument("--no-ad-block", action="store_true", help="Disable ad blocking")
    parser.add_argument("--no-doh", action="store_true", help="Disable DNS-over-HTTPS")
    parser.add_argument("--no-fp-protection", action="store_true", help="Disable fingerprint protection")
    parser.add_argument("--theme", choices=["dark", "light", "midnight", "forest", "ocean"], default="dark")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose logging")
    args = parser.parse_args()

    log_level = logging.DEBUG if args.verbose else logging.INFO
    Path("logs").mkdir(exist_ok=True)
    Path("downloads").mkdir(exist_ok=True)
    Path("data").mkdir(exist_ok=True)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("logs/mimo_v4.log"),
        ],
    )

    config = BrowserConfig(
        theme=args.theme,
        ad_block_enabled=not args.no_ad_block,
        doh_enabled=not args.no_doh,
        fingerprint_protection=not args.no_fp_protection,
    )

    async def run():
        app = await create_app(config, port=args.port)
        from aiohttp import web
        import ssl as ssl_mod

        ssl_cert = args.ssl_cert
        ssl_key = args.ssl_key

        # Auto-generate self-signed cert if requested and none provided
        if args.auto_ssl and not (ssl_cert and ssl_key):
            import subprocess
            cert_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "certs")
            os.makedirs(cert_dir, exist_ok=True)
            ssl_cert = os.path.join(cert_dir, "server.crt")
            ssl_key = os.path.join(cert_dir, "server.key")
            if not (os.path.isfile(ssl_cert) and os.path.isfile(ssl_key)):
                subprocess.run([
                    "openssl", "req", "-x509", "-newkey", "rsa:4096",
                    "-keyout", ssl_key, "-out", ssl_cert,
                    "-days", "365", "-nodes",
                    "-subj", "/CN=localhost/O=MiMo Browser v4/C=US",
                    "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
                ], check=True, capture_output=True)
                logger.info("  Auto-generated self-signed cert at %s", ssl_cert)

        runner = web.AppRunner(app)
        await runner.setup()

        ssl_ctx = None
        if ssl_cert and ssl_key:
            ssl_ctx = ssl_mod.create_default_context(ssl_mod.Purpose.CLIENT_AUTH)
            ssl_ctx.load_cert_chain(ssl_cert, ssl_key)
            logger.info("  TLS enabled with cert: %s", ssl_cert)

        site = web.TCPSite(runner, args.host, args.port, ssl_context=ssl_ctx)
        await site.start()
        logger.info("=" * 60)
        logger.info("  MiMo Browser v4 — Personal Intelligent Browser")
        proto = "https" if ssl_ctx else "http"
        logger.info("  Running at %s://localhost:%d", proto, args.port)
        logger.info("  Theme: %s | Ad Block: %s | DoH: %s | FP Protection: %s",
                     config.theme, config.ad_block_enabled, config.doh_enabled, config.fingerprint_protection)
        logger.info("  Press Ctrl+C to stop")
        logger.info("=" * 60)
        await asyncio.Event().wait()

    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        logger.info("MiMo Browser v4 stopped.")


if __name__ == "__main__":
    main()
