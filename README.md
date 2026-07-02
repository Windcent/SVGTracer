# SVGTracer

A web-based vector drawing editor that lets you draw, trace, modify, and export SVG elements directly in the browser. 

*This project was 100% vibe coded.*

## Features

- **Grid Snapping**: Canvas grid with adjustable snap sizes.
- **Drawing Tools**:
  - **Select & Pan**: Move objects on canvas, multi-select, and pan the viewport.
  - **Pen & Polygon**: Draw custom paths or straight-segmented closed polygons.
  - **Shapes**: Create rectangles (with corner radius adjustments) and ellipses.
  - **Lines**: Create straight lines.
  - **Text Box (<kbd>T</kbd>)**: Add and edit multiline text elements in-place with multiple fonts (Outfit, Helvetica, Fira Code, Arial, Times New Roman).
- **Paint Bucket**: Detects and fills enclosed regions formed by intersecting shapes.
- **Layers**: Arrange element order (Move Up/Down, Send to Back, Bring to Front) via layers list.
- **Style Controls**: Customize fill (solid color or gradient presets), opacity, stroke (color, width, dash style, and corner join style).
- **Import/Export**: Copy and paste SVG markup, import SVG files, export as raw SVG or PNG, or copy vectors directly formatted for Microsoft Office.

## Getting Started

Simply open `SVGTracer.html` directly in any web browser.

Agent must never test directly, must ask the user to test and provide feedback.