import { INbcCurrentUser } from '@/modules/auth/services/nbc-current-user.service';
import { FLUJOS } from '@/modules/flujos/flujos.registry';

type ReportesUser = Pick<INbcCurrentUser, 'esAdmin' | 'creatableFlujoIds'> | undefined | null;

/**
 * The department that owns a flujo (the one that creates it) is the only one that sees it in
 * Reportes. Admins see everything. UI only: no backend validates it, same as creation.
 */
export function canAccessReportes(user: ReportesUser): boolean {
    return Boolean(user?.esAdmin) || (user?.creatableFlujoIds?.length ?? 0) > 0;
}

/** Product codes (deduplicated) of the flujos the user can see in Reportes. */
export function getReportesProductCodes(user: ReportesUser): number[] {
    if (!user || !canAccessReportes(user)) return [];

    const flujos = user.esAdmin ? FLUJOS : FLUJOS.filter(flujo => user.creatableFlujoIds.includes(flujo.id));

    return Array.from(new Set(flujos.flatMap(flujo => flujo.productos)));
}
