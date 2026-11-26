import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error';
import { getSeguimientosApiClient } from '@/lib/seguimientos-api-client';
import { getSeguimientosApiConfig } from '@/config/seguimientos-api.config';
import { getJbpmAccessToken } from '@/utils/get-jbpm-access-token';
import { getDecodeToken } from '@/utils/get-decode-token';
import {
    DatosDepartamento,
    resolverCodigoDepartamentoReal,
    resolverDatosDepartamentoReal,
} from '@/lib/departamento-codigo.config';
import { resolveViewAllProductos } from '@/lib/flujos-creation.config';
import { isAdminUser } from '@/lib/admin-role';
import { normalizarString } from '@/utils/normalizar-string';
import { IPagedResult } from '@/interfaces/pagination/pagination.interface';
import {
    ISeguimientoItemApi,
    TIPOS_BUSQUEDA_SEGUIMIENTO,
} from '@/modules/bandeja/operaciones/interfaces/seguimiento.interface';
import { getAssignedDepartmentCodes } from '@/modules/bandeja/operaciones/adapters/seguimiento.adapter';
import { CODIGOS_ESTADOS_CABECERA } from '@/modules/bandeja/operaciones/constants/seguimientos';
import { canSeeExcludedAuditOperations, isHiddenExcludedAuditOperation } from '@/lib/seguimientos-visibility.config';
import { APONTAMENTO_PROCESO } from '@/products/auditoria/apontamentos/apontamentos-auditoria.config';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const params: Record<string, string | number | boolean | undefined> = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });

        const { defaultPageSize, usePagination: defaultUsePagination } = getSeguimientosApiConfig();

        const tipoBusquedaNum =
            params.tipoBusqueda !== undefined ? Number(params.tipoBusqueda) : TIPOS_BUSQUEDA_SEGUIMIENTO.MI_BANDEJA;
        const esMiBandeja = tipoBusquedaNum === TIPOS_BUSQUEDA_SEGUIMIENTO.MI_BANDEJA;

        const isAdvancedFilter = tipoBusquedaNum === TIPOS_BUSQUEDA_SEGUIMIENTO.FILTRO;
        /* NOTE: the "Nº Operação" search (tipoBusqueda=HISTORICO) gets the same department scoping
           as the advanced filter. `detailRefresh=true` is the detail-panel refresh after an action
           (`refershSelectedSeguimiento`): it re-reads an operation the user already had open, which
           may have just moved to another department, so it is left unscoped. */
        const isOperationSearch =
            tipoBusquedaNum === TIPOS_BUSQUEDA_SEGUIMIENTO.HISTORICO && params.detailRefresh !== 'true';
        const scopeByDepartment = isAdvancedFilter || isOperationSearch;

        const jbpmToken = await getJbpmAccessToken();
        const tokenUsername = jbpmToken ? getDecodeToken(jbpmToken)?.preferred_username : undefined;
        const usuarioDominio = esMiBandeja ? tokenUsername : undefined;
        const departamento =
            esMiBandeja && usuarioDominio
                ? await resolverCodigoDepartamentoReal(usuarioDominio, { skipCache: true })
                : undefined;

        /* NOTE: the advanced filter and the operation search must not send the logged-in user's own
           `domainUser`/`department` (from the token) to the backend: that adds the active-task `EXISTS`
           clause in `OracleTrackingRepository` and would hide finished operations (see commit a4d61ad).
           Without them the backend returns operations from every department, so results are scoped here,
           server-side, by matching the user's real department code against every assigned department code
           (task 2 can have several departments). If the department cannot be
           resolved, nothing is returned (fail closed). On top of that, each flujo's
           `viewAllDepartamentos` (flujos registry) see every operation of that flujo.
           Exception: filters explicitly chosen by the user (Reportes "Área responsável" /
           "Responsável da área") are forwarded as-is in `apiParams`. */
        // NOTE: admins (see `lib/admin-role.ts`) skip the department scoping.
        const esAdmin = await isAdminUser(tokenUsername);
        const applyDepartmentScope = scopeByDepartment && !esAdmin;
        const filterDepartment = applyDepartmentScope
            ? await resolverDatosDepartamentoReal(tokenUsername, { skipCache: true })
            : null;
        if (applyDepartmentScope && !filterDepartment?.codigo) {
            console.warn(`[seguimientos] Departamento não resolvido para "${tokenUsername}" — filtro sem resultados.`);
            return NextResponse.json(emptyPage(defaultPageSize));
        }
        const scopeDepartment = applyDepartmentScope ? filterDepartment : null;

        /* NOTE: EXCLUIDO Auditoria operations are a temporary front-only visibility restriction
           (see `seguimientos-visibility.config.ts`), only relevant for the two entry points scoped
           above: the advanced filter and the "Nº Operação" search (scopeByDepartment). */
        const canSeeExcludedAudit = canSeeExcludedAuditOperations(scopeDepartment?.codigo ?? null, esAdmin);

        /* NOTE: when the advanced filter targets only the Auditoria product and the user cannot
           see EXCLUIDO Auditoria operations, drop that status code from the request instead of
           asking the backend for operations we would hide anyway — keeps totals/pagination
           correct. If EXCLUIDO was the only status requested, there is nothing left to show. */
        let statusCodesParaBackend = params.estados;
        if (isAdvancedFilter && !canSeeExcludedAudit && params.estados && esSoloProductoAuditoria(params.productos)) {
            const codigosSolicitados = String(params.estados)
                .split(',')
                .map(codigo => codigo.trim())
                .filter(Boolean);
            const codigosVisibles = codigosSolicitados.filter(
                codigo => Number(codigo) !== CODIGOS_ESTADOS_CABECERA.BAJA
            );
            if (codigosSolicitados.length > 0 && codigosVisibles.length === 0) {
                return NextResponse.json(emptyPage(defaultPageSize));
            }
            statusCodesParaBackend = codigosVisibles.join(',');
        }

        // NOTE: the new API paginates from zero (see MIGRACION_INSTRUCCIONES.md example request).
        // NOTE: any UI that displays 1-based page numbers must convert only at the view layer.
        const apiParams = {
            pageNumber: params.pageNumber !== undefined ? Number(params.pageNumber) : 0,
            pageSize: params.pageSize !== undefined ? Number(params.pageSize) : defaultPageSize,
            usePagination:
                params.usePagination !== undefined
                    ? params.usePagination === 'true' || params.usePagination === true
                    : defaultUsePagination,
            searchType: params.tipoBusqueda,
            operation: params.operacion || params.numeroOperacion,
            clientCode: params.codigoCliente,
            // NOTE: MI_BANDEJA always uses the token identity and ignores client params; other search types
            // only forward filters explicitly chosen by the user (Reportes área/responsável).
            domainUser: esMiBandeja ? usuarioDominio : params.usuarioDominio,
            department: esMiBandeja ? departamento : params.departamento,
            productCodes: params.productos,
            subProductCodes: params.subProductos,
            branches: params.sucursales,
            statusCodes: statusCodesParaBackend,
            startDateFrom: params.fechaDesde,
            startDateTo: params.fechaHasta,
            banca: params.banca ? Number(params.banca) : undefined,
        };

        Object.keys(apiParams).forEach(key => {
            if (apiParams[key as keyof typeof apiParams] === undefined) {
                delete apiParams[key as keyof typeof apiParams];
            }
        });

        const seguimientosApi = getSeguimientosApiClient();
        /* NOTE: '' y no '/' — Spring Boot 3 no trata `/seguimientos/` como equivalente a `/seguimientos`;
           con url:'/' axios agrega esa barra final y el backend responde 500 "No static resource ...". */
        const response = await seguimientosApi.get<IPagedResult<ISeguimientoItemApi>>('', { params: apiParams });

        if (scopeDepartment) {
            const viewAllProductos = resolveViewAllProductos(scopeDepartment.codigo);
            return NextResponse.json(
                filterByDepartment(response.data, scopeDepartment, viewAllProductos, canSeeExcludedAudit)
            );
        }

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error in GET /api/seguimientos', error);
        const { status, body } = handleApiError(error);
        return NextResponse.json({ error: body }, { status });
    }
}

