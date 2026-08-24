"""MiMo Browser v4 — Extension System.
Inspired by: "Les extensions permettent d'ajouter de nouvelles fonctionnalités
au navigateur, comme la météo dans la barre d'état, un blocage des publicités
des sites Web et la préservation de la confidentialité des données personnelles."""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

logger = logging.getLogger("mimo.v4.extension")


@dataclass
class Extension:
    """Represents a browser extension."""
    id: str
    name: str
    version: str
    description: str
    enabled: bool = True
    permissions: list[str] = field(default_factory=list)
    content_script: str = ""  # JS to inject into pages
    background_script: str = ""  # JS to run in background
    icon: str = "🧩"
    settings: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "enabled": self.enabled,
            "permissions": self.permissions,
            "content_script": self.content_script,
            "background_script": self.background_script,
            "icon": self.icon,
            "settings": self.settings,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Extension:
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class ExtensionManager:
    """Manages browser extensions with content script injection."""

    def __init__(self, storage_path: str = "./data/extensions.json") -> None:
        self._path = Path(storage_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._extensions: dict[str, Extension] = {}
        self._hooks: dict[str, list[Callable]] = {}  # hook_name -> [callbacks]
        self._load()
        self._register_builtin()

    def _load(self) -> None:
        if self._path.exists():
            try:
                data = json.loads(self._path.read_text())
                for ext_id, ext_data in data.items():
                    self._extensions[ext_id] = Extension.from_dict(ext_data)
            except Exception as e:
                logger.warning("Failed to load extensions: %s", e)

    def _save(self) -> None:
        try:
            data = {ext_id: ext.to_dict() for ext_id, ext in self._extensions.items()}
            self._path.write_text(json.dumps(data, indent=2))
        except Exception as e:
            logger.warning("Failed to save extensions: %s", e)

    def _register_builtin(self) -> None:
        """Register built-in extensions."""
        builtins = [
            Extension(
                id="ad-blocker",
                name="Ad Blocker",
                version="1.0.0",
                description="Blocks ads and trackers on web pages",
                icon="🛡️",
                permissions=["webRequest", "storage"],
                content_script="""
                (function(){
                    // Common ad selectors
                    var selectors = [
                        '[id*="ad-"]', '[class*="ad-"]', '[id*="ads-"]',
                        '[class*="ads-"]', '[id*="banner"]', '[class*="sponsor"]',
                        'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
                        'iframe[src*="facebook.com/plugins"]', '[data-ad]',
                        '.adsbygoogle', '#adsense'
                    ];
                    function removeAds() {
                        selectors.forEach(function(sel) {
                            document.querySelectorAll(sel).forEach(function(el) {
                                el.style.display = 'none';
                            });
                        });
                    }
                    removeAds();
                    var observer = new MutationObserver(removeAds);
                    observer.observe(document.body, {childList: true, subtree: true});
                })();
                """,
            ),
            Extension(
                id="dark-mode",
                name="Dark Mode",
                version="1.0.0",
                description="Applies dark theme to web pages",
                icon="🌙",
                permissions=["content"],
                content_script="""
                (function(){
                    var style = document.createElement('style');
                    style.textContent = 'html { filter: invert(1) hue-rotate(180deg) !important; } img, video, svg { filter: invert(1) hue-rotate(180deg) !important; }';
                    document.head.appendChild(style);
                })();
                """,
            ),
            Extension(
                id="privacy-guard",
                name="Privacy Guard",
                version="1.0.0",
                description="Blocks tracking scripts and fingerprinting",
                icon="🔒",
                permissions=["webRequest"],
                content_script="""
                (function(){
                    // Block common tracking scripts
                    var blocked = ['analytics', 'tracking', 'pixel', 'beacon', 'telemetry'];
                    var origOpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function() {
                        var url = arguments[1] || '';
                        for (var i = 0; i < blocked.length; i++) {
                            if (url.indexOf(blocked[i]) !== -1) return;
                        }
                        return origOpen.apply(this, arguments);
                    };
                    // Block navigator.sendBeacon
                    var origBeacon = navigator.sendBeacon;
                    navigator.sendBeacon = function(url) {
                        for (var i = 0; i < blocked.length; i++) {
                            if (url.indexOf(blocked[i]) !== -1) return false;
                        }
                        return origBeacon.apply(this, arguments);
                    };
                })();
                """,
            ),
            Extension(
                id="reading-time",
                name="Reading Time",
                version="1.0.0",
                description="Shows estimated reading time for articles",
                icon="⏱️",
                permissions=["content"],
                content_script="""
                (function(){
                    var article = document.querySelector('article') || document.querySelector('main') || document.body;
                    var text = article.innerText || '';
                    var words = text.split(/\\s+/).length;
                    var minutes = Math.ceil(words / 200);
                    var badge = document.createElement('div');
                    badge.style.cssText = 'position:fixed;bottom:16px;right:16px;background:rgba(0,0,0,0.8);color:#fff;padding:6px 12px;border-radius:16px;font-size:12px;z-index:99999;font-family:sans-serif;';
                    badge.textContent = '⏱️ ' + minutes + ' min read';
                    document.body.appendChild(badge);
                })();
                """,
            ),
        ]
        for ext in builtins:
            if ext.id not in self._extensions:
                self._extensions[ext.id] = ext
        self._save()

    def list_extensions(self) -> list[Extension]:
        return list(self._extensions.values())

    def get_extension(self, ext_id: str) -> Extension | None:
        return self._extensions.get(ext_id)

    def enable(self, ext_id: str) -> bool:
        if ext_id in self._extensions:
            self._extensions[ext_id].enabled = True
            self._save()
            return True
        return False

    def disable(self, ext_id: str) -> bool:
        if ext_id in self._extensions:
            self._extensions[ext_id].enabled = False
            self._save()
            return True
        return False

    def install(self, ext: Extension) -> bool:
        self._extensions[ext.id] = ext
        self._save()
        return True

    def uninstall(self, ext_id: str) -> bool:
        if ext_id in self._extensions:
            del self._extensions[ext_id]
            self._save()
            return True
        return False

    def get_content_scripts(self) -> str:
        """Get combined JS from all enabled extensions for page injection."""
        scripts = []
        for ext in self._extensions.values():
            if ext.enabled and ext.content_script:
                scripts.append(f"// Extension: {ext.name}\n{ext.content_script}")
        return "\n;\n".join(scripts)

    def register_hook(self, hook_name: str, callback: Callable) -> None:
        if hook_name not in self._hooks:
            self._hooks[hook_name] = []
        self._hooks[hook_name].append(callback)

    def trigger_hook(self, hook_name: str, **kwargs: Any) -> list[Any]:
        results = []
        for callback in self._hooks.get(hook_name, []):
            try:
                results.append(callback(**kwargs))
            except Exception as e:
                logger.error("Hook %s error: %s", hook_name, e)
        return results

    @property
    def stats(self) -> dict[str, int]:
        total = len(self._extensions)
        enabled = sum(1 for e in self._extensions.values() if e.enabled)
        return {"total": total, "enabled": enabled, "disabled": total - enabled}
