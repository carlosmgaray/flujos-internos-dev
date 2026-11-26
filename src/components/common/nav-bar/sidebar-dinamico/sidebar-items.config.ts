import { SidebarItem, SidebarSection } from '@/interfaces/sidebar/sidebar.types';
import { MdOutlineInbox, MdAdd, MdOutlineAssessment } from 'react-icons/md';
import { APP_ROUTES } from '@/constants/app-routes';
import { FLUJOS } from '@/modules/flujos/flujos.registry';

/* NOTE: the quick filters and the creation actions come from the flujos registry, one of each per
   flujo. Nothing here names a specific flujo. */
export const sidebarSections: SidebarSection[] = [
    {
        id: 'navigation',
        items: [
            {
                id: 'inbox',
                type: 'route',
                text: 'Minha Caixa de Entrada',
                icon: MdOutlineInbox,
                href: APP_ROUTES.BANDEJA,
            },
            {
                id: 'reportes',
                type: 'route',
                text: 'Consultas e Informes',
                icon: MdOutlineAssessment,
                href: APP_ROUTES.REPORTES,
            },
        ],
    },
    {
        id: 'filters',
        title: 'Filtros Rápidos',
        items: FLUJOS.map((flujo): SidebarItem => ({
            id: `filter-${flujo.id}`,
            type: 'filter',
            text: flujo.quickFilter.text,
            icon: flujo.quickFilter.icon,
            filterType: flujo.id,
            href: APP_ROUTES.BANDEJA,
            showBadge: true,
        })),
    },
    {
        id: 'acciones',
        title: 'Ações',
        items: FLUJOS.flatMap((flujo): SidebarItem[] =>
            flujo.creation
                ? [
                      {
                          id: `create-${flujo.id}`,
                          type: 'action',
                          text: flujo.creation.text,
                          icon: MdAdd,
                          actionId: 'novaOperacao',
                          flujoId: flujo.id,
                          showItem: ({ creatableFlujoIds }) => creatableFlujoIds.includes(flujo.id),
                      },
                  ]
                : []
        ),
    },
];