/* NOTE: totals are recomputed over the filtered items. They are exact with usePagination=false
   (what the inbox sends, see use-seguimientos.ts); with backend pagination they only reflect
   the current page. */
function filterByDepartment(
    data: IPagedResult<ISeguimientoItemApi>,
    department: DatosDepartamento,
    viewAllProductos: number[],
    canSeeExcludedAudit: boolean
): IPagedResult<ISeguimientoItemApi> {
    const userDepartmentName = department.nombre ? normalizarString(department.nombre) : null;
    const items = (data.items ?? []).filter(item => {
        if (isHiddenExcludedAuditOperation(item, canSeeExcludedAudit)) return false;
        if (viewAllProductos.includes(item.productCode)) return true;

        const codes = getAssignedDepartmentCodes(item);
        if (codes.length > 0) return codes.includes(department.codigo);
        return (
            !!userDepartmentName &&
            !!item.assignedDepartment &&
            normalizarString(item.assignedDepartment) === userDepartmentName
        );
    });
    const pageSize = data.pageSize || items.length;

    return {
        ...data,
        items,
        totalCount: items.length,
        totalPages: pageSize > 0 ? Math.ceil(items.length / pageSize) : 0,
        hasNextPage: false,
    };
}

/** Whether the comma-separated `productos` param selects only the Auditoria product. */
function esSoloProductoAuditoria(productos: string | number | boolean | undefined): boolean {
    if (!productos) return false;
    const codigos = String(productos)
        .split(',')
        .map(codigo => codigo.trim())
        .filter(Boolean);
    return codigos.length > 0 && codigos.every(codigo => Number(codigo) === APONTAMENTO_PROCESO.producto);
}

function emptyPage(pageSize: number): IPagedResult<ISeguimientoItemApi> {
    return {
        items: [],
        totalCount: 0,
        pageNumber: 0,
        pageSize,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
    };
}
