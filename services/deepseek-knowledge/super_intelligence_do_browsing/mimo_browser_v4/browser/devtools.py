"""MiMo Browser v4 — Developer Tools & JS Console.
Inspired by: "Les navigateurs permettent d'imprimer les pages web..."
and "JavaScript... principal langage de script, côté client."
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger("mimo.v4.devtools")


@dataclass
class ConsoleMessage:
    """A single console message."""
    level: str  # log, warn, error, info, debug
    message: str
    timestamp: float = 0.0
    source: str = ""
    line: int = 0

    def to_dict(self) -> dict[str, Any]:
        import time
        return {
            "level": self.level,
            "message": self.message,
            "timestamp": self.timestamp or time.time(),
            "source": self.source,
            "line": self.line,
        }


@dataclass
class NetworkRequest:
    """Tracked network request."""
    method: str
    url: str
    status: int = 0
    content_type: str = ""
    size: int = 0
    duration_ms: float = 0.0
    type: str = "other"  # document, stylesheet, script, image, xhr, fetch

    def to_dict(self) -> dict[str, Any]:
        return {
            "method": self.method,
            "url": self.url,
            "status": self.status,
            "contentType": self.content_type,
            "size": self.size,
            "duration": self.duration_ms,
            "type": self.type,
        }


@dataclass
class DOMNode:
    """Simplified DOM tree node."""
    tag: str
    id: str = ""
    classes: list[str] = field(default_factory=list)
    children: list[DOMNode] = field(default_factory=list)
    text: str = ""
    attrs: dict[str, str] = field(default_factory=dict)


class DevTools:
    """Developer tools: console, network, DOM inspector, resource editor."""

    def __init__(self) -> None:
        self._console: list[ConsoleMessage] = []
        self._network: list[NetworkRequest] = []
        self._enabled: bool = False

    def enable(self) -> None:
        self._enabled = True

    def disable(self) -> None:
        self._enabled = False

    # ── Console ──
    def log(self, message: str, level: str = "log", source: str = "", line: int = 0) -> None:
        import time
        if not self._enabled:
            return
        self._console.append(ConsoleMessage(
            level=level, message=message, source=source, line=line,
            timestamp=time.time(),
        ))

    def get_console(self, level: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
        messages = self._console
        if level:
            messages = [m for m in messages if m.level == level]
        return [m.to_dict() for m in messages[-limit:]]

    def clear_console(self) -> None:
        self._console.clear()

    # ── Network ──
    def track_request(self, request: NetworkRequest) -> None:
        if self._enabled:
            self._network.append(request)

    def get_network(self, type_filter: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
        reqs = self._network
        if type_filter:
            reqs = [r for r in reqs if r.type == type_filter]
        return [r.to_dict() for r in reqs[-limit:]]

    def clear_network(self) -> None:
        self._network.clear()

    # ── Performance ──
    def get_performance_stats(self) -> dict[str, Any]:
        """Return page performance statistics."""
        total_requests = len(self._network)
        total_size = sum(r.size for r in self._network)
        by_type: dict[str, int] = {}
        for r in self._network:
            by_type[r.type] = by_type.get(r.type, 0) + 1
        avg_duration = (
            sum(r.duration_ms for r in self._network) / total_requests
            if total_requests > 0 else 0
        )
        return {
            "totalRequests": total_requests,
            "totalSize": total_size,
            "avgDuration": round(avg_duration, 1),
            "byType": by_type,
            "errors": sum(1 for r in self._network if r.status >= 400),
        }

    # ── Security Info ──
    def analyze_page_security(self, url: str, headers: dict[str, str]) -> dict[str, Any]:
        """Analyze security of the current page."""
        issues: list[dict[str, str]] = []
        score = 100

        # Check HTTPS
        if not url.startswith("https://"):
            issues.append({"severity": "high", "message": "Page not served over HTTPS"})
            score -= 30

        # Check security headers
        important_headers = {
            "X-Frame-Options": ("Clickjacking protection", 10),
            "X-Content-Type-Options": ("MIME sniffing protection", 5),
            "X-XSS-Protection": ("XSS filter", 5),
            "Referrer-Policy": ("Referrer control", 5),
            "Content-Security-Policy": ("CSP", 15),
            "Strict-Transport-Security": ("HSTS", 10),
        }
        for header, (desc, penalty) in important_headers.items():
            if header not in headers:
                issues.append({"severity": "medium", "message": f"Missing {header} ({desc})"})
                score -= penalty

        # Check for mixed content (simplified)
        if url.startswith("https://"):
            issues.append({"severity": "info", "message": "Check for HTTP resources on HTTPS page"})

        return {
            "score": max(0, score),
            "grade": "A" if score >= 90 else "B" if score >= 75 else "C" if score >= 60 else "D" if score >= 40 else "F",
            "issues": issues,
            "https": url.startswith("https://"),
        }

    @property
    def stats(self) -> dict[str, Any]:
        return {
            "consoleMessages": len(self._console),
            "consoleErrors": sum(1 for m in self._console if m.level == "error"),
            "networkRequests": len(self._network),
            "enabled": self._enabled,
        }


def generate_devtools_js() -> str:
    """Generate JavaScript to inject into pages for devtools integration."""
    return """
    <script>
    (function(){
        // Console interception
        if (!window.__mimo_console) {
            window.__mimo_console = [];
            var origLog = console.log;
            var origWarn = console.warn;
            var origError = console.error;
            var origInfo = console.info;

            function capture(level, args) {
                var msg = Array.from(args).map(function(a) {
                    return typeof a === 'object' ? JSON.stringify(a) : String(a);
                }).join(' ');
                window.__mimo_console.push({level: level, message: msg, time: Date.now()});
            }

            console.log = function() { capture('log', arguments); origLog.apply(console, arguments); };
            console.warn = function() { capture('warn', arguments); origWarn.apply(console, arguments); };
            console.error = function() { capture('error', arguments); origError.apply(console, arguments); };
            console.info = function() { capture('info', arguments); origInfo.apply(console, arguments); };
        }

        // Network interception
        if (!window.__mimo_network) {
            window.__mimo_network = [];
            var origFetch = window.fetch;
            window.fetch = function(url, opts) {
                var start = performance.now();
                return origFetch.apply(this, arguments).then(function(resp) {
                    window.__mimo_network.push({
                        type: 'fetch', url: String(url).substring(0, 200),
                        status: resp.status, duration: Math.round(performance.now() - start)
                    });
                    return resp;
                });
            };
            var origXHROpen = XMLHttpRequest.prototype.open;
            var origXHRSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.open = function(method, url) {
                this.__mimo_method = method;
                this.__mimo_url = url;
                this.__mimo_start = performance.now();
                return origXHROpen.apply(this, arguments);
            };
            XMLHttpRequest.prototype.send = function() {
                this.addEventListener('loadend', function() {
                    window.__mimo_network.push({
                        type: 'xhr', method: this.__mimo_method,
                        url: String(this.__mimo_url || '').substring(0, 200),
                        status: this.status, duration: Math.round(performance.now() - this.__mimo_start)
                    });
                });
                return origXHRSend.apply(this, arguments);
            };
        }

        // Error tracking
        window.addEventListener('error', function(e) {
            window.__mimo_console.push({
                level: 'error',
                message: e.message + ' at ' + e.filename + ':' + e.lineno,
                time: Date.now()
            });
        });

        // Expose devtools API
        window.__mimo_devtools = {
            getConsole: function() { return JSON.stringify(window.__mimo_console); },
            getNetwork: function() { return JSON.stringify(window.__mimo_network); },
            clearConsole: function() { window.__mimo_console = []; },
            clearNetwork: function() { window.__mimo_network = []; },
            getDOM: function() {
                var html = document.documentElement.outerHTML;
                return html.substring(0, 50000); // Limit size
            },
            getCookies: function() { return document.cookie; },
            getLocalStorage: function() {
                var data = {};
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    data[key] = localStorage.getItem(key);
                }
                return JSON.stringify(data);
            },
            getSessionStorage: function() {
                var data = {};
                for (var i = 0; i < sessionStorage.length; i++) {
                    var key = sessionStorage.key(i);
                    data[key] = sessionStorage.getItem(key);
                }
                return JSON.stringify(data);
            },
            getPerformance: function() {
                var p = performance.getEntriesByType('resource');
                return JSON.stringify(p.map(function(r) {
                    return {name: r.name, type: r.initiatorType, duration: Math.round(r.duration), size: r.transferSize || 0};
                }));
            }
        };
    })();
    </script>
    """
