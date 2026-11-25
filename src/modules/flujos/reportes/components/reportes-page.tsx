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
        isLoading,
        isError,
        pageNumber,
        pageSize,
        totalCount,
        totalPages,
        goToPage,
        setPageSize,
        resetPage,
    } = useReportes(filtros);

    const onApplyFiltros = (novosFiltros: IReporteFiltros) => {
        setFiltros(novosFiltros);
        resetPage();
    };

    return (
        <Box className="p-4">
            <Box className="flex justify-between items-center mb-3">
                <Typography variant="h5" className="font-bold">
                    Centralizador de Relatórios
                </Typography>
                <ReportesExportButton filtros={filtros} disabled={isLoading} />
            </Box>

            <ReporteFiltrosForm
                open={filtrosOpen}
                onToggle={() => setFiltrosOpen(prev => !prev)}
                onApply={onApplyFiltros}
            />

            <ReportesTable
                seguimientos={seguimientos}
                isLoading={isLoading}
                isError={isError}
                pageNumber={pageNumber}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                goToPage={goToPage}
                setPageSize={setPageSize}
            />
        </Box>
    );
}
