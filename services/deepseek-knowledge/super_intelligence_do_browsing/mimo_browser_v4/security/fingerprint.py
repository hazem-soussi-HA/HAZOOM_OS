"""MiMo Browser v4 — Fingerprint protection via JavaScript injection."""
from __future__ import annotations


class FingerprintGuard:
    """Provides JavaScript snippets to protect against browser fingerprinting.

    Each method returns a JavaScript string that can be injected into
    pages via CDP (Chrome DevTools Protocol) to override native APIs
    and add noise/spoofing to fingerprinting vectors.
    """

    CANVAS_NOISE_JS: str = """
    (function() {
        'use strict';
        // Canvas fingerprint noise injection
        var origToDataURL = HTMLCanvasElement.prototype.toDataURL;
        var origToBlob = HTMLCanvasElement.prototype.toBlob;
        var origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        var origFillText = CanvasRenderingContext2D.prototype.fillText;
        var origStrokeText = CanvasRenderingContext2D.prototype.strokeText;

        // Deterministic but unique per-session noise seed
        var noiseSeed = Math.floor(Math.random() * 2147483647);

        function pseudoRandom(seed) {
            var x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        }

        function addNoise(imageData, seed) {
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                var noise = Math.floor(pseudoRandom(seed + i) * 3) - 1;
                data[i] = Math.max(0, Math.min(255, data[i] + noise));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
            }
            return imageData;
        }

        HTMLCanvasElement.prototype.toDataURL = function() {
            if (this.width === 0 || this.height === 0) {
                return origToDataURL.apply(this, arguments);
            }
            var ctx = this.getContext('2d');
            if (ctx) {
                var imageData = ctx.getImageData(0, 0, this.width, this.height);
                addNoise(imageData, noiseSeed);
                ctx.putImageData(imageData, 0, 0);
            }
            return origToDataURL.apply(this, arguments);
        };

        HTMLCanvasElement.prototype.toBlob = function() {
            if (this.width === 0 || this.height === 0) {
                return origToBlob.apply(this, arguments);
            }
            var ctx = this.getContext('2d');
            if (ctx) {
                var imageData = ctx.getImageData(0, 0, this.width, this.height);
                addNoise(imageData, noiseSeed);
                ctx.putImageData(imageData, 0, 0);
            }
            return origToBlob.apply(this, arguments);
        };

        CanvasRenderingContext2D.prototype.getImageData = function() {
            var imageData = origGetImageData.apply(this, arguments);
            addNoise(imageData, noiseSeed);
            return imageData;
        };

        // Also protect toBlob via convertToBlob (OffscreenCanvas)
        if (typeof OffscreenCanvas !== 'undefined') {
            OffscreenCanvas.prototype.convertToBlob = (function(orig) {
                return function() {
                    var ctx = this.getContext('2d');
                    if (ctx && this.width > 0 && this.height > 0) {
                        var imageData = ctx.getImageData(0, 0, this.width, this.height);
                        addNoise(imageData, noiseSeed);
                        ctx.putImageData(imageData, 0, 0);
                    }
                    return orig.apply(this, arguments);
                };
            })(OffscreenCanvas.prototype.convertToBlob || function() { return Promise.resolve(); });
        }
    })();
    """

    WEBGL_SPOOF_JS: str = """
    (function() {
        'use strict';
        // WebGL fingerprint spoofing
        var spoofedVendor = 'Google Inc. (NVIDIA)';
        var spoofedRenderer = 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        var spoofedVersion = 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
        var spoofedShadingLanguage = 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';

        var origGetParameter = WebGLRenderingContext.prototype.getParameter;
        var origGetExtension = WebGLRenderingContext.prototype.getExtension;
        var origGetShaderPrecisionFormat = WebGLRenderingContext.prototype.getShaderPrecisionFormat;

        var VENDOR_PARAM = 0x1F00;
        var RENDERER_PARAM = 0x1F01;
        var VERSION_PARAM = 0x1F02;
        var SHADING_LANGUAGE_VERSION = 0x8B8C;

        WebGLRenderingContext.prototype.getParameter = function(param) {
            if (param === VENDOR_PARAM) return spoofedVendor;
            if (param === RENDERER_PARAM) return spoofedRenderer;
            if (param === VERSION_PARAM) return spoofedVersion;
            if (param === SHADING_LANGUAGE_VERSION) return spoofedShadingLanguage;
            return origGetParameter.apply(this, arguments);
        };

        // Spoof debug renderer info extension
        WebGLRenderingContext.prototype.getExtension = function(name) {
            if (name === 'WEBGL_debug_renderer_info') {
                return {
                    UNMASKED_VENDOR_WEBGL: VENDOR_PARAM,
                    UNMASKED_RENDERER_WEBGL: RENDERER_PARAM,
                };
            }
            return origGetExtension.apply(this, arguments);
        };

        // WebGL2 support
        if (typeof WebGL2RenderingContext !== 'undefined') {
            var origGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
            WebGL2RenderingContext.prototype.getParameter = function(param) {
                if (param === VENDOR_PARAM) return spoofedVendor;
                if (param === RENDERER_PARAM) return spoofedRenderer;
                if (param === VERSION_PARAM) return spoofedVersion;
                if (param === SHADING_LANGUAGE_VERSION) return spoofedShadingLanguage;
                return origGetParameter2.apply(this, arguments);
            };

            var origGetExtension2 = WebGL2RenderingContext.prototype.getExtension;
            WebGL2RenderingContext.prototype.getExtension = function(name) {
                if (name === 'WEBGL_debug_renderer_info') {
                    return {
                        UNMASKED_VENDOR_WEBGL: VENDOR_PARAM,
                        UNMASKED_RENDERER_WEBGL: RENDERER_PARAM,
                    };
                }
                return origGetExtension2.apply(this, arguments);
            };
        }
    })();
    """

    FONT_MASK_JS: str = """
    (function() {
        'use strict';
        // Font fingerprint masking
        // Returns a standardized set of fonts regardless of actual system fonts

        var COMMON_FONTS = [
            'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
            'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS',
            'Verdana', 'Lucida Console', 'Monaco', 'Palatino Linotype',
            'Tahoma', 'Helvetica', 'Calibri', 'Cambria', 'Consolas',
            'Segoe UI', 'Segoe UI Emoji', 'Segoe UI Symbol'
        ];

        // Override font detection via canvas measureText
        var origMeasureText = CanvasRenderingContext2D.prototype.measureText;
        var detectedWidths = {};

        CanvasRenderingContext2D.prototype.measureText = function(text) {
            var result = origMeasureText.apply(this, arguments);
            // Add subtle noise to text metrics for font detection scripts
            if (text && typeof text === 'string' && text.length > 2) {
                var font = this.font || '';
                if (font && !detectedWidths[font]) {
                    detectedWidths[font] = result.width;
                }
                // Add tiny random variation to prevent font enumeration
                var jitter = (Math.random() - 0.5) * 0.01;
                return {
                    width: result.width + jitter,
                    actualBoundingBoxAscent: result.actualBoundingBoxAscent,
                    actualBoundingBoxDescent: result.actualBoundingBoxDescent,
                    actualBoundingBoxLeft: result.actualBoundingBoxLeft,
                    actualBoundingBoxRight: result.actualBoundingBoxRight,
                    fontBoundingBoxAscent: result.fontBoundingBoxAscent,
                    fontBoundingBoxDescent: result.fontBoundingBoxDescent,
                };
            }
            return result;
        };

        // Override CSS font detection
        var origGetComputedStyle = window.getComputedStyle;
        var fontDetectionProps = ['fontFamily', 'fontSize', 'fontWeight'];

        // Standardize navigator.fonts API if available
        if (navigator.fonts && navigator.fonts.query) {
            navigator.fonts.query = function() {
                return Promise.resolve(COMMON_FONTS.map(function(f) {
                    return {
                        family: f,
                        status: 'loaded',
                        style: 'normal',
                    };
                }));
            };
        }

        // Block common font detection techniques
        if (document.fonts && document.fonts.check) {
            var origCheck = document.fonts.check;
            document.fonts.check = function() {
                // Always report common fonts as available
                var fontSpec = arguments[0] || '';
                for (var i = 0; i < COMMON_FONTS.length; i++) {
                    if (fontSpec.indexOf(COMMON_FONTS[i]) !== -1) {
                        return true;
                    }
                }
                return origCheck.apply(this, arguments);
            };
        }
    })();
    """

    @classmethod
    def get_canvas_noise(cls) -> str:
        """Get JavaScript snippet for canvas fingerprint noise injection.

        Returns:
            JavaScript code string to inject into pages.
        """
        return cls.CANVAS_NOISE_JS.strip()

    @classmethod
    def get_webgl_spoof(cls) -> str:
        """Get JavaScript snippet for WebGL fingerprint spoofing.

        Returns:
            JavaScript code string to inject into pages.
        """
        return cls.WEBGL_SPOOF_JS.strip()

    @classmethod
    def get_font_mask(cls) -> str:
        """Get JavaScript snippet for font fingerprint masking.

        Returns:
            JavaScript code string to inject into pages.
        """
        return cls.FONT_MASK_JS.strip()

    @classmethod
    def get_full_protection_script(cls) -> str:
        """Get the complete fingerprint protection script.

        Combines all protection mechanisms into a single script that
        can be injected into every page load.

        Returns:
            Combined JavaScript code string for full fingerprint protection.
        """
        sections = [
            "// === MiMo Browser v4 — Fingerprint Protection ===",
            "// Auto-generated protection script. Inject at document_start.",
            "",
            cls.CANVAS_NOISE_JS.strip(),
            "",
            cls.WEBGL_SPOOF_JS.strip(),
            "",
            cls.FONT_MASK_JS.strip(),
            "",
            "// === Additional Protections ===",
            cls._get_navigator_spoof_js(),
            cls._get_audio_spoof_js(),
            cls._get_screen_spoof_js(),
            "// === End Fingerprint Protection ===",
        ]
        return "\n".join(sections)

    @staticmethod
    def _get_navigator_spoof_js() -> str:
        """Get navigator property spoofing JavaScript."""
        return """
    (function() {
        'use strict';
        // Spoof navigator properties
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: function() { return 4; },
            configurable: true,
        });
        Object.defineProperty(navigator, 'deviceMemory', {
            get: function() { return 8; },
            configurable: true,
        });
        Object.defineProperty(navigator, 'platform', {
            get: function() { return 'Win32'; },
            configurable: true,
        });
        Object.defineProperty(navigator, 'plugins', {
            get: function() { return []; },
            configurable: true,
        });
        Object.defineProperty(navigator, 'mimeTypes', {
            get: function() { return []; },
            configurable: true,
        });
    })();
    """.strip()

    @staticmethod
    def _get_audio_spoof_js() -> str:
        """Get audio context fingerprint noise JavaScript."""
        return """
    (function() {
        'use strict';
        // AudioContext fingerprint noise
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            var OrigAudioContext = window.AudioContext || window.webkitAudioContext;
            var origCreateAnalyser = OrigAudioContext.prototype.createAnalyser;
            var origCreateOscillator = OrigAudioContext.prototype.createOscillator;
            var origGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;

            AnalyserNode.prototype.getFloatFrequencyData = function(array) {
                origGetFloatFrequencyData.apply(this, arguments);
                // Add subtle noise to frequency data
                for (var i = 0; i < array.length; i++) {
                    array[i] += (Math.random() - 0.5) * 0.0001;
                }
            };

            AnalyserNode.prototype.getByteFrequencyData = function(array) {
                AnalyserNode.prototype.getFloatFrequencyData.call(this, new Float32Array(array.buffer));
            };
        }
    })();
    """.strip()

    @staticmethod
    def _get_screen_spoof_js() -> str:
        """Get screen property spoofing JavaScript."""
        return """
    (function() {
        'use strict';
        // Standardize screen properties
        Object.defineProperty(screen, 'width', {
            get: function() { return 1920; },
            configurable: true,
        });
        Object.defineProperty(screen, 'height', {
            get: function() { return 1080; },
            configurable: true,
        });
        Object.defineProperty(screen, 'availWidth', {
            get: function() { return 1920; },
            configurable: true,
        });
        Object.defineProperty(screen, 'availHeight', {
            get: function() { return 1040; },
            configurable: true,
        });
        Object.defineProperty(screen, 'colorDepth', {
            get: function() { return 24; },
            configurable: true,
        });
        Object.defineProperty(screen, 'pixelDepth', {
            get: function() { return 24; },
            configurable: true,
        });
    })();
    """.strip()
