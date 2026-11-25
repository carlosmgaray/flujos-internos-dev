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
        if (usuariosArea?.isError) return 'Erro ao carregar os usuários';
        return 'Selecione o responsável';
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

    /** Expande a opção placeholder "TODOS" (só existe para o Estado) para os códigos reais do
     *  catálogo — igual ao `procesarFiltros` do filtro avançado de Bandeja
     *  (`filtro-seguimiento-dialog.tsx`), já que o backend não conhece "1000" como código. */
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
                                        <FormLabel>{getLabel('areaResponsavel', 'Área responsável')}</FormLabel>
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
                                        <FormLabel>{getLabel('responsavelDaArea', 'Responsável da área')}</FormLabel>
                                        <FormControl>
                                            <SelectAutocomplete
                                                options={responsavelOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                loading={usuariosArea?.isLoading ?? false}
                                                disabled={!areaResponsavel || !permiteResponsavel}
                                                placeholder={
                                                    !permiteResponsavel
                                                        ? 'Este produto utiliza apenas área responsável'
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
                                        <FormLabel>Título</FormLabel>
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
                                        <FormLabel>Criado até</FormLabel>
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
