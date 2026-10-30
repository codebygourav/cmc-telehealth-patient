const LoadingSkeleton = () => {
    return (
        <div className="container-max-width w-full mx-auto space-y-6 sm:space-y-8 animate-pulse">

            {/* Hero Section Skeleton */}
            <div className="-mx-5 -mt-5 sm:mt-0 sm:mx-auto w-[calc(100%+2.5rem)] sm:w-full container-max-width px-5 py-6 md:py-12 md:px-10 bg-[#F5F6F8] rounded-none sm:rounded-md border-b sm:border border-[#E7E8EB] mb-5">
                <div className="max-w-[600px] mx-auto flex flex-col items-center justify-center">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-80 max-w-full bg-gray-200 rounded" />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">

                {/* Sidebar Skeleton */}
                <aside className="w-full lg:w-72 flex-shrink-0">
                    <div className="sticky top-28 space-y-8">
                        <div className="h-8 w-32 bg-gray-200 rounded" />
                        <div className="space-y-6">
                            {[1, 2].map((i) => (
                                <div key={i} className="space-y-3">
                                    <div className="h-4 w-24 bg-gray-200 rounded" />
                                    <div className="h-12 w-full bg-gray-200 rounded-md" />
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Cards Skeleton */}
                <div className="flex-grow">
                    <div className="flex justify-between mb-8">
                        <div className="h-6 w-48 bg-gray-200 rounded" />
                        <div className="h-6 w-32 bg-gray-200 rounded" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-100 p-6 rounded-3xl h-80" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton;