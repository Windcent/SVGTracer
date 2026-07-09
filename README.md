# FlowTracer — SVG Vector Editor

A browser-based vector illustration tool for drawing, tracing, and exporting SVG artwork — no installation required.

*This project was 100% vibe coded.*

---

## Features

### Drawing Tools

| Tool | Key | Description |
|---|---|---|
| Select / Move | `V` | Select, move, resize, and multi-select elements |
| Pan Canvas | `H` or `Space` | Pan the infinite canvas viewport |
| Rotate | `E` | Freehand rotation around an element's center |
| Pen / Path | `P` | Place anchor points to build open or closed paths |
| Smooth Trace | `S` | Click-to-place point tracing with Catmull-Rom path smoothing |
| Line Segment | `L` | Draw straight line segments |
| Rectangle | `R` | Draw rectangles with adjustable corner radius |
| Ellipse / Circle | `O` | Draw ellipses and perfect circles |
| Polygon | `Y` | Draw closed straight-segment polygons |
| Bucket Fill | `G` | Detect and fill enclosed regions formed by intersecting shapes |
| Text Box | `T` | Place multiline text with font and size controls |

### Canvas & Workspace

- **Infinite grid canvas** with zoom (`Ctrl +/-`, scroll wheel) and pan
- **Grid snapping** — configurable snap sizes: 5, 10, 20, 50, or 100 px
- **Canvas theme toggle** — switch between dark and light canvas backgrounds
- **Live cursor coordinates** shown in the status bar
- **Snap indicator** in the status bar

### Symmetry

- Enable a **symmetry line** to mirror strokes in real time across any axis
- Place the two symmetry endpoints anywhere on the canvas
- Works with all path-based drawing tools (Pen, Smooth Trace)

### Trace Image Overlay

Load a reference image behind the canvas to trace over:

- Upload any raster image (PNG, JPG, etc.)
- Control **opacity** (0–100%) to see through to your vectors
- **Scale** (10–400%) and **X/Y offset** positioning
- Toggle visibility without removing the image

### Style Inspector

- **Fill** — None, solid color (with hex input + color history), or gradient presets:
  - Neon Ice, Sunset Glow, Sol Forest, Cyberpunk Emerald, Monochrome
- **Stroke** — None, solid, dashed, or dotted; custom color, width, and line-join style (miter / round / bevel)
- **Opacity** slider per element
- **Corner radius** slider for rectangles
- **Rotation** — numeric angle input plus quick ±90° and reset buttons

### Text

- Inline editing directly on the canvas
- Font family: Outfit, Helvetica, Fira Code, Arial, Times New Roman
- Font size control with increment / decrement buttons

### Layers

- Full layer list showing all canvas elements
- Reorder: Move Up, Move Down, Send to Back, Bring to Front
- Select layers directly from the Layers panel

### Edit Operations

- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y`
- **Duplicate** selected element
- **Delete** selected element — `Del` or `Backspace`
- **Nudge** elements with arrow keys
- **Copy / Paste** — `Ctrl+C` / `Ctrl+V`
- **Marquee selection** — drag-select multiple elements
- **Multi-select** with `Shift+click`
- **Constrain proportions** while drawing — hold `Shift`

### Import / Export

| Action | Description |
|---|---|
| **Import SVG File** | Upload a `.svg` file to import its elements onto the canvas |
| **Paste SVG Markup** | Paste raw SVG XML directly in the import modal |
| **Export SVG File** | Download a clean `.svg` vector file |
| **Export DXF File** | Download a CAD-compatible `.dxf` vector file |
| **Export PNG** | Rasterized high-resolution image |
| **Copy SVG Code** | Copy raw SVG XML to the clipboard |
| **Copy for Office Suite** | Copy vectors as Office-compatible metadata for Word / PowerPoint |

All export modes support an optional **light background** setting.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select tool |
| `H` | Pan tool |
| `E` | Rotate tool |
| `P` | Pen tool |
| `S` | Smooth Trace tool |
| `L` | Line tool |
| `R` | Rectangle tool |
| `O` | Ellipse tool |
| `Y` | Polygon tool |
| `G` | Bucket Fill tool |
| `T` | Text tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Del` / `Backspace` | Delete selected |
| `Arrow Keys` | Nudge selected element |
| `Shift` | Constrain shape proportions while drawing |
| `Esc` | Cancel active path / deselect |
| `Space` (hold) | Temporary pan mode |

---

## Getting Started

Open `SVGTracer.html` directly in any modern web browser — no build step or server required.

```
SVGTracer/
├── SVGTracer.html   # Application shell
├── app.js           # Core drawing engine
└── styles.css       # Visual theme
```

Agent must never test directly, must ask the user to test and provide feedback.