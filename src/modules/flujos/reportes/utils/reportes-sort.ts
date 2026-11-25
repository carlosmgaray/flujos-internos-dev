import { parse } from 'date-fns';

import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import { formatAreas, formatResponsables } from '@/modules/flujos/reportes/utils/reportes-format';

export type SortKey =
    | 'operacion'
    | 'produto'
    | 'solicitante'
    | 'areaResponsavel'
    | 'estado'
    | 'fechaInicio'
    | 'prazo'
    | 'titulo'
    | 'responsable';

export type SortDirection = 'asc' | 'desc';

/** `null` marks an empty or unparseable value (only dates use it), always sorted last. */
type SortValue = string | number | null;

interface Fila {
    seguimiento: ISeguimientoItem;
    sortValues: Record<SortKey, SortValue>;
}

/** Timestamp of a `dd/MM/yyyy` date (e.g. `plazo`), or `null` if empty/invalid. */
function parsePlazo(plazo?: string | null): number | null {
    if (!plazo) return null;
    const time = parse(plazo, 'dd/MM/yyyy', new Date()).getTime();
    return Number.isNaN(time) ? null : time;
}

/** Timestamp of an ISO date (e.g. `fechaInicio`), or `null` if empty/invalid. */
function parseIsoDate(value?: string | null): number | null {
    if (!value) return null;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : time;
}

function buildFila(seguimiento: ISeguimientoItem): Fila {
    return {
        seguimiento,
        sortValues: {
            operacion: seguimiento.operacion ?? '',
            produto: `${seguimiento.nombreProducto} / ${seguimiento.nombreSubProducto}`,
            solicitante: seguimiento.requestedBy ?? seguimiento.propietario ?? '',
            areaResponsavel: formatAreas(seguimiento.assignedDepartmentNames),
            estado: seguimiento.estado ?? '',
            fechaInicio: parseIsoDate(seguimiento.fechaInicio),
            prazo: parsePlazo(seguimiento.plazo),
            titulo: seguimiento.titulo ?? '',
            responsable: formatResponsables(seguimiento.responsibleName),
        },
    };
}

function compararFilas(a: Fila, b: Fila, sortKey: SortKey, direction: SortDirection): number {
    const valorA = a.sortValues[sortKey];
    const valorB = b.sortValues[sortKey];

    // Empty values go last regardless of direction, so handle them before applying it.
    if (valorA === null || valorB === null) {
        if (valorA === valorB) return 0;
        return valorA === null ? 1 : -1;
    }

    let resultado: number;
    if (typeof valorA === 'number' && typeof valorB === 'number') {
        resultado = valorA - valorB;
    } else {
        resultado = String(valorA).localeCompare(String(valorB), 'pt-BR');
    }

    return direction === 'asc' ? resultado : -resultado;
}

/** Returns a new array sorted by `sortKey`; keeps the original order when `sortKey` is `null`. */
export function sortSeguimientos(
    seguimientos: ISeguimientoItem[],
    sortKey: SortKey | null,
    direction: SortDirection
): ISeguimientoItem[] {
    if (!sortKey) return seguimientos;

    return seguimientos
        .map(buildFila)
        .sort((a, b) => compararFilas(a, b, sortKey, direction))
        .map(fila => fila.seguimiento);
}
