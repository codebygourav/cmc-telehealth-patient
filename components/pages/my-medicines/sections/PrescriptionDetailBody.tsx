'use client';

import { Loader2 } from 'lucide-react';
import { usePrescriptionDetail } from '@/queries/usePrescriptionDetail';
import { PrescriptionDocument } from './PrescriptionDocument';

/** Full prescription of one appointment (for drawers / dialogs). */
export default function PrescriptionDetailBody({ appointmentId }: { appointmentId: string }) {
    const { data, isLoading, isError } = usePrescriptionDetail(appointmentId);

    if (isLoading) {
        return <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading prescription...</div>;
    }
    if (isError || !data?.success) {
        return <p className="py-10 text-center text-sm text-muted-foreground">Could not load the prescription. Please try again.</p>;
    }
    return <PrescriptionDocument data={data.data} />;
}
