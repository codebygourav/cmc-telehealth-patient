'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import CustomDialog from '@/components/custom/Dialogboxs';
import PendingPaymentCard from '@/components/pages/appointments/PendingPaymentCard';
import { deleteUnpaidAppointment } from '@/api/appointments';
import UpcomingAppointmentCard from '@/components/pages/appointments/UpcomingAppointmentCard';
import PastAppointmentCard from '@/components/pages/appointments/PastAppointmentCard';
import CustomTabs from '@/components/custom/CustomTabs';
import { useAppointments } from '@/queries/useAppointments';
import { Loader2, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { AppointmentResponse } from '@/types/appointment';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/hero-section';
import { Skeleton } from '@/components/ui/skeleton';

const AppointmentsPage = () => {

    const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'past' | 'pending_payment'>('all');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const queryClient = useQueryClient();

    // Open a tab from the URL, e.g. /appointments?tab=pending_payment
    useEffect(() => {
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'all' || tab === 'pending_payment' || tab === 'past' || tab === 'upcoming' || tab === 'today') {
            setActiveTab(tab);
        }
    }, []);

    const handleDeleteUnpaid = async () => {
        if (!deleteId) return;
        try {
            setDeleting(true);
            await deleteUnpaidAppointment(deleteId);
            toast.success('Booking deleted.');
            await queryClient.invalidateQueries({ queryKey: ['appointments'] });
        } catch (err: any) {
            const errors = err?.response?.data?.errors;
            toast.error(errors?.message || err?.response?.data?.message || 'Could not delete the booking.');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };
    const [currentPage, setCurrentPage] = useState(1);
    // Search / status / type / page size: applied by the server over ALL appointments.
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [perPage, setPerPage] = useState<number | 'all' | undefined>(undefined); // undefined = admin default
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchQuery.trim()); setCurrentPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

    // Fetch appointments based on active tab and page
    const { data, isLoading: firstLoad, isFetching, isPlaceholderData, isError, error } = useAppointments(activeTab, currentPage, {
        search: debouncedSearch,
        status: statusFilter,
        consultationType: typeFilter,
        perPage,
        hideCancelled: activeTab === 'upcoming',
    });
    const listMeta = data as any;
    // Skeleton while new results load (search, filter, page, page size or tab).
    const isLoading = firstLoad || isPlaceholderData;
    const hasFilters = !!debouncedSearch || statusFilter !== 'all' || typeFilter !== 'all';
    const router = useRouter();

    const handleManageAppointment = (appointmentId: string) => {
        setSelectedAppointment(appointmentId);
    };

    const handleViewDetails = (id: string) => {
        router.push(`/appointments/appoitment-detail/${id}`);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Transform API response to match component props
    const transformToAppointment = (app: AppointmentResponse) => {
        return {
            id: app.appointment_id,
            doctorId: app.doctor?.id || '',
            doctorName: app.doctor?.name || '',
            doctorImage: app.doctor?.avatar || '',
            date: app.schedule?.date_formatted || app.appointment_date_formatted || app.appointment_date,
            time: app.schedule?.time_formatted || app.appointment_time_formatted || app.appointment_time,
            status: app.status as 'upcoming' | 'completed' | 'cancelled',
            type: app.consultation_type || app.schedule?.consultation_type || 'video',
            reason: app.notes || undefined,
        };
    };

    const transformToDoctor = (app: AppointmentResponse) => {
        if (!app.doctor) return undefined;

        return {
            id: app.doctor.id,
            name: app.doctor.name,
            // Department and the doctor's role in it, e.g. "Pediatrics · Professor & Head".
            specialty: [app.doctor.department, (app.doctor as any).department_role && `(${(app.doctor as any).department_role})`].filter(Boolean).join(" "),
            // Real average from reviews; 0 = no reviews yet (the card shows "New").
            rating: Number(app.doctor.average_rating) || 0,
            reviews: app.ratings_count || 0,
            experience: app.doctor.years_experience || '',
            location: '',
            languages: [],
            fee: parseFloat(app.fee_amount) || 0,
            image: app.doctor.avatar,
            verified: false,
        };
    };

    // Loading Component
    const LoadingState = () => {
        const count = Math.min(Number(perPage === 'all' ? 6 : (perPage ?? listMeta?.default_per_page ?? 6)), 6);
        return (
            <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading appointments">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-white p-5">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <Skeleton className="h-20 w-full rounded-xl" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                        <Skeleton className="mt-4 h-11 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        );
    };

    // Error Component
    const ErrorState = () => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="p-4 text-red-800 bg-red-100 rounded-lg">
                    <p className="font-bold">Error loading appointments</p>
                    <p className="mt-1 text-sm">{error?.message || 'Please try again later'}</p>
                </div>
            </div>
        </div>
    );

    // Empty State Component
    const EmptyState = ({ type }: { type: 'all' | 'today' | 'upcoming' | 'past' }) => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container-low">
                    <Calendar className="w-8 h-8 text-on-surface-variant/50" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-on-surface">{type === 'all' ? 'No appointments found' : type === 'today' ? 'No appointments today' : `No ${type} appointments`}</h3>
                <p className="text-sm text-on-surface-variant">
                    {type === 'all'
                        ? 'Your appointments will appear here.'
                        : type === 'today'
                        ? 'You have no appointments today.'
                        : type === 'upcoming'
                            ? 'You have no upcoming appointments scheduled.'
                            : 'You have no past appointments to show.'}
                </p>
            </div>
        </div>
    );

    // Filter appointments based on active tab
    // The API already handles filtering by "upcoming" or "past", but we also filter out cancelled ones
    // The server already applied tab, search and filters (cancelled hidden on Upcoming / Past).
    const filterAppointments = (appointments: AppointmentResponse[] | undefined) => appointments ?? [];

    const renderNoMatch = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-foreground">No appointments match your search or filters</p>
            <button type="button" className="mt-2 text-sm font-semibold text-primary hover:underline"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); setCurrentPage(1); }}>
                Clear search and filters
            </button>
        </div>
    );

    const renderListFooter = (pagination: { total: number; per_page: number; current_page: number; last_page: number }) => {
        const page = pagination.current_page || currentPage;
        const size = pagination.per_page || 10;
        const last = pagination.last_page || 1;
        const from = pagination.total === 0 ? 0 : (page - 1) * size + 1;
        const to = Math.min(page * size, pagination.total);
        const btn = "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground";

        return (
            <div className="mt-2 flex flex-col items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 sm:flex-row sm:justify-between">
                {/* Showing X to Y of N */}
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{from}</span> to{" "}
                    <span className="font-semibold text-foreground">{to}</span> of{" "}
                    <span className="font-semibold text-foreground">{pagination.total}</span> appointments
                </p>

                {/* Page size (admin setting) */}
                {(listMeta?.per_page_options?.length ?? 0) > 0 && (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        Show
                        <select
                            value={String(perPage ?? listMeta?.default_per_page ?? size)}
                            onChange={(e) => { setPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}
                            className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        >
                            {(listMeta.per_page_options as number[]).map((n) => <option key={n} value={n}>{n}</option>)}
                            {listMeta?.allow_all && <option value="all">All</option>}
                        </select>
                        per page
                    </label>
                )}

                {/* First / previous / page / next / last */}
                <div className="flex items-center gap-1.5">
                    <button type="button" className={btn} onClick={() => handlePageChange(1)} disabled={page <= 1} aria-label="First page">
                        <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button type="button" className={btn} onClick={() => handlePageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-sm text-muted-foreground whitespace-nowrap">
                        Page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{last}</span>
                    </span>
                    <button type="button" className={btn} onClick={() => handlePageChange(page + 1)} disabled={page >= last} aria-label="Next page">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button type="button" className={btn} onClick={() => handlePageChange(last)} disabled={page >= last} aria-label="Last page">
                        <ChevronsRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    };

    // Upcoming Tab Content
    // "Today": every appointment dated today (done or not) until the day is over.
    // "Upcoming": from tomorrow on (the API splits them, see AppointmentController::index).
    const UpcomingContent = ({ type = 'upcoming' }: { type?: 'all' | 'today' | 'upcoming' }) => {
        if (isLoading) return <LoadingState />;
        if (isError) return <ErrorState />;

        // The All tab must retain every status, including past, cancelled and unpaid bookings.
        const upcomingApps = type === 'all' || type === 'today' ? (data?.data ?? []) : filterAppointments(data?.data);
        const pagination = data?.pagination;

        if (upcomingApps.length === 0 && (!pagination || pagination.total === 0)) {
            return hasFilters ? renderNoMatch() : <EmptyState type={type} />;
        }

        return (
            <div className="space-y-6">

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 mt-3">
                    {upcomingApps.map((app: AppointmentResponse) => {
                        const transformedApp = transformToAppointment(app);
                        const transformedDoctor = transformToDoctor(app);
                        return (
                            <UpcomingAppointmentCard
                                key={app.appointment_id}
                                appointment={transformedApp}
                                doctor={transformedDoctor}
                                onManageClick={handleManageAppointment}
                                consultationType={app.consultation_type_label || app.schedule?.consultation_type_label}
                                fee={app.fee_amount}
                                currencySymbol={app.currency_symbol}
                                joinUrl={app.join_url || app.video_consultation?.join_url}
                                call_now={app.call_now}
                                isRejoin={Boolean((app as any).call_is_rejoin)}
                                status={app.status}
                                statusLabel={(app as any).status_label}
                                bookedForName={(app as any).booked_for?.name}
                                isTestDoctor={Boolean((app as any).doctor?.is_test_doctor)}
                                doctorReplacement={(app as any).doctor_replacement}
                            />
                        );
                    })}
                </div>

                {pagination && pagination.total > 0 && renderListFooter(pagination)}
            </div>
        );
    };

    // Past Tab Content
    const PastContent = () => {

        if (isLoading) return <LoadingState />;
        if (isError) return <ErrorState />;

        const pastApps = filterAppointments(data?.data);
        const pagination = data?.pagination;

        if (pastApps.length === 0 && (!pagination || pagination.total === 0)) {
            return hasFilters ? renderNoMatch() : <EmptyState type="past" />;
        }

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 mt-3">
                    {pastApps.map((app: AppointmentResponse) => {
                        const transformedApp = transformToAppointment(app);
                        const transformedDoctor = transformToDoctor(app);
                        return (
                            <PastAppointmentCard
                                key={app.appointment_id}
                                appointment={transformedApp}
                                doctor={transformedDoctor}
                                onViewDetails={handleViewDetails}
                                consultationType={app.consultation_type_label || app.schedule?.consultation_type_label}
                                fee={app.fee_amount}
                                currencySymbol={app.currency_symbol}
                                statusLabel={app.status_label}
                                doctorReplacement={(app as any).doctor_replacement}
                            />
                        );
                    })}
                </div>

                {pagination && pagination.total > 0 && renderListFooter(pagination)}
            </div>
        );
    };

    // Unpaid bookings: complete payment on the Review Appointment page, or delete.
    const PendingPaymentContent = () => {
        if (isLoading) return <LoadingState />;
        if (isError) return <ErrorState />;

        const pendingApps = data?.data || [];

        if (pendingApps.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground/40 mb-3" />
                    <p className="font-semibold text-foreground">No pending payments</p>
                    <p className="text-sm text-muted-foreground">Bookings waiting for payment will show here.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 mt-3">
                {pendingApps.map((app: AppointmentResponse) => (
                    <PendingPaymentCard
                        key={app.appointment_id}
                        appointment={transformToAppointment(app)}
                        specialty={transformToDoctor(app)?.specialty}
                        rating={transformToDoctor(app)?.rating}
                        consultationType={app.consultation_type_label || app.schedule?.consultation_type_label}
                        fee={app.fee_amount}
                                currencySymbol={app.currency_symbol}
                        bookedForName={(app as any).booked_for?.name}
                        onComplete={(id) => router.push(`/appointments/${id}`)}
                        onDelete={(id) => setDeleteId(id)}
                    />
                ))}
            </div>
        );
    };

    // Reset to page 1 when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value as 'all' | 'today' | 'upcoming' | 'past' | 'pending_payment');
        setStatusFilter('all'); // statuses differ per tab
        setCurrentPage(1);
    };

    // Define tabs with dynamic content
    const tabs = [
        {
            key: 'all',
            label: 'All',
            content: <UpcomingContent type="all" />,
        },
        {
            key: 'today',
            label: 'Today',
            content: <UpcomingContent type="today" />,
        },
        {
            key: 'upcoming',
            label: 'Upcoming',
            content: <UpcomingContent />,
        },
        {
            key: 'pending_payment',
            label: 'Pending Payment',
            content: <PendingPaymentContent />,
        },
        {
            key: 'past',
            label: 'Past',
            content: <PastContent />,
        },
    ];

    return (
        <>
            <HeroSection
                title="My Appointments"
                description='Connect with world-class specialists curated for your health journey. Expert clinical care delivered with a human touch.'
            />
            <div className="space-y-6 container-max-width mx-auto w-full">
                {isFetching && (
                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground" role="status">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Loading appointments…
                    </p>
                )}
                {activeTab !== 'pending_payment' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_200px]">
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search doctor, date (12 Nov 2026), month (Nov), video / clinic…"
                            className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                        >
                            <option value="all">All statuses</option>
                            {((listMeta?.status_options ?? []) as { value: string; label: string; count: number }[]).map((o) => (
                                <option key={o.value} value={o.value}>{o.label} ({o.count})</option>
                            ))}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                            className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                        >
                            <option value="all">Video and in-person</option>
                            <option value="video">Video</option>
                            <option value="in-person">In-person</option>
                        </select>
                    </div>
                )}
                <CustomTabs
                    variant="pill"
                    activeTabBg="#013220"
                    activeTabColor="white"
                    tabs={tabs}
                    defaultTab="upcoming"
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    tabsListClassName="w-full md:max-w-2xl overflow-x-auto overflow-y-hidden scrollbar-none flex-nowrap justify-start sm:justify-start md:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                />
            </div>

            <CustomDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                type="danger"
                icon={<AlertCircle className="h-6 w-6 text-destructive" />}
                title="Delete this booking?"
                description="The unpaid booking will be removed and the slot released. This cannot be undone."
                confirmText={deleting ? 'Deleting...' : 'Yes, Delete'}
                cancelText="Keep"
                onConfirm={handleDeleteUnpaid}
                loading={deleting}
            />
        </>
    );
};

export default AppointmentsPage;
