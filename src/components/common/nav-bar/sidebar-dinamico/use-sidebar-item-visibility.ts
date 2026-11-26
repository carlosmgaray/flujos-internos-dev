import { SidebarItem } from '@/interfaces/sidebar/sidebar.types';
import { useNbcCurrentUser } from '@/modules/auth/ui/hooks/use-nbc-current-user';

export const useSidebarItemVisibility = () => {
    const { usuarioActual } = useNbcCurrentUser();

    const isItemVisible = (item: SidebarItem): boolean =>
        item.showItem
            ? item.showItem({
                  nivelAutorizacion: null,
                  roles: [],
                  codigoDepartamento: usuarioActual?.codigoDepartamento ?? null,
                  creatableFlujoIds: usuarioActual?.creatableFlujoIds ?? [],
              })
            : true;

    return { isItemVisible };
};
