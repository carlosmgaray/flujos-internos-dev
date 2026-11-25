'use client';

import { useMemo, useState } from 'react';
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableSortLabel,
    TableContainer,
    Paper,
    IconButton,
    Tooltip,
    Typography,
    Box,
    CircularProgress,
    Pagination,
    Button,
} from '@mui/material';
import { MdVisibility } from 'react-icons/md';

import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import { DATE_FORMAT, formatDate } from '@/lib/date';
import { DetalheOperacaoDialog } from '@/modules/flujos/reportes/components/detalhe-operacao-dialog';

interface ReportesTableProps {
    seguimientos: ISeguimientoItem[];
    isLoading: boolean;
    isError: boolean;
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    goToPage: (page: number) => void;
    setPageSize: (size: number) => void;
}

const VALOR_VAZIO = '-';

// NOTE: Paleta del diseño
const COLOR_HEADER_BG = '#1e4491';
const COLOR_HEADER_TEXT = '#ffffff';
const COLOR_ROW_ALT = '#eef4fd';
const COLOR_ROW_HOVER = '#dde8f9';
const COLOR_FIRST_COL = '#1e4491';
const COLOR_TEXT = '#1f2a44';

interface Column {
    key: SortKey;
    label: string;
    width: string;
}

type SortKey =
    | 'operacion'
    | 'produto'
    | 'solicitante'
    | 'areaResponsavel'
    | 'estado'
    | 'fechaInicio'
    | 'prazo'
    | 'titulo'
    | 'responsable';

interface Fila {
    seguimiento: ISeguimientoItem;
    sortValues: Record<SortKey, string | number>;
}

/** Normaliza listas: acepta array o string, separa por el patrón indicado,
 *  quita vacíos y duplicados y une con ", ". */
function formatList(value?: string[] | string | null, separator: RegExp = /[|;]/): string {
    if (!value) return VALOR_VAZIO;

    const lista = Array.isArray(value) ? value : [value];
    const items = lista
        .flatMap(item => String(item ?? '').split(separator))
        .map(item => item.trim())
        .filter(Boolean);

    const unicos = Array.from(new Set(items));
    return unicos.length > 0 ? unicos.join(', ') : VALOR_VAZIO;
}

const formatAreas = (value?: string[] | string | null) => formatList(value, /[|,;]/);
const formatResponsables = (value?: string[] | string | null) => formatList(value, /[|;]/);

function buildFila(seguimiento: ISeguimientoItem): Fila {
    return {
        seguimiento,
        sortValues: {
            operacion: seguimiento.operacion ?? '',
            produto: `${seguimiento.nombreProducto} / ${seguimiento.nombreSubProducto}`,
            solicitante: seguimiento.requestedBy ?? seguimiento.propietario ?? '',
            areaResponsavel: formatAreas(seguimiento.assignedDepartmentNames),
            estado: seguimiento.estado ?? '',
            fechaInicio: seguimiento.fechaInicio ?? '',
            prazo: seguimiento.plazo ?? '',
            titulo: seguimiento.titulo ?? '',
            responsable: formatResponsables(seguimiento.responsibleName),
        },
    };
}

function compararFilas(a: Fila, b: Fila, sortKey: SortKey, direction: 'asc' | 'desc'): number {
    const valorA = a.sortValues[sortKey];
    const valorB = b.sortValues[sortKey];

    let resultado: number;
    if (typeof valorA === 'number' && typeof valorB === 'number') {
        resultado = valorA - valorB;
    } else {
        resultado = String(valorA).localeCompare(String(valorB), 'pt-BR');
    }

    return direction === 'asc' ? resultado : -resultado;
}

