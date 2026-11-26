import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getProductCatalog, getTrackingStatuses } from '@/modules/bandeja/operaciones/services';
import { ISubProductoCatalogo } from '@/modules/bandeja/operaciones/interfaces';
import { keysQuery } from '@/constants/keys.query';

interface UseAdvancedFilterProps {
    productosSeleccionados?: string[];
    includeTodos?: boolean;
    enabled?: boolean;
}

const STALE_TIME_MS = 60 * 60 * 1000;

export const useAdvancedFilter = ({
    productosSeleccionados = [],
    includeTodos = true,
    enabled = true,
}: UseAdvancedFilterProps = {}) => {
    const queryClient = useQueryClient();

    const productCatalogQuery = useQuery({
        queryKey: keysQuery.productCatalog(),
        queryFn: () => getProductCatalog(),
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        enabled,
    });

    const trackingStatusesQuery = useQuery({
        queryKey: keysQuery.trackingStatuses(),
        queryFn: () => getTrackingStatuses(),
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        enabled,
    });

    const prefetchAdvancedFilter = useCallback(() => {
        queryClient.prefetchQuery({
            queryKey: keysQuery.productCatalog(),
            queryFn: () => getProductCatalog(),
            staleTime: STALE_TIME_MS,
        });
        queryClient.prefetchQuery({
            queryKey: keysQuery.trackingStatuses(),
            queryFn: () => getTrackingStatuses(),
            staleTime: STALE_TIME_MS,
        });
    }, [queryClient]);

    /**
     * `subProductos` viene anidado dentro de cada producto (`ProductoResponseDTO.subProductos`,
     * ver `filtros.interface.ts`), no como lista plana con `codigoProducto` — se aplana acá
     * mismo, solo para los productos actualmente seleccionados.
     */
    const subProductosFiltrados = useMemo((): (ISubProductoCatalogo & { codigoProducto: number })[] => {
        const productos = productCatalogQuery.data;
        if (!productos || productosSeleccionados.length === 0) return [];

        const productosSeleccionadosTodos = productosSeleccionados.includes('1000')
            ? productos
            : productos.filter(producto => productosSeleccionados.includes(producto.code.toString()));

        return productosSeleccionadosTodos.flatMap(producto =>
            producto.subProducts.map(subProducto => ({ ...subProducto, codigoProducto: producto.code }))
        );
    }, [productCatalogQuery.data, productosSeleccionados]);

    const subProductosOptions = useMemo(
        () => convertSubProductosToOptions(subProductosFiltrados, includeTodos),
        [subProductosFiltrados, includeTodos]
    );

    return {
        productCatalogQuery,
        trackingStatusesQuery,
        prefetchAdvancedFilter,
        productos: productCatalogQuery.data,
        estados: trackingStatusesQuery.data,
        isError: productCatalogQuery.isError || trackingStatusesQuery.isError,
        subProductosFiltrados,
        subProductosOptions,
    };
};

const convertSubProductosToOptions = (
    subProductos: (ISubProductoCatalogo & { codigoProducto: number })[],
    includeTodos = true
) => {
    if (subProductos.length === 0) return [];

    const options = subProductos.map(subProducto => ({
        value: subProducto.code.toString(),
        label: subProducto.name.toUpperCase(),
    }));

    return includeTodos ? [{ value: '1000', label: 'TODOS' }, ...options] : options;
};
