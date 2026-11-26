import type { ComponentType } from 'react';
import type { ITabDetalles } from '@/modules/bandeja/tabs/components/detalles/item-tab-detalle';

/**
 * Where a list of department codes comes from. `runtime` is read from the server environment by
 * name on every request, so changing it in the ConfigMap needs a pod restart, not a rebuild.
 * `buildTime` is a list that was already fixed when the app was compiled.
 */
export type DepartamentosSource =
    { source: 'runtime'; envVar: string; defaultCodes: string[] } | { source: 'buildTime'; codes: string[] };

export interface FlujoCreation {
    text: string;
    producto: number;
    subProducto: number;
    /** Body of the creation dialog. */
    Form: ComponentType;
    allowedDepartamentos: DepartamentosSource;
}

/** Extra field a task action's confirmation modal asks for, beyond the generic comment. */
export interface AccionCampoExtraNovoPrazo {
    tipo: 'novoPrazo';
    /** Item code (per flujo) holding the deadline: shown as reference ("Prazo atual: ..."), read from `datosOperacion` the same way `detalleResumen` reads it. */
    codigoItemPrazo: number;
    /** Item code where the requested deadline is saved once the action succeeds. The deadline itself only changes when the request is approved. */
    codigoItemNovoPrazo: number;
}

/** Review of a requested deadline: the modal shows the current and the requested deadline; approving copies the requested one into the deadline item. */
export interface AccionCampoExtraRevisaoNovoPrazo {
    tipo: 'revisaoNovoPrazo';
    codigoItemPrazo: number;
    codigoItemNovoPrazo: number;
    /** true = the action applies the requested deadline (copies it into `codigoItemPrazo`); false = it only shows the dates. */
    aplicaNovoPrazo: boolean;
}

/** Adds a "Ver documentos" shortcut (and a no-documents notice) to the action's comment modal. */
export interface AccionCampoExtraMostrarDocumentos {
    tipo: 'mostrarDocumentos';
}

export type AccionCampoExtra =
    AccionCampoExtraNovoPrazo | AccionCampoExtraRevisaoNovoPrazo | AccionCampoExtraMostrarDocumentos;

export interface FlujoDefinition {
    /** Also the key of the flujo's quick filter. */
    id: string;
    quickFilter: { text: string; icon: ComponentType };
    /** Product codes of the operations that belong to this flujo. */
    productos: number[];
    /** Product/subproduct pair the backend uses to identify this flujo's operations. */
    backend: { productCode: number; subproductCode: number };
    creation?: FlujoCreation;
    /** Departments that see "Excluir Operação" on this flujo's operations. Admins always see it. Omitted = admins only. */
    exclusionDepartamentos?: DepartamentosSource;
    /** Departments whose users can delete their own comments on this flujo's operations; everyone else cannot delete any comment. Admins always can. Omitted = every author can delete their own (same as today). */
    comentarioExclusionDepartamentos?: DepartamentosSource;
    /** Departments that see every operation of this flujo in "Filtros" and the "Nº Operação" search; everyone else only sees the operations assigned to their department. Admins see everything. Omitted = assigned only. */
    viewAllDepartamentos?: DepartamentosSource;
    cardTitleFromTask?: boolean;
    cardThumbByDeadline?: boolean;
    /** Fields shown in the detail panel's "Resumo" tab. Omitted = no fields (same as today). */
    detalleResumen?: ITabDetalles[];
    /**
     * Layout of the "Estado da solicitação" block in the "Resumo" tab. `'strip'` = full-width
     * bar above the fields card (for flujos whose fields are many/long and get cramped at
     * 2/3 width). Omitted = side card next to the fields (same as today).
     */
    detalleEstadoLayout?: 'strip';
    /** Icon shown next to each task action's menu item, by action code. Omitted = no icon. */
    accionIconos?: Record<number, ComponentType<{ className?: string }>>;
    /** By task code, then action code: actions whose confirmation modal needs more than the comment. Keyed by task because an action code is unique only within its task. Omitted = generic comment-only modal. */
    accionCamposExtra?: Record<number, Record<number, AccionCampoExtra>>;
}
