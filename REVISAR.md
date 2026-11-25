# REVISAR — points to check against the real repo

Paths relative to `src/modules/flujos/reportes/`. Line numbers refer to the transcribed files (they include the added TODO comment lines, so they do not match the photos exactly).

## 1. TODO-UNREADABLE spots

Almost all of them are lines **cut off at the right edge of the screen** (the code continues off-screen), not blurry text.

### components/reporte-filtros-form.tsx
- L61 — `isRequired` cut after `.require`
- L111 — `expandirTodos` signature cut after `undefined =`
- L238 — `<FormLabel>` of `areaResponsavel` cut after `</FormL`
- L245 — **lines 241–252 of the original are missing** (no photo covers them): end of the `onChange` of `areaResponsavel` and the closing of that `FormField`
- L254 — `<FormLabel>` of `responsavelDaArea` cut after `</`
- L304, L343, L364 — `onClear: () => field.onChange` cut (DatePickers for prazo, fechaDesde, fechaHasta)

### components/reportes-export-button.tsx
- L73 — spinner `className` cut after `border-t-transp`

### components/reportes-table.tsx
- L5 — `@mui/material` import is folded in the editor (orig. lines 4–19): the names are unknown. The ones used are probably `Box, Button, CircularProgress, IconButton, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Tooltip, Typography` (unconfirmed)
- L131 — `...(showResponsible ? [...] :` cut
- L233 — "Ações" `TableCell`: `minWidth` value unclear and the end of the line is cut off
- L328 — `<DetalheOperacaoDialog ... seguimiento={d` cut

### hooks/use-reportes.ts
- L6 — two imports cut (`interfac…`, `reporte-filt…`)
- L21 — the whole NOTE comment block is cut off on the right

### interfaces/reporte-filtros.interface.ts
- L3 — JSDoc comment cut off on the right (and its closing `*/` is not visible)

### utils/datos-operacion-item.ts
- L8 — JSDoc lines 9–15 cut off
- L23 — `getDatoOperacionSeguro` signature cut (return type and `{`)
- L33 — `.find(...)` cut after `codigoItem)`
- L38 — `getTituloOperacion` cut after `string | null =`
- L42 — `getDescripcionOperacion` cut after `string | n`
- L46 — JSDoc "Cargos responsables" cut off (closing `*/` not visible)

### utils/dias-gestion.ts
- L3 — JSDoc cut off (closing `*/` not visible)
- L6 — `diasTranscurridos` signature cut after `): n`
- L17 — first JSDoc line cut after `Pued`

### utils/excel-export.ts
- L2, L6 — imports cut (`interfa…`, `datos-ope…`)
- L16 — JSDoc of `ITEM_CODES_EXCLUIDOS` cut off
- L29, L31 — `sanitizeSheetName` (signature and `.replace(...)`) cut
- L36 — JSDoc of `dedupeSheetName` cut (closing `*/` not visible)
- L55, L58 — JSDoc and signature of `dedupeItemsPorCodigo` cut
- L71 — `descricao` cut after `?? getDe`
- L82 — `'Data de criação'` and `Prazo` cut
- L88 — JSDoc of `buildExcelSheets` partly cut off
- L114 — `detalles.get(seguimiento.o` cut
- L125 — `sanitizeSheetName(nombreProducto, nombre` cut

## 2. Cuts / inconsistencies between photos

- `reporte-filtros-form.tsx`: **gap between photo 5 (ends at L240) and photo 6 (starts at L253)** → 12 lines missing.
- `reportes-table.tsx`: photos 13 and 14 disagree by 1 line (in 13, `{seguimiento.operacion ...}` is on L269; in 14 it is on L271). The file may have been edited between photos. I followed photo 13 up to L278 and photo 14 from there on.
- `reportes-table.tsx` L2: the photo shows a "Blame" annotation on that line; transcribed as a blank line.
- `excel-export.ts` L89: the line holds only the "Blame" annotation; transcribed as a blank line.
- `use-reportes.ts` L18: the "Blame" text is a VS Code annotation, not code (omitted).
- The color swatches in front of the hex values (`reportes-table.tsx`) are VS Code decorations, not code (omitted).

## 3. Imports pointing to files not shown in any photo

- `@/components/ui/dialog`
- `@/components/ui/form`
- `@/components/ui/select`
- `@/stores/seguimientos.store`
- `@/lib/date`
- `@/constants/codigo-items`
- `@/modules/bandeja/operaciones/interfaces`
- `@/modules/bandeja/operaciones/services`
- `@/modules/bandeja/operaciones/hooks/use-advanced-filter`
- `@/modules/bandeja/operaciones/components/detalles-presentacion`
- `@/modules/bandeja/operaciones/constants/new-operation.config`
- `@/modules/bandeja/tabs/components/tabs-operacion`
- `@/modules/bandeja/detalle-operaciones/contexts/detalle-mode.context`
- `@/modules/bandeja/detalle-operaciones/interfaces`
- `@/modules/bandeja/detalle-operaciones/services/detalle.service`
- `@/modules/comentarios/ui/components/comentarios-seguimiento`
- `@/modules/usuarios/ui/hooks/use-usuarios-setores`
- `@/modules/usuarios/ui/hooks/use-setores`
- `@/products/auditoria/apontamentos/apontamentos-auditoria.config`

Every import inside `@/modules/flujos/reportes/...` points to a file that was transcribed.
