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
import { formatAreas, formatResponsables, VALOR_VAZIO } from '@/modules/flujos/reportes/utils/reportes-format';
import { SortDirection, SortKey } from '@/modules/flujos/reportes/utils/reportes-sort';

interface ReportesTableProps {
    seguimientos: ISeguimientoItem[];
    sortKey: SortKey | null;
    sortDirection: SortDirection;
    onSort: (key: SortKey) => void;
    isLoading: boolean;
    isError: boolean;
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    goToPage: (page: number) => void;
    setPageSize: (size: number) => void;
}

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

export function ReportesTable({
    seguimientos,
    sortKey,
    sortDirection,
    onSort,
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
                        {seguimientos.map((seguimiento, index) => (
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
