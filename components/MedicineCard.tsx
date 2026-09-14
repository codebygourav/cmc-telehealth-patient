"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle, Calendar, ChevronRight, User, Pill, Clock, FileText } from "lucide-react";
import { motion } from "motion/react";

interface MedicineCardProps {
  prescription: any; // Using any for now to match the user's detailed JSON
  onViewDetail?: (id: string) => void;
  showViewDetail?: boolean;
}

interface InfoBadgeProps {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
}

function InfoBadges({ prescription }: { prescription: any }) {
  const items: InfoBadgeProps[] = [];

  const medicineName =
    prescription?.medician_name ||
    prescription?.medicine_name ||
    prescription?.name;

  if (medicineName) {
    items.push({
      icon: <Pill className="w-4 h-4 text-emerald-600" />,
      label: "Medicine:",
      value: medicineName,
    });
  }

  const frequencyText = prescription?.frequencylabel
    ? `${prescription.frequencylabel}${
        prescription.frequency && prescription.frequency !== prescription.frequencylabel
          ? ` (${prescription.frequency})`
          : ""
      }`
    : prescription?.frequency;

  if (frequencyText) {
    items.push({
      icon: <Clock className="w-4 h-4 text-emerald-600" />,
      label: "Frequency:",
      value: frequencyText,
    });
  }

  if (prescription?.doctor_name) {
    items.push({
      icon: <User className="w-4 h-4" />,
      label: "Doctor:",
      value: prescription.doctor_name,
    });
  }

  const timingText = prescription?.timing || prescription?.medician_timings;
  if (timingText) {
    items.push({
      icon: <Calendar className="w-4 h-4" />,
      label: "Duration:",
      value: timingText,
    });
  }

  if (prescription?.instructions_by_doctor) {
    items.push({
      icon: <FileText className="w-4 h-4 text-amber-600" />,
      label: "Instructions:",
      value: prescription.instructions_by_doctor,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs g-text-muted font-semibold bg-light-gray global-radius"
        >
          {item.icon}
          {item.label && (
            <span className="font-semibold text-gray-500">{item.label}</span>
          )}
          <span className="font-semibold text-gray-900">{item.value}</span>
        </span>
      ))}
    </div>
  );
}

export const MedicineCard = ({
  prescription,
  onViewDetail,
  showViewDetail = true,
}: MedicineCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      <Card className="p-5 h-full overflow-hidden bg-white global-radius-10 group">
        <CardContent className="flex flex-col h-full justify-between gap-4 p-0 md:flex-row md:items-center">
          <div className="flex-1 space-y-3">
            {/* Header: Label */}
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest g-text-muted">
              <AlertCircle className="w-3.5 h-3.5 text-error" />
              <span className="font-semibold g-text-muted">Health Issue</span>
            </div>

            {/* Problem Title */}
            <h2 className="font-bold g-text-dark line-clamp-1">
              {prescription.problem}
            </h2>

            {/* Info Badges */}
            <InfoBadges prescription={prescription} />

            {/* Array of detailed medicines if available */}
            {Array.isArray(prescription?.medicines) && prescription.medicines.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Prescribed Medicines
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {prescription.medicines.map((med: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100"
                    >
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                        {med.name}
                      </span>
                      {(med.frequencylabel || med.frequency) && (
                        <span className="text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200 font-medium">
                          {med.frequencylabel || med.frequency}
                        </span>
                      )}
                      {med.dosage && <span className="text-gray-500 font-medium">{med.dosage}</span>}
                      {med.take_when && <span className="text-gray-500 font-medium">({med.take_when})</span>}
                      {med.instructions && med.instructions.length > 0 && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {Array.isArray(med.instructions) ? med.instructions.join(", ") : med.instructions}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          {showViewDetail && (
            <div className="flex items-center pt-2 shrink-0 md:pt-0">
              {onViewDetail ? (
                <Button
                  className="h-10 btn-primary-cta mt-0"
                  onClick={() => onViewDetail(prescription.appointment_id)}
                >
                  View Detail
                  <ChevronRight className="m-0 size-4" />
                </Button>
              ) : (
                <Button className="btn-primary-cta" asChild>
                  <Link href={`/my-medicines/${prescription.appointment_id}`}>View Detail</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};


