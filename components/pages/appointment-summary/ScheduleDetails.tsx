import { StatusBadge, StatusBadgeStatus } from '@/components/custom/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { AppointmentSchedule } from '@/types/appointment-summary';
import { Calendar } from 'lucide-react';

interface ScheduleDetailsProps {
  schedule: AppointmentSchedule;
}
function InfoBadges({ schedule }: { schedule: AppointmentSchedule }) {
  return (
    <div className="p-4 sm:p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold text-on-surface">Schedule Detail</span>
        </div>
        <StatusBadge status={schedule?.consultation_type as StatusBadgeStatus} label={schedule?.consultation_type_label || "N/A"} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 text-sm leading-snug">
        <div className="text-on-surface-variant">Date</div>
        <div className="text-right">
          {schedule?.date_formatted || "N/A"}
        </div>

        <div className="text-on-surface-variant">Time</div>
        <div className="text-right">{schedule?.time_formatted || "N/A"}</div>

        <div className="text-on-surface-variant">Booking Type</div>
        <div className="text-right capitalize">{schedule?.booking_type || "N/A"}</div>
      </div>

    </div>
  );
}
const ScheduleDetails = ({ schedule }: ScheduleDetailsProps) => {

  return (
    <Card className="h-full w-full p-0 g-border global-radius-10">
      <CardContent className="p-0">
        <InfoBadges schedule={schedule} />
      </CardContent>
    </Card>
  );
};

export default ScheduleDetails;
