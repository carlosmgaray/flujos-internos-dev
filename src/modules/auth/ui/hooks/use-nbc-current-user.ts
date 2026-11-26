'use client';

import { useQuery } from '@tanstack/react-query';
import { keysQuery } from '@/constants/keys.query';
import { getNbcCurrentUser } from '@/modules/auth/services/nbc-current-user.service';

const UNRESOLVED_DEPARTAMENTO_REFETCH_MS = 30 * 1000;

/**
 * Current NBC session identity (`usuarioDominio` + `departamento`) — this flow has no
 * "cliente", so the UI shows who the operation belongs to instead of client data. Same
 * claims for the whole session, so it is fetched once and cached indefinitely.
 */
export function useNbcCurrentUser() {
    const query = useQuery({
        queryKey: keysQuery.nbcCurrentUser(),
        queryFn: getNbcCurrentUser,
        staleTime: Infinity,
        retry: 2,
        refetchOnWindowFocus: false,
        // NOTE: an answer built on the fallback department hides the actions that depend on it, so it is
        // asked again until the real one resolves instead of being kept for the whole session.
        refetchInterval: ({ state }) =>
            state.data?.departamentoResuelto === false ? UNRESOLVED_DEPARTAMENTO_REFETCH_MS : false,
    });

    return {
        usuarioActual: query.data,
        usuarioActualQuery: query,
    };
}
