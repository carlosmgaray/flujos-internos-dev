import { INbcCurrentUser } from '@/modules/auth/services/nbc-current-user.service';
import { APONTAMENTOS_AUDITORIA_FLUJO_ID } from '@/products/auditoria/apontamentos/apontamentos-auditoria.config';

/**
 * Client-side counterpart of `canSeeExcludedAuditOperations` (`lib/seguimientos-visibility.config.ts`).
 * Reuses `creatableFlujoIds` — the same flag that gates "Novo apontamento" — since both are
 * decided by the same Auditoria Interna department check. Admins see everything.
 */
export function canSeeExcludedAuditOperations(
    user: Pick<INbcCurrentUser, 'esAdmin' | 'creatableFlujoIds'> | undefined | null
): boolean {
    return Boolean(user?.esAdmin) || !!user?.creatableFlujoIds?.includes(APONTAMENTOS_AUDITORIA_FLUJO_ID);
}
