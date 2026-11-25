import { differenceInCalendarDays, parse } from 'date-fns';

/** Días transcurridos desde `fechaInicio` hasta `fechaFin` (fecha de cierre si el estado es
 *  terminal) o hasta hoy si la operación sigue abierta. `null` si `fechaInicio` no es parseable. */
export function diasTranscurridos(fechaInicio: string, fechaFin: string | null): number | null {
    const inicio = new Date(fechaInicio);
    if (Number.isNaN(inicio.getTime())) return null;

    const fin = fechaFin ? new Date(fechaFin) : new Date();
    if (Number.isNaN(fin.getTime())) return null;

    return Math.max(0, differenceInCalendarDays(fin, inicio));
}

/** Días restantes hasta `plazo`, o `null` si no hay plazo o no es parseable. Puede ser negativo
 *  (operación vencida). */
export function diasRestantes(plazo: string | null | undefined): number | null {
    if (!plazo) return null;
    const fecha = parse(plazo, 'dd/MM/yyyy', new Date());
    if (Number.isNaN(fecha.getTime())) {
        return null;
    }
    return differenceInCalendarDays(fecha, new Date());
}
