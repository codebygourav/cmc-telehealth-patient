"use client";
import { Advertisements } from "@/components/pages/Dashboard/Advertisements";
import { AvailableDoctors } from "@/components/pages/Dashboard/AvailableDoctors";
import { DoctorDepartments } from "@/components/pages/Dashboard/DoctorDepartments";
import QuickLinks from "@/components/pages/Dashboard/QuickLinks";
import { TestimonialsCarousel } from "@/components/pages/Dashboard/TestimonialsCarousel";
import { UpcomingAppointments } from "@/components/pages/Dashboard/UpcomingAppointments";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/userContext";
import {
	mapHomeScreenAdvertisements,
	mapHomeScreenAppointments,
	mapHomeScreenDepartmentCards,
	mapHomeScreenTestimonials,
} from "@/lib/home-screen";
import { usePatientHome } from "@/queries/usePatientHome";
import { Loader2, Plus } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

	const { user, initializing } = useAuth();
	const isGuest = !initializing && !user;
	// isPending (not isLoading): keep the loader until data or a real error, so no error flash on reload.
	const { data, isPending: isLoading, isError } = usePatientHome();
	const homeData = data?.data;
	const router = useRouter();
	const appointments = useMemo(() => mapHomeScreenAppointments(homeData), [homeData]);
	const departmentCards = useMemo(() => mapHomeScreenDepartmentCards(homeData), [homeData]);
	const advertisements = useMemo(() => mapHomeScreenAdvertisements(homeData), [homeData]);
	const testimonials = useMemo(() => mapHomeScreenTestimonials(homeData), [homeData]);
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}
	if (isError || !homeData) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="font-semibold text-destructive">
					Failed to load dashboard. Please try again.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-5">

			<header className="container-max-width mx-auto flex flex-col justify-between w-full gap-6 p-5 bg-white global-radius shadow-card-lg md:flex-row md:items-center">

				{/* Left Content */}
				<div>
					{isGuest ? (
						<>
							<h1 className="font-bold sm:text-2xl text-base tracking-tight text-foreground">
								Welcome
							</h1>
							<p className="!font-normal text-span-16 g-text-muted">
								Browse our doctors and book a consultation. Sign in or register when you are ready to book.
							</p>
						</>
					) : (
						<>
							<h1 className="font-bold sm:text-2xl text-base tracking-tight text-foreground">
								Welcome back{user?.first_name || user?.last_name ? "," : ""}{" "}
								{user?.first_name ?? ""} {user?.last_name ?? ""}
							</h1>

							<p className="!font-normal text-span-16 g-text-muted">
								Your health summary is looking stable today.
							</p>
						</>
					)}
				</div>

				{(isGuest || appointments.length > 0) && (
					// Right Action
					<Button
						onClick={() => {
							window.open("/find-doctors", "_blank");
						}}
						className="flex items-center justify-center gap-2 font-semibold py-4.5 text-sm md:text-xs global-radius bg-primary text-white hover:bg-primary/90 shadow-none transition-all"
					>
						<Plus className="w-4 h-4" />
						<span>Book Appointment</span>
					</Button>
				)}
			</header>

			<div className="container-max-width mx-auto flex flex-col items-stretch gap-5 lg:flex-row">

				{/* Left - 40% */}
				<div className="w-full lg:basis-[40%]">
					{isGuest ? (
						<div className="flex h-full flex-col items-start justify-center gap-3 p-5 bg-white global-radius shadow-card-lg">
							<h2 className="text-base font-bold text-foreground">Your Appointments</h2>
							<p className="text-sm g-text-muted">
								Sign in to see your upcoming appointments, reports and prescriptions.
							</p>
							<div className="flex gap-2">
								<Button onClick={() => router.push("/auth/login")} variant="outline" className="global-radius">
									Sign In
								</Button>
								<Button onClick={() => router.push("/auth/register")} className="global-radius bg-primary text-white hover:bg-primary/90">
									Register
								</Button>
							</div>
						</div>
					) : (
						<UpcomingAppointments
							appointments={appointments}
							onViewAll={() => router.push("/appointments")}
							onStartCall={() => { }}
							onBookFirst={() => router.push("/find-doctors")}
						/>
					)}
				</div>

				{/* Right - 60% */}
				<div className="w-full lg:basis-[60%]">
					<QuickLinks />
				</div>
			</div>

			{departmentCards.length > 0 ? (
				<DoctorDepartments departments={departmentCards} />
			) : (
				null
			)}
			<AvailableDoctors
				doctors={homeData.available_doctors}
				onShowAll={() => router.push("/find-doctors")}
			/>

			{/* Advertisements */}
			<Advertisements ads={advertisements} />

			{/* Testimonials */}
			<TestimonialsCarousel testimonials={testimonials} />

		</div>
	);
}
