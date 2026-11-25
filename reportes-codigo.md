# Modulo reportes (copia transcrita desde fotos, NO es la fuente de verdad)


===== FILE: src\modules\flujos\reportes\components\detalhe-operacao-dialog.tsx =====

'use client';

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSeguimientosStore } from '@/stores/seguimientos.store';
import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import { DetallesPresentacion } from '@/modules/bandeja/operaciones/components/detalles-presentacion';
import { TabsOperacion } from '@/modules/bandeja/tabs/components/tabs-operacion';
import { ComentariosSeguimiento } from '@/modules/comentarios/ui/components/comentarios-seguimiento';
import { DetalleModeProvider } from '@/modules/bandeja/detalle-operaciones/contexts/detalle-mode.context';

interface DetalheOperacaoDialogProps {
    open: boolean;
    onClose: () => void;
    seguimiento: ISeguimientoItem;
}

/** Mesmo conteÃºdo que o painel de detalhe da bandeja (`DatosOperacion`), sÃ³ que dentro de um
 *  diÃ¡logo somente-leitura â€” reaproveita os mesmos componentes/store, mas em modo
 *  `modal-aprobacion` (esconde as aÃ§Ãµes de aprovar/rejeitar/excluir) e com os comentÃ¡rios em
 *  modo `readOnly`, jÃ¡ que aqui Ã© sÃ³ para visualizar, nÃ£o para agir sobre a operaÃ§Ã£o. */
export function DetalheOperacaoDialog({ open, onClose, seguimiento }: DetalheOperacaoDialogProps) {
    const setSelectedSeguimiento = useSeguimientosStore(state => state.setSelectedSeguimiento);
    const seguimientoAnteriorRef = useRef<ISeguimientoItem | null>(null);

    useEffect(() => {
        if (!open) return;

        seguimientoAnteriorRef.current = useSeguimientosStore.getState().selectedSeguimiento;
        setSelectedSeguimiento(seguimiento);

        return () => {
            setSelectedSeguimiento(seguimientoAnteriorRef.current);
        };
    }, [open, seguimiento, setSelectedSeguimiento]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            scroll="paper"
            showCloseButton={false}
            slotProps={{
                paper: { className: 'h-[85vh] max-h-[800px]' },
            }}
        >
            <DialogContent className="bg-white p-3 overflow-y-auto">
                <DetalleModeProvider value={{ mode: 'modal-aprobacion', onClose }}>
                    <DetallesPresentacion />
                    <TabsOperacion />
                    <ComentariosSeguimiento readOnly />
                </DetalleModeProvider>
            </DialogContent>
        </Dialog>
    );
}



===== FILE: src\modules\flujos\reportes\components\reporte-filtros-form.tsx =====

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Box, Button, Collapse, Paper, TextField } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import { MdFilterList } from 'react-icons/md';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Option, SelectAutocomplete } from '@/components/ui/select';
import { useAdvancedFilter } from '@/modules/bandeja/operaciones/hooks/use-advanced-filter';
import { DATE_FORMAT, formatDate } from '@/lib/date';
import { IReporteFiltros } from '@/modules/flujos/reportes/interfaces/reporte-filtros.interface';
import { useUsuariosSetores } from '@/modules/usuarios/ui/hooks/use-usuarios-setores';
import {
    APONTAMENTO_CREATION_FIELDS,
    ApontamentoCreationField,
} from '@/products/auditoria/apontamentos/apontamentos-auditoria.config';
import { useSetores } from '@/modules/usuarios/ui/hooks/use-setores';

const TODOS = '1000';

interface ReporteFiltrosFormValues {
    produto: string;
    subProduto: string;
    estado: string;
    areaResponsavel: string;
    responsavelDaArea: string;
    plazo: Date | null;
    titulo: string;
    fechaDesde: Date | null;
    fechaHasta: Date | null;
}

const hoy = new Date();

const PRODUTOS_SEM_RESPONSAVEL = ['1'];

const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

const EMPTY_VALUES: ReporteFiltrosFormValues = {
    produto: '',
    subProduto: '',
    estado: TODOS,
    areaResponsavel: '',
    responsavelDaArea: '',
    plazo: null,
    titulo: '',
    fechaDesde: null,
    fechaHasta: ultimoDiaMes,
};

interface ReporteFiltrosFormProps {
    open: boolean;
    onToggle: () => void;
    onApply: (filtros: IReporteFiltros) => void;
}

const isRequired = (field: ApontamentoCreationField): boolean => APONTAMENTO_CREATION_FIELDS[field].required;

