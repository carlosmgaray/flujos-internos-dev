'use client';

import { apiInterno } from '@/lib/api-interno';

export interface INbcCurrentUser {
    usuarioDominio: string;
    /** Raw Keycloak claim — a human-readable description (e.g. "Inovações Continental"), not a code. For display only. */
    departamento: string;
    /** Numeric department code backends expect — resolved from `departamento`, see `departamento-codigo.config.ts`. `null`
     * when it couldn't be resolved. */
    codigoDepartamento: string | null;
    /** `false` when `codigoDepartamento` is `null` because the real department could not be resolved. */
    departamentoResuelto: boolean;
    /** Rol `BPM_ROLES.GRUPO = 'ADMIN'` (ver `lib/admin-role.ts`) — habilita todas as ações na UI. */
    esAdmin: boolean;
    /** Ids of the flujos (`flujos.registry.ts`) whose creation action the sidebar shows. Calculated server-side, UI only. */
    creatableFlujoIds: string[];
    /** Ids of the flujos whose operations show "Excluir Operação" (each flujo's `exclusionDepartamentos`). Admins are not
     *  listed: they see it on every flujo. Calculated server-side, UI only. */
    excluibleFlujoIds: string[];
    /** Ids of the flujos that restrict comment deletion (`comentarioExclusionDepartamentos`) where the user's department may
     *  still delete its own comments. Admins are not listed. Calculated server-side, UI only. */
    comentarioExcluibleFlujoIds: string[];
    puedeExcluirDocumento: boolean;
}

export const getNbcCurrentUser = async (): Promise<INbcCurrentUser> => {
    const response = await apiInterno.get<INbcCurrentUser>('/auth/nbc-current-user');
    return response.data;
};
