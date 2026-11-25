import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import { IDetalleSeguimiento } from '@/modules/bandeja/detalle-operaciones/interfaces';
import { DATE_FORMAT, formatDate } from '@/lib/date';
import { COD_ITEM } from '@/constants/codigo-items';
import { getDescripcionOperacion } from '@/modules/flujos/reportes/utils/datos-operacion-item';

export interface IExcelSheet {
    sheetName: string;
    rows: Record<string, string | number>[];
}

const INVALID_SHEET_NAME_CHARS = /[:\\/?*[\]]/g;

/** `itemCode`s que não devem aparecer como coluna extra no Excel: ou são dados técnicos internos
 *  (ex.: `TIPO_MOTOR_BPM`, flag de controle jBPM, sem valor pra quem lê o relatório), ou já têm
 *  sua própria coluna na linha base (Título/Descrição/Prazo/Impacto) — mantê-los também como
 *  coluna genérica duplicaria a informação. */
const ITEM_CODES_EXCLUIDOS: number[] = [
    COD_ITEM.TIPO_MOTOR_BPM,
    COD_ITEM.TITULO_GESTION,
    COD_ITEM.DETALLE_GESTION,
    COD_ITEM.PLAZO_GESTION,
    COD_ITEM.IMPACTO_GESTION,
];

function sanitizeSheetName(nombreProducto: string, nombreSubProducto: string): string {
    const nombre = `${nombreProducto} - ${nombreSubProducto}`.replace(INVALID_SHEET_NAME_CHARS, ' ').trim();
    return nombre.slice(0, 31);
}

/** Evita colisiones cuando dos grupos distintos truncan al mismo nombre de 31 caracteres. */
function dedupeSheetName(nombre: string, nombresUsados: Set<string>): string {
    if (!nombresUsados.has(nombre)) {
        nombresUsados.add(nombre);
        return nombre;
    }

    let contador = 2;
    let candidato = `${nombre.slice(0, 28)} ${contador}`;
    while (nombresUsados.has(candidato)) {
        contador += 1;
        candidato = `${nombre.slice(0, 28)} ${contador}`;
    }

    nombresUsados.add(candidato);
    return candidato;
}

/** El endpoint `seguimiento/{operacion}/datos-operacion` puede repetir el mismo `itemCode` para
 *  una misma operación — se queda con la última aparición. */
function dedupeItemsPorCodigo(itemsDetalle: IDetalleSeguimiento[]): Map<number, IDetalleSeguimiento> {
    const porCodigo = new Map<number, IDetalleSeguimiento>();
    for (const item of itemsDetalle) {
        porCodigo.set(item.itemCode, item);
    }
    return porCodigo;
}

function buildBaseRow(
    seguimiento: ISeguimientoItem,
    itemsPorCodigo: Map<number, IDetalleSeguimiento>
): Record<string, string | number> {
    const descricao = itemsPorCodigo.get(COD_ITEM.DETALLE_GESTION)?.value ?? getDescripcionOperacion(seguimiento) ?? '';

    return {
        'Nº Processo': seguimiento.operacion,
        Produto: seguimiento.nombreProducto,
        Subproduto: seguimiento.nombreSubProducto,
        Solicitante: seguimiento.requestedBy ?? seguimiento.propietario,
        'Área Responsável': seguimiento.assignedDepartmentNames?.join(', ') ?? '',
        Descrição: descricao,
        Estado: seguimiento.estado,
        'Data de criação': formatDate(seguimiento.fechaInicio, DATE_FORMAT.DD_MM_YYYY),
        Prazo: seguimiento.plazo ? formatDate(seguimiento.plazo, DATE_FORMAT.DD_MM
    };
}

/**
 * Agrupa los seguimientos por producto+subProducto (una hoja por grupo) y agrega, por cada
 * seguimiento, una columna extra por cada `itemName` distinto devuelto por
 * `seguimiento/{operacion}/datos-operacion` dentro de ese grupo — salvo los `itemCode` en
 * `ITEM_CODES_EXCLUIDOS` (técnicos o ya representados en la fila base).
 */
export function buildExcelSheets(
    seguimientos: ISeguimientoItem[],
    detalles: Map<string, IDetalleSeguimiento[]>
): IExcelSheet[] {
    const grupos = new Map<string, ISeguimientoItem[]>();

    for (const seguimiento of seguimientos) {
        const clave = `${seguimiento.producto}-${seguimiento.subProducto}`;
        const grupo = grupos.get(clave) ?? [];
        grupo.push(seguimiento);
        grupos.set(clave, grupo);
    }

    const nombresUsados = new Set<string>();

    return Array.from(grupos.values()).map(grupo => {
        const { nombreProducto, nombreSubProducto } = grupo[0];

        const rows = grupo.map(seguimiento => {
            const itemsPorCodigo = dedupeItemsPorCodigo(detalles.get(seguimiento.operacion) ?? []);
            const row = buildBaseRow(seguimiento, itemsPorCodigo);
            for (const item of itemsPorCodigo.values()) {
                if (ITEM_CODES_EXCLUIDOS.includes(item.itemCode)) continue;
                row[item.itemName] = item.value;
            }

            return row;
        });

        const sheetName = dedupeSheetName(sanitizeSheetName(nombreProducto, nombreSubProducto), nombresUsados);
        return { sheetName, rows };
    });
}
