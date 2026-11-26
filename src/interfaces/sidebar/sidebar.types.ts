import { LocalFilterType } from '@/stores/seguimiento-filters.store';
import { TIPOS_BUSQUEDA_SEGUIMIENTO } from '@/modules/bandeja/operaciones/interfaces/seguimiento.interface';

export type SidebarItemType = 'route' | 'external' | 'filter' | 'action';

export interface SidebarItemShowParams {
    nivelAutorizacion: number | null;
    roles: number[];
    codigoDepartamento: string | null;
    creatableFlujoIds: string[];
}

export interface SidebarItem {
    id: string;
    type: SidebarItemType;
    text: string;
    icon: React.ComponentType;
    actionId?: string;
    /** Flujo an action item acts on (see `src/modules/flujos/flujos.registry.ts`). */
    flujoId?: string;

    href?: string;
    external?: boolean;

    filterType?: LocalFilterType;
    tipoBusqueda?: TIPOS_BUSQUEDA_SEGUIMIENTO;

    showBadge?: boolean;

    showItem?: (params: SidebarItemShowParams) => boolean;
}

export interface SidebarSection {
    id: string;
    title?: string;
    items: SidebarItem[];
}
