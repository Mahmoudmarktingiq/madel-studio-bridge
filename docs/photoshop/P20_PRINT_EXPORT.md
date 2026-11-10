# MADEL Studio Bridge — Phase P20
# Professional Print Setup & Production Export Guide
**Architect & Owner:** Mahmoud Adel (`Mahmoudmarktingiq`)  
**Phase:** P20 — Advanced Photoshop Creative Tools  
**Module:** Print Document Engine & Production Export  

---

## 1. Overview & Print Prepress Standards

Professional commercial printing demands exact adherence to physical prepress standards:
1. **Resolution:** 300 DPI (Dots Per Inch) minimum to ensure sharp halftone screening (150 LPI).
2. **Color Mode:** 4-Channel Subtractive CMYK (Cyan, Magenta, Yellow, Key/Black) to prevent out-of-gamut RGB clipping.
3. **Physical Sizing:** Precise millimeter and inch dimensions corresponding to international paper standards (e.g. ISO A4: 210 x 297 mm, US Letter: 8.5 x 11 in).
4. **Export Formats:** Lossless Tagged Image File Format (TIFF) with LZW compression and embedded ICC profiles, or multi-layer PSD master files.

Phase P20 introduces comprehensive support for professional print document generation, resolution manipulation, and lossless TIFF export.

---

## 2. Tools & Capabilities

### 2.1 `ps_create_document` (CMYK & 300 DPI Support)
Creates an active document configured for commercial print:
- **Modes:** `"cmyk"`, `"rgb"`, `"grayscale"`.
- **Default Resolution:** Automatically defaults to **300 DPI** when `mode: "cmyk"` is selected (and 72 DPI for RGB web documents).
- **Physical Sizing Example (A4 Flyer at 300 DPI):**
  - Width: 2480 px
  - Height: 3508 px
  - Resolution: 300 DPI
  - Mode: `cmyk`
  - Result: 210 x 297 mm physical print size.

### 2.2 `ps_get_document_info`
Extracts full document prepress telemetry:
- Canvas pixel dimensions: `{ width, height }`
- Resolution: DPI value
- Physical print dimensions calculated automatically:
  - `inches`: `{ width: (pixels / dpi), height: (pixels / dpi) }`
  - `mm`: `{ width: (pixels / dpi) * 25.4, height: (pixels / dpi) * 25.4 }`
- Color Mode: `CMYKColorMode`, `RGBColorMode`, `grayscaleMode`
- Color Depth: 8-bit, 16-bit, or 32-bit per channel
- Embedded Color Profile: (e.g. "U.S. Web Coated (SWOP) v2", "Coated FOGRA39", "sRGB IEC61966-2.1")
- Active layer and total layer count.

### 2.3 `ps_set_document_resolution`
Adjusts document resolution with two distinct prepress intents:
1. **Print DPI Adjustment without Resampling (`resample: false`):**
   Changes the physical print density (e.g. shifting from 72 DPI to 300 DPI) without altering the pixel dimensions of the image. Pixel sharpness is preserved while physical print dimensions scale down proportionally.
   Uses Photoshop `imageSize` ActionDescriptor:
   ```javascript
   {
     _obj: "imageSize",
     resolution: { _unit: "densityUnit", _value: 300 },
     scaleStyles: true,
     constrainProportions: true
   }
   ```
2. **Pixel Resampling (`resample: true`):**
   Resamples image data using bicubic interpolation to fit the specified DPI at existing physical dimensions.

### 2.4 `ps_export` (Lossless TIFF & Web Formats)
Extends file exports to support prepress production:
- **TIFF Export (`format: "tiff"`):**
  - Uses `doc.saveAs.tiff`.
  - Compression: `lzw` (lossless LZW compression, default) or `none`.
  - Preserves 4-channel CMYK data, spot channels, and embedded ICC color profiles.
  - Byte Order: `constants.ByteOrder.IBMPC` (Windows standard).
- **JPEG Export (`format: "jpg"`):** Quality 0–12 with color profile embedding.
- **PNG Export (`format: "png"`):** Level 6 compression for digital web deliverables.
