'use client';

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSeguimientosStore } from '@/stores/seguimientos.store';
import { ISeguimientoItem } from '@/modules/bandeja/operaciones/interfaces';
import { DetallesPresentacion } from '@/modules/bandeja/operaciones/components/detalles-presentacion';
import { TabsOperacion } from '@/modules/bandeja/tabs/components/tabs-operacion';
import { ComentariosSeguimiento } from '@/modules/comentarios/ui/components/comentarios-seguimiento';
import { DetalleModeProvider } from '@/modules/bandeja/detalle-operaciones/contexts/detalle-mode.context';

interface DetalheOperacaoDialogProps {
    open: boolean;
    onClose: () => void;
    seguimiento: ISeguimientoItem;
}

/** Mesmo conteúdo que o painel de detalhe da bandeja (`DatosOperacion`), só que dentro de um
 *  diálogo somente-leitura — reaproveita os mesmos componentes/store, mas em modo
 *  `modal-aprobacion` (esconde as ações de aprovar/rejeitar/excluir) e com os comentários em
 *  modo `readOnly`, já que aqui é só para visualizar, não para agir sobre a operação. */
export function DetalheOperacaoDialog({ open, onClose, seguimiento }: DetalheOperacaoDialogProps) {
    const setSelectedSeguimiento = useSeguimientosStore(state => state.setSelectedSeguimiento);
    const seguimientoAnteriorRef = useRef<ISeguimientoItem | null>(null);

    useEffect(() => {
        if (!open) return;

        seguimientoAnteriorRef.current = useSeguimientosStore.getState().selectedSeguimiento;
        setSelectedSeguimiento(seguimiento);

        return () => {
            setSelectedSeguimiento(seguimientoAnteriorRef.current);
        };
    }, [open, seguimiento, setSelectedSeguimiento]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            scroll="paper"
            showCloseButton={false}
            slotProps={{
                paper: { className: 'h-[85vh] max-h-[800px]' },
            }}
        >
            <DialogContent className="bg-white p-3 overflow-y-auto">
                <DetalleModeProvider value={{ mode: 'modal-aprobacion', onClose }}>
                    <DetallesPresentacion />
                    <TabsOperacion />
                    <ComentariosSeguimiento readOnly />
                </DetalleModeProvider>
            </DialogContent>
        </Dialog>
    );
}
