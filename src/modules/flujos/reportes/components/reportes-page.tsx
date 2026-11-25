'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';

import { ReporteFiltrosForm } from '@/modules/flujos/reportes/components/reporte-filtros-form';
import { ReportesTable } from '@/modules/flujos/reportes/components/reportes-table';
import { ReportesExportButton } from '@/modules/flujos/reportes/components/reportes-export-button';
import { useReportes } from '@/modules/flujos/reportes/hooks/use-reportes';
import { IReporteFiltros } from '@/modules/flujos/reportes/interfaces/reporte-filtros.interface';

export function ReportesPage() {
    const [filtrosOpen, setFiltrosOpen] = useState(true);
    const [filtros, setFiltros] = useState<IReporteFiltros>({});

    const {
        seguimientos,
        sortKey,
        sortDirection,
        onSort,
        hasFilters,
        isLoading,
        isFetching,
        isError,
        pageNumber,
        pageSize,
        totalCount,
        totalPages,
        goToPage,
        setPageSize,
        resetPage,
        refetch,
    } = useReportes(filtros);

    const onApplyFiltros = (novosFiltros: IReporteFiltros) => {
        if (JSON.stringify(novosFiltros) === JSON.stringify(filtros)) {
            refetch();
        } else {
            setFiltros(novosFiltros);
        }
        resetPage();
    };

    return (
        <Box className="p-4">
            <Box className="flex justify-between items-center mb-3">
                <Typography variant="h5" className="font-bold">
                    Centralizador de Relatórios
                </Typography>
                <ReportesExportButton filtros={filtros} disabled={!hasFilters || isLoading} />
            </Box>

            <ReporteFiltrosForm
                open={filtrosOpen}
                onToggle={() => setFiltrosOpen(prev => !prev)}
                onApply={onApplyFiltros}
            />

            {hasFilters ? (
                <ReportesTable
                    seguimientos={seguimientos}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    isLoading={isLoading || isFetching}
                    isError={isError}
                    pageNumber={pageNumber}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    goToPage={goToPage}
                    setPageSize={setPageSize}
                />
            ) : (
                <Typography color="textSecondary" className="text-center py-10">
                    Selecione os filtros e clique em Pesquisar para ver os relatórios.
                </Typography>
            )}
        </Box>
    );
}
