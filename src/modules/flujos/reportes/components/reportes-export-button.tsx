'use client';

import { useState } from 'react';
import { MdFileDownload } from 'react-icons/md';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

import { getSeguimientos } from '@/modules/bandeja/operaciones/services';
import { ISeguimientoItem, TIPOS_BUSQUEDA_SEGUIMIENTO } from '@/modules/bandeja/operaciones/interfaces';
import { IDetalleSeguimiento } from '@/modules/bandeja/detalle-operaciones/interfaces';
import { getDatosOperacion } from '@/modules/bandeja/detalle-operaciones/services/detalle.service';
import { DATE_FORMAT, formatDate } from '@/lib/date';
import { buildExcelSheets } from '@/modules/flujos/reportes/utils/excel-export';
import { IReporteFiltros } from '@/modules/flujos/reportes/interfaces/reporte-filtros.interface';
import { runWithConcurrency } from '@/modules/flujos/reportes/utils/run-with-concurrency';

const DETAIL_CONCURRENCY = 5;
const DETAIL_MAX_RETRIES = 1;
const MAX_FAILED_LISTED = 5;

type ExportPhase = 'idle' | 'list' | 'details' | 'file';

interface ExportProgress {
    done: number;
    total: number;
}

interface DetalleResult {
    operacion: string;
    items: IDetalleSeguimiento[];
    failed: boolean;
}

interface ReportesExportButtonProps {
    filtros: IReporteFiltros;
    disabled?: boolean;
}

function buildFailedWarning(operacoes: string[]): string {
    const n = operacoes.length;
    const visiveis = operacoes.slice(0, MAX_FAILED_LISTED).join(', ');
    const restantes = n - MAX_FAILED_LISTED;
    const lista = restantes > 0 ? `${visiveis} e mais ${restantes}` : visiveis;

    return `Relatório gerado, mas não foi possível carregar os detalhes de ${n} ${n === 1 ? 'operação' : 'operações'}: ${lista}. As colunas extras ficaram vazias.`;
}

export function ReportesExportButton({ filtros, disabled }: ReportesExportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState<ExportPhase>('idle');
    const [progress, setProgress] = useState<ExportProgress | null>(null);

    /** Never rejects: retries up to DETAIL_MAX_RETRIES times, then returns an empty, failed result. */
    const fetchDetalle = async (seguimiento: ISeguimientoItem): Promise<DetalleResult> => {
        let lastError: unknown;

        for (let attempt = 0; attempt <= DETAIL_MAX_RETRIES; attempt++) {
            try {
                const items = await getDatosOperacion({
                    operacion: seguimiento.operacion,
                    codigoProducto: seguimiento.producto,
                    codigoSubProducto: seguimiento.subProducto,
                });
                return { operacion: seguimiento.operacion, items, failed: false };
            } catch (error) {
                lastError = error;
            }
        }

        console.error('Falha ao carregar os detalhes da operação', seguimiento.operacion, lastError);
        return { operacion: seguimiento.operacion, items: [], failed: true };
    };

    const onExport = async () => {
        setLoading(true);
        setPhase('list');

        try {
            const { items: seguimientos } = await getSeguimientos({
                ...filtros,
                tipoBusqueda: TIPOS_BUSQUEDA_SEGUIMIENTO.FILTRO,
                usePagination: false,
            });

            if (seguimientos.length === 0) {
                toast.warning('Nenhum registro encontrado para exportar.');
                return;
            }

            setPhase('details');
            setProgress({ done: 0, total: seguimientos.length });

            const resultados = await runWithConcurrency(seguimientos, DETAIL_CONCURRENCY, async seguimiento => {
                const resultado = await fetchDetalle(seguimiento);
                setProgress(prev => (prev ? { ...prev, done: prev.done + 1 } : prev));
                return resultado;
            });

            const detalles = new Map<string, IDetalleSeguimiento[]>();
            resultados.forEach(({ operacion, items }) => detalles.set(operacion, items));
            const operacoesComFalha = resultados.filter(r => r.failed).map(r => r.operacion);

            setPhase('file');
            // Yield so "Gerando arquivo..." paints before the synchronous workbook build blocks the thread.
            await new Promise(resolve => setTimeout(resolve, 0));

            const sheets = buildExcelSheets(seguimientos, detalles);

            const workbook = XLSX.utils.book_new();
            sheets.forEach(({ sheetName, rows }) => {
                const worksheet = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            });

            XLSX.writeFile(workbook, `relatorio-${formatDate(new Date(), DATE_FORMAT.YYYY_MM_DD)}.xlsx`);

            if (operacoesComFalha.length > 0) {
                toast.warning(buildFailedWarning(operacoesComFalha), { duration: 10000 });
            }
        } catch (error) {
            console.error('Erro ao exportar o relatório', error);
            toast.error('Erro ao exportar o relatório. Tente novamente.');
        } finally {
            setLoading(false);
            setPhase('idle');
            setProgress(null);
        }
    };

    const getLabel = (): string => {
        if (phase === 'file') return 'Gerando arquivo...';
        if (phase === 'details' && progress) return `Exportando ${progress.done}/${progress.total}`;
        if (phase === 'list' || phase === 'details') return 'Exportando...';
        return 'Exportar para Excel';
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
                {getLabel()}
            </span>
        </button>
    );
}
