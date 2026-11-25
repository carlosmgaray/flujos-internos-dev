import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import {
    NEW_OPERATION_PRODUCTO,
    NEW_OPERATION_SUB_PRODUCTO,
} from '@/modules/bandeja/operaciones/constants/new-operation.config';
import { COD_ITEM } from '@/constants/codigo-items';

/**
 * `codigoItem` não é único globalmente: o mesmo número significa coisas diferente segundo o
 * produto/subProduto (ex.: `1` = Título da gestão só no fluxo "Gestão Documental" - produto 1/
 * subProduto 1 —, e `1` = Nome do cliente nos demais produtos). Por isso "Título" e "Descrição
 * da operação" só podem ser lidos com segurança dentro desse escopo conhecido; em qualquer
 * outro produto retornam `null` mesmo que exista um valor com esse `itemCode` (seria outro
 * campo). Ver `use-new-operation.ts`/`gestion-documental.flujo.tsx`, única fonte confirmada
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

/** "Cargos responsables" não tem um `codigoItem` genérico — reusa o mesmo critério já usado
 *  pelo detalhe de Gestão Documental (`gestion-documental.flujo.tsx`): os departamentos
 *  designados à tarefa ativa, não um cargo de pessoa. Só dentro do mesmo escopo confirmado. */
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
