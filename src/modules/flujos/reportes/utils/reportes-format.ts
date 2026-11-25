export const VALOR_VAZIO = '-';

/** Normaliza listas: acepta array o string, separa por el patrón indicado,
 *  quita vacíos y duplicados y une con ", ". */
export function formatList(value?: string[] | string | null, separator: RegExp = /[|;]/): string {
    if (!value) return VALOR_VAZIO;

    const lista = Array.isArray(value) ? value : [value];
    const items = lista
        .flatMap(item => String(item ?? '').split(separator))
        .map(item => item.trim())
        .filter(Boolean);

    const unicos = Array.from(new Set(items));
    return unicos.length > 0 ? unicos.join(', ') : VALOR_VAZIO;
}

export const formatAreas = (value?: string[] | string | null) => formatList(value, /[|,;]/);
export const formatResponsables = (value?: string[] | string | null) => formatList(value, /[|;]/);
