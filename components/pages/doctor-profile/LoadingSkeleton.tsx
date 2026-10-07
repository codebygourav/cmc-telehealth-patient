// Same layout as the doctor detail page, so nothing jumps when the data arrives.
const Bar = ({ className = '' }: { className?: string }) => <div className={`rounded bg-gray-200 ${className}`} />;

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-[#E7E8EB] p-5 shadow-[0px_2px_4px_0px_#0000001A] ${className}`}>{children}</div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse" aria-busy="true" aria-label="Loading doctor details">
    {/* Hero */}
    <div className="container-max-width mx-auto mb-5 flex w-full flex-col items-center gap-3 rounded-md bg-[#F5F6F8] px-4 py-10 md:py-14">
      <Bar className="h-8 w-56" />
      <Bar className="h-4 w-80 max-w-full" />
      <Bar className="h-4 w-64 max-w-full" />
    </div>

    <div className="container-max-width mx-auto grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12">
      {/* Left: doctor card + sections */}
      <div className="space-y-8 lg:col-span-7">
        <div className="overflow-hidden rounded-lg border border-[#E7E8EB] shadow-[0px_2px_4px_0px_#0000001A]">
          <div className="flex flex-col items-center gap-5 p-5 sm:flex-row">
            <div className="h-24 w-24 shrink-0 rounded-full bg-gray-200" />
            <div className="flex w-full flex-1 flex-col items-center gap-2.5 sm:items-start">
              <Bar className="h-5 w-28 rounded-full" />
              <Bar className="h-7 w-52" />
              <Bar className="h-4 w-72 max-w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 border-t border-[#E7E8EB] bg-[#F9FAFB] px-5 py-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <Bar className="h-2.5 w-16" />
                  <Bar className="h-3.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="space-y-3">
          <Bar className="h-5 w-44" />
          <Bar className="h-3.5 w-full" />
          <Bar className="h-3.5 w-full" />
          <Bar className="h-3.5 w-5/6" />
          <Bar className="h-3.5 w-2/3" />
        </Card>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-gray-200" />
                <Bar className="h-4 w-28" />
              </div>
              <Bar className="h-3.5 w-full" />
              <Bar className="h-3.5 w-4/5" />
            </Card>
          ))}
        </div>
      </div>

      {/* Right: booking card */}
      <Card className="space-y-5 lg:col-span-5">
        <div className="space-y-3">
          <Bar className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#F5F6F8] p-1">
            <div className="h-13 rounded-md bg-gray-200" />
            <div className="h-13 rounded-md bg-gray-100" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Bar className="h-5 w-28" />
            <Bar className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-9 rounded-md bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 border-t border-[#E7E8EB] pt-4">
          <div className="h-18 rounded-lg bg-gray-100" />
          <div className="h-18 rounded-lg bg-gray-100" />
        </div>
        <Bar className="h-10 w-full rounded-md" />
      </Card>
    </div>
  </div>
);

export default LoadingSkeleton;
