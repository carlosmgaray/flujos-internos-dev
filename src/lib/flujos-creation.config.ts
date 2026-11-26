import { FLUJOS } from '@/modules/flujos/flujos.registry';
import { resolveAllowedDepartamentos } from '@/lib/flujos-departamentos.config';
import { DepartamentosSource, FlujoDefinition } from '@/modules/flujos/interfaces/flujo.interface';

interface CreatableFlujosParams {
    /** `null` when the user's real department could not be resolved — no more made-up default. */
    codigoDepartamento: string | null;
    /** Same as `codigoDepartamento` above, just `undefined` instead of `null` when unresolved. */
    codigoDepartamentoReal: string | undefined;
}

/**
 * Ids of the flujos the user's department can create. Only decides which creation actions the
 * sidebar shows: no backend validates who creates an operation. Fails closed when the department
 * is unknown, for both `buildTime` and `runtime` lists.
 */
export function resolveCreatableFlujoIds({
    codigoDepartamento,
    codigoDepartamentoReal,
}: CreatableFlujosParams): string[] {
    return FLUJOS.filter(flujo => {
        if (!flujo.creation) return false;

        const { allowedDepartamentos } = flujo.creation;
        const codigo = allowedDepartamentos.source === 'buildTime' ? codigoDepartamento : codigoDepartamentoReal;

        return !!codigo && resolveAllowedDepartamentos(allowedDepartamentos).includes(codigo.trim());
    }).map(flujo => flujo.id);
}

/**
 * Ids of the flujos whose operations the user's department can exclude (force-finish). Only
 * decides whether "Excluir Operação" shows: since no backend validates who calls
 * `/seguimientos/{operacion}/finish`. Fails closed when the department is unknown.
 */
export function resolveExcluibleFlujoIds(codigoDepartamentoReal: string | undefined): string[] {
    return resolveFlujosForDepartamento(codigoDepartamentoReal, flujo => flujo.exclusionDepartamentos).map(
        flujo => flujo.id
    );
}

/**
 * Ids of the flujos that restrict comment deletion (`comentarioExclusionDepartamentos`) and list
 * the user's department. Only decides whether "Excluir comentário" shows: the backend only checks
 * that the comment is the caller's own. Fails closed when the department is unknown.
 */
export function resolveComentarioExcluibleFlujoIds(codigoDepartamentoReal: string | undefined): string[] {
    return resolveFlujosForDepartamento(codigoDepartamentoReal, flujo => flujo.comentarioExclusionDepartamentos).map(
        flujo => flujo.id
    );
}

/**
 * Product codes of the flujos whose operations the user's department sees in full in "Filtros"
 * and the "Nº Operação" search (`viewAllDepartamentos`). Fails closed when the department is
 * unknown.
 */
export function resolveViewAllProductos(codigoDepartamentoReal: string | undefined): number[] {
    return resolveFlujosForDepartamento(codigoDepartamentoReal, flujo => flujo.viewAllDepartamentos).flatMap(
        flujo => flujo.productos
    );
}

function resolveFlujosForDepartamento(
    codigoDepartamentoReal: string | undefined,
    getDepartamentos: (flujo: FlujoDefinition) => DepartamentosSource | undefined
): FlujoDefinition[] {
    if (!codigoDepartamentoReal) return [];

    const codigo = codigoDepartamentoReal.trim();

    return FLUJOS.filter(flujo => {
        const departamentos = getDepartamentos(flujo);
        return !!departamentos && resolveAllowedDepartamentos(departamentos).includes(codigo);
    });
}
