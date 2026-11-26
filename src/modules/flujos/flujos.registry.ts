import type { ComponentType } from 'react';

import type { SubproductManifest } from '@/core/registry/manifest.types';
import { FlujoDefinition } from '@/modules/flujos/interfaces/flujo.interface';
import { apontamentosManifest } from '@/products/auditoria/apontamentos/manifest';
import { apontamentosLegacyExtras } from '@/products/auditoria/apontamentos/apontamentos-auditoria.legacy-extras';
import { normativasExternasManifest } from '@/products/compliance/normativas-externas/manifest';
import { normativasExternasLegacyExtras } from '@/products/compliance/normativas-externas/normativas-externas.legacy-extras';
import { normativasInternasManifest } from '@/products/compliance/normativas-internas/manifest';
import { normativasInternasLegacyExtras } from '@/products/compliance/normativas-internas/normativas-internas.legacy-extras';

/** Flattens `process.tasks[*].actions[*].icon` back into the old action-code-keyed shape. */
const getAccionIconos = (
    manifest: SubproductManifest
): Record<number, ComponentType<{ className?: string }>> | undefined => {
    const iconos: Record<number, ComponentType<{ className?: string }>> = {};
    for (const task of Object.values(manifest.process.tasks)) {
        for (const [actionCode, action] of Object.entries(task.actions ?? {})) {
            if (action.icon) {
                iconos[Number(actionCode)] = action.icon;
            }
        }
    }
    return Object.keys(iconos).length > 0 ? iconos : undefined;
};

const apontamentosAuditoriaFlujo: FlujoDefinition = {
    id: apontamentosLegacyExtras.id,
    quickFilter: { text: apontamentosManifest.texts.quickFilter, icon: apontamentosManifest.inbox.quickFilter.icon },
    productos: [apontamentosManifest.backend.productCode],
    backend: apontamentosManifest.backend,
    creation: apontamentosManifest.creation && {
        text: apontamentosManifest.texts.createButton,
        producto: apontamentosManifest.backend.productCode,
        subProducto: apontamentosManifest.backend.subproductCode,
        Form: apontamentosLegacyExtras.Form,
        allowedDepartamentos: apontamentosLegacyExtras.allowedDepartamentos,
    },
    exclusionDepartamentos: apontamentosLegacyExtras.exclusionDepartamentos,
    comentarioExclusionDepartamentos: apontamentosLegacyExtras.comentarioExclusionDepartamentos,
    viewAllDepartamentos: apontamentosLegacyExtras.viewAllDepartamentos,
    cardTitleFromTask: apontamentosManifest.inbox.cardTitleFromTask,
    cardThumbByDeadline: apontamentosManifest.inbox.cardThumbByDeadline,
    detalleResumen: apontamentosLegacyExtras.detalleResumen,
    detalleEstadoLayout: apontamentosLegacyExtras.detalleEstadoLayout,
    accionIconos: getAccionIconos(apontamentosManifest),
    accionCamposExtra: apontamentosLegacyExtras.accionCamposExtra,
};

const gestionDocumentalFlujo: FlujoDefinition = {
    id: normativasExternasLegacyExtras.id,
    quickFilter: {
        text: normativasExternasManifest.texts.quickFilter,
        icon: normativasExternasManifest.inbox.quickFilter.icon,
    },
    productos: [normativasExternasManifest.backend.productCode],
    backend: normativasExternasManifest.backend,
    creation: normativasExternasManifest.creation && {
        text: normativasExternasManifest.texts.createButton,
        producto: normativasExternasManifest.backend.productCode,
        subProducto: normativasExternasManifest.backend.subproductCode,
        Form: normativasExternasLegacyExtras.Form,
        allowedDepartamentos: normativasExternasLegacyExtras.allowedDepartamentos,
    },
    exclusionDepartamentos: normativasExternasLegacyExtras.exclusionDepartamentos,
    viewAllDepartamentos: normativasExternasLegacyExtras.viewAllDepartamentos,
    cardTitleFromTask: normativasExternasManifest.inbox.cardTitleFromTask,
    cardThumbByDeadline: normativasExternasManifest.inbox.cardThumbByDeadline,
    detalleResumen: normativasExternasLegacyExtras.detalleResumen,
    accionIconos: getAccionIconos(normativasExternasManifest),
    accionCamposExtra: undefined,
};

const normativasInternasFlujo: FlujoDefinition = {
    id: normativasInternasLegacyExtras.id,
    quickFilter: {
        text: normativasInternasManifest.texts.quickFilter,
        icon: normativasInternasManifest.inbox.quickFilter.icon,
    },
    productos: [normativasInternasManifest.backend.productCode],
    backend: normativasInternasManifest.backend,
    creation: normativasInternasManifest.creation && {
        text: normativasInternasManifest.texts.createButton,
        producto: normativasInternasManifest.backend.productCode,
        subProducto: normativasInternasManifest.backend.subproductCode,
        Form: normativasInternasLegacyExtras.Form,
        allowedDepartamentos: normativasInternasLegacyExtras.allowedDepartamentos,
    },
    exclusionDepartamentos: normativasInternasLegacyExtras.exclusionDepartamentos,
    viewAllDepartamentos: normativasInternasLegacyExtras.viewAllDepartamentos,
    cardTitleFromTask: normativasInternasManifest.inbox.cardTitleFromTask,
    cardThumbByDeadline: normativasInternasManifest.inbox.cardThumbByDeadline,
    detalleResumen: normativasInternasLegacyExtras.detalleResumen,
    accionIconos: getAccionIconos(normativasInternasManifest),
    accionCamposExtra: undefined,
};

/**
 * Single place where a process type is declared. The sidebar (quick filters and creation
 * actions), the quick filter counts, the creation dialog and the creation permission are all
 * derived from this list: adding a flujo is adding its definition here.
 *
 * Every entry below is derived from its `SubproductManifest` + legacy extras (migration-plan.md
 * step 7) instead of being hardcoded. `getFlujoByBackend` keeps its signature and result
 * unchanged. Buscar siempre por (producto, subProducto): dos subproductos de Compliance comparten
 * `producto` 1, por eso no existe (ni debe agregarse) un `getFlujoByProducto` — un lookup por solo
 * `producto` sería ambiguo entre ellos.
 */
export const FLUJOS: FlujoDefinition[] = [gestionDocumentalFlujo, normativasInternasFlujo, apontamentosAuditoriaFlujo];

export const getFlujoById = (id: string | null | undefined): FlujoDefinition | undefined =>
    FLUJOS.find(flujo => flujo.id === id);

export const getFlujoByBackend = (
    productCode: number | null | undefined,
    subproductCode: number | null | undefined
): FlujoDefinition | undefined =>
    productCode === null || productCode === undefined || subproductCode === null || subproductCode === undefined
        ? undefined
        : FLUJOS.find(
              flujo => flujo.backend.productCode === productCode && flujo.backend.subproductCode === subproductCode
          );