const getLabel = (field: ApontamentoCreationField, text: string): string =>
    isRequired(field) ? text : `${text} (opcional)`;

export function ReporteFiltrosForm({ open, onToggle, onApply }: ReporteFiltrosFormProps) {
    const form = useForm<ReporteFiltrosFormValues>({ defaultValues: EMPTY_VALUES });
    const { control, handleSubmit, reset, setValue } = form;
    const { setores, setoresQuery } = useSetores();

    const departamentoOptions: Option[] = setores.map(setor => ({ value: setor.id, label: setor.name }));

    const areaResponsavel = useWatch({ control: form.control, name: 'areaResponsavel' });
    const [usuariosArea] = useUsuariosSetores(areaResponsavel ? [areaResponsavel] : [], !!areaResponsavel);
    const usuarios = usuariosArea?.usuarios ?? [];
    const responsavelOptions: Option[] = usuarios.map(usuario => ({
        value: usuario.userKey,
        label: usuario.userName ?? usuario.userKey,
    }));

    const getResponsavelPlaceholder = (): string => {
        if (!areaResponsavel) return 'Selecione primeiro o cargo';
        if (usuariosArea?.isError) return 'Erro ao carregar os usuÃ¡rios';
        return 'Selecione o responsÃ¡vel';
    };

    const produtoSelecionado = useWatch({ control, name: 'produto' });
    const permiteResponsavel = !PRODUTOS_SEM_RESPONSAVEL.includes(produtoSelecionado);

    const { productos, estados, subProductosOptions } = useAdvancedFilter({
        productosSeleccionados: produtoSelecionado ? [produtoSelecionado] : [],
        includeTodos: false,
    });

    const productosOptions = useMemo(
        () => (productos ?? []).map(p => ({ value: p.code.toString(), label: p.name.toUpperCase() })),
        [productos]
    );
    const estadosOptions = useMemo(
        () => [
            { value: TODOS, label: 'TODOS' },
            ...(estados ?? []).map(e => ({ value: e.code.toString(), label: e.name.toUpperCase() })),
        ],
        [estados]
    );

    /** Expande a opÃ§Ã£o placeholder "TODOS" (sÃ³ existe para o Estado) para os cÃ³digos reais do
     *  catÃ¡logo â€” igual ao `procesarFiltros` do filtro avanÃ§ado de Bandeja
     *  (`filtro-seguimiento-dialog.tsx`), jÃ¡ que o backend nÃ£o conhece "1000" como cÃ³digo. */
    const expandirTodos = (valor: string, opcoes: { value: string; label: string }[]): string | undefined => {
        if (!valor) return undefined;
        if (valor !== TODOS) return valor;

        const codigosReais = opcoes.filter(opcao => opcao.value !== TODOS).map(opcao => opcao.value);
        return codigosReais.length > 0 ? codigosReais.join(',') : undefined;
    };

    const buildFiltros = (values: ReporteFiltrosFormValues): IReporteFiltros => ({
        productos: values.produto || undefined,
        subProductos: values.subProduto || undefined,
        estados: expandirTodos(values.estado, estadosOptions),
        departamento: values.areaResponsavel || undefined,
        usuarioDominio: values.responsavelDaArea || undefined,
        titulo: values.titulo || undefined,
        plazo: values.plazo ? formatDate(values.plazo, DATE_FORMAT.YYYY_MM_DD) : undefined,
        fechaDesde: values.fechaDesde ? formatDate(values.fechaDesde, DATE_FORMAT.YYYY_MM_DD) : undefined,
        fechaHasta: values.fechaHasta ? formatDate(values.fechaHasta, DATE_FORMAT.YYYY_MM_DD) : undefined,
    });

    const onSubmit = handleSubmit(values => {
        onApply(buildFiltros(values));
    });

    const defaultsAplicados = useRef(false);

    const aplicarDefaults = () => {
        if (!productos || productos.length === 0) return false;

        const primeiroProduto = productos[0];
        const primeiroSubProduto = primeiroProduto.subProducts[0];
        if (!primeiroSubProduto) return false;

        const defaults: ReporteFiltrosFormValues = {
            produto: primeiroProduto.code.toString(),
            subProduto: primeiroSubProduto.code.toString(),
            estado: TODOS,
            areaResponsavel: '',
            responsavelDaArea: '',
            titulo: '',
            plazo: null,
            fechaDesde: primerDiaMes,
            fechaHasta: ultimoDiaMes,
        };
        reset(defaults);
        onApply(buildFiltros(defaults));
        return true;
    };

    useEffect(() => {
        if (!permiteResponsavel) {
            setValue('responsavelDaArea', '');
        }
    }, [permiteResponsavel, setValue]);

    useEffect(() => {
        if (defaultsAplicados.current) return;
        defaultsAplicados.current = aplicarDefaults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productos]);

    const onClear = () => {
        aplicarDefaults();
    };

    return (
        <Paper className="p-3 mb-3">
            <Box className="flex justify-between items-center">
                <Button startIcon={<MdFilterList />} onClick={onToggle} size="small">
                    Filtros
                </Button>
            </Box>

            <Collapse in={open}>
                <Form {...form}>
                    <form onSubmit={onSubmit}>
                        <Box className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                            <FormField
                                name="produto"
                                control={control}
                                rules={{ required: true }}
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel>Produto *</FormLabel>
                                        <FormControl>
                                            <SelectAutocomplete
                                                options={productosOptions}
                                                value={field.value}
                                                error={!!fieldState.error}
                                                onChange={value => {
                                                    field.onChange(value);
                                                    setValue('subProduto', '');
                                                }}
                                                disableClearable
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="subProduto"
                                control={control}
                                rules={{ required: true }}
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel>Subproduto *</FormLabel>
                                        <FormControl>
                                            <SelectAutocomplete
                                                options={subProductosOptions}
                                                value={field.value}
                                                error={!!fieldState.error}
                                                onChange={field.onChange}
                                                disabled={!produtoSelecionado}
                                                disableClearable
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="areaResponsavel"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem sx={{ mb: 0 }}>
                                        <FormLabel>{getLabel('areaResponsavel', 'Ãrea responsÃ¡vel')}</FormLabel>
                                        <FormControl>
                                            <SelectAutocomplete
                                                options={departamentoOptions}
                                                value={field.value}
                                                onChange={value => {
                                                   if (value !== field.value) {
                                                        form.setValue('responsavelDaArea', '');
                                                    }
                                                    field.onChange(value);
                                                }}
                                                loading={setoresQuery.isLoading}
                                                placeholder="Selecione o cargo"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="responsavelDaArea"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem sx={{ mb: 0 }}>
                                        <FormLabel>{getLabel('responsavelDaArea', 'ResponsÃ¡vel da Ã¡rea')}</FormLabel>
                                        <FormControl>
                                            <SelectAutocomplete
                                                options={responsavelOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                loading={usuariosArea?.isLoading ?? false}
                                                disabled={!areaResponsavel || !permiteResponsavel}
                                                placeholder={
                                                    !permiteResponsavel
                                                        ? 'Este produto utiliza apenas Ã¡rea responsÃ¡vel'
                                                        : getResponsavelPlaceholder()
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="titulo"
                                control={control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TÃ­tulo</FormLabel>
                                        <FormControl>
                                            <TextField
                                                {...field}
                                                size="small"
                                                fullWidth
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="plazo"
                                control={control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prazo</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                slotProps={{
                                                    textField: { size: 'small', fullWidth: true },
                                                    field: { clearable: true, onClear: () => field.onChange(null) },
                                                }}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="estado"
                                control={control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <FormControl>
                                            <SelectAutocomplete
                                                options={estadosOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                disableClearable
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="fechaDesde"
                                control={control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Criado a partir de</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                slotProps={{
                                                    textField: { size: 'small', fullWidth: true },
                                                    field: { clearable: true, onClear: () => field.onChange(null) },
                                                }}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="fechaHasta"
                                control={control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Criado atÃ©</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                slotProps={{
                                                    textField: { size: 'small', fullWidth: true },
                                                    field: { clearable: true, onClear: () => field.onChange(null) },
                                                }}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </Box>

                        <Box className="flex gap-2 justify-end mt-3">
                            <Button variant="outlined" onClick={onClear} type="button">
                                Limpar
                            </Button>
                            <Button variant="contained" type="submit">
                                Pesquisar
                            </Button>
                        </Box>
                    </form>
                </Form>
            </Collapse>
        </Paper>
    );
}



===== FILE: src\modules\flujos\reportes\components\reportes-export-button.tsx =====

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



===== FILE: src\modules\flujos\reportes\components\reportes-page.tsx =====

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
                    Centralizador de RelatÃ³rios
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



===== FILE: src\modules\flujos\reportes\components\reportes-table.tsx =====

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

// NOTE: Paleta del diseÃ±o
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

/** Normaliza listas: acepta array o string, separa por el patrÃ³n indicado,
 *  quita vacÃ­os y duplicados y une con ", ". */
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
            { key: 'operacion', label: 'NÂº Processo', width: '8%' },
            { key: 'produto', label: 'Produto / Subproduto', width: '12%' },
            { key: 'titulo', label: 'TÃ­tulo', width: showResponsible ? '20%' : '32%' },
            ...(showResponsible ? [{ key: 'responsable' as SortKey, label: 'ResponsÃ¡vel', width: '12%' }] : []),
            { key: 'areaResponsavel', label: 'Ãrea ResponsÃ¡vel', width: '12%' },
            { key: 'estado', label: 'Estado', width: '8%' },
            { key: 'fechaInicio', label: 'Data de criaÃ§Ã£o', width: '10%' },
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
                Erro ao carregar os relatÃ³rios. Tente novamente.
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
                                AÃ§Ãµes
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
                                {/* Primera columna: azul y en negrita, como en el diseÃ±o */}
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



===== FILE: src\modules\flujos\reportes\hooks\use-reportes.ts =====

'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSeguimientos } from '@/modules/bandeja/operaciones/services';
import { TIPOS_BUSQUEDA_SEGUIMIENTO } from '@/modules/bandeja/operaciones/interfaces';
import { IReporteFiltros } from '@/modules/flujos/reportes/interfaces/reporte-filtros.interface';

export const keysQueryReportes = {
    list: (filtros: IReporteFiltros) => ['reportes', filtros],
};

export const useReportes = (filtros: IReporteFiltros) => {
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const query = useQuery({
        queryKey: keysQueryReportes.list(filtros),
        queryFn: () =>
            /* NOTE: `usePagination: false` â€” igual que hace Bandeja (`fetchSeguimentosCompletos'
             * en `use-seguimientos.ts`). Con `tipoBusqueda: FILTRO`, el route (`filterByDepartment`
             * en `src/app/api/seguimientos/route.ts`) filtra post-paginaciÃ³n y recalcula
             * `totalCount`/`totalPages` sobre los Ã­tems ya filtrados â€” si se pagina en el backend,
             * esos totales terminan reflejando solo la pÃ¡gina actual (casi siempre 0 o 1 pagina),
             * y el control de paginaciÃ³n nunca aparece. Trayendo todo de una vez, el conteo es
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

    const seguimientos = useMemo(() => {
        const inicio = (pageNumber - 1) * pageSize;
        return todosSeguimientos.slice(inicio, inicio + pageSize);
    }, [todosSeguimientos, pageNumber, pageSize]);

    return {
        seguimientos,
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



===== FILE: src\modules\flujos\reportes\interfaces\reporte-filtros.interface.ts =====

import { ISeguimientoListParams } from '@/modules/bandeja/operaciones/interfaces';

/** Filtros del formulario de Reportes â€” subconjunto de `ISeguimientoListParams` soportado por
 *  `getSeguimientos` (no existe filtro de servidor por Ã¡rea/departamento responsable). */
export type IReporteFiltros = Pick<
    ISeguimientoListParams,
    | 'numeroOperacion'
    | 'codigoCliente'
    | 'usuarioDominio'
    | 'productos'
    | 'subProductos'
    | 'estados'
    | 'fechaDesde'
    | 'fechaHasta'
    | 'plazo'
    | 'titulo'
    | 'departamento'
>;



===== FILE: src\modules\flujos\reportes\utils\datos-operacion-item.ts =====

import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import {
    NEW_OPERATION_PRODUCTO,
    NEW_OPERATION_SUB_PRODUCTO,
} from '@/modules/bandeja/operaciones/constants/new-operation.config';
import { COD_ITEM } from '@/constants/codigo-items';

/**
 * `codigoItem` nÃ£o Ã© Ãºnico globalmente: o mesmo nÃºmero significa coisas diferente segundo o
 * produto/subProduto (ex.: `1` = TÃ­tulo da gestÃ£o sÃ³ no fluxo "GestÃ£o Documental" - produto 1/
 * subProduto 1 â€”, e `1` = Nome do cliente nos demais produtos). Por isso "TÃ­tulo" e "DescriÃ§Ã£o
 * da operaÃ§Ã£o" sÃ³ podem ser lidos com seguranÃ§a dentro desse escopo conhecido; em qualquer
 * outro produto retornam `null` mesmo que exista um valor com esse `itemCode` (seria outro
 * campo). Ver `use-new-operation.ts`/`gestion-documental.flujo.tsx`, Ãºnica fonte confirmada
 * desses dois itens hoje.
 */
const ESCOPO_GESTION_DOCUMENTAL = {
    productCode: NEW_OPERATION_PRODUCTO,
    subProductCode: NEW_OPERATION_SUB_PRODUCTO,
};

function getDatoOperacionSeguro(seguimiento: ISeguimientoItem, codigoItem: number): string | null {
    const { producto, subProducto, datosOperacionSeguimiento } = seguimiento;
    if (
        producto !== ESCOPO_GESTION_DOCUMENTAL.productCode ||
        subProducto !== ESCOPO_GESTION_DOCUMENTAL.subProductCode
    ) {
        return null;
    }

    const item = datosOperacionSeguimiento?.find(d => d.codigoItem === codigoItem);
    return item?.valor ?? null;
}

export const getTituloOperacion = (seguimiento: ISeguimientoItem): string | null =>
    getDatoOperacionSeguro(seguimiento, COD_ITEM.TITULO_GESTION);

export const getDescripcionOperacion = (seguimiento: ISeguimientoItem): string | null =>
    getDatoOperacionSeguro(seguimiento, COD_ITEM.DETALLE_GESTION);

/** "Cargos responsables" nÃ£o tem um `codigoItem` genÃ©rico â€” reusa o mesmo critÃ©rio jÃ¡ usado
 *  pelo detalhe de GestÃ£o Documental (`gestion-documental.flujo.tsx`): os departamentos
 *  designados Ã  tarefa ativa, nÃ£o um cargo de pessoa. SÃ³ dentro do mesmo escopo confirmado. */
export const getCargosResponsables = (seguimiento: ISeguimientoItem): string[] => {
    const { producto, subProducto, assignedDepartmentNames } = seguimiento;
    if (
        producto !== ESCOPO_GESTION_DOCUMENTAL.productCode ||
        subProducto !== ESCOPO_GESTION_DOCUMENTAL.subProductCode
    ) {
        return [];
    }

    return assignedDepartmentNames ?? [];
};



===== FILE: src\modules\flujos\reportes\utils\dias-gestion.ts =====

import { differenceInCalendarDays, parse } from 'date-fns';

/** DÃ­as transcurridos desde `fechaInicio` hasta `fechaFin` (fecha de cierre si el estado es
 *  terminal) o hasta hoy si la operaciÃ³n sigue abierta. `null` si `fechaInicio` no es parseable. */
export function diasTranscurridos(fechaInicio: string, fechaFin: string | null): number | null {
    const inicio = new Date(fechaInicio);
    if (Number.isNaN(inicio.getTime())) return null;

    const fin = fechaFin ? new Date(fechaFin) : new Date();
    if (Number.isNaN(fin.getTime())) return null;

    return Math.max(0, differenceInCalendarDays(fin, inicio));
}

/** DÃ­as restantes hasta `plazo`, o `null` si no hay plazo o no es parseable. Puede ser negativo
 *  (operaciÃ³n vencida). */
export function diasRestantes(plazo: string | null | undefined): number | null {
    if (!plazo) return null;
    const fecha = parse(plazo, 'dd/MM/yyyy', new Date());
    if (Number.isNaN(fecha.getTime())) {
        return null;
    }
    return differenceInCalendarDays(fecha, new Date());
}



===== FILE: src\modules\flujos\reportes\utils\excel-export.ts =====

import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import { IDetalleSeguimiento } from '@/modules/bandeja/detalle-operaciones/interfaces';
import { DATE_FORMAT, formatDate } from '@/lib/date';
import { COD_ITEM } from '@/constants/codigo-items';
import { getDescripcionOperacion } from '@/modules/flujos/reportes/utils/datos-operacion-item';

export interface IExcelSheet {
    sheetName: string;
    rows: Record<string, string | number>[];
}

const INVALID_SHEET_NAME_CHARS = /[:\\/?*[\]]/g;

/** `itemCode`s que nÃ£o devem aparecer como coluna extra no Excel: ou sÃ£o dados tÃ©cnicos internos
 *  (ex.: `TIPO_MOTOR_BPM`, flag de controle jBPM, sem valor pra quem lÃª o relatÃ³rio), ou jÃ¡ tÃªm
 *  sua prÃ³pria coluna na linha base (TÃ­tulo/DescriÃ§Ã£o/Prazo/Impacto) â€” mantÃª-los tambÃ©m como
 *  coluna genÃ©rica duplicaria a informaÃ§Ã£o. */
const ITEM_CODES_EXCLUIDOS: number[] = [
    COD_ITEM.TIPO_MOTOR_BPM,
    COD_ITEM.TITULO_GESTION,
    COD_ITEM.DETALLE_GESTION,
    COD_ITEM.PLAZO_GESTION,
    COD_ITEM.IMPACTO_GESTION,
];

function sanitizeSheetName(nombreProducto: string, nombreSubProducto: string): string {
    const nombre = `${nombreProducto} - ${nombreSubProducto}`.replace(INVALID_SHEET_NAME_CHARS, ' ').trim();
    return nombre.slice(0, 31);
}

/** Evita colisiones cuando dos grupos distintos truncan al mismo nombre de 31 caracteres. */
function dedupeSheetName(nombre: string, nombresUsados: Set<string>): string {
    if (!nombresUsados.has(nombre)) {
        nombresUsados.add(nombre);
        return nombre;
    }

    let contador = 2;
    let candidato = `${nombre.slice(0, 28)} ${contador}`;
    while (nombresUsados.has(candidato)) {
        contador += 1;
        candidato = `${nombre.slice(0, 28)} ${contador}`;
    }

    nombresUsados.add(candidato);
    return candidato;
}

/** El endpoint `seguimiento/{operacion}/datos-operacion` puede repetir el mismo `itemCode` para
 *  una misma operaciÃ³n â€” se queda con la Ãºltima apariciÃ³n. */
function dedupeItemsPorCodigo(itemsDetalle: IDetalleSeguimiento[]): Map<number, IDetalleSeguimiento> {
    const porCodigo = new Map<number, IDetalleSeguimiento>();
    for (const item of itemsDetalle) {
        porCodigo.set(item.itemCode, item);
    }
    return porCodigo;
}

function buildBaseRow(
    seguimiento: ISeguimientoItem,
    itemsPorCodigo: Map<number, IDetalleSeguimiento>
): Record<string, string | number> {
    const descricao = itemsPorCodigo.get(COD_ITEM.DETALLE_GESTION)?.value ?? getDescripcionOperacion(seguimiento) ?? '';

    return {
        'NÂº Processo': seguimiento.operacion,
        Produto: seguimiento.nombreProducto,
        Subproduto: seguimiento.nombreSubProducto,
        Solicitante: seguimiento.requestedBy ?? seguimiento.propietario,
        'Ãrea ResponsÃ¡vel': seguimiento.assignedDepartmentNames?.join(', ') ?? '',
        DescriÃ§Ã£o: descricao,
        Estado: seguimiento.estado,
        'Data de criaÃ§Ã£o': formatDate(seguimiento.fechaInicio, DATE_FORMAT.DD_MM_YYYY),
        Prazo: seguimiento.plazo ? formatDate(seguimiento.plazo, DATE_FORMAT.DD_MM
    };
}

/**
 * Agrupa los seguimientos por producto+subProducto (una hoja por grupo) y agrega, por cada
 * seguimiento, una columna extra por cada `itemName` distinto devuelto por
 * `seguimiento/{operacion}/datos-operacion` dentro de ese grupo â€” salvo los `itemCode` en
 * `ITEM_CODES_EXCLUIDOS` (tÃ©cnicos o ya representados en la fila base).
 */
export function buildExcelSheets(
    seguimientos: ISeguimientoItem[],
    detalles: Map<string, IDetalleSeguimiento[]>
): IExcelSheet[] {
    const grupos = new Map<string, ISeguimientoItem[]>();

    for (const seguimiento of seguimientos) {
        const clave = `${seguimiento.producto}-${seguimiento.subProducto}`;
        const grupo = grupos.get(clave) ?? [];
        grupo.push(seguimiento);
        grupos.set(clave, grupo);
    }

    const nombresUsados = new Set<string>();

    return Array.from(grupos.values()).map(grupo => {
        const { nombreProducto, nombreSubProducto } = grupo[0];

        const rows = grupo.map(seguimiento => {
            const itemsPorCodigo = dedupeItemsPorCodigo(detalles.get(seguimiento.operacion) ?? []);
            const row = buildBaseRow(seguimiento, itemsPorCodigo);
            for (const item of itemsPorCodigo.values()) {
                if (ITEM_CODES_EXCLUIDOS.includes(item.itemCode)) continue;
                row[item.itemName] = item.value;
            }

            return row;
        });

        const sheetName = dedupeSheetName(sanitizeSheetName(nombreProducto, nombreSubProducto), nombresUsados);
        return { sheetName, rows };
    });
}

