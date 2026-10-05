"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import BookingOverviewCard from "@/components/pages/appointment-summary/BookingOverviewCard";
import PatientDetailsCard from "@/components/pages/appointment-summary/PatientDetailsCard";
import NextStepsCard from "@/components/pages/appointment-summary/NextStepsCard";
import ConfirmButton from "@/components/pages/appointment-summary/ConfirmButton";
import LoadingSkeleton from "@/components/pages/appointment-summary/LoadingSkeleton";
import CustomDialog from "@/components/custom/Dialogboxs";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  appointmentDetailKeys,
  useAppointmentDetail,
} from "@/queries/useAppointmentSummary";
import type {
  AppointmentDetailData,
  AppointmentPatient,
  AppointmentPayment,
  AppointmentSchedule,
} from "@/types/appointment-summary";
import { useVerifyPayment } from "@/mutations/useVerifyPayment";
import { useQueryClient } from "@tanstack/react-query";
import PaymentSummary from "@/components/pages/appointment-summary/PaymentSummary";
import { Button } from "@base-ui/react/button";
import { deleteUnpaidAppointment } from "@/api/appointments";
import BookingConfirmationModal, { type BookingConfirmationDetails } from "@/components/pages/appointment-summary/BookingConfirmationModal";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveProfile } from "@/context/activeProfileContext";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

