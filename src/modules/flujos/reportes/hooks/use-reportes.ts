'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSeguimientos } from '@/modules/bandeja/operaciones/services';
import { TIPOS_BUSQUEDA_SEGUIMIENTO } from '@/modules/bandeja/operaciones/interfaces';
import { IReporteFiltros } from '@/modules/flujos/reportes/interfaces/reporte-filtros.interface';
import { SortDirection, SortKey, sortSeguimientos } from '@/modules/flujos/reportes/utils/reportes-sort';

export const keysQueryReportes = {
    list: (filtros: IReporteFiltros) => ['reportes', filtros],
};

export const useReportes = (filtros: IReporteFiltros) => {
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const hasFilters = !!filtros.productos && !!filtros.subProductos;

    const query = useQuery({
        queryKey: keysQueryReportes.list(filtros),
        enabled: hasFilters,
        queryFn: () =>
            /* NOTE: `usePagination: false` — igual que hace Bandeja (`fetchSeguimentosCompletos'
             * en `use-seguimientos.ts`). Con `tipoBusqueda: FILTRO`, el route (`filterByDepartment`
             * en `src/app/api/seguimientos/route.ts`) filtra post-paginación y recalcula
             * `totalCount`/`totalPages` sobre los ítems ya filtrados — si se pagina en el backend,
             * esos totales terminan reflejando solo la página actual (casi siempre 0 o 1 pagina),
             * y el control de paginación nunca aparece. Trayendo todo de una vez, el conteo es
             * exacto y paginamos del lado del cliente abajo. */
            getSeguimientos({
                ...filtros,
                tipoBusqueda: TIPOS_BUSQUEDA_SEGUIMIENTO.FILTRO,
                usePagination: false,
            }),
        refetchOnWindowFocus: false,
    });

    const items = query.data?.items;
    const todosSeguimientos = useMemo(() => items ?? [], [items]);
    const totalCount = todosSeguimientos.length;
    const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

    // Sort the whole result set first, then cut the current page.
    const seguimientosOrdenados = useMemo(
        () => sortSeguimientos(todosSeguimientos, sortKey, sortDirection),
        [todosSeguimientos, sortKey, sortDirection]
    );

    const seguimientos = useMemo(() => {
        const inicio = (pageNumber - 1) * pageSize;
        return seguimientosOrdenados.slice(inicio, inicio + pageSize);
    }, [seguimientosOrdenados, pageNumber, pageSize]);

    const onSort = (key: SortKey) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDirection('asc');
        } else {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        }
        setPageNumber(1);
    };

    return {
        seguimientos,
        sortKey,
        sortDirection,
        onSort,
        hasFilters,
        isLoading: query.isLoading,
        isError: query.isError,
        isFetching: query.isFetching,
        totalCount,
        totalPages,
        pageNumber,
        pageSize,
        goToPage: (page: number) => setPageNumber(page),
        setPageSize: (size: number) => {
            setPageSize(size);
            setPageNumber(1);
        },
        resetPage: () => setPageNumber(1),
        refetch: () => query.refetch(),
    };
};

export type UseReportesReturn = ReturnType<typeof useReportes>;
