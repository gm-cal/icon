# File Operations category instructions

This directory contains canonical file-operation icon templates for the `FOP` / `file-operations` category.

## Canonical icons

Keep the category small. The canonical operation icons are:

- `file-convert.svg` — one file format converted to another
- `file-split.svg` — one file split into multiple files
- `file-merge.svg` — multiple files merged into one file

Do **not** add a new catalog icon only for a format pair such as `pdf-to-csv`, `xlsx-to-json`, or `docx-to-txt`. Those are derived instances of the canonical templates.

## Replaceable labels

Format labels are SVG `<text>` elements marked with `data-uui-label-slot="source"` or `data-uui-label-slot="target"`.

- Replace text content only; preserve the slot attribute and layout attributes.
- 1–5 characters are supported. Common uppercase format abbreviations such as `PDF`, `CSV`, `XLSX`, `DOCX`, `JSON`, `TXT`, and `XML` are preferred.
- Do not convert the label text to path geometry.
- Dynamic label content is intentionally excluded from the canonical geometry hash. Changing only a label does not create a new icon identity.
- Use `node tools/render-file-operation.mjs ...` to generate derived SVGs when possible.
- Derived format-pair SVGs should normally be generated at build/runtime and should not be committed to this repository.

## Visual rules

- Preserve the `24 × 24` viewBox, stroke width 2, round caps, and round joins.
- The operation silhouette must remain understandable even when the small label text is unreadable at 16px.
- Color and monochrome variants must share the same geometry and label-slot positions.
- Monochrome uses `currentColor`; color uses the `FOP` category palette.
- Labels are secondary information. Do not enlarge them enough to dominate the operation symbol.

## Metadata and validation

- Category ID: `file-operations`
- Category code: `FOP`
- Preserve icon IDs and slugs once published.
- Keep `<uui:template>` metadata and label-slot attributes intact.
- After changing canonical geometry, synchronize catalog, sprites, previews, and `SHA256SUMS`, then run `node tools/validate.mjs` and `sha256sum -c SHA256SUMS`.