export function ReportesTable({
    seguimientos,
    isLoading,
    isError,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    goToPage,
    setPageSize,
}: ReportesTableProps) {
    const [detalheDe, setDetalheDe] = useState<ISeguimientoItem | null>(null);
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const showResponsible = useMemo(
        () => seguimientos.some(item => item.responsibleName && item.responsibleName.trim() !== ''),
        [seguimientos]
    );

    const columns = useMemo<Column[]>(
        () => [
            { key: 'operacion', label: 'Nº Processo', width: '8%' },
            { key: 'produto', label: 'Produto / Subproduto', width: '12%' },
            { key: 'titulo', label: 'Título', width: showResponsible ? '20%' : '32%' },
            ...(showResponsible ? [{ key: 'responsable' as SortKey, label: 'Responsável', width: '12%' }] : []),
            { key: 'areaResponsavel', label: 'Área Responsável', width: '12%' },
            { key: 'estado', label: 'Estado', width: '8%' },
            { key: 'fechaInicio', label: 'Data de criação', width: '10%' },
            { key: 'prazo', label: 'Prazo', width: '8%' },
        ],
        [showResponsible]
    );

    const filas = useMemo(() => {
        const construidas = seguimientos.map(buildFila);
        if (!sortKey) return construidas;

        return [...construidas].sort((a, b) => compararFilas(a, b, sortKey, sortDirection));
    }, [seguimientos, sortKey, sortDirection]);

    const onSort = (key: SortKey) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDirection('asc');
            return;
        }
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    };

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center py-10">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Typography color="error" className="text-center py-10">
                Erro ao carregar os relatórios. Tente novamente.
            </Typography>
        );
    }

    if (seguimientos.length === 0) {
        return (
            <Typography color="textSecondary" className="text-center py-10">
                Nenhum registro encontrado para os filtros selecionados.
            </Typography>
        );
    }

    const headerCellSx = {
        backgroundColor: COLOR_HEADER_BG,
        color: COLOR_HEADER_TEXT,
        fontWeight: 500,
        borderBottom: 'none',
        py: 1.5,
    };

    const bodyCellSx = {
        color: COLOR_TEXT,
        borderBottom: 'none',
        py: 1.5,
        verticalAlign: 'middle',
    };

    return (
        <Box>
            <Typography variant="caption" color="textSecondary" className="mb-2 block">
                Mostrando {seguimientos.length} de {totalCount} registros
            </Typography>

            <TableContainer
                component={Paper}
                elevation={0}
                className="border border-gray-300"
                sx={{ borderRadius: '8px', overflow: 'hidden' }}
            >
                <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(coluna => (
                                <TableCell
                                    key={coluna.key}
                                    sx={{ ...headerCellSx, width: coluna.width, minWidth: coluna.width }}
                                >
                                    <TableSortLabel
                                        active={sortKey === coluna.key}
                                        direction={sortKey === coluna.key ? sortDirection : 'asc'}
                                        onClick={() => onSort(coluna.key)}
                                        sx={{
                                            color: `${COLOR_HEADER_TEXT} !important`,
                                            '&:hover': { color: `${COLOR_HEADER_TEXT} !important` },
                                            '& .MuiTableSortLabel-icon': {
                                                color: `${COLOR_HEADER_TEXT} !important`,
                                            },
                                        }}
                                    >
                                        {coluna.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}

                            <TableCell align="center" sx={{ ...headerCellSx, width: '5%', minWidth: '0px' }}>
                                Ações
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filas.map(({ seguimiento }, index) => (
                            <TableRow
                                key={`${seguimiento.codigoSeguimiento}-${index}`}
                                hover
                                sx={{
                                    backgroundColor: index % 2 === 0 ? '#ffffff' : COLOR_ROW_ALT,
                                    '&.MuiTableRow-hover:hover': { backgroundColor: COLOR_ROW_HOVER },
                                }}
                            >
                                {/* Primera columna: azul y en negrita, como en el diseño */}
                                <TableCell
                                    sx={{
                                        ...bodyCellSx,
                                        color: COLOR_FIRST_COL,
                                        fontWeight: 700,
                                    }}
                                >
                                    {seguimiento.operacion || VALOR_VAZIO}
                                </TableCell>

                                <TableCell sx={bodyCellSx}>
                                    {seguimiento.nombreProducto} / {seguimiento.nombreSubProducto}
                                </TableCell>

                                <TableCell sx={bodyCellSx}>{seguimiento.titulo || VALOR_VAZIO}</TableCell>

                                {showResponsible && (
                                    <TableCell sx={bodyCellSx}>
                                        {formatResponsables(seguimiento.responsibleName)}
                                    </TableCell>
                                )}

                                <TableCell sx={bodyCellSx}>
                                    {formatAreas(seguimiento.assignedDepartmentNames)}
                                </TableCell>

                                <TableCell sx={bodyCellSx}>{seguimiento.estado || VALOR_VAZIO}</TableCell>

                                <TableCell sx={bodyCellSx}>
                                    {formatDate(seguimiento.fechaInicio, DATE_FORMAT.DD_MM_YYYY)}
                                </TableCell>

                                <TableCell sx={bodyCellSx}>{seguimiento.plazo || VALOR_VAZIO}</TableCell>

                                <TableCell align="center" sx={bodyCellSx}>
                                    <Tooltip title="Ver detalhe">
                                        <IconButton
                                            size="small"
                                            onClick={() => setDetalheDe(seguimiento)}
                                            sx={{ color: COLOR_FIRST_COL }}
                                        >
                                            <MdVisibility />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box className="mt-4 flex flex-col items-center gap-2">
                    <Pagination
                        count={totalPages}
                        page={pageNumber}
                        onChange={(_, page) => goToPage(page)}
                        color="primary"
                        size="small"
                    />
                    <Box className="flex gap-1">
                        {[10, 20, 50].map(size => (
                            <Button
                                key={size}
                                variant={pageSize === size ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => setPageSize(size)}
                                className="min-w-0 px-2"
                            >
                                {size}
                            </Button>
                        ))}
                    </Box>
                </Box>
            )}

            {detalheDe && (
                <DetalheOperacaoDialog open={!!detalheDe} onClose={() => setDetalheDe(null)} seguimiento={detalheDe} />
            )}
        </Box>
    );
}
