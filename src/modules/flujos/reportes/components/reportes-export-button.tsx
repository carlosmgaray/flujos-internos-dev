'use client';

import { useState } from 'react';
import { MdFileDownload } from 'react-icons/md';
import * as XLSX from 'xlsx';

import { getSeguimientos } from '@/modules/bandeja/operaciones/services';
import { TIPOS_BUSQUEDA_SEGUIMIENTO } from '@/modules/bandeja/operaciones/interfaces';
import { IDetalleSeguimiento } from '@/modules/bandeja/detalle-operaciones/interfaces';
import { getDatosOperacion } from '@/modules/bandeja/detalle-operaciones/services/detalle.service';
import { DATE_FORMAT, formatDate } from '@/lib/date';
import { buildExcelSheets } from '@/modules/flujos/reportes/utils/excel-export';
import { IReporteFiltros } from '@/modules/flujos/reportes/interfaces/reporte-filtros.interface';

interface ReportesExportButtonProps {
    filtros: IReporteFiltros;
    disabled?: boolean;
}

export function ReportesExportButton({ filtros, disabled }: ReportesExportButtonProps) {
    const [loading, setLoading] = useState(false);

    const onExport = async () => {
        setLoading(true);

        try {
            const { items: seguimientos } = await getSeguimientos({
                ...filtros,
                tipoBusqueda: TIPOS_BUSQUEDA_SEGUIMIENTO.FILTRO,
                usePagination: false,
            });

            const detalles = new Map<string, IDetalleSeguimiento[]>();

            await Promise.all(
                seguimientos.map(async seguimiento => {
                    const items = await getDatosOperacion({
                        operacion: seguimiento.operacion,
                        codigoProducto: seguimiento.producto,
                        codigoSubProducto: seguimiento.subProducto,
                    }).catch(() => [] as IDetalleSeguimiento[]);

                    detalles.set(seguimiento.operacion, items);
                })
            );

            const sheets = buildExcelSheets(seguimientos, detalles);

            const workbook = XLSX.utils.book_new();
            sheets.forEach(({ sheetName, rows }) => {
                const worksheet = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            });

            XLSX.writeFile(workbook, `relatorio-${formatDate(new Date(), DATE_FORMAT.YYYY_MM_DD)}.xlsx`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={onExport}
            disabled={loading || disabled}
            className="
                inline-flex items-center overflow-hidden rounded-md
                bg-green-600 text-white shadow-sm
                hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
        >
            <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium">
                {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                    <MdFileDownload className="h-5 w-5" />
                )}
                Exportar a Excel
            </span>
        </button>
    );
}
