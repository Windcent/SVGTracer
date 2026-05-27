// SVGTracer Application Engine
(function() {
    'use strict';

    // State Variables
    let activeTool = 'select'; // select, pan, pen, line, rect, ellipse, polygon
    let zoom = 1.0;
    let panX = 0;
    let panY = 0;
    
    let selectedEl = null;
    const selection = {
        elements: [],
        get active() {
            return this.elements[0] || null;
        },
        set active(el) {
            this.elements = el ? [el] : [];
        },
        clear() {
            this.elements = [];
        },
        add(el) {
            if (el && !this.elements.includes(el)) {
                this.elements.push(el);
            }
        },
        remove(el) {
            const idx = this.elements.indexOf(el);
            if (idx !== -1) this.elements.splice(idx, 1);
        },
        contains(el) {
            return this.elements.includes(el);
        }
    };
    let isDrawing = false;
    let activeDrawEl = null;
    let drawingPoints = []; // For pen / polygon
    
    // Undo / Redo stacks
    let historyStack = [];
    let historyIndex = -1;
    let localClipboard = [];
    
    // Grid settings
    let gridSize = 20;
    let gridSnap = true;
    let showGrid = true;
    
    // Interaction Trackers
    let dragMode = 'none'; // none, pan, move, resize, marquee
    let resizeHandle = null;
    let dragStart = { x: 0, y: 0 };
    let initialPan = { x: 0, y: 0 };
    let initialBox = { x: 0, y: 0, w: 0, h: 0 };
    let initialElementCoords = {};
    let initialElementCoordsList = [];
    let initialLineCoords = {};
    let spacePressed = false;
    let shapeCounts = {};
    let clickedElement = null;

    // Default styles for new shapes / selections
    let defaultStyle = {
        fillType: 'none', // none, color, gradient
        fill: '#ffffff',
        fillGrad: 'grad-cyan-blue',
        strokeEnabled: true,
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeDash: 'solid', // solid, dashed, dotted
        strokeJoin: 'miter',
        opacity: 1.0,
        fontFamily: 'Outfit',
        fontSize: 20,
        textVal: 'Text'
    };

    // DOM Elements
    const canvasViewport = document.getElementById('canvasViewport');
    const canvasContainer = document.getElementById('canvasContainer');
    const svgGrid = document.getElementById('svgGrid');
    const worldGroup = document.getElementById('worldGroup');
    const drawGroup = document.getElementById('drawGroup');
    const previewGroup = document.getElementById('previewGroup');
    const transformerGroup = document.getElementById('transformerGroup');
    const gridBackplate = document.getElementById('gridBackplate');

    // UI Inputs & Buttons
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    const lblZoomLevel = document.getElementById('lblZoomLevel');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnResetZoom = document.getElementById('btnResetZoom');
    const btnClearCanvas = document.getElementById('btnClearCanvas');
    const btnImport = document.getElementById('btnImport');
    const btnExportMenu = document.getElementById('btnExportMenu');
    const exportDropdown = document.getElementById('exportDropdown');
    const btnExportSVG = document.getElementById('btnExportSVG');
    const btnCopyOffice = document.getElementById('btnCopyOffice');
    const btnCopySelectionOffice = document.getElementById('btnCopySelectionOffice');
    const btnExportPNG = document.getElementById('btnExportPNG');

    // Import Modal Elements
    const importModal = document.getElementById('importModal');
    const btnImportClose = document.getElementById('btnImportClose');
    const btnImportCancel = document.getElementById('btnImportCancel');
    const btnImportSubmit = document.getElementById('btnImportSubmit');
    const fileSvgInput = document.getElementById('fileSvgInput');
    const txtSvgPaste = document.getElementById('txtSvgPaste');
    const importError = document.getElementById('importError');

    // Inspector Inputs
    const selectionProperties = document.getElementById('selectionProperties');
    const selectionPropertiesEmpty = document.getElementById('selectionPropertiesEmpty');
    const dimensionFields = document.getElementById('dimensionFields');
    const valX = document.getElementById('valX');
    const valY = document.getElementById('valY');
    const valW = document.getElementById('valW');
    const valH = document.getElementById('valH');
    const txtSelectedType = document.getElementById('txtSelectedType');
    const cornerRadiusField = document.getElementById('cornerRadiusField');
    const valRx = document.getElementById('valRx');
    const lblRx = document.getElementById('lblRx');

    const btnFillNone = document.getElementById('btnFillNone');
    const btnFillColor = document.getElementById('btnFillColor');
    const btnFillGradient = document.getElementById('btnFillGradient');
    const fillColorWrapper = document.getElementById('fillColorWrapper');
    const fillGradWrapper = document.getElementById('fillGradWrapper');
    const valFillColor = document.getElementById('valFillColor');
    const valFillHex = document.getElementById('valFillHex');
    const valFillGradientSelect = document.getElementById('valFillGradientSelect');
    const fillColorHistory = document.getElementById('fillColorHistory');
    let fillColorHistoryList = [];

    const btnStrokeNone = document.getElementById('btnStrokeNone');
    const btnStrokeSolid = document.getElementById('btnStrokeSolid');
    const btnStrokeDashed = document.getElementById('btnStrokeDashed');
    const btnStrokeDotted = document.getElementById('btnStrokeDotted');
    const strokeSubProperties = document.getElementById('strokeSubProperties');
    const valStrokeColor = document.getElementById('valStrokeColor');
    const valStrokeHex = document.getElementById('valStrokeHex');
    const valStrokeWidth = document.getElementById('valStrokeWidth');
    const lblStrokeWidth = document.getElementById('lblStrokeWidth');
    const valStrokeJoin = document.getElementById('valStrokeJoin');
    const strokeColorHistory = document.getElementById('strokeColorHistory');
    let strokeColorHistoryList = [];
    const DEFAULT_COLORS = ['#ffffff', '#000000', '#dfb75c', '#ffd700', '#00f2fe', '#4facfe', '#a18cd1', '#fbc2eb'];
    let strokeColorTimeout = null;
    let fillColorTimeout = null;

    const textProperties = document.getElementById('textProperties');
    const valTextContent = document.getElementById('valTextContent');
    const valFontSize = document.getElementById('valFontSize');
    const valFontFamily = document.getElementById('valFontFamily');

    const valOpacity = document.getElementById('valOpacity');
    const lblOpacity = document.getElementById('lblOpacity');
    const btnDeleteSelected = document.getElementById('btnDeleteSelected');
    const btnDuplicateSelected = document.getElementById('btnDuplicateSelected');

    // Workspace Settings Inputs
    const chkShowGrid = document.getElementById('chkShowGrid');
    const chkSnapToGrid = document.getElementById('chkSnapToGrid');
    const valGridSize = document.getElementById('valGridSize');
    const snapIndicator = document.getElementById('snapIndicator');

    // Tab buttons & Layer buttons
    const tabBtnProperties = document.getElementById('tabBtnProperties');
    const tabBtnLayers = document.getElementById('tabBtnLayers');
    const tabContentProperties = document.getElementById('tabContentProperties');
    const tabContentLayers = document.getElementById('tabContentLayers');
    const layersList = document.getElementById('layersList');
    const btnMoveLayerUp = document.getElementById('btnMoveLayerUp');
    const btnMoveLayerDown = document.getElementById('btnMoveLayerDown');

    // INITIALIZATION
    function init() {
        // 1. Inject Gradient Defs
        injectGradientDefs();

        // 2. Load LocalStorage State
        loadState();
        loadColorHistory();
        loadFillColorHistory();

        // 3. Reset Viewport Zoom / Panning
        centerViewport();

        // 4. Update Grid pattern
        updateGridLines();

        // 5. Setup Events
        setupEventHandlers();

        // 6. Refresh UI Layout
        updateInspectorUI();
    }

    // Helper: Dynamic Gradient Defs injection
    function injectGradientDefs() {
        const defs = svgGrid.querySelector('defs');
        const gradientHTML = `
            <linearGradient id="grad-cyan-blue-def" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00f2fe" />
                <stop offset="100%" stop-color="#4facfe" />
            </linearGradient>
            <linearGradient id="grad-purple-pink-def" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a18cd1" />
                <stop offset="100%" stop-color="#fbc2eb" />
            </linearGradient>
            <linearGradient id="grad-gold-orange-def" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f6d365" />
                <stop offset="100%" stop-color="#fda085" />
            </linearGradient>
            <linearGradient id="grad-emerald-teal-def" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#05d590" />
                <stop offset="100%" stop-color="#00a896" />
            </linearGradient>
            <linearGradient id="grad-dark-mode-def" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#30cfd0" />
                <stop offset="100%" stop-color="#330867" />
            </linearGradient>
        `;
        defs.insertAdjacentHTML('beforeend', gradientHTML);
    }

    // Helper: Center canvas viewport on window load
    function centerViewport() {
        const rect = canvasViewport.getBoundingClientRect();
        // Place coordinate 0,0 near the middle-left of workspace
        panX = Math.round(rect.width / 2.5);
        panY = Math.round(rect.height / 2);
        zoom = 1.0;
        updateCanvasTransform();
    }

    // COLOR HISTORY LOGIC
    function loadColorHistory() {
        const saved = localStorage.getItem('svgtracer_stroke_colors');
        if (saved) {
            try {
                strokeColorHistoryList = JSON.parse(saved);
            } catch (e) {
                strokeColorHistoryList = [...DEFAULT_COLORS];
            }
        } else {
            strokeColorHistoryList = [...DEFAULT_COLORS];
        }
        renderColorHistory();
    }

    function saveColorHistory() {
        localStorage.setItem('svgtracer_stroke_colors', JSON.stringify(strokeColorHistoryList));
    }

    function addToColorHistory(color) {
        if (!color) return;
        const hex = rgbToHex(color) || color;
        const clean = hex.toLowerCase();
        
        // Remove duplicate
        const idx = strokeColorHistoryList.indexOf(clean);
        if (idx !== -1) {
            strokeColorHistoryList.splice(idx, 1);
        }
        
        // Prepend and limit to 8 colors
        strokeColorHistoryList.unshift(clean);
        if (strokeColorHistoryList.length > 8) {
            strokeColorHistoryList = strokeColorHistoryList.slice(0, 8);
        }
        
        saveColorHistory();
        renderColorHistory();
    }

    function renderColorHistory() {
        if (!strokeColorHistory) return;
        strokeColorHistory.innerHTML = '';
        
        let activeColor = '#ffffff';
        if (selectedEl) {
            const stroke = selectedEl.getAttribute('stroke') || 'none';
            if (stroke !== 'none') {
                activeColor = (rgbToHex(stroke) || stroke).toLowerCase();
            }
        } else {
            activeColor = defaultStyle.stroke.toLowerCase();
        }
        
        strokeColorHistoryList.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = `color-swatch ${color === activeColor ? 'active' : ''}`;
            swatch.style.backgroundColor = color;
            swatch.title = color;
            
            swatch.addEventListener('click', () => {
                valStrokeColor.value = color;
                valStrokeHex.value = color;
                handleStyleUIChange();
                renderColorHistory();
            });
            
            strokeColorHistory.appendChild(swatch);
        });
    }

    function loadFillColorHistory() {
        const saved = localStorage.getItem('svgtracer_fill_colors');
        if (saved) {
            try {
                fillColorHistoryList = JSON.parse(saved);
            } catch (e) {
                fillColorHistoryList = [...DEFAULT_COLORS];
            }
        } else {
            fillColorHistoryList = [...DEFAULT_COLORS];
        }
        renderFillColorHistory();
    }

    function saveFillColorHistory() {
        localStorage.setItem('svgtracer_fill_colors', JSON.stringify(fillColorHistoryList));
    }

    function addToFillColorHistory(color) {
        if (!color) return;
        const hex = rgbToHex(color) || color;
        const clean = hex.toLowerCase();
        
        const idx = fillColorHistoryList.indexOf(clean);
        if (idx !== -1) {
            fillColorHistoryList.splice(idx, 1);
        }
        
        fillColorHistoryList.unshift(clean);
        if (fillColorHistoryList.length > 8) {
            fillColorHistoryList = fillColorHistoryList.slice(0, 8);
        }
        
        saveFillColorHistory();
        renderFillColorHistory();
    }

    function renderFillColorHistory() {
        if (!fillColorHistory) return;
        fillColorHistory.innerHTML = '';
        
        let activeColor = '#ffffff';
        if (selectedEl) {
            const fill = selectedEl.getAttribute('fill') || 'none';
            if (fill !== 'none' && !fill.startsWith('url(#')) {
                activeColor = (rgbToHex(fill) || fill).toLowerCase();
            }
        } else {
            activeColor = defaultStyle.fill.toLowerCase();
        }
        
        fillColorHistoryList.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = `color-swatch ${color === activeColor ? 'active' : ''}`;
            swatch.style.backgroundColor = color;
            swatch.title = color;
            
            swatch.addEventListener('click', () => {
                valFillColor.value = color;
                valFillHex.value = color;
                handleStyleUIChange();
                renderFillColorHistory();
            });
            
            fillColorHistory.appendChild(swatch);
        });
    }

    function debounceAddToStrokeHistory(color) {
        if (strokeColorTimeout) clearTimeout(strokeColorTimeout);
        strokeColorTimeout = setTimeout(() => {
            addToColorHistory(color);
        }, 500);
    }

    function debounceAddToFillHistory(color) {
        if (fillColorTimeout) clearTimeout(fillColorTimeout);
        fillColorTimeout = setTimeout(() => {
            addToFillColorHistory(color);
        }, 500);
    }

    function updateTextContent(textEl, txtVal) {
        textEl.innerHTML = '';
        const lines = txtVal.split('\n');
        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', textEl.getAttribute('x') || '0');
            if (index > 0) {
                tspan.setAttribute('dy', '1.2em');
            }
            tspan.textContent = line || ' ';
            textEl.appendChild(tspan);
        });
    }

    function getTextContent(textEl) {
        const tspans = textEl.querySelectorAll('tspan');
        if (tspans.length > 0) {
            return Array.from(tspans).map(t => t.textContent).join('\n');
        }
        return textEl.textContent;
    }

    function showTextEditorOverlay(x, y, existingTextNode = null) {
        // Remove any existing active overlay first
        const activeOverlay = canvasViewport.querySelector('.text-edit-overlay');
        if (activeOverlay) activeOverlay.remove();

        const vpX = x * zoom + panX;
        const vpY = y * zoom + panY;

        const overlay = document.createElement('textarea');
        overlay.className = 'text-edit-overlay';
        overlay.value = existingTextNode ? getTextContent(existingTextNode) : 'Text';
        overlay.style.left = `${vpX}px`;
        overlay.style.top = `${vpY - (15 * zoom)}px`; // shift up slightly to align with cursor baseline
        overlay.style.fontFamily = existingTextNode ? existingTextNode.getAttribute('font-family') : defaultStyle.fontFamily;
        overlay.style.fontSize = `${(existingTextNode ? parseFloat(existingTextNode.getAttribute('font-size')) : defaultStyle.fontSize) * zoom}px`;
        overlay.style.color = existingTextNode ? (existingTextNode.getAttribute('fill') || '#ffffff') : (defaultStyle.fillType === 'color' ? defaultStyle.fill : '#ffffff');
        overlay.style.width = '150px';
        overlay.style.height = '40px';

        const adjustSize = () => {
            overlay.style.width = 'auto';
            overlay.style.height = 'auto';
            overlay.style.width = `${Math.max(150, overlay.scrollWidth + 10)}px`;
            overlay.style.height = `${Math.max(40, overlay.scrollHeight + 5)}px`;
        };

        const saveAndExit = () => {
            const txtVal = overlay.value;
            if (txtVal && txtVal.trim()) {
                if (existingTextNode) {
                    updateTextContent(existingTextNode, txtVal);
                    selectElement(existingTextNode);
                } else {
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.id = generateId('text');
                    textEl.setAttribute('x', x);
                    textEl.setAttribute('y', y);
                    textEl.setAttribute('font-family', defaultStyle.fontFamily);
                    textEl.setAttribute('font-size', defaultStyle.fontSize);
                    textEl.setAttribute('fill', defaultStyle.fillType === 'color' ? defaultStyle.fill : '#ffffff');
                    textEl.setAttribute('opacity', defaultStyle.opacity);
                    updateTextContent(textEl, txtVal);
                    
                    drawGroup.appendChild(textEl);
                    selectElement(textEl);
                }
                saveState();
            } else if (existingTextNode) {
                existingTextNode.remove();
                selectElement(null);
                saveState();
            }
            overlay.remove();
        };

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                saveAndExit();
            }
            if (e.key === 'Escape') {
                overlay.remove();
            }
        });
        overlay.addEventListener('input', adjustSize);
        overlay.addEventListener('blur', saveAndExit);
        canvasViewport.appendChild(overlay);
        adjustSize();
        overlay.focus();
        overlay.select();
    }

    function updateCursor() {
        if (spacePressed || dragMode === 'pan') {
            canvasViewport.style.cursor = 'grabbing';
        } else if (activeTool === 'pan') {
            canvasViewport.style.cursor = 'grab';
        } else if (activeTool === 'select') {
            canvasViewport.style.cursor = 'default';
        } else if (activeTool === 'bucket') {
            canvasViewport.style.cursor = ''; // Let CSS custom cursor handle it
        } else {
            canvasViewport.style.cursor = 'crosshair';
        }
    }

    // MATH HELPERS & COORDINATE CONVERSION
    function getCanvasCoords(e) {
        const rect = canvasViewport.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
        
        const vpX = clientX - rect.left;
        const vpY = clientY - rect.top;
        
        let rawX = (vpX - panX) / zoom;
        let rawY = (vpY - panY) / zoom;
        
        let x = rawX;
        let y = rawY;
        
        if (gridSnap && activeTool !== 'pan') {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }
        
        return { x, y, rawX, rawY };
    }

    function rgbToHex(color) {
        if (!color) return null;
        if (color.startsWith('#')) return color;
        if (!color.startsWith('rgb')) return null;
        
        const rgb = color.match(/\d+/g);
        if (!rgb || rgb.length < 3) return null;
        
        const r = parseInt(rgb[0], 10).toString(16).padStart(2, '0');
        const g = parseInt(rgb[1], 10).toString(16).padStart(2, '0');
        const b = parseInt(rgb[2], 10).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    function generateId(tagName) {
        if (!shapeCounts[tagName]) shapeCounts[tagName] = 0;
        let id;
        do {
            shapeCounts[tagName]++;
            id = `${tagName}-${shapeCounts[tagName]}`;
        } while (document.getElementById(id));
        return id;
    }

    function rectsIntersect(r1, r2) {
        return r1.x < r2.x + r2.w &&
               r1.x + r1.w > r2.x &&
               r1.y < r2.y + r2.h &&
               r1.y + r1.h > r2.y;
    }

    function getCollectiveBounds(elements) {
        if (elements.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        elements.forEach(el => {
            const bbox = el.getBBox();
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
        });
        return {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
        };
    }

    // STATE HISTORY & PERSISTENCE
    function saveState() {
        const html = drawGroup.innerHTML;
        if (historyIndex >= 0 && historyStack[historyIndex] === html) return;
        
        // Discard redos if drawing a new shape
        historyStack = historyStack.slice(0, historyIndex + 1);
        historyStack.push(html);
        historyIndex = historyStack.length - 1;
        
        // Update Undone Button states
        btnUndo.disabled = historyIndex <= 0;
        btnRedo.disabled = historyIndex >= historyStack.length - 1;
        
        localStorage.setItem('svgtracer_elements', html);
        localStorage.setItem('svgtracer_canvas_light', document.body.classList.contains('canvas-light-mode'));
        renderLayers();
    }

    function loadState() {
        const saved = localStorage.getItem('svgtracer_elements');
        if (saved) {
            drawGroup.innerHTML = saved;
            // Assure id for all elements
            Array.from(drawGroup.children).forEach(el => {
                if (!el.id) el.id = generateId(el.tagName.toLowerCase());
            });
        }
        
        const canvasLight = localStorage.getItem('svgtracer_canvas_light') === 'true';
        if (canvasLight) {
            document.body.classList.add('canvas-light-mode');
            defaultStyle.fill = '#ffffff';
            defaultStyle.stroke = '#000000';
        } else {
            document.body.classList.remove('canvas-light-mode');
            defaultStyle.fill = '#ffffff';
            defaultStyle.stroke = '#ffffff';
        }
        
        historyStack = [drawGroup.innerHTML];
        historyIndex = 0;
        renderLayers();
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            drawGroup.innerHTML = historyStack[historyIndex];
            selectElement(null);
            renderLayers();
            btnUndo.disabled = historyIndex <= 0;
            btnRedo.disabled = historyIndex >= historyStack.length - 1;
            localStorage.setItem('svgtracer_elements', drawGroup.innerHTML);
        }
    }

    function redo() {
        if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            drawGroup.innerHTML = historyStack[historyIndex];
            selectElement(null);
            renderLayers();
            btnUndo.disabled = historyIndex <= 0;
            btnRedo.disabled = historyIndex >= historyStack.length - 1;
            localStorage.setItem('svgtracer_elements', drawGroup.innerHTML);
        }
    }

    function copyToClipboard() {
        if (selection.elements.length === 0) return;
        
        // 1. Store locally as cloned nodes
        localClipboard = selection.elements.map(el => {
            const clone = el.cloneNode(true);
            clone.removeAttribute('id');
            return clone;
        });
        
        // 2. Write to system clipboard as SVG markup
        const svgCode = getSVGCode(true);
        if (svgCode) {
            const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
            const textBlob = new Blob([svgCode], { type: 'text/plain;charset=utf-8' });
            try {
                const clipboardItem = new ClipboardItem({
                    'image/svg+xml': svgBlob,
                    'text/plain': textBlob
                });
                navigator.clipboard.write([clipboardItem]).catch(err => {
                    console.warn('System clipboard write failed: ', err);
                });
            } catch (e) {
                // Fallback for browsers that don't support ClipboardItem with image/svg+xml
                navigator.clipboard.writeText(svgCode).catch(err => {
                    console.warn('System clipboard text write failed: ', err);
                });
            }
        }
    }

    function pasteFromClipboard() {
        const offset = gridSize || 20;

        function pasteLocal() {
            if (localClipboard.length === 0) return;
            
            const pastedElements = localClipboard.map(el => {
                const clone = el.cloneNode(true);
                clone.id = generateId(clone.tagName.toLowerCase());
                
                // Offset the coordinates
                moveElementBy(clone, offset, offset);
                
                drawGroup.appendChild(clone);
                return clone;
            });
            
            // Prepare localClipboard for next paste (offset it again)
            localClipboard = pastedElements.map(el => {
                const clone = el.cloneNode(true);
                clone.removeAttribute('id');
                return clone;
            });
            
            // Select the newly pasted elements
            selectElements(pastedElements);
            saveState();
        }

        // Try reading from system clipboard first
        navigator.clipboard.readText().then(text => {
            const trimmed = text.trim();
            if (trimmed.startsWith('<svg') || trimmed.includes('<path') || trimmed.includes('<rect') || trimmed.includes('<ellipse') || trimmed.includes('<polygon') || trimmed.includes('<line')) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(trimmed, 'image/svg+xml');
                    const parserError = doc.querySelector('parsererror');
                    if (parserError) {
                        pasteLocal();
                        return;
                    }
                    
                    const svgEl = doc.querySelector('svg');
                    const shapes = (svgEl || doc).querySelectorAll('rect, circle, ellipse, line, polyline, polygon, path');
                    if (shapes.length === 0) {
                        pasteLocal();
                        return;
                    }
                    
                    const pastedElements = [];
                    shapes.forEach(shape => {
                        const clone = shape.cloneNode(true);
                        const tag = clone.tagName.toLowerCase();
                        
                        let importedEl;
                        if (tag === 'circle') {
                            const cx = parseFloat(clone.getAttribute('cx')) || 0;
                            const cy = parseFloat(clone.getAttribute('cy')) || 0;
                            const r = parseFloat(clone.getAttribute('r')) || 0;
                            
                            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                            ellipse.setAttribute('cx', cx);
                            ellipse.setAttribute('cy', cy);
                            ellipse.setAttribute('rx', r);
                            ellipse.setAttribute('ry', r);
                            Array.from(clone.attributes).forEach(attr => {
                                if (attr.name !== 'cx' && attr.name !== 'cy' && attr.name !== 'r') {
                                    ellipse.setAttribute(attr.name, attr.value);
                                }
                            });
                            importedEl = ellipse;
                        } else {
                            importedEl = clone;
                        }
                        
                        importedEl.id = generateId(importedEl.tagName.toLowerCase());
                        moveElementBy(importedEl, offset, offset);
                        drawGroup.appendChild(importedEl);
                        pastedElements.push(importedEl);
                    });
                    
                    if (pastedElements.length > 0) {
                        localClipboard = pastedElements.map(el => {
                            const clone = el.cloneNode(true);
                            clone.removeAttribute('id');
                            return clone;
                        });
                        selectElements(pastedElements);
                        saveState();
                    } else {
                        pasteLocal();
                    }
                } catch (e) {
                    pasteLocal();
                }
            } else {
                pasteLocal();
            }
        }).catch(err => {
            pasteLocal();
        });
    }

    // SVG ELEMENT ATTRIBUTE ADJUSTMENTS
    function applyStyleTo(el, style) {
        if (style.fillType === 'none') {
            el.setAttribute('fill', 'none');
        } else if (style.fillType === 'color') {
            el.setAttribute('fill', style.fill);
        } else if (style.fillType === 'gradient') {
            el.setAttribute('fill', `url(#${style.fillGrad}-def)`);
        }
        
        if (style.strokeEnabled) {
            el.setAttribute('stroke', style.stroke);
            el.setAttribute('stroke-width', style.strokeWidth);
            
            let dash = 'none';
            if (style.strokeDash === 'dashed') dash = '6,4';
            else if (style.strokeDash === 'dotted') dash = '2,2';
            el.setAttribute('stroke-dasharray', dash);
            el.setAttribute('stroke-linejoin', style.strokeJoin);
            el.setAttribute('stroke-linecap', 'round');
        } else {
            el.setAttribute('stroke', 'none');
            el.removeAttribute('stroke-width');
            el.removeAttribute('stroke-dasharray');
        }
        
        el.setAttribute('opacity', style.opacity);
    }

    function applyBucketFillTo(el, style) {
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'line') {
            // For stroke-only elements like line, apply the default stroke color as their primary stroke
            el.setAttribute('stroke', style.strokeEnabled ? style.stroke : (style.fillType === 'color' ? style.fill : '#ffffff'));
            el.setAttribute('opacity', style.opacity);
        } else {
            // For other elements, apply only the fill type and opacity
            if (style.fillType === 'none') {
                el.setAttribute('fill', 'none');
            } else if (style.fillType === 'color') {
                el.setAttribute('fill', style.fill);
            } else if (style.fillType === 'gradient') {
                el.setAttribute('fill', `url(#${style.fillGrad}-def)`);
            }
            el.setAttribute('opacity', style.opacity);
        }
        renderLayers();
    }

    // Path Simplification using Ramer-Douglas-Peucker (RDP) algorithm
    function getSqSegDist(p, p1, p2) {
        let x = p1.x;
        let y = p1.y;
        let dx = p2.x - x;
        let dy = p2.y - y;
        
        if (dx !== 0 || dy !== 0) {
            let t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                x = p2.x;
                y = p2.y;
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        
        dx = p.x - x;
        dy = p.y - y;
        return dx * dx + dy * dy;
    }

    function simplifyPath(points, epsilon) {
        if (points.length <= 2) return points;
        
        let maxSqDist = 0;
        let index = 0;
        const end = points.length - 1;
        
        for (let i = 1; i < end; i++) {
            const sqDist = getSqSegDist(points[i], points[0], points[end]);
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }
        
        if (maxSqDist > epsilon * epsilon) {
            const results1 = simplifyPath(points.slice(0, index + 1), epsilon);
            const results2 = simplifyPath(points.slice(index), epsilon);
            return results1.slice(0, results1.length - 1).concat(results2);
        } else {
            return [points[0], points[end]];
        }
    }

    // Canvas-based bucket fill: renders strokes to offscreen canvas,
    // flood-fills from click pixel, then traces the filled region back as an SVG path.
    function bucketFillRegion(clickX, clickY, style) {
        return new Promise(resolve => {
            // --- Step 1: build a minimal SVG that only contains the stroke elements ---
            const elements = Array.from(drawGroup.children);
            if (elements.length === 0) { resolve(false); return; }

            // Pick a render scale for accuracy vs performance
            const SCALE = 2;
            const vpRect = canvasViewport.getBoundingClientRect();
            const W = Math.ceil(vpRect.width  * SCALE);
            const H = Math.ceil(vpRect.height * SCALE);

            // Convert the world-space click into screen space (so we know which pixel to flood-fill from)
            const screenX = Math.round((clickX * zoom + panX) * SCALE);
            const screenY = Math.round((clickY * zoom + panY) * SCALE);

            if (screenX < 0 || screenX >= W || screenY < 0 || screenY >= H) { resolve(false); return; }

            // Build a standalone SVG string: white background, black strokes, no fills
            const svgTransform = `translate(${panX * SCALE}, ${panY * SCALE}) scale(${zoom * SCALE})`;
            const strokeEls = elements.map(el => {
                const clone = el.cloneNode(true);
                clone.setAttribute('fill', 'none');
                // Make strokes black and thick enough to be solid barriers.
                // To prevent anti-aliasing leaks, ensure the stroke width on the offscreen canvas is at least 3px.
                const sw = parseFloat(el.getAttribute('stroke-width') || '1');
                const canvasStrokeWidth = Math.max(sw, 3 / (zoom * SCALE));
                clone.setAttribute('stroke', '#000000');
                clone.setAttribute('stroke-width', canvasStrokeWidth);
                clone.removeAttribute('opacity');
                return clone.outerHTML;
            }).join('');

            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <g transform="${svgTransform}">${strokeEls}</g>
</svg>`;

            // --- Step 2: render SVG to offscreen canvas ---
            const canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');

            const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const img  = new Image();

            img.onload = () => {
                URL.revokeObjectURL(url);
                ctx.drawImage(img, 0, 0);

                const data = ctx.getImageData(0, 0, W, H);
                const pixels = data.data; // RGBA flat array

                // --- Step 3: BFS flood fill from click pixel ---
                // A pixel is "open" (fillable) if it's close to white.
                // We use a high threshold to treat even slightly anti-aliased stroke pixels as barriers.
                function isOpen(idx) {
                    return pixels[idx] > 240 && pixels[idx+1] > 240 && pixels[idx+2] > 240;
                }

                const startIdx = (screenY * W + screenX) * 4;
                if (!isOpen(startIdx)) { resolve(false); return; } // clicked on a stroke

                const filled = new Uint8Array(W * H); // 1 = filled
                const queue  = [screenY * W + screenX];
                filled[screenY * W + screenX] = 1;
                let filledCount = 0;
                const maxFill = W * H * 0.75; // Safety cap

                while (queue.length > 0 && filledCount < maxFill) {
                    const pos = queue.shift();
                    filledCount++;
                    const py = (pos / W) | 0;
                    const px = pos % W;

                    const neighbors = [
                        py > 0     ? pos - W : -1,
                        py < H - 1 ? pos + W : -1,
                        px > 0     ? pos - 1 : -1,
                        px < W - 1 ? pos + 1 : -1,
                    ];
                    for (const n of neighbors) {
                        if (n >= 0 && !filled[n] && isOpen(n * 4)) {
                            filled[n] = 1;
                            queue.push(n);
                        }
                    }
                }

                if (filledCount === 0 || filledCount >= maxFill) { resolve(false); return; }

                // --- Step 4: find outer boundary using Moore-Neighbor Tracing ---
                let startX = -1, startY = -1;
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        if (filled[y * W + x]) {
                            startX = x;
                            startY = y;
                            break;
                        }
                    }
                    if (startX !== -1) break;
                }

                if (startX === -1) { resolve(false); return; }

                const points = [];
                let currX = startX;
                let currY = startY;
                let backDir = 4; // scanned left-to-right, so pretend we entered from the left (West)
                let startDir = -1;
                let loopCount = 0;
                const maxLoops = W * H;

                // Clockwise neighborhood index directions
                const dx = [1, 1, 0, -1, -1, -1, 0, 1];
                const dy = [0, 1, 1, 1, 0, -1, -1, -1];

                while (loopCount < maxLoops) {
                    points.push({ x: currX, y: currY });

                    let nextX = -1;
                    let nextY = -1;
                    let nextDir = -1;

                    // Scan clockwise starting from (backDir + 1) % 8
                    for (let i = 1; i <= 8; i++) {
                        const d = (backDir + i) % 8;
                        const nx = currX + dx[d];
                        const ny = currY + dy[d];

                        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                            if (filled[ny * W + nx]) {
                                nextX = nx;
                                nextY = ny;
                                nextDir = d;
                                break;
                            }
                        }
                    }

                    if (nextDir === -1) {
                        break;
                    }

                    if (currX === startX && currY === startY) {
                        if (startDir === -1) {
                            startDir = nextDir;
                        } else if (nextDir === startDir) {
                            points.pop(); // Remove duplicate start point
                            break;
                        }
                    }

                    currX = nextX;
                    currY = nextY;
                    backDir = (nextDir + 4) % 8;
                    loopCount++;
                }

                if (points.length < 3) { resolve(false); return; }

                // --- Step 5: simplify the traced path using RDP ---
                const closedPoints = [...points, points[0]];
                const simplifiedScreenPts = simplifyPath(closedPoints, 1.0);

                // Convert screen pixels back to world SVG coordinates
                const worldPts = simplifiedScreenPts.map(p => ({
                    x: (p.x / SCALE - panX) / zoom,
                    y: (p.y / SCALE - panY) / zoom,
                }));

                if (worldPts.length < 3) { resolve(false); return; }

                // --- Step 6: create and insert the filled polygon ---
                const pointsStr = worldPts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                poly.id = generateId('fill');
                poly.setAttribute('points', pointsStr);
                poly.setAttribute('opacity', style.opacity);

                const fillColor = style.fillType === 'color'    ? style.fill
                                : style.fillType === 'gradient' ? `url(#${style.fillGrad}-def)`
                                : (style.fill || '#ffffff');
                poly.setAttribute('fill', fillColor);
                
                // Add a small bleed stroke of the same color to avoid background gaps/slivers
                poly.setAttribute('stroke', fillColor);
                poly.setAttribute('stroke-width', (1.5 / zoom).toFixed(2));
                poly.setAttribute('stroke-linejoin', 'round');

                drawGroup.insertBefore(poly, drawGroup.firstChild);
                renderLayers();
                resolve(true);
            };

            img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
            img.src = url;
        });
    }

    function invertColor(colorStr) {
        if (!colorStr) return '#ffffff';
        const clean = colorStr.trim().toLowerCase();
        if (clean === 'none' || clean.startsWith('url(')) return colorStr;
        
        let r, g, b;
        
        if (clean.startsWith('#')) {
            let hex = clean.substring(1);
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else {
                return colorStr;
            }
        } else if (clean.startsWith('rgb')) {
            const match = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
            } else {
                return colorStr;
            }
        } else {
            const namedColors = {
                'white': [255, 255, 255], 'black': [0, 0, 0],
                'red': [255, 0, 0], 'green': [0, 255, 0], 'blue': [0, 0, 255],
                'yellow': [255, 255, 0], 'cyan': [0, 255, 255], 'magenta': [255, 0, 255],
                'gray': [128, 128, 128], 'grey': [128, 128, 128]
            };
            if (namedColors[clean]) {
                const rgb = namedColors[clean];
                r = rgb[0];
                g = rgb[1];
                b = rgb[2];
            } else {
                return colorStr;
            }
        }
        
        const ir = 255 - r;
        const ig = 255 - g;
        const ib = 255 - b;
        
        const toHex = (c) => c.toString(16).padStart(2, '0');
        return `#${toHex(ir)}${toHex(ig)}${toHex(ib)}`;
    }

    function invertAllCanvasColors() {
        // 1. Invert shapes in drawGroup
        const elements = drawGroup.querySelectorAll('*');
        elements.forEach(el => {
            const fill = el.getAttribute('fill');
            if (fill && fill !== 'none' && !fill.startsWith('url(#')) {
                el.setAttribute('fill', invertColor(fill));
            }
            const stroke = el.getAttribute('stroke');
            if (stroke && stroke !== 'none') {
                el.setAttribute('stroke', invertColor(stroke));
            }
        });
        
        // 2. Invert gradients in defs
        const defs = svgGrid.querySelector('defs');
        if (defs) {
            const stops = defs.querySelectorAll('stop');
            stops.forEach(stop => {
                const stopColor = stop.getAttribute('stop-color');
                if (stopColor) {
                    stop.setAttribute('stop-color', invertColor(stopColor));
                }
                const style = stop.getAttribute('style');
                if (style && style.includes('stop-color')) {
                    const match = style.match(/stop-color:\s*([^;]+)/);
                    if (match) {
                        const invColor = invertColor(match[1]);
                        stop.setAttribute('style', style.replace(match[0], `stop-color:${invColor}`));
                    }
                }
            });
        }
        
        // 3. Set default styles based on light/dark mode
        if (document.body.classList.contains('canvas-light-mode')) {
            defaultStyle.fill = '#ffffff';
            defaultStyle.stroke = '#000000';
        } else {
            defaultStyle.fill = '#ffffff';
            defaultStyle.stroke = '#ffffff';
        }
        
        // Update selection settings UI and save the state
        updateInspectorUI();
        saveState();
    }

    function moveElementBy(el, dx, dy) {
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'rect') {
            const x = parseFloat(el.getAttribute('x')) || 0;
            const y = parseFloat(el.getAttribute('y')) || 0;
            el.setAttribute('x', x + dx);
            el.setAttribute('y', y + dy);
        } else if (tagName === 'ellipse') {
            const cx = parseFloat(el.getAttribute('cx')) || 0;
            const cy = parseFloat(el.getAttribute('cy')) || 0;
            el.setAttribute('cx', cx + dx);
            el.setAttribute('cy', cy + dy);
        } else if (tagName === 'line') {
            const x1 = parseFloat(el.getAttribute('x1')) || 0;
            const y1 = parseFloat(el.getAttribute('y1')) || 0;
            const x2 = parseFloat(el.getAttribute('x2')) || 0;
            const y2 = parseFloat(el.getAttribute('y2')) || 0;
            el.setAttribute('x1', x1 + dx);
            el.setAttribute('y1', y1 + dy);
            el.setAttribute('x2', x2 + dx);
            el.setAttribute('y2', y2 + dy);
        } else if (tagName === 'polygon' || tagName === 'polyline') {
            const pointsStr = el.getAttribute('points') || '';
            const pairs = pointsStr.trim().split(/[\s,]+/);
            const newPoints = [];
            for (let i = 0; i < pairs.length; i += 2) {
                if (i + 1 >= pairs.length) break;
                newPoints.push(`${parseFloat(pairs[i]) + dx},${parseFloat(pairs[i+1]) + dy}`);
            }
            el.setAttribute('points', newPoints.join(" "));
        } else if (tagName === 'path') {
            const dStr = el.getAttribute('d') || '';
            el.setAttribute('d', movePath(dStr, dx, dy));
        } else if (tagName === 'text') {
            const x = parseFloat(el.getAttribute('x')) || 0;
            const y = parseFloat(el.getAttribute('y')) || 0;
            const newX = x + dx;
            el.setAttribute('x', newX);
            el.setAttribute('y', y + dy);
            el.querySelectorAll('tspan').forEach(tspan => {
                tspan.setAttribute('x', newX);
            });
        }
    }

    function scaleLine(lineEl, initialBox, newBox) {
        const sX = initialBox.w === 0 ? 1 : newBox.w / initialBox.w;
        const sY = initialBox.h === 0 ? 1 : newBox.h / initialBox.h;
        
        const x1 = initialLineCoords.x1;
        const y1 = initialLineCoords.y1;
        const x2 = initialLineCoords.x2;
        const y2 = initialLineCoords.y2;
        
        lineEl.setAttribute('x1', newBox.x + ((x1 - initialBox.x) * sX));
        lineEl.setAttribute('y1', newBox.y + ((y1 - initialBox.y) * sY));
        lineEl.setAttribute('x2', newBox.x + ((x2 - initialBox.x) * sX));
        lineEl.setAttribute('y2', newBox.y + ((y2 - initialBox.y) * sY));
    }

    function scalePolygon(pointsString, initialBox, newBox) {
        const sX = initialBox.w === 0 ? 1 : newBox.w / initialBox.w;
        const sY = initialBox.h === 0 ? 1 : newBox.h / initialBox.h;
        
        const pairs = pointsString.trim().split(/[\s,]+/);
        const scaledPairs = [];
        for (let i = 0; i < pairs.length; i += 2) {
            if (i + 1 >= pairs.length) break;
            const px = Number(pairs[i]);
            const py = Number(pairs[i+1]);
            const newPx = newBox.x + ((px - initialBox.x) * sX);
            const newPy = newBox.y + ((py - initialBox.y) * sY);
            scaledPairs.push(`${newPx},${newPy}`);
        }
        return scaledPairs.join(" ");
    }

    function scalePath(dString, initialBox, newBox) {
        const commands = dString.match(/[a-df-z]/gi) || [];
        const numberGroups = dString.split(/[a-df-z]/gi).slice(1);
        
        let newD = "";
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const isRelative = cmd === cmd.toLowerCase();
            const group = numberGroups[i].trim();
            if (!group) {
                newD += cmd;
                continue;
            }
            const numbers = group.split(/[\s,]+/ || []).map(Number).filter(n => !isNaN(n));
            const sX = initialBox.w === 0 ? 1 : newBox.w / initialBox.w;
            const sY = initialBox.h === 0 ? 1 : newBox.h / initialBox.h;
            
            const scaledNums = [];
            let isX = true;
            
            if (cmd.toUpperCase() === 'H') {
                numbers.forEach(num => {
                    if (isRelative) scaledNums.push(num * sX);
                    else scaledNums.push(newBox.x + ((num - initialBox.x) * sX));
                });
            } else if (cmd.toUpperCase() === 'V') {
                numbers.forEach(num => {
                    if (isRelative) scaledNums.push(num * sY);
                    else scaledNums.push(newBox.y + ((num - initialBox.y) * sY));
                });
            } else {
                for (let j = 0; j < numbers.length; j++) {
                    const num = numbers[j];
                    if (isX) {
                        if (isRelative) scaledNums.push(num * sX);
                        else scaledNums.push(newBox.x + ((num - initialBox.x) * sX));
                    } else {
                        if (isRelative) scaledNums.push(num * sY);
                        else scaledNums.push(newBox.y + ((num - initialBox.y) * sY));
                    }
                    isX = !isX;
                }
            }
            newD += cmd + scaledNums.join(" ");
        }
        return newD;
    }

    function movePath(dString, dx, dy) {
        const commands = dString.match(/[a-df-z]/gi) || [];
        const numberGroups = dString.split(/[a-df-z]/gi).slice(1);
        
        let newD = "";
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const isRelative = cmd === cmd.toLowerCase();
            const group = numberGroups[i].trim();
            if (!group) {
                newD += cmd;
                continue;
            }
            const numbers = group.split(/[\s,]+/ || []).map(Number).filter(n => !isNaN(n));
            const shiftedNums = [];
            let isX = true;
            
            if (cmd.toUpperCase() === 'H') {
                numbers.forEach(num => {
                    if (isRelative) shiftedNums.push(num);
                    else shiftedNums.push(num + dx);
                });
            } else if (cmd.toUpperCase() === 'V') {
                numbers.forEach(num => {
                    if (isRelative) shiftedNums.push(num);
                    else shiftedNums.push(num + dy);
                });
            } else {
                for (let j = 0; j < numbers.length; j++) {
                    const num = numbers[j];
                    if (isRelative) {
                        shiftedNums.push(num);
                    } else {
                        if (isX) shiftedNums.push(num + dx);
                        else shiftedNums.push(num + dy);
                    }
                    isX = !isX;
                }
            }
            newD += cmd + shiftedNums.join(" ");
        }
        return newD;
    }

    // CANVAS DRAW INTERACTION
    function addDrawPoint(x, y) {
        if (activeTool === 'pen') {
            if (drawingPoints.length === 0) {
                drawingPoints.push({ x, y });
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.id = generateId('path');
                path.setAttribute('d', `M ${x} ${y}`);
                applyStyleTo(path, defaultStyle);
                drawGroup.appendChild(path);
                activeDrawEl = path;
                isDrawing = true;
            } else {
                const start = drawingPoints[0];
                const dist = Math.hypot(x - start.x, y - start.y);
                if (dist < Math.max(10, gridSize)) {
                    let d = activeDrawEl.getAttribute('d');
                    d += ' Z';
                    activeDrawEl.setAttribute('d', d);
                    finishActiveDraw();
                } else {
                    drawingPoints.push({ x, y });
                    let d = activeDrawEl.getAttribute('d');
                    d += ` L ${x} ${y}`;
                    activeDrawEl.setAttribute('d', d);
                }
            }
        } else if (activeTool === 'polygon') {
            if (drawingPoints.length === 0) {
                drawingPoints.push({ x, y });
                const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                poly.id = generateId('polygon');
                poly.setAttribute('points', `${x},${y}`);
                applyStyleTo(poly, defaultStyle);
                drawGroup.appendChild(poly);
                activeDrawEl = poly;
                isDrawing = true;
            } else {
                const start = drawingPoints[0];
                const dist = Math.hypot(x - start.x, y - start.y);
                if (dist < Math.max(10, gridSize)) {
                    finishActiveDraw();
                } else {
                    drawingPoints.push({ x, y });
                    const ptsStr = drawingPoints.map(p => `${p.x},${p.y}`).join(' ');
                    activeDrawEl.setAttribute('points', ptsStr);
                }
            }
        }
    }

    function updateDrawPreview(x, y) {
        if (!isDrawing || !activeDrawEl) return;
        previewGroup.innerHTML = '';
        
        const lastPt = drawingPoints[drawingPoints.length - 1];
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', lastPt.x);
        line.setAttribute('y1', lastPt.y);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#dfb75c');
        line.setAttribute('stroke-width', 1.5 / zoom);
        line.setAttribute('stroke-dasharray', `${4/zoom},${4/zoom}`);
        previewGroup.appendChild(line);
        
        // Show start point proximity indicator
        const start = drawingPoints[0];
        const dist = Math.hypot(x - start.x, y - start.y);
        if (dist < Math.max(10, gridSize)) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', start.x);
            circle.setAttribute('cy', start.y);
            circle.setAttribute('r', 6 / zoom);
            circle.setAttribute('fill', '#05d590');
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', 1.5 / zoom);
            previewGroup.appendChild(circle);
        }
    }

    function finishActiveDraw() {
        if (!isDrawing) return;
        previewGroup.innerHTML = '';
        if (activeDrawEl) {
            if (activeTool === 'polygon') {
                const ptsStr = drawingPoints.map(p => `${p.x},${p.y}`).join(' ');
                activeDrawEl.setAttribute('points', ptsStr);
            }
            const el = activeDrawEl;
            activeDrawEl = null;
            isDrawing = false;
            drawingPoints = [];
            selectElement(el);
            saveState();
        }
    }

    function cancelActiveDraw() {
        if (!isDrawing) return;
        previewGroup.innerHTML = '';
        if (activeDrawEl) activeDrawEl.remove();
        activeDrawEl = null;
        isDrawing = false;
        drawingPoints = [];
        selectElement(null);
    }

    // VIEWPORT AND CANVAS RENDER TRANSFORMS
    function updateCanvasTransform() {
        // Apply pan/zoom via SVG transform on the worldGroup — renders at native resolution at every zoom level
        worldGroup.setAttribute('transform', `translate(${panX}, ${panY}) scale(${zoom})`);
        // Keep the grid pattern aligned with the world transform
        const mainPattern = document.getElementById('gridPattern');
        if (mainPattern) mainPattern.setAttribute('patternTransform', `translate(${panX}, ${panY}) scale(${zoom})`);
        lblZoomLevel.innerText = `${Math.round(zoom * 100)}%`;
        updateTransformer();
    }

    function updateGridLines() {
        const mainPattern = document.getElementById('gridPattern');
        const gridBackplate = document.getElementById('gridBackplate');
        
        const size = gridSize;
        
        if (showGrid) {
            gridBackplate.style.display = 'block';
        } else {
            gridBackplate.style.display = 'none';
            return;
        }
        
        if (mainPattern) {
            mainPattern.setAttribute('width', size);
            mainPattern.setAttribute('height', size);
            const path = mainPattern.querySelector('path');
            if (path) {
                path.setAttribute('d', `M ${size} 0 L 0 0 0 ${size}`);
            }
        }
    }

    // TRANSFORMER / SELECTION OUTLINES & HANDLES
    function updateTransformer() {
        transformerGroup.innerHTML = '';
        if (selection.elements.length === 0 || activeTool !== 'select') return;
        
        const bounds = getCollectiveBounds(selection.elements);
        const x = bounds.x;
        const y = bounds.y;
        const w = bounds.w;
        const h = bounds.h;
        
        const handleSize = Math.max(6, 8 / zoom);
        const offset = handleSize / 2;
        
        // Dashed bounding rectangle
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        outline.setAttribute('x', x);
        outline.setAttribute('y', y);
        outline.setAttribute('width', w);
        outline.setAttribute('height', h);
        outline.setAttribute('stroke', '#dfb75c');
        outline.setAttribute('stroke-width', 1.5 / zoom);
        outline.setAttribute('stroke-dasharray', `${4/zoom},${4/zoom}`);
        outline.setAttribute('fill', 'none');
        transformerGroup.appendChild(outline);
        
        const handlePoints = {
            'nw': { x: x, y: y },
            'n':  { x: x + w/2, y: y },
            'ne': { x: x + w, y: y },
            'w':  { x: x, y: y + h/2 },
            'e':  { x: x + w, y: y + h/2 },
            'sw': { x: x, y: y + h },
            's':  { x: x + w/2, y: y + h },
            'se': { x: x + w, y: y + h }
        };
        
        const cursors = {
            'nw': 'nwse-resize', 'se': 'nwse-resize',
            'ne': 'nesw-resize', 'sw': 'nesw-resize',
            'n': 'ns-resize', 's': 'ns-resize',
            'e': 'ew-resize', 'w': 'ew-resize'
        };
        
        for (const [key, pt] of Object.entries(handlePoints)) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', pt.x - offset);
            rect.setAttribute('y', pt.y - offset);
            rect.setAttribute('width', handleSize);
            rect.setAttribute('height', handleSize);
            rect.setAttribute('fill', '#ffffff');
            rect.setAttribute('stroke', '#dfb75c');
            rect.setAttribute('stroke-width', 1.5 / zoom);
            rect.style.pointerEvents = 'auto';
            rect.style.cursor = cursors[key];
            rect.setAttribute('data-handle', key);
            
            rect.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                dragMode = 'resize';
                resizeHandle = key;
                const coords = getCanvasCoords(e);
                dragStart = { x: coords.rawX, y: coords.rawY };
                
                initialBox = { x, y, w, h };
                
                initialElementCoordsList = selection.elements.map(el => {
                    const tag = el.tagName.toLowerCase();
                    const info = { el, tag };
                    if (tag === 'rect') {
                        info.x = parseFloat(el.getAttribute('x')) || 0;
                        info.y = parseFloat(el.getAttribute('y')) || 0;
                        info.w = parseFloat(el.getAttribute('width')) || 0;
                        info.h = parseFloat(el.getAttribute('height')) || 0;
                    } else if (tag === 'ellipse') {
                        info.cx = parseFloat(el.getAttribute('cx')) || 0;
                        info.cy = parseFloat(el.getAttribute('cy')) || 0;
                        info.rx = parseFloat(el.getAttribute('rx')) || 0;
                        info.ry = parseFloat(el.getAttribute('ry')) || 0;
                    } else if (tag === 'line') {
                        info.x1 = parseFloat(el.getAttribute('x1')) || 0;
                        info.y1 = parseFloat(el.getAttribute('y1')) || 0;
                        info.x2 = parseFloat(el.getAttribute('x2')) || 0;
                        info.y2 = parseFloat(el.getAttribute('y2')) || 0;
                    } else if (tag === 'polygon' || tag === 'polyline') {
                        info.points = el.getAttribute('points') || '';
                    } else if (tag === 'path') {
                        info.d = el.getAttribute('d') || '';
                    } else if (tag === 'text') {
                        info.x = parseFloat(el.getAttribute('x')) || 0;
                        info.y = parseFloat(el.getAttribute('y')) || 0;
                        info.fontSize = parseFloat(el.getAttribute('font-size')) || 20;
                        const bbox = el.getBBox();
                        info.w = bbox.width;
                        info.h = bbox.height;
                    }
                    return info;
                });
            });
            
            transformerGroup.appendChild(rect);
        }
    }

    // SELECTION STATE MANAGER
    function selectElement(el) {
        selectElements(el ? [el] : []);
    }

    function selectElements(list) {
        selection.elements = [...list];
        selectedEl = selection.active;
        
        updateTransformer();
        updateInspectorUI();
        renderLayers();
    }

    // INSPECTOR / SIDEBAR SYNCING
    function updateInspectorUI() {
        textProperties.style.display = 'none';
        if (selectedEl) {
            selectionProperties.style.display = 'flex';
            selectionPropertiesEmpty.style.display = 'none';
            dimensionFields.style.display = 'grid';
            document.querySelector('.actions-row').style.display = 'grid';
            
            if (selection.elements.length > 1) {
                txtSelectedType.innerText = `${selection.elements.length} elements`;
                cornerRadiusField.style.display = 'none';
                
                const bounds = getCollectiveBounds(selection.elements);
                valX.value = Math.round(bounds.x);
                valY.value = Math.round(bounds.y);
                valW.value = Math.round(bounds.w);
                valH.value = Math.round(bounds.h);
            } else {
                const tagName = selectedEl.tagName.toLowerCase();
                txtSelectedType.innerText = tagName;
                
                let x, y, w, h;
                if (tagName === 'rect') {
                    x = parseFloat(selectedEl.getAttribute('x')) || 0;
                    y = parseFloat(selectedEl.getAttribute('y')) || 0;
                    w = parseFloat(selectedEl.getAttribute('width')) || 0;
                    h = parseFloat(selectedEl.getAttribute('height')) || 0;
                    
                    cornerRadiusField.style.display = 'block';
                    const rx = parseFloat(selectedEl.getAttribute('rx')) || 0;
                    valRx.value = rx;
                    lblRx.innerText = `${rx}px`;
                } else if (tagName === 'ellipse') {
                    const cx = parseFloat(selectedEl.getAttribute('cx')) || 0;
                    const cy = parseFloat(selectedEl.getAttribute('cy')) || 0;
                    const rx = parseFloat(selectedEl.getAttribute('rx')) || 0;
                    const ry = parseFloat(selectedEl.getAttribute('ry')) || 0;
                    x = cx - rx;
                    y = cy - ry;
                    w = rx * 2;
                    h = ry * 2;
                    cornerRadiusField.style.display = 'none';
                } else if (tagName === 'text') {
                    x = parseFloat(selectedEl.getAttribute('x')) || 0;
                    y = parseFloat(selectedEl.getAttribute('y')) || 0;
                    const bbox = selectedEl.getBBox();
                    w = Math.round(bbox.width);
                    h = Math.round(bbox.height);
                    cornerRadiusField.style.display = 'none';
                    
                    textProperties.style.display = 'block';
                    valTextContent.value = getTextContent(selectedEl);
                    valFontSize.value = parseFloat(selectedEl.getAttribute('font-size')) || 20;
                    valFontFamily.value = selectedEl.getAttribute('font-family') || 'Outfit';
                } else {
                    const bbox = selectedEl.getBBox();
                    x = Math.round(bbox.x);
                    y = Math.round(bbox.y);
                    w = Math.round(bbox.width);
                    h = Math.round(bbox.height);
                    cornerRadiusField.style.display = 'none';
                }
                
                valX.value = Math.round(x);
                valY.value = Math.round(y);
                valW.value = Math.round(w);
                valH.value = Math.round(h);
            }
            
            // Sync Color & Opacity
            const fill = selectedEl.getAttribute('fill') || 'none';
            syncFillUI(fill);
            
            const stroke = selectedEl.getAttribute('stroke') || 'none';
            const strokeEnabled = stroke !== 'none';
            const dash = selectedEl.getAttribute('stroke-dasharray') || 'none';
            
            let strokeType = 'none';
            if (strokeEnabled) {
                if (dash === '6,4' || dash === '6 4') strokeType = 'dashed';
                else if (dash === '2,2' || dash === '2 2') strokeType = 'dotted';
                else strokeType = 'solid';
            }
            
            syncStrokeUI(strokeType);
            
            if (strokeEnabled) {
                strokeSubProperties.style.display = 'block';
                valStrokeColor.value = rgbToHex(stroke) || stroke;
                valStrokeHex.value = rgbToHex(stroke) || stroke;
                
                const sw = parseFloat(selectedEl.getAttribute('stroke-width')) || 1;
                valStrokeWidth.value = sw;
                if (lblStrokeWidth) lblStrokeWidth.innerText = `${sw}px`;
                valStrokeJoin.value = selectedEl.getAttribute('stroke-linejoin') || 'miter';
            } else {
                strokeSubProperties.style.display = 'none';
            }
            
            const opacity = parseFloat(selectedEl.getAttribute('opacity')) || 1.0;
            valOpacity.value = Math.round(opacity * 100);
            lblOpacity.innerText = `${Math.round(opacity * 100)}%`;
        } else {
            // Default styling properties mode
            selectionProperties.style.display = 'flex';
            selectionPropertiesEmpty.style.display = 'none';
            dimensionFields.style.display = 'none'; // Hide dimensions
            document.querySelector('.actions-row').style.display = 'none'; // Hide Delete/Duplicate
            
            txtSelectedType.innerText = 'default styles';
            cornerRadiusField.style.display = 'none';
            
            // Sync to defaults
            syncFillUI(defaultStyle.fillType === 'gradient' ? `url(#${defaultStyle.fillGrad}-def)` : defaultStyle.fill);
            
            let strokeType = 'none';
            if (defaultStyle.strokeEnabled) {
                strokeType = defaultStyle.strokeDash;
            }
            syncStrokeUI(strokeType);
            
            if (defaultStyle.strokeEnabled) {
                strokeSubProperties.style.display = 'block';
                valStrokeColor.value = defaultStyle.stroke;
                valStrokeHex.value = defaultStyle.stroke;
                valStrokeWidth.value = defaultStyle.strokeWidth;
                if (lblStrokeWidth) lblStrokeWidth.innerText = `${defaultStyle.strokeWidth}px`;
                valStrokeJoin.value = defaultStyle.strokeJoin;
            } else {
                strokeSubProperties.style.display = 'none';
            }
            
            valOpacity.value = Math.round(defaultStyle.opacity * 100);
            lblOpacity.innerText = `${Math.round(defaultStyle.opacity * 100)}%`;
        }
        renderColorHistory();
        renderFillColorHistory();
    }

    function syncFillUI(fillVal) {
        [btnFillNone, btnFillColor, btnFillGradient].forEach(b => b.classList.remove('active'));
        fillColorWrapper.style.display = 'none';
        fillGradWrapper.style.display = 'none';
        
        if (fillVal === 'none') {
            btnFillNone.classList.add('active');
        } else if (fillVal.startsWith('url(#')) {
            btnFillGradient.classList.add('active');
            fillGradWrapper.style.display = 'block';
            const match = fillVal.match(/#([a-z0-9-]+)-def/i);
            if (match && match[1]) {
                valFillGradientSelect.value = match[1];
            }
        } else {
            btnFillColor.classList.add('active');
            fillColorWrapper.style.display = 'flex';
            valFillColor.value = rgbToHex(fillVal) || fillVal;
            valFillHex.value = rgbToHex(fillVal) || fillVal;
        }
    }

    function syncStrokeUI(strokeType) {
        [btnStrokeNone, btnStrokeSolid, btnStrokeDashed, btnStrokeDotted].forEach(b => {
            if (b) {
                if (b.dataset.stroke === strokeType) b.classList.add('active');
                else b.classList.remove('active');
            }
        });
    }

    function handleStyleUIChange() {
        const fillType = document.querySelector('.btn-fill-type.active').dataset.fill;
        const fillHex = valFillHex.value;
        const fillColor = valFillColor.value;
        const fillGrad = valFillGradientSelect.value;
        
        const activeStrokeBtn = document.querySelector('.btn-stroke-type.active');
        const strokeType = activeStrokeBtn ? activeStrokeBtn.dataset.stroke : 'none';
        const strokeEnabled = strokeType !== 'none';
        const strokeColor = valStrokeColor.value;
        const strokeWidth = parseFloat(valStrokeWidth.value) || 2;
        const strokeDash = strokeEnabled ? strokeType : 'solid';
        const strokeJoin = valStrokeJoin.value;
        
        const opacity = parseFloat(valOpacity.value) / 100;
        
        const style = {
            fillType,
            fill: fillHex || fillColor,
            fillGrad,
            strokeEnabled,
            stroke: strokeColor,
            strokeWidth,
            strokeDash,
            strokeJoin,
            opacity
        };
        
        if (selectedEl) {
            selection.elements.forEach(el => applyStyleTo(el, style));
            updateTransformer();
            saveState();
        } else {
            defaultStyle = { ...style };
        }
        
        // Update range labels
        if (lblStrokeWidth) lblStrokeWidth.innerText = `${strokeWidth}px`;
        lblOpacity.innerText = `${Math.round(opacity * 100)}%`;

        if (strokeEnabled) {
            debounceAddToStrokeHistory(strokeColor);
        }
        if (fillType === 'color') {
            debounceAddToFillHistory(style.fill);
        }
    }

    function updateSelectedDimension(prop, value) {
        if (selection.elements.length === 0) return;
        
        const bounds = getCollectiveBounds(selection.elements);
        const initialBox = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
        let newBox = { ...initialBox };
        
        if (prop === 'x') newBox.x = value;
        else if (prop === 'y') newBox.y = value;
        else if (prop === 'w') newBox.w = Math.max(1, value);
        else if (prop === 'h') newBox.h = Math.max(1, value);
        
        const sX = initialBox.w === 0 ? 1 : newBox.w / initialBox.w;
        const sY = initialBox.h === 0 ? 1 : newBox.h / initialBox.h;
        
        selection.elements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            const bbox = el.getBBox();
            const elBox = { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
            
            if (tagName === 'rect') {
                el.setAttribute('x', newBox.x + ((elBox.x - initialBox.x) * sX));
                el.setAttribute('y', newBox.y + ((elBox.y - initialBox.y) * sY));
                el.setAttribute('width', Math.max(1, elBox.w * sX));
                el.setAttribute('height', Math.max(1, elBox.h * sY));
            } else if (tagName === 'ellipse') {
                const cx = parseFloat(el.getAttribute('cx')) || 0;
                const cy = parseFloat(el.getAttribute('cy')) || 0;
                const rx = parseFloat(el.getAttribute('rx')) || 0;
                const ry = parseFloat(el.getAttribute('ry')) || 0;
                
                el.setAttribute('cx', newBox.x + ((cx - initialBox.x) * sX));
                el.setAttribute('cy', newBox.y + ((cy - initialBox.y) * sY));
                el.setAttribute('rx', Math.max(1, rx * sX));
                el.setAttribute('ry', Math.max(1, ry * sY));
            } else if (tagName === 'line') {
                const x1 = parseFloat(el.getAttribute('x1')) || 0;
                const y1 = parseFloat(el.getAttribute('y1')) || 0;
                const x2 = parseFloat(el.getAttribute('x2')) || 0;
                const y2 = parseFloat(el.getAttribute('y2')) || 0;
                
                el.setAttribute('x1', newBox.x + ((x1 - initialBox.x) * sX));
                el.setAttribute('y1', newBox.y + ((y1 - initialBox.y) * sY));
                el.setAttribute('x2', newBox.x + ((x2 - initialBox.x) * sX));
                el.setAttribute('y2', newBox.y + ((y2 - initialBox.y) * sY));
            } else if (tagName === 'polygon' || tagName === 'polyline') {
                const pointsStr = el.getAttribute('points');
                el.setAttribute('points', scalePolygon(pointsStr, initialBox, newBox));
            } else if (tagName === 'path') {
                const dStr = el.getAttribute('d');
                el.setAttribute('d', scalePath(dStr, initialBox, newBox));
            } else if (tagName === 'text') {
                const x = parseFloat(el.getAttribute('x')) || 0;
                const y = parseFloat(el.getAttribute('y')) || 0;
                const fontSize = parseFloat(el.getAttribute('font-size')) || 20;
                const newX = newBox.x + ((x - initialBox.x) * sX);
                el.setAttribute('x', newX);
                el.setAttribute('y', newBox.y + ((y - initialBox.y) * sY));
                const scaleFactor = Math.min(sX, sY);
                el.setAttribute('font-size', Math.max(1, fontSize * scaleFactor));
                el.querySelectorAll('tspan').forEach(tspan => {
                    tspan.setAttribute('x', newX);
                });
            }
        });
        
        updateTransformer();
    }

    // LAYERS SIDEBAR MANAGEMENT
    function getLayerIcon(tagName) {
        const svgStart = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;
        const svgEnd = `</svg>`;
        switch (tagName.toLowerCase()) {
            case 'rect':
                return `${svgStart}<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>${svgEnd}`;
            case 'ellipse':
                return `${svgStart}<circle cx="12" cy="12" r="10"></circle>${svgEnd}`;
            case 'line':
                return `${svgStart}<line x1="5" y1="19" x2="19" y2="5"></line>${svgEnd}`;
            case 'polygon':
                return `${svgStart}<polygon points="12 2 22 8.5 22 19.5 12 26 2 19.5 2 8.5"></polygon>${svgEnd}`;
            case 'path':
                return `${svgStart}<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>${svgEnd}`;
            case 'text':
                return `${svgStart}<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="12" y1="4" x2="12" y2="20"></line><line x1="9" y1="20" x2="15" y2="20"></line>${svgEnd}`;
            default:
                return `${svgStart}<circle cx="12" cy="12" r="1"></circle>${svgEnd}`;
        }
    }

    function renderLayers() {
        layersList.innerHTML = '';
        const children = Array.from(drawGroup.children);
        
        document.getElementById('layersEmpty').style.display = children.length === 0 ? 'flex' : 'none';
        
        // Reverse render order (top elements on top list items)
        for (let i = children.length - 1; i >= 0; i--) {
            const el = children[i];
            const id = el.id || generateId(el.tagName.toLowerCase());
            el.id = id;
            
            const isSelected = selection.contains(el);
            const isHidden = el.style.display === 'none';
            const isLocked = el.getAttribute('data-locked') === 'true';
            
            const item = document.createElement('div');
            item.className = `layer-item ${isSelected ? 'selected' : ''}`;
            item.setAttribute('data-id', id);
            
            item.innerHTML = `
                <div class="layer-icon">${getLayerIcon(el.tagName)}</div>
                <div class="layer-name" title="Double click to rename">${el.getAttribute('data-name') || id}</div>
                <div class="layer-controls">
                    <button class="layer-control-btn btn-visibility ${isHidden ? 'active' : ''}" title="Toggle Visibility">
                        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            ${isHidden ? 
                                '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>' : 
                                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
                            }
                        </svg>
                    </button>
                    <button class="layer-control-btn btn-lock ${isLocked ? 'active' : ''}" title="Toggle Lock">
                        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            ${isLocked ? 
                                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' : 
                                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'
                            }
                        </svg>
                    </button>
                    <button class="layer-control-btn danger btn-delete" title="Delete Layer">
                        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            
            // Events
            item.addEventListener('click', (e) => {
                if (e.target.closest('.layer-control-btn')) return;
                if (e.shiftKey) {
                    if (selection.contains(el)) {
                        selection.remove(el);
                    } else {
                        selection.add(el);
                    }
                    selectElements(selection.elements);
                } else {
                    selectElement(el);
                }
            });
            
            const nameDiv = item.querySelector('.layer-name');
            nameDiv.addEventListener('dblclick', () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'layer-name-input';
                input.value = el.getAttribute('data-name') || id;
                nameDiv.replaceWith(input);
                input.focus();
                input.select();
                
                const saveName = () => {
                    const newName = input.value.trim() || id;
                    el.setAttribute('data-name', newName);
                    renderLayers();
                    saveState();
                };
                
                input.addEventListener('blur', saveName);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveName();
                    if (e.key === 'Escape') renderLayers();
                });
            });
            
            item.querySelector('.btn-visibility').addEventListener('click', () => {
                if (el.style.display === 'none') {
                    el.style.display = '';
                } else {
                    el.style.display = 'none';
                    if (selection.contains(el)) selection.remove(el);
                    selectElements(selection.elements);
                }
                renderLayers();
                saveState();
            });
            
            item.querySelector('.btn-lock').addEventListener('click', () => {
                if (el.getAttribute('data-locked') === 'true') {
                    el.removeAttribute('data-locked');
                } else {
                    el.setAttribute('data-locked', 'true');
                    if (selection.contains(el)) selection.remove(el);
                    selectElements(selection.elements);
                }
                renderLayers();
                saveState();
            });
            
            item.querySelector('.btn-delete').addEventListener('click', () => {
                if (selection.contains(el)) selection.remove(el);
                el.remove();
                selectElements(selection.elements);
                saveState();
            });
            
            layersList.appendChild(item);
        }
    }

    function moveSelectedLayer(direction) {
        if (!selectedEl) return;
        const sibling = direction === 'up' ? selectedEl.nextElementSibling : selectedEl.previousElementSibling;
        if (sibling) {
            if (direction === 'up') {
                drawGroup.insertBefore(sibling, selectedEl);
            } else {
                drawGroup.insertBefore(selectedEl, sibling);
            }
            renderLayers();
            saveState();
        }
    }

    function moveSelectedToFront() {
        if (selection.elements.length === 0) return;
        
        // Sort elements by their current document order to maintain relative order when appending
        const sorted = [...selection.elements].sort((a, b) => {
            return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
        
        sorted.forEach(el => {
            drawGroup.appendChild(el);
        });
        
        renderLayers();
        saveState();
        updateTransformer();
    }

    function moveSelectedToBack() {
        if (selection.elements.length === 0) return;
        
        // Sort in reverse document order to maintain relative order when inserting at the front
        const sorted = [...selection.elements].sort((a, b) => {
            return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1;
        });
        
        sorted.forEach(el => {
            drawGroup.insertBefore(el, drawGroup.firstChild);
        });
        
        renderLayers();
        saveState();
        updateTransformer();
    }

    // SVG & PNG EXPORT ENGINE
    function getBoundsForElements(elementsList) {
        if (elementsList.length === 0) return { x: 0, y: 0, w: 800, h: 600 };
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        elementsList.forEach(el => {
            if (el.style.display === 'none') return;
            const bbox = el.getBBox();
            const sw = parseFloat(el.getAttribute('stroke-width')) || 0;
            
            minX = Math.min(minX, bbox.x - sw/2);
            minY = Math.min(minY, bbox.y - sw/2);
            maxX = Math.max(maxX, bbox.x + bbox.width + sw/2);
            maxY = Math.max(maxY, bbox.y + bbox.height + sw/2);
        });
        
        if (minX === Infinity) return { x: 0, y: 0, w: 800, h: 600 };
        
        const pad = 15; // Padding margin around graphics
        const x = Math.floor(minX - pad);
        const y = Math.floor(minY - pad);
        const w = Math.ceil(maxX - minX + pad * 2);
        const h = Math.ceil(maxY - minY + pad * 2);
        
        return { x, y, w, h };
    }

    function getDrawGroupBounds() {
        return getBoundsForElements(Array.from(drawGroup.children));
    }

    function getSVGCode(onlySelection = false) {
        const targets = onlySelection ? selection.elements : Array.from(drawGroup.children);
        if (targets.length === 0) return '';
        
        const bounds = getBoundsForElements(targets);
        const defs = svgGrid.querySelector('defs');
        const gradientDefs = Array.from(defs.querySelectorAll('linearGradient'))
            .map(g => g.outerHTML)
            .join('\n        ');
        
        const elementsHTML = targets
            .filter(el => el.style.display !== 'none')
            .map(el => {
                const clone = el.cloneNode(true);
                clone.removeAttribute('data-locked');
                return `    ${clone.outerHTML}`;
            })
            .join('\n');
        
        let svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}" width="${bounds.w}" height="${bounds.h}">\n`;
        if (gradientDefs) {
            svgCode += `    <defs>\n        ${gradientDefs}\n    </defs>\n`;
        }
        
        const chkExportLight = document.getElementById('chkExportLightMode');
        if (chkExportLight && chkExportLight.checked) {
            svgCode += `    <rect x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" fill="#ffffff" />\n`;
        }
        
        svgCode += elementsHTML;
        svgCode += `\n</svg>`;
        
        return svgCode;
    }

    function exportSVG() {
        const code = getSVGCode();
        if (!code) return;
        const blob = new Blob([code], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'svgtracer_drawing.svg';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    function copySVGCode() {
        const code = getSVGCode();
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            const orgText = btnCopySVG.querySelector('.item-title').innerText;
            btnCopySVG.querySelector('.item-title').innerText = 'Copied to Clipboard!';
            setTimeout(() => {
                btnCopySVG.querySelector('.item-title').innerText = orgText;
            }, 1500);
        }).catch(err => {
            alert('Failed to copy code: ' + err);
        });
    }

    function copyAsOfficeVector(onlySelection = false) {
        const code = getSVGCode(onlySelection);
        if (!code) {
            alert('Nothing to copy!');
            return;
        }
        const svgBlob = new Blob([code], { type: 'image/svg+xml;charset=utf-8' });
        const textBlob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        
        const button = onlySelection ? btnCopySelectionOffice : btnCopyOffice;
        
        try {
            const clipboardItem = new ClipboardItem({
                'image/svg+xml': svgBlob,
                'text/plain': textBlob
            });
            navigator.clipboard.write([clipboardItem]).then(() => {
                const orgText = onlySelection ? button.innerText : button.querySelector('.item-title').innerText;
                if (onlySelection) {
                    button.innerText = 'Copied Selection!';
                } else {
                    button.querySelector('.item-title').innerText = 'Copied for Office!';
                }
                setTimeout(() => {
                    if (onlySelection) {
                        button.innerText = orgText;
                    } else {
                        button.querySelector('.item-title').innerText = orgText;
                    }
                }, 1500);
            }).catch(err => {
                alert('Copy failed: ' + err.message);
            });
        } catch (err) {
            alert('Your browser does not support copying vector image metadata to the clipboard: ' + err.message);
        }
    }

    function exportPNG() {
        try {
            const svgString = getSVGCode();
            const bounds = getDrawGroupBounds();
            
            const canvas = document.createElement('canvas');
            canvas.width = bounds.w * 2; // High-res rendering scale
            canvas.height = bounds.h * 2;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);
            
            const chkExportLight = document.getElementById('chkExportLightMode');
            if (chkExportLight && chkExportLight.checked) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, bounds.w, bounds.h);
            }
            
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                const link = document.createElement('a');
                link.download = 'svgtracer_raster.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
            img.src = url;
        } catch (e) {
            alert('PNG Render failure: ' + e.message);
        }
    }

    // IMPORT SVG XML PARSER
    function importSVGMarkup(svgMarkup) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Malformed XML document.');
        }
        
        const svgEl = doc.querySelector('svg');
        if (!svgEl) {
            throw new Error('No root SVG element found.');
        }
        
        const shapes = svgEl.querySelectorAll('rect, circle, ellipse, line, polyline, polygon, path');
        if (shapes.length === 0) {
            throw new Error('No compatible vector shapes found.');
        }
        
        shapes.forEach(shape => {
            const clone = shape.cloneNode(true);
            const tag = clone.tagName.toLowerCase();
            
            // Standardize Tag name to ellipse
            if (tag === 'circle') {
                const cx = parseFloat(clone.getAttribute('cx')) || 0;
                const cy = parseFloat(clone.getAttribute('cy')) || 0;
                const r = parseFloat(clone.getAttribute('r')) || 0;
                
                const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                ellipse.setAttribute('cx', cx);
                ellipse.setAttribute('cy', cy);
                ellipse.setAttribute('rx', r);
                ellipse.setAttribute('ry', r);
                // Copy properties
                Array.from(clone.attributes).forEach(attr => {
                    if (attr.name !== 'cx' && attr.name !== 'cy' && attr.name !== 'r') {
                        ellipse.setAttribute(attr.name, attr.value);
                    }
                });
                ellipse.id = generateId('ellipse');
                drawGroup.appendChild(ellipse);
            } else {
                clone.id = generateId(tag);
                drawGroup.appendChild(clone);
            }
        });
        
        selectElement(null);
        saveState();
    }

    function setActiveTool(toolName) {
        activeTool = toolName;
        
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active');
                document.getElementById('lblActiveTool').innerText = btn.innerText.split('\n')[0].trim();
            } else {
                btn.classList.remove('active');
            }
        });
        
        cancelActiveDraw();
        updateCursor();
        
        if (activeTool === 'bucket') {
            canvasViewport.classList.add('tool-bucket-active');
        } else {
            canvasViewport.classList.remove('tool-bucket-active');
        }
        
        selectElement(null);
    }

    // MAIN EVENTS CONTROLLER BINDINGS
    function setupEventHandlers() {
        // Spacebar Panning toggle & Escape return to select
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                spacePressed = true;
                if (dragMode === 'none') {
                    updateCursor();
                }
            }
            if (e.key === 'Escape') {
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    document.activeElement.blur();
                    return;
                }
                setActiveTool('select');
            }
            
            // Clipboard shortcuts (Ctrl+C / Ctrl+V)
            if ((e.ctrlKey || e.metaKey) && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                if (e.key === 'c' || e.key === 'C') {
                    e.preventDefault();
                    copyToClipboard();
                }
                if (e.key === 'v' || e.key === 'V') {
                    e.preventDefault();
                    pasteFromClipboard();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                spacePressed = false;
                updateCursor();
            }
        });

        // 1. Tool Selection click
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setActiveTool(btn.dataset.tool);
            });
        });

        // 2. Mouse interactions on canvas
        canvasViewport.addEventListener('mousedown', (e) => {
            if (e.button === 1 || activeTool === 'pan' || spacePressed) {
                dragMode = 'pan';
                dragStart = { x: e.clientX, y: e.clientY };
                initialPan = { x: panX, y: panY };
                canvasViewport.style.cursor = 'grabbing';
                return;
            }
            
            if (e.button !== 0) return;
            const coords = getCanvasCoords(e);
            
            // Shift drag triggers marquee area selection (always available regardless of active tool)
            if (e.shiftKey) {
                const target = e.target;
                dragMode = 'marquee';
                dragStart = { x: coords.rawX, y: coords.rawY };
                clickedElement = target && target !== gridBackplate && drawGroup.contains(target) ? target : null;
                
                const marquee = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                marquee.id = 'marqueeRect';
                marquee.setAttribute('stroke', '#dfb75c');
                marquee.setAttribute('stroke-width', 1 / zoom);
                marquee.setAttribute('stroke-dasharray', `${4/zoom},${4/zoom}`);
                marquee.setAttribute('fill', 'rgba(223, 183, 92, 0.12)');
                marquee.setAttribute('x', coords.rawX);
                marquee.setAttribute('y', coords.rawY);
                marquee.setAttribute('width', 0);
                marquee.setAttribute('height', 0);
                previewGroup.appendChild(marquee);
                return;
            }
            
            if (activeTool === 'bucket') {
                const target = e.target;
                // Always try region fill first — this handles enclosed regions
                // formed by any combination of lines/paths/polygons.
                // If no region is found, fall back to direct element fill.
                bucketFillRegion(coords.rawX, coords.rawY, defaultStyle).then(filled => {
                    if (filled) {
                        saveState();
                    } else if (target && target !== gridBackplate && drawGroup.contains(target)) {
                        if (target.getAttribute('data-locked') === 'true') return;
                        applyBucketFillTo(target, defaultStyle);
                        selectElement(target);
                        saveState();
                    }
                });
                return;
            }
            
            if (activeTool === 'select') {
                const target = e.target;
                
                if (target && target !== gridBackplate && drawGroup.contains(target)) {
                    if (target.getAttribute('data-locked') === 'true') {
                        selectElement(null);
                        return;
                    }
                    
                    if (!selection.contains(target)) {
                        selectElement(target);
                    }
                    
                    dragMode = 'move';
                    dragStart = { x: coords.rawX, y: coords.rawY };
                    
                    initialElementCoordsList = selection.elements.map(el => {
                        const tag = el.tagName.toLowerCase();
                        const info = { el, tag };
                        if (tag === 'rect') {
                            info.x = parseFloat(el.getAttribute('x')) || 0;
                            info.y = parseFloat(el.getAttribute('y')) || 0;
                        } else if (tag === 'ellipse') {
                            info.cx = parseFloat(el.getAttribute('cx')) || 0;
                            info.cy = parseFloat(el.getAttribute('cy')) || 0;
                        } else if (tag === 'line') {
                            info.x1 = parseFloat(el.getAttribute('x1')) || 0;
                            info.y1 = parseFloat(el.getAttribute('y1')) || 0;
                            info.x2 = parseFloat(el.getAttribute('x2')) || 0;
                            info.y2 = parseFloat(el.getAttribute('y2')) || 0;
                        } else if (tag === 'polygon' || tag === 'polyline') {
                            info.points = el.getAttribute('points') || '';
                        } else if (tag === 'path') {
                            info.d = el.getAttribute('d') || '';
                        } else if (tag === 'text') {
                            info.x = parseFloat(el.getAttribute('x')) || 0;
                            info.y = parseFloat(el.getAttribute('y')) || 0;
                        }
                        return info;
                    });
                } else {
                    selectElement(null);
                    
                    // Clicked on background/empty space in Select mode: start marquee selection!
                    dragMode = 'marquee';
                    dragStart = { x: coords.rawX, y: coords.rawY };
                    clickedElement = null;
                    
                    const marquee = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    marquee.id = 'marqueeRect';
                    marquee.setAttribute('stroke', '#dfb75c');
                    marquee.setAttribute('stroke-width', 1 / zoom);
                    marquee.setAttribute('stroke-dasharray', `${4/zoom},${4/zoom}`);
                    marquee.setAttribute('fill', 'rgba(223, 183, 92, 0.12)');
                    marquee.setAttribute('x', coords.rawX);
                    marquee.setAttribute('y', coords.rawY);
                    marquee.setAttribute('width', 0);
                    marquee.setAttribute('height', 0);
                    previewGroup.appendChild(marquee);
                }
            } else {
                // Drawing basic elements
                if (activeTool === 'pen' || activeTool === 'polygon') {
                    addDrawPoint(coords.x, coords.y);
                } else if (activeTool === 'text') {
                    showTextEditorOverlay(coords.x, coords.y);
                } else {
                    isDrawing = true;
                    dragStart = { x: coords.x, y: coords.y };
                    
                    if (activeTool === 'rect') {
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.id = generateId('rect');
                        rect.setAttribute('x', coords.x);
                        rect.setAttribute('y', coords.y);
                        rect.setAttribute('width', 0);
                        rect.setAttribute('height', 0);
                        applyStyleTo(rect, defaultStyle);
                        drawGroup.appendChild(rect);
                        activeDrawEl = rect;
                    } else if (activeTool === 'ellipse') {
                        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                        ellipse.id = generateId('ellipse');
                        ellipse.setAttribute('cx', coords.x);
                        ellipse.setAttribute('cy', coords.y);
                        ellipse.setAttribute('rx', 0);
                        ellipse.setAttribute('ry', 0);
                        applyStyleTo(ellipse, defaultStyle);
                        drawGroup.appendChild(ellipse);
                        activeDrawEl = ellipse;
                    } else if (activeTool === 'line') {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.id = generateId('line');
                        line.setAttribute('x1', coords.x);
                        line.setAttribute('y1', coords.y);
                        line.setAttribute('x2', coords.x);
                        line.setAttribute('y2', coords.y);
                        applyStyleTo(line, defaultStyle);
                        drawGroup.appendChild(line);
                        activeDrawEl = line;
                    }
                }
            }
        });

        canvasViewport.addEventListener('mousemove', (e) => {
            const coords = getCanvasCoords(e);
            
            if (dragMode === 'pan') {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                panX = initialPan.x + dx;
                panY = initialPan.y + dy;
                updateCanvasTransform();
                return;
            }
            
            if (dragMode === 'marquee') {
                const marquee = document.getElementById('marqueeRect');
                if (marquee) {
                    const x = Math.min(dragStart.x, coords.rawX);
                    const y = Math.min(dragStart.y, coords.rawY);
                    const w = Math.abs(coords.rawX - dragStart.x);
                    const h = Math.abs(coords.rawY - dragStart.y);
                    marquee.setAttribute('x', x);
                    marquee.setAttribute('y', y);
                    marquee.setAttribute('width', w);
                    marquee.setAttribute('height', h);
                }
                return;
            }
            
            if (dragMode === 'move' && selection.elements.length > 0) {
                const dx = coords.rawX - dragStart.x;
                const dy = coords.rawY - dragStart.y;
                
                let snapDx = dx;
                let snapDy = dy;
                if (gridSnap) {
                    snapDx = Math.round(dx / gridSize) * gridSize;
                    snapDy = Math.round(dy / gridSize) * gridSize;
                }
                
                initialElementCoordsList.forEach(info => {
                    const el = info.el;
                    const tag = info.tag;
                    if (tag === 'rect') {
                        el.setAttribute('x', info.x + snapDx);
                        el.setAttribute('y', info.y + snapDy);
                    } else if (tag === 'ellipse') {
                        el.setAttribute('cx', info.cx + snapDx);
                        el.setAttribute('cy', info.cy + snapDy);
                    } else if (tag === 'line') {
                        el.setAttribute('x1', info.x1 + snapDx);
                        el.setAttribute('y1', info.y1 + snapDy);
                        el.setAttribute('x2', info.x2 + snapDx);
                        el.setAttribute('y2', info.y2 + snapDy);
                    } else if (tag === 'polygon' || tag === 'polyline') {
                        const pairs = info.points.trim().split(/[\s,]+/);
                        const newPoints = [];
                        for (let i = 0; i < pairs.length; i += 2) {
                            if (i + 1 >= pairs.length) break;
                            newPoints.push(`${parseFloat(pairs[i]) + snapDx},${parseFloat(pairs[i+1]) + snapDy}`);
                        }
                        el.setAttribute('points', newPoints.join(" "));
                    } else if (tag === 'path') {
                        el.setAttribute('d', movePath(info.d, snapDx, snapDy));
                    } else if (tag === 'text') {
                        const newX = info.x + snapDx;
                        el.setAttribute('x', newX);
                        el.setAttribute('y', info.y + snapDy);
                        el.querySelectorAll('tspan').forEach(tspan => {
                            tspan.setAttribute('x', newX);
                        });
                    }
                });
                
                updateTransformer();
                populateDimensionInputs();
                return;
            }
            
            if (dragMode === 'resize' && selection.elements.length > 0) {
                const dx = coords.rawX - dragStart.x;
                const dy = coords.rawY - dragStart.y;
                
                let snapDx = dx;
                let snapDy = dy;
                if (gridSnap) {
                    snapDx = Math.round(dx / gridSize) * gridSize;
                    snapDy = Math.round(dy / gridSize) * gridSize;
                }
                
                let newX = initialBox.x;
                let newY = initialBox.y;
                let newW = initialBox.w;
                let newH = initialBox.h;
                
                if (resizeHandle.includes('e')) newW = Math.max(5, initialBox.w + snapDx);
                if (resizeHandle.includes('s')) newH = Math.max(5, initialBox.h + snapDy);
                if (resizeHandle.includes('w')) {
                    const targetW = initialBox.w - snapDx;
                    if (targetW >= 5) {
                        newX = initialBox.x + snapDx;
                        newW = targetW;
                    }
                }
                if (resizeHandle.includes('n')) {
                    const targetH = initialBox.h - snapDy;
                    if (targetH >= 5) {
                        newY = initialBox.y + snapDy;
                        newH = targetH;
                    }
                }
                
                if (e.shiftKey) {
                    const ratio = initialBox.w / initialBox.h;
                    if (resizeHandle === 'e' || resizeHandle === 'w') {
                        newH = newW / ratio;
                    } else if (resizeHandle === 's' || resizeHandle === 'n') {
                        newW = newH * ratio;
                    } else {
                        const scale = Math.max(newW / initialBox.w, newH / initialBox.h);
                        newW = initialBox.w * scale;
                        newH = initialBox.h * scale;
                        if (resizeHandle.includes('w')) newX = initialBox.x + (initialBox.w - newW);
                        if (resizeHandle.includes('n')) newY = initialBox.y + (initialBox.h - newH);
                    }
                }
                
                const newBox = { x: newX, y: newY, w: newW, h: newH };
                
                const sX = initialBox.w === 0 ? 1 : newBox.w / initialBox.w;
                const sY = initialBox.h === 0 ? 1 : newBox.h / initialBox.h;
                
                initialElementCoordsList.forEach(info => {
                    const el = info.el;
                    const tag = info.tag;
                    
                    if (tag === 'rect') {
                        el.setAttribute('x', newBox.x + ((info.x - initialBox.x) * sX));
                        el.setAttribute('y', newBox.y + ((info.y - initialBox.y) * sY));
                        el.setAttribute('width', Math.max(1, info.w * sX));
                        el.setAttribute('height', Math.max(1, info.h * sY));
                    } else if (tag === 'ellipse') {
                        el.setAttribute('cx', newBox.x + ((info.cx - initialBox.x) * sX));
                        el.setAttribute('cy', newBox.y + ((info.cy - initialBox.y) * sY));
                        el.setAttribute('rx', Math.max(1, info.rx * sX));
                        el.setAttribute('ry', Math.max(1, info.ry * sY));
                    } else if (tag === 'line') {
                        el.setAttribute('x1', newBox.x + ((info.x1 - initialBox.x) * sX));
                        el.setAttribute('y1', newBox.y + ((info.y1 - initialBox.y) * sY));
                        el.setAttribute('x2', newBox.x + ((info.x2 - initialBox.x) * sX));
                        el.setAttribute('y2', newBox.y + ((info.y2 - initialBox.y) * sY));
                    } else if (tag === 'polygon' || tag === 'polyline') {
                        el.setAttribute('points', scalePolygon(info.points, initialBox, newBox));
                    } else if (tag === 'path') {
                        el.setAttribute('d', scalePath(info.d, initialBox, newBox));
                    } else if (tag === 'text') {
                        const newX = newBox.x + ((info.x - initialBox.x) * sX);
                        el.setAttribute('x', newX);
                        el.setAttribute('y', newBox.y + ((info.y - initialBox.y) * sY));
                        const scaleFactor = Math.min(sX, sY);
                        el.setAttribute('font-size', Math.max(1, info.fontSize * scaleFactor));
                        el.querySelectorAll('tspan').forEach(tspan => {
                            tspan.setAttribute('x', newX);
                        });
                    }
                });
                
                updateTransformer();
                populateDimensionInputs();
                return;
            }
            
            if (isDrawing && activeDrawEl) {
                if (activeTool === 'rect') {
                    const w = Math.abs(coords.x - dragStart.x);
                    const h = Math.abs(coords.y - dragStart.y);
                    let x = Math.min(dragStart.x, coords.x);
                    let y = Math.min(dragStart.y, coords.y);
                    let finalW = w, finalH = h;
                    
                    if (e.shiftKey) {
                        const size = Math.max(w, h);
                        finalW = size;
                        finalH = size;
                        if (coords.x < dragStart.x) x = dragStart.x - size;
                        if (coords.y < dragStart.y) y = dragStart.y - size;
                    }
                    activeDrawEl.setAttribute('x', x);
                    activeDrawEl.setAttribute('y', y);
                    activeDrawEl.setAttribute('width', finalW);
                    activeDrawEl.setAttribute('height', finalH);
                } else if (activeTool === 'ellipse') {
                    let rx = Math.abs(coords.x - dragStart.x) / 2;
                    let ry = Math.abs(coords.y - dragStart.y) / 2;
                    if (e.shiftKey) {
                        const r = Math.max(rx, ry);
                        rx = r; ry = r;
                    }
                    const cx = dragStart.x + (coords.x >= dragStart.x ? rx : -rx);
                    const cy = dragStart.y + (coords.y >= dragStart.y ? ry : -ry);
                    activeDrawEl.setAttribute('cx', cx);
                    activeDrawEl.setAttribute('cy', cy);
                    activeDrawEl.setAttribute('rx', rx);
                    activeDrawEl.setAttribute('ry', ry);
                } else if (activeTool === 'line') {
                    let x2 = coords.x;
                    let y2 = coords.y;
                    if (e.shiftKey) {
                        const dx = coords.x - dragStart.x;
                        const dy = coords.y - dragStart.y;
                        const theta = Math.atan2(dy, dx);
                        const nearest = Math.round(theta / (Math.PI / 4)) * (Math.PI / 4);
                        const r = Math.sqrt(dx*dx + dy*dy);
                        x2 = dragStart.x + r * Math.cos(nearest);
                        y2 = dragStart.y + r * Math.sin(nearest);
                        if (gridSnap) {
                            x2 = Math.round(x2 / gridSize) * gridSize;
                            y2 = Math.round(y2 / gridSize) * gridSize;
                        }
                    }
                    activeDrawEl.setAttribute('x2', x2);
                    activeDrawEl.setAttribute('y2', y2);
                }
                return;
            }
            
            if (isDrawing && (activeTool === 'pen' || activeTool === 'polygon')) {
                updateDrawPreview(coords.x, coords.y);
            }
        });

        canvasViewport.addEventListener('mouseup', (e) => {
            if (dragMode === 'pan') {
                dragMode = 'none';
                updateCursor();
                return;
            }
            
            if (dragMode === 'marquee') {
                const marquee = document.getElementById('marqueeRect');
                if (marquee) marquee.remove();
                
                const coords = getCanvasCoords(e);
                const dist = Math.hypot(coords.rawX - dragStart.x, coords.rawY - dragStart.y);
                
                if (dist < 4) {
                    if (clickedElement) {
                        if (clickedElement.getAttribute('data-locked') === 'true') {
                            dragMode = 'none';
                            return;
                        }
                        if (selection.contains(clickedElement)) {
                            selection.remove(clickedElement);
                        } else {
                            selection.add(clickedElement);
                        }
                        selectElements(selection.elements);
                    } else {
                        selectElements([]);
                    }
                } else {
                    const marqueeBox = {
                        x: Math.min(dragStart.x, coords.rawX),
                        y: Math.min(dragStart.y, coords.rawY),
                        w: Math.abs(coords.rawX - dragStart.x),
                        h: Math.abs(coords.rawY - dragStart.y)
                    };
                    
                    // If Shift is not held, replace the selection (clear first)
                    if (!e.shiftKey) {
                        selection.clear();
                    }
                    
                    const children = Array.from(drawGroup.children);
                    children.forEach(el => {
                        if (el.style.display === 'none' || el.getAttribute('data-locked') === 'true') return;
                        
                        const bbox = el.getBBox();
                        const elBox = { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
                        
                        if (rectsIntersect(elBox, marqueeBox)) {
                            selection.add(el);
                        }
                    });
                    selectElements(selection.elements);
                }
                
                dragMode = 'none';
                return;
            }
            
            if (dragMode === 'move' || dragMode === 'resize') {
                if (dragMode === 'move') {
                    const coords = getCanvasCoords(e);
                    const dist = Math.hypot(coords.rawX - dragStart.x, coords.rawY - dragStart.y);
                    if (dist < 4 && !e.shiftKey && selection.elements.length > 1) {
                        // Clicked on a selected element without dragging and without Shift:
                        // reduce selection to just the clicked element.
                        const target = e.target;
                        if (target && target !== gridBackplate && drawGroup.contains(target)) {
                            selectElement(target);
                        }
                    }
                }
                dragMode = 'none';
                saveState();
                return;
            }
            
            if (isDrawing) {
                if (activeTool === 'rect' || activeTool === 'ellipse' || activeTool === 'line') {
                    const el = activeDrawEl;
                    activeDrawEl = null;
                    isDrawing = false;
                    
                    const box = el.getBBox();
                    if (box.width === 0 && box.height === 0 && activeTool !== 'line') {
                        el.remove();
                        selectElement(null);
                    } else {
                        selectElement(el);
                        saveState();
                    }
                }
            }
        });

        canvasViewport.addEventListener('dblclick', (e) => {
            const target = e.target;
            if (target && target.tagName.toLowerCase() === 'text' && drawGroup.contains(target)) {
                if (target.getAttribute('data-locked') === 'true') return;
                showTextEditorOverlay(parseFloat(target.getAttribute('x')), parseFloat(target.getAttribute('y')), target);
            }
        });

        // 3. Zoom mousewheel handler
        canvasViewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = 1.08;
            const oldZoom = zoom;
            let newZoom;
            if (e.deltaY < 0) {
                newZoom = Math.min(25, zoom * factor);
            } else {
                newZoom = Math.max(0.08, zoom / factor);
            }
            
            const rect = canvasViewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const svgX = (mouseX - panX) / oldZoom;
            const svgY = (mouseY - panY) / oldZoom;
            
            panX = mouseX - svgX * newZoom;
            panY = mouseY - svgY * newZoom;
            zoom = newZoom;
            
            updateCanvasTransform();
        });

        // 4. Header buttons
        btnUndo.addEventListener('click', undo);
        btnRedo.addEventListener('click', redo);
        btnZoomIn.addEventListener('click', () => { zoom = Math.min(25, zoom * 1.2); updateCanvasTransform(); });
        btnZoomOut.addEventListener('click', () => { zoom = Math.max(0.08, zoom / 1.2); updateCanvasTransform(); });
        btnResetZoom.addEventListener('click', () => centerViewport());
        
        const btnCanvasTheme = document.getElementById('btnCanvasTheme');
        if (btnCanvasTheme) {
            btnCanvasTheme.addEventListener('click', () => {
                document.body.classList.toggle('canvas-light-mode');
                invertAllCanvasColors();
            });
        }
        
        btnClearCanvas.addEventListener('click', () => {
            if (confirm('Clear the canvas completely? This resets your workspace graphics.')) {
                drawGroup.innerHTML = '';
                selectElement(null);
                saveState();
            }
        });

        // 5. Dropdown trigger
        btnExportMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdown.classList.toggle('show');
        });
        
        exportDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        window.addEventListener('click', () => {
            exportDropdown.classList.remove('show');
        });
        
        btnExportSVG.addEventListener('click', exportSVG);
        btnCopySVG.addEventListener('click', copySVGCode);
        btnCopyOffice.addEventListener('click', () => copyAsOfficeVector(false));
        if (btnCopySelectionOffice) {
            btnCopySelectionOffice.addEventListener('click', () => copyAsOfficeVector(true));
        }
        btnExportPNG.addEventListener('click', exportPNG);

        // 6. Import Dialog modal setup
        btnImport.addEventListener('click', () => {
            importModal.classList.add('show');
            txtSvgPaste.value = '';
            importError.style.display = 'none';
        });
        btnImportClose.addEventListener('click', () => importModal.classList.remove('show'));
        btnImportCancel.addEventListener('click', () => importModal.classList.remove('show'));
        
        fileSvgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    txtSvgPaste.value = event.target.result;
                };
                reader.readAsText(file);
            }
        });
        
        btnImportSubmit.addEventListener('click', () => {
            try {
                const markup = txtSvgPaste.value.trim();
                if (!markup) return;
                importSVGMarkup(markup);
                importModal.classList.remove('show');
            } catch (err) {
                importError.innerText = `Import Error: ${err.message}`;
                importError.style.display = 'block';
            }
        });

        // 7. Inspector Tab toggling
        tabBtnProperties.addEventListener('click', () => {
            tabBtnProperties.classList.add('active');
            tabBtnLayers.classList.remove('active');
            tabContentProperties.classList.add('active');
            tabContentLayers.classList.remove('active');
        });
        tabBtnLayers.addEventListener('click', () => {
            tabBtnLayers.classList.add('active');
            tabBtnProperties.classList.remove('active');
            tabContentLayers.classList.add('active');
            tabContentProperties.classList.remove('active');
            renderLayers();
        });

        // 8. Properties Dimension Input changes
        const dimInputs = [valX, valY, valW, valH];
        dimInputs.forEach(input => {
            input.addEventListener('input', () => {
                const prop = input.id.replace('val', '').toLowerCase();
                const val = parseFloat(input.value) || 0;
                updateSelectedDimension(prop, val);
            });
            input.addEventListener('change', () => {
                saveState();
            });
        });

        valRx.addEventListener('input', () => {
            if (selectedEl && selectedEl.tagName.toLowerCase() === 'rect') {
                const rxVal = parseFloat(valRx.value);
                selectedEl.setAttribute('rx', rxVal);
                selectedEl.setAttribute('ry', rxVal);
                lblRx.innerText = `${rxVal}px`;
            }
        });
        valRx.addEventListener('change', () => saveState());

        // 9. Fill Type Actions
        const fillBtns = [btnFillNone, btnFillColor, btnFillGradient];
        fillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                fillBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (btn === btnFillNone) {
                    fillColorWrapper.style.display = 'none';
                    fillGradWrapper.style.display = 'none';
                } else if (btn === btnFillColor) {
                    fillColorWrapper.style.display = 'flex';
                    fillGradWrapper.style.display = 'none';
                } else {
                    fillColorWrapper.style.display = 'none';
                    fillGradWrapper.style.display = 'block';
                }
                handleStyleUIChange();
            });
        });

        valFillColor.addEventListener('input', () => {
            valFillHex.value = valFillColor.value;
            handleStyleUIChange();
        });
        valFillHex.addEventListener('input', () => {
            let val = valFillHex.value.trim();
            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                valFillColor.value = val;
                handleStyleUIChange();
            }
        });
        valFillGradientSelect.addEventListener('change', handleStyleUIChange);

        // 10. Stroke UI Input changes
        const strokeBtns = [btnStrokeNone, btnStrokeSolid, btnStrokeDashed, btnStrokeDotted];
        strokeBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    strokeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    if (btn === btnStrokeNone) {
                        strokeSubProperties.style.display = 'none';
                    } else {
                        strokeSubProperties.style.display = 'block';
                    }
                    handleStyleUIChange();
                });
            }
        });

        valStrokeColor.addEventListener('input', () => {
            valStrokeHex.value = valStrokeColor.value;
            handleStyleUIChange();
        });
        valStrokeHex.addEventListener('input', () => {
            let val = valStrokeHex.value.trim();
            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                valStrokeColor.value = val;
                handleStyleUIChange();
            }
        });
        
        valStrokeWidth.addEventListener('input', () => {
            if (lblStrokeWidth) lblStrokeWidth.innerText = `${valStrokeWidth.value}px`;
            handleStyleUIChange();
        });
        valStrokeWidth.addEventListener('change', () => saveState());
        
        const btnStrokeWidthDec = document.getElementById('btnStrokeWidthDec');
        const btnStrokeWidthInc = document.getElementById('btnStrokeWidthInc');
        if (btnStrokeWidthDec && btnStrokeWidthInc) {
            btnStrokeWidthDec.addEventListener('click', () => {
                let val = (parseFloat(valStrokeWidth.value) || 2) - 1;
                val = Math.max(1, Math.round(val * 10) / 10);
                valStrokeWidth.value = val;
                valStrokeWidth.dispatchEvent(new Event('input'));
                valStrokeWidth.dispatchEvent(new Event('change'));
            });
            btnStrokeWidthInc.addEventListener('click', () => {
                let val = (parseFloat(valStrokeWidth.value) || 2) + 1;
                val = Math.min(100, Math.round(val * 10) / 10);
                valStrokeWidth.value = val;
                valStrokeWidth.dispatchEvent(new Event('input'));
                valStrokeWidth.dispatchEvent(new Event('change'));
            });
        }
        
        valStrokeJoin.addEventListener('change', handleStyleUIChange);

        valTextContent.addEventListener('input', () => {
            if (selectedEl && selectedEl.tagName.toLowerCase() === 'text') {
                updateTextContent(selectedEl, valTextContent.value);
                updateTransformer();
            }
        });
        valTextContent.addEventListener('change', () => saveState());

        valFontSize.addEventListener('input', () => {
            if (selectedEl && selectedEl.tagName.toLowerCase() === 'text') {
                selectedEl.setAttribute('font-size', valFontSize.value);
                updateTransformer();
            }
        });
        valFontSize.addEventListener('change', () => saveState());

        const btnFontSizeDec = document.getElementById('btnFontSizeDec');
        const btnFontSizeInc = document.getElementById('btnFontSizeInc');
        if (btnFontSizeDec && btnFontSizeInc) {
            btnFontSizeDec.addEventListener('click', () => {
                let val = (parseFloat(valFontSize.value) || 20) - 1;
                val = Math.max(8, Math.round(val));
                valFontSize.value = val;
                valFontSize.dispatchEvent(new Event('input'));
                valFontSize.dispatchEvent(new Event('change'));
            });
            btnFontSizeInc.addEventListener('click', () => {
                let val = (parseFloat(valFontSize.value) || 20) + 1;
                val = Math.min(150, Math.round(val));
                valFontSize.value = val;
                valFontSize.dispatchEvent(new Event('input'));
                valFontSize.dispatchEvent(new Event('change'));
            });
        }

        valFontFamily.addEventListener('change', () => {
            if (selectedEl && selectedEl.tagName.toLowerCase() === 'text') {
                selectedEl.setAttribute('font-family', valFontFamily.value);
                updateTransformer();
                saveState();
            }
        });

        // 11. Opacity slider
        valOpacity.addEventListener('input', () => {
            lblOpacity.innerText = `${valOpacity.value}%`;
            handleStyleUIChange();
        });
        valOpacity.addEventListener('change', () => saveState());

        // 12. Element actions (Delete / Duplicate)
        btnDeleteSelected.addEventListener('click', () => {
            if (selection.elements.length > 0) {
                selection.elements.forEach(el => el.remove());
                selectElements([]);
                saveState();
            }
        });
        btnDuplicateSelected.addEventListener('click', () => {
            duplicateElements(selection.elements);
        });

        // 13. Workspace Grid Settings
        chkShowGrid.addEventListener('change', () => {
            showGrid = chkShowGrid.checked;
            updateGridLines();
        });
        chkSnapToGrid.addEventListener('change', () => {
            gridSnap = chkSnapToGrid.checked;
            snapIndicator.style.display = gridSnap ? 'flex' : 'none';
        });
        valGridSize.addEventListener('change', () => {
            gridSize = parseInt(valGridSize.value, 10);
            updateGridLines();
        });


        // 14. Layer Move Actions
        btnMoveLayerUp.addEventListener('click', () => moveSelectedLayer('up'));
        btnMoveLayerDown.addEventListener('click', () => moveSelectedLayer('down'));
        
        const btnMoveToFront = document.getElementById('btnMoveToFront');
        const btnMoveToBack = document.getElementById('btnMoveToBack');
        const btnMoveLayerToFront = document.getElementById('btnMoveLayerToFront');
        const btnMoveLayerToBack = document.getElementById('btnMoveLayerToBack');
        
        if (btnMoveToFront) btnMoveToFront.addEventListener('click', moveSelectedToFront);
        if (btnMoveToBack) btnMoveToBack.addEventListener('click', moveSelectedToBack);
        if (btnMoveLayerToFront) btnMoveLayerToFront.addEventListener('click', moveSelectedToFront);
        if (btnMoveLayerToBack) btnMoveLayerToBack.addEventListener('click', moveSelectedToBack);

        // 15. Shortcuts key bindings
        window.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            
            const isCtrl = e.ctrlKey || e.metaKey;
            
            if (isCtrl && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (isCtrl && e.key === 'y') {
                e.preventDefault();
                redo();
            } else if (isCtrl && e.key === 'd') {
                e.preventDefault();
                duplicateElements(selection.elements);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selection.elements.length > 0) {
                    selection.elements.forEach(el => el.remove());
                    selectElements([]);
                    saveState();
                }
            } else if (e.key === 'Escape') {
                if (isDrawing) {
                    if (activeTool === 'pen' || activeTool === 'polygon') {
                        finishActiveDraw();
                    } else {
                        cancelActiveDraw();
                    }
                } else {
                    selectElements([]);
                }
            } else if (e.key === 'Enter') {
                if (isDrawing && (activeTool === 'pen' || activeTool === 'polygon')) {
                    finishActiveDraw();
                }
            } else if (e.key.startsWith('Arrow') && selection.elements.length > 0) {
                let nudge = 1;
                if (e.shiftKey) nudge = 10;
                else if (gridSnap) nudge = gridSize;
                
                let dx = 0, dy = 0;
                if (e.key === 'ArrowUp') dy = -nudge;
                else if (e.key === 'ArrowDown') dy = nudge;
                else if (e.key === 'ArrowLeft') dx = -nudge;
                else if (e.key === 'ArrowRight') dx = nudge;
                
                if (dx !== 0 || dy !== 0) {
                    e.preventDefault();
                    selection.elements.forEach(el => moveElementBy(el, dx, dy));
                    updateTransformer();
                    populateDimensionInputs();
                }
            }
            
            // Tool Shortcuts
            if (!isCtrl) {
                if (e.key.toLowerCase() === 'v') triggerToolBtn('select');
                else if (e.key.toLowerCase() === 'h') triggerToolBtn('pan');
                else if (e.key.toLowerCase() === 'p') triggerToolBtn('pen');
                else if (e.key.toLowerCase() === 'l') triggerToolBtn('line');
                else if (e.key.toLowerCase() === 'r') triggerToolBtn('rect');
                else if (e.key.toLowerCase() === 'o') triggerToolBtn('ellipse');
                else if (e.key.toLowerCase() === 'y') triggerToolBtn('polygon');
                else if (e.key.toLowerCase() === 'g') triggerToolBtn('bucket');
                else if (e.key.toLowerCase() === 't') triggerToolBtn('text');
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.key.startsWith('Arrow') && selection.elements.length > 0) {
                saveState();
            }
        });
    }

    function triggerToolBtn(toolName) {
        const btn = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
        if (btn) btn.click();
    }

    function duplicateElements(elements) {
        if (elements.length === 0) return;
        const newClones = [];
        elements.forEach(el => {
            const clone = el.cloneNode(true);
            clone.id = generateId(clone.tagName.toLowerCase());
            moveElementBy(clone, gridSize, gridSize);
            drawGroup.appendChild(clone);
            newClones.push(clone);
        });
        selectElements(newClones);
        saveState();
    }

    function populateDimensionInputs() {
        if (selection.elements.length === 0) return;
        
        let x, y, w, h;
        if (selection.elements.length > 1) {
            const bounds = getCollectiveBounds(selection.elements);
            x = bounds.x;
            y = bounds.y;
            w = bounds.w;
            h = bounds.h;
        } else {
            const el = selection.active;
            const tagName = el.tagName.toLowerCase();
            const bbox = el.getBBox();
            
            if (tagName === 'rect') {
                x = parseFloat(el.getAttribute('x')) || 0;
                y = parseFloat(el.getAttribute('y')) || 0;
                w = parseFloat(el.getAttribute('width')) || 0;
                h = parseFloat(el.getAttribute('height')) || 0;
            } else if (tagName === 'ellipse') {
                const cx = parseFloat(el.getAttribute('cx')) || 0;
                const cy = parseFloat(el.getAttribute('cy')) || 0;
                const rx = parseFloat(el.getAttribute('rx')) || 0;
                const ry = parseFloat(el.getAttribute('ry')) || 0;
                x = cx - rx;
                y = cy - ry;
                w = rx * 2;
                h = ry * 2;
            } else {
                x = bbox.x;
                y = bbox.y;
                w = bbox.width;
                h = bbox.height;
            }
        }
        
        valX.value = Math.round(x);
        valY.value = Math.round(y);
        valW.value = Math.round(w);
        valH.value = Math.round(h);
    }

    // RUN BOOTSTRAP
    window.addEventListener('DOMContentLoaded', init);

})();