const AppointmentSummaryPage = ({ params }: PageProps) => {
  const { id: AppointmentId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get appointment data from URL search params
  const appointmentData = {
    date: searchParams.get("date") || "",
    timeSlot: searchParams.get("timeSlot") || "",
    consultationType:
      (searchParams.get("consultationType") as "video" | "in_person") ||
      "in_person",
    patientName: searchParams.get("patientName") || "",
    patientAge: parseInt(searchParams.get("patientAge") || "0"),
    patientGender: searchParams.get("patientGender") || "",
  };
  const [isConfirming, setIsConfirming] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmationDetails | null>(null);
  // Set once payment succeeds on this page, so the "already paid" redirect below does not run.
  const justPaidRef = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Patient changed their mind: remove the unpaid booking (and release the slot).
  const handleDeleteBooking = async () => {
    try {
      setIsDeleting(true);
      await deleteUnpaidAppointment(AppointmentId);
      toast.success("Booking deleted.");
      router.push("/appointments?tab=pending_payment");
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      toast.error(errors?.message || err?.response?.data?.message || "Could not delete the booking.");
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: "danger" | "success";
    title: string;
    description: string;
  }>({
    open: false,
    type: "danger",
    title: "",
    description: "",
  });

  const { data, isLoading, error, refetch } =
    useAppointmentDetail(AppointmentId);
  const doctor = data?.data;
  // Booked for a family member: show their details instead of the account holder's.
  const bookedFor = (data?.data as any)?.booked_for;
  const patient = bookedFor
    ? {
      ...data?.data?.patient,
      name: bookedFor.name,
      first_name: bookedFor.name,
      last_name: "",
      age: bookedFor.age,
      age_formatted: bookedFor.age != null ? `${bookedFor.age} Years` : "",
      gender: bookedFor.gender,
      gender_formatted: bookedFor.gender ? bookedFor.gender.charAt(0).toUpperCase() + bookedFor.gender.slice(1) : "",
      phone: bookedFor.phone || data?.data?.patient?.phone,
    }
    : data?.data?.patient;
  const Data: AppointmentDetailData | undefined = data?.data;
  const schedule = data?.data?.schedule;
  const status = data?.data?.status;
  const statusLabel = data?.data?.status_label;

  const queryClient = useQueryClient();

  // Booked for a family member: their appointments are listed under that member's profile.
  const isFamilyBooking = !!(data?.data as any)?.booked_for;
  const { familyMembers, activeProfile, switchTo } = useActiveProfile();
  const visitPatientId = data?.data?.patient?.id;
  const memberProfile = isFamilyBooking ? familyMembers.find((m) => m.patient_id === visitPatientId) : undefined;
  // Booked for someone else from this profile: their appointment is not in this profile's list,
  // so stay here and tell the patient to switch profile (no redirect). Own booking -> My Appointments.
  const bookedForOther = isFamilyBooking && activeProfile?.patient_id !== visitPatientId;
  const viewAppointments = () => {
    if (bookedForOther) {
      const name = memberProfile?.first_name || (data?.data as any)?.booked_for?.name || "the family member";
      setConfirmation(null);
      if (memberProfile) {
        switchTo(memberProfile.patient_id);
        router.push("/appointments");
      } else {
        router.push("/find-doctors");
      }
      return;
    }
    router.replace("/appointments");
  };
  const afterBookingPath = isFamilyBooking ? "/" : "/appointments";
  const isPaid = data?.data?.payment?.status === "paid";

  // The Review page is only for unpaid bookings. Already paid:
  // - own booking -> Manage Appointment
  // - family member's booking -> just show the booking details (no review page)
  useEffect(() => {
    if (!data?.data || !isPaid || justPaidRef.current) return;
    if (isFamilyBooking) {
      setConfirmation((current) => current ?? buildConfirmation());
    } else {
      router.replace(`/appointments/manage-appointment/${AppointmentId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data, isPaid, isFamilyBooking]);

  // Close the booking details: leave the Review page once the booking is paid.
  const closeConfirmation = () => {
    if (bookedForOther) return viewAppointments();
    setConfirmation(null);
    if (isPaid || justPaidRef.current) {
      router.replace(`/appointments/manage-appointment/${AppointmentId}`);
    }
  };

  // Everything the patient needs after booking (shown in the modal, PDF and print).
  const buildConfirmation = (overrides: { status?: string; paymentId?: string | null } = {}): BookingConfirmationDetails | null => {
    const d: any = data?.data;
    if (!d) return null;
    const bookingStatus = overrides.status || d.status;
    const confirmed = bookingStatus === "confirmed" || bookingStatus === "rescheduled";
    const p: any = patient || {};
    const ageGender = [p.age_formatted, p.gender_formatted].filter(Boolean).join(" / ");
    return {
      confirmed,
      statusLabel: confirmed ? "Confirmed" : "Awaiting Doctor Confirmation",
      bookingId: String(d.appointment_id || AppointmentId),
      patientName: p.name || "",
      patientAgeGender: ageGender,
      patientPhone: p.phone,
      patientUid: d.booked_for?.uid,
      bookedBy: d.booked_by_name && d.booked_by_name !== p.name ? d.booked_by_name : null,
      email: p.email,
      doctorName: d.doctor?.name || "",
      department: d.doctor?.department,
      date: d.schedule?.date_formatted || d.schedule?.date || "",
      time: d.schedule?.time_formatted || d.schedule?.time || "",
      consultationType: d.schedule?.consultation_type_label || d.schedule?.booking_type,
      amount: d.payment?.total_formatted || (d.payment?.consultation_fee_formatted ?? undefined),
      paymentId: overrides.paymentId ?? d.payment?.payment_id ?? d.payment?.transaction_id,
    };
  };
  const { mutate: verifyPayment } = useVerifyPayment();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handleConfirmBooking = async () => {
    setIsConfirming(true);
    try {
      // API call to confirm booking
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await loadRazorpayScript();

      if (!res) {
        alert("Razorpay SDK failed to load");
        return;
      }

      // Validate fields
      if (!doctor?.razorpay_key_id || !doctor?.razorpay_order_id) {
        alert("Payment info missing");
        return;
      }

      const razorpayKeyId = doctor.razorpay_key_id;
      const razorpayOrderId = doctor.razorpay_order_id;

      const options = {
        key: razorpayKeyId,
        amount: doctor.payment.total, // already in paise
        currency: doctor.payment.currency,
        name: "Cmc Telehealth",
        description: doctor?.doctor?.name,
        order_id: razorpayOrderId,

        handler: async function (response: any) {
          if (
            !response?.razorpay_order_id ||
            !response?.razorpay_payment_id ||
            !response?.razorpay_signature
          )
            return;

          setIsVerifyingPayment(true);

          verifyPayment(
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              appointment_id: doctor?.appointment_id,
              razorpay_signature: response.razorpay_signature,
            },
            {
              onSuccess: async (res) => {
                await refetch();
                queryClient.invalidateQueries({
                  queryKey: appointmentDetailKeys.detail(AppointmentId),
                });

                justPaidRef.current = true;

                setConfirmation(
                  buildConfirmation({
                    status: res?.data?.appointment_status || "awaiting_confirmation",
                    paymentId: response.razorpay_payment_id,
                  }),
                );
                setIsVerifyingPayment(false);
              },
              onError: async () => {
                const updated = await refetch();
                const latestData: any = updated?.data?.data;
                const isNowPaid = latestData?.payment?.status === "paid" || ["awaiting_confirmation", "confirmed", "rescheduled", "completed"].includes(latestData?.status);

                if (isNowPaid) {
                  justPaidRef.current = true;
                  queryClient.invalidateQueries({
                    queryKey: appointmentDetailKeys.detail(AppointmentId),
                  });
                  setConfirmation(
                    buildConfirmation({
                      status: latestData?.status || "awaiting_confirmation",
                      paymentId: response.razorpay_payment_id,
                    }),
                  );
                } else {
                  setDialogState({
                    open: true,
                    type: "danger",
                    title: "Verification Failed",
                    description: "Payment done but verification failed. Please refresh or check your appointments.",
                  });
                }
                setIsVerifyingPayment(false);
              },
            },
          );
        },

        prefill: {
          name: patient?.name,
          email: patient?.email,
          contact: patient?.phone,
        },

        theme: {
          color: "#013220",
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        setDialogState({
          open: true,
          type: "danger",
          title: "Payment Failed",
          description: response.error.description,
        });
      });

      rzp.open();
    } catch (error) {
      setDialogState({
        open: true,
        type: "danger",
        title: "Booking Failed",
        description: "Unable to confirm appointment. Please try again.",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !doctor) {
    return (
      <div className="container-max-width w-full mx-auto py-12 text-center">
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive">
            Failed to load appointment details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Paid booking for a family member: only the booking details, not the review page. */}
      <div className={isPaid && isFamilyBooking ? "hidden" : undefined}>
        <div className="container-max-width mx-auto mb-5 w-full rounded-2xl border border-primary/10  px-5 py-7 sm:px-8 sm:py-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">Almost there</p>
          <h1 className="text-2xl font-bold text-[#1F1E1E] sm:text-3xl">Review Appointment</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">Confirm the doctor, patient, schedule, and payment details before booking.</p>
        </div>

        <div className="container-max-width mx-auto grid w-full items-start grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <BookingOverviewCard doctor={doctor.doctor} schedule={schedule as AppointmentSchedule} />
            <PatientDetailsCard appointment={doctor} />
            {!isPaid && <NextStepsCard isVideo={String(schedule?.consultation_type || "").toLowerCase().includes("video")} />}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
            <PaymentSummary payment={doctor.payment as AppointmentPayment} />
            {doctor.payment.status !== "paid" && (
              <>
                <ConfirmButton
                  onClick={handleConfirmBooking}
                  isLoading={isConfirming}
                />
                {["pending", "failed"].includes(String(status)) && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-red-200 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete Booking
                  </button>
                )}
              </>
            )}
            {doctor.payment.status === "paid" && (
              <button
                type="button"
                onClick={() => setConfirmation(buildConfirmation())}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-primary py-3 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                View / Download Booking Details
              </button>
            )}
            {doctor.payment.status === "paid" && (
              <Button
                onClick={() => {
                  router.push(
                    `/appointments/manage-appointment/${AppointmentId}`,
                  );
                }}
                className="w-full btn-primary-cta"
              >
                Manage Appointment
                <ChevronRight size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <CustomDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        type="danger"
        icon={<AlertCircle className="w-6 h-6 text-destructive" />}
        title="Delete this booking?"
        description="The unpaid booking will be removed and the slot released. This cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Yes, Delete"}
        cancelText="Keep"
        onConfirm={handleDeleteBooking}
        loading={isDeleting}
      />

      <BookingConfirmationModal
        open={!!confirmation}
        details={confirmation}
        onClose={closeConfirmation}
        onViewAppointments={viewAppointments}
        viewAppointmentsLabel={bookedForOther ? "Done" : "Go to My Appointments"}
      />

      {/* Custom Dialog */}
      <CustomDialog
        open={dialogState.open}
        onClose={() => setDialogState((prev) => ({ ...prev, open: false }))}
        type={dialogState.type}
        title={dialogState.title}
        description={dialogState.description}
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={() => setDialogState((prev) => ({ ...prev, open: false }))}
        icon={
          dialogState.type === "danger" ? (
            <AlertCircle className="w-6 h-6 text-destructive" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          )
        }
      />
      {/* Payment Verification Loading Overlay */}
      {isVerifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-bold text-[#1F1E1E]">Verifying Payment...</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Please wait while we confirm your payment and update your appointment details.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentSummaryPage;
