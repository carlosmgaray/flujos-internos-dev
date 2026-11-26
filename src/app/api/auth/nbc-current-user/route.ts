import { NextResponse } from 'next/server';
import { getJbpmAccessToken } from '@/utils/get-jbpm-access-token';
import { getDecodeToken } from '@/utils/get-decode-token';
import { resolverCodigoDepartamentoReal } from '@/lib/departamento-codigo.config';
import { canDeleteDocuments } from '@/lib/compliance-departamentos.config';
import {
    resolveComentarioExcluibleFlujoIds,
    resolveCreatableFlujoIds,
    resolveExcluibleFlujoIds,
} from '@/lib/flujos-creation.config';
import { handleApiError } from '@/lib/api-error';
import { isAdminUser } from '@/lib/admin-role';

/**
 * Exposes the current session's identity to client components. `departamento` is the raw
 * Keycloak claim (display only); `codigoDepartamento` is resolved separately for backends
 * that expect a numeric code.
 */
export async function GET() {
    try {
        const token = await getJbpmAccessToken();
        if (!token) {
            return NextResponse.json({ error: 'Sem sessão ativa' }, { status: 401 });
        }

        const decoded = getDecodeToken(token);
        const usuarioDominio = decoded?.preferred_username ?? '';
        const departamento = decoded?.departamento ?? '';
        const codigoDepartamentoReal = await resolverCodigoDepartamentoReal(usuarioDominio);
        const departamentoResuelto = codigoDepartamentoReal !== undefined;
        const codigoDepartamento = codigoDepartamentoReal ?? null;
        // NOTE: admins (see `lib/admin-role.ts`) get every action regardless of department.
        const esAdmin = await isAdminUser(usuarioDominio);
        const puedeExcluirDocumento = canDeleteDocuments(codigoDepartamento, esAdmin);
        const creatableFlujoIds = resolveCreatableFlujoIds({ codigoDepartamento, codigoDepartamentoReal });
        const excluibleFlujoIds = resolveExcluibleFlujoIds(codigoDepartamentoReal);
        const comentarioExcluibleFlujoIds = resolveComentarioExcluibleFlujoIds(codigoDepartamentoReal);

        return NextResponse.json({
            usuarioDominio,
            departamento,
            codigoDepartamento,
            departamentoResuelto,
            esAdmin,
            puedeExcluirDocumento,
            creatableFlujoIds,
            excluibleFlujoIds,
            comentarioExcluibleFlujoIds,
        });
    } catch (error) {
        const { status, body } = handleApiError(error);
        return NextResponse.json({ error: body }, { status });
    }
}
