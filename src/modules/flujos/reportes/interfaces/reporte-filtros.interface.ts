import { ISeguimientoListParams } from '@/modules/bandeja/operaciones/interfaces';

/** Filtros del formulario de Reportes — subconjunto de `ISeguimientoListParams` soportado por
 *  `getSeguimientos` (no existe filtro de servidor por área/departamento responsable). */
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
