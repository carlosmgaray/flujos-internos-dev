import { redirect } from 'next/navigation';

import { LayoutContentBandeja } from '@/components/ui/layout-content-bandeja';
import { DatosAgenteProvider } from '@/modules/auth/ui/provider/datos-agente-provider';
import { MainStoreProtectedSetter } from '@/stores/main-store/main-store-protected-setter';
import { GlobalDialogsProvider } from '@/providers/global-dialogs-provider';
import { getRole, getJbpmAccessToken } from '@/utils';
import { getDecodeToken } from '@/utils/get-decode-token';
import { authLog, authWarn, describeClaims } from '@/utils/auth-debug-log';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const token = await getJbpmAccessToken();

    if (!token) {
        const { URL_LOGIN } = process.env;
        authWarn('protected layout: no token, redirecting to login', { urlLogin: URL_LOGIN ?? null });
        redirect(URL_LOGIN ?? '/');
    }

    authLog('protected layout: token available', describeClaims(getDecodeToken(token)));

    const role = await getRole(token);
    return (
        <MainStoreProtectedSetter role={role} token={token}>
            <GlobalDialogsProvider>
                <LayoutContentBandeja>
                    <DatosAgenteProvider>{children}</DatosAgenteProvider>
                </LayoutContentBandeja>
            </GlobalDialogsProvider>
        </MainStoreProtectedSetter>
    );
}
