"use client";

import SheetDialog from "@/components/custom/SheetDialog";
import { Button } from "@/components/ui/button";
import PrescriptionDetailBody from "@/components/pages/my-medicines/sections/PrescriptionDetailBody";

interface PrescribeMedicineDialogProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string | null;
}

/**
 * Video call screen: this visit's prescription (medicines, diagnosis, notes, instructions, PDF).
 * Refreshes every 15 seconds while open, so what the doctor adds during the call shows up.
 */
export const PrescribeMedicineDialog = ({ isOpen, onClose, appointmentId }: PrescribeMedicineDialogProps) => (
    <SheetDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Prescription for this visit"
        description="Updates automatically as your doctor adds medicines and notes during the call."
        className="sm:max-w-3xl"
        footer={
            <div className="flex justify-end">
                <Button className="h-10 w-full sm:w-auto" onClick={onClose}>Close</Button>
            </div>
        }
    >
        {appointmentId ? (
            <PrescriptionDetailBody appointmentId={appointmentId} live />
        ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No appointment selected.</p>
        )}
    </SheetDialog>
);
