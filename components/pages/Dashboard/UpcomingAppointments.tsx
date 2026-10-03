import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, Separator } from "@/components/ui";
import type { HomeScreenAppointment } from "@/types/home-screen";
import { Calendar, Clock3, type LucideIcon, UserRound, Video } from "lucide-react";
import { EmptyState } from "@/components/custom/EmptyState";
import { ChevronRight } from "lucide-react";
interface UpcomingAppointmentsProps {
    appointments: HomeScreenAppointment[];
    onViewAll: () => void;
    onStartCall: (appointmentId: string | number) => void;
    onBookFirst: () => void;
}

function AppointmentMetaItem({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-8.5 shrink-0 items-center justify-center global-radius bg-white text-foreground">
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-xs font-medium text-white/100">{label}</p>
                <p className="font-semibold text-white text-md">{value}</p>
            </div>
        </div>
    );
}

function AppointmentCard({
    appointment,
    onStartCall,
}: {
    appointment: HomeScreenAppointment;
    onStartCall: (id: string | number) => void;
}) {
    const doctor = appointment.doctor;

    return (
        <Card className="h-full p-0 overflow-hidden rounded-lg primary-card-shadow">
            <CardContent className="flex flex-col justify-between h-full p-5 sm:p-6">
                <div className="flex flex-col justify-between flex-1 gap-5 sm-justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <Avatar className="h-[100px] w-[100px] global-radius shadow-lg after:hidden sm:h-[108px] sm:w-[108px]">
                                <AvatarImage
                                    src={appointment.doctorImage}
                                    alt={appointment.doctorName}
                                    className="object-cover global-radius"
                                />
                                <AvatarFallback className="text-white global-radius bg-white/15">
                                    <UserRound className="size-8" />
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 pt-1">
                                <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold leading-tight text-white sm:text-2xl">
                                    {appointment.doctorName}
                                    {appointment.isTestDoctor && (
                                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-950">Test</span>
                                    )}
                                </h3>
                                <p className="mt-2 text-sm sm:text-lg font-semibold text-white/100">
                                    {doctor?.specialty || "Cardiology"}
                                </p>
                                <p className="mt-1.5 text-base sm:text-sm font-semibold text-white/85 ">
                                    Exp: {doctor?.experience || "14 years"}
                                    <span className="px-1.5">•</span>
                                    {/* {doctor?.languages?.join(", ") || "English, Hindi, Punjabi"} */}
                                </p>
                            </div>
                        </div>

                        <Badge className="px-3 py-3 text-sm font-medium text-green-600 bg-white w-fit global-radius hover:bg-white">
                            {appointment.status === "awaiting_confirmation" ? "Awaiting Confirmation" : "Upcoming Session"}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                        <AppointmentMetaItem icon={Calendar} label="Date" value={appointment.date} />
                        <AppointmentMetaItem icon={Clock3} label="Time" value={appointment.time} />
                        <AppointmentMetaItem icon={Video} label="Type" value={appointment.typeLabel} />
                    </div>
                </div>

                <Separator className="my-3 bg-transparent" />

                {appointment.type === "video" && (appointment.canJoin ? (
                    <Button
                        onClick={() => {
                            onStartCall(appointment.id);
                            window.open(
                                `/start-consultation?room_url=${encodeURIComponent(appointment.joinUrl || "")}&appointment_id=${appointment.id}`,
                                "_blank"
                            );
                        }}
                        className="w-full mt-4 text-sm sm:text-base font-bold text-primary bg-white hover:bg-slate-100 h-11 rounded-md shadow-sm transition-all border-0 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Video className="size-4" />
                        Join Video Call
                    </Button>
                ) : (
                    <p className="flex items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2.5 text-center text-sm font-medium text-white/90">
                        <Video className="size-4" />
                        {appointment.status === "awaiting_confirmation"
                            ? "Join link appears once the doctor confirms."
                            : "Join link opens 1 hour before your appointment."}
                    </p>
                ))}
            </CardContent>
        </Card>
    );
}

export function UpcomingAppointments({
    appointments,
    onStartCall,
    onBookFirst,
}: UpcomingAppointmentsProps) {

    const button = <Button onClick={onBookFirst} className="btn-primary-cta global-radius px-5">Book Your First Appointment <ChevronRight className="size-4 m-0" /></Button>;
    if (!appointments || appointments.length === 0) {
        return (
            <EmptyState
                title="No Upcoming Sessions"
                description="You don't have any appointments scheduled at the moment."
                button={button}
                icon={<Calendar className="size-10" />}
                className="h-full"
            />
        );
    }

    // Show only one upcoming appointment  
    return (
        <AppointmentCard
            appointment={appointments[0]}
            onStartCall={onStartCall}
        />
    );
}
