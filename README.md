# SVGTracer

**This project was 100% vibe coded**

A browser-based vector illustration tool built on a live SVG canvas. Draw, trace, and export clean vector graphics without any install or sign-up required.

## Overview

SVGTracer gives you a full drawing workspace in a single HTML file. Open `SVGTracer.html` in any modern browser and start drawing immediately. Everything runs locally — no server, no build step.

## Features

### Drawing Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Select / Move / Resize | `V` | Click to select, drag handles to resize |
| Pan | `H` / Hold `Space` | Pan the infinite canvas |
| Rotate | `E` | Free-rotate the selected element |
| Pen / Path | `P` | Click-to-place anchor points, double-click to close |
| Smooth Trace | `S` | Freehand tracing with automatic Bezier smoothing |
| Line Segment | `L` | Draw straight line segments |
| Rectangle | `R` | Draw rectangles (hold `Shift` to constrain to square) |
| Ellipse / Circle | `O` | Draw ellipses (hold `Shift` for perfect circles) |
| Polygon | `Y` | Multi-sided polygon tool |
| Bucket Fill | `G` | Apply fill to the selected shape |
| Text Box | `T` | Place editable text elements |

### Canvas & Workspace

- **Infinite grid canvas** — pan and zoom freely with scroll or pinch
- **Snap to grid** — configurable snap sizes: 5 / 10 / 20 / 50 / 100 px
- **Canvas theme toggle** — switch the canvas background between dark and light
- **Symmetry line** — draw mirror-symmetrical paths across a draggable axis
- **Trace image overlay** — upload a reference image, adjust its opacity (0–100%) and scale, and draw directly on top of it

### Element Inspector (Right Panel)

- **Dimensions** — X, Y, Width, Height with live numeric inputs
- **Rotation** — numeric angle input plus ±90° and reset buttons
- **Fill** — None / Solid color / Preset gradient (Neon Ice, Sunset Glow, Sol Forest, Cyberpunk Emerald, Monochrome)
- **Stroke** — None / Solid / Dashed / Dotted, color picker, width, and line-join style (Miter / Round / Bevel)
- **Opacity** — per-element opacity slider
- **Layer order** — Send to Back, Bring to Front, and step-up/step-down controls
- **Duplicate & Delete** shortcuts in the inspector
- **Text properties** — font family (Outfit, Helvetica, Fira Code, Arial, Times New Roman) and font size
- **Color history** — recent fill and stroke colors shown as swatches
- **"Copy Selection for Office"** — copies the selected element as vector metadata compatible with Microsoft Office / LibreOffice

### Layers Panel

- Full layer list showing every element on the canvas
- Click a layer row to select the corresponding element
- Reorder layers directly from the panel

### Import & Export

| Action | Output |
|--------|--------|
| Import SVG | Paste SVG XML markup or upload an `.svg` file to place elements on the canvas |
| Export SVG File | Download a clean, minimal `.svg` file |
| Export DXF File | Download a CAD-compatible `.dxf` vector |
| Export PNG | Rasterize the canvas to a high-resolution `.png` |
| Copy SVG Code | Copy the raw SVG XML to the clipboard |
| Copy for Office Suite | Copy as vector graphics metadata for paste into Office apps |
| Export with light background | Checkbox option that overrides the canvas theme on export |

### Keyboard Shortcuts

| Keys | Action |
|------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Delete` | Delete selected shape |
| `Arrow Keys` | Nudge selected shape by 1 px |
| `Shift` | Constrain proportions while drawing |
| `Esc` | Cancel active path or tool |
| `Space` (hold) | Temporarily activate Pan tool |

## Getting Started

1. Open `SVGTracer.html` in a modern browser (Chrome, Edge, Firefox, Safari).
2. Pick a tool from the left sidebar and start drawing on the grid.
3. Click any element to open its properties in the right inspector.
4. Use **Export** in the top-right to download your work.

## File Structure

```
SVGTracer/
├── SVGTracer.html   # Application entry point (open this)
├── app.js           # All drawing logic, tool handling, import/export engine
└── styles.css       # Dark-mode UI, grid, and inspector styles
```

## Browser Compatibility

Requires a modern browser with SVG and ES6+ support. No external dependencies are loaded at runtime — fonts and icons are fetched from Google Fonts and Cloudflare CDN on first load.
