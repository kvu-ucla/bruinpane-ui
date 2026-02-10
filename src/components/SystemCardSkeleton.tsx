export default function SystemCardSkeleton() {
    return (
        <div className="card bg-base-200 animate-pulse">
            <div className="card-body p-4">
                <div className="flex gap-4">
                    {/* Camera preview skeletons */}
                    <div className="flex-shrink-0 flex gap-2">
                        <div className="w-24 h-24 rounded-lg bg-base-300"></div>
                        <div className="w-24 h-24 rounded-lg bg-base-300"></div>
                        <div className="w-24 h-24 rounded-lg bg-base-300"></div>
                    </div>

                    {/* Text skeletons */}
                    <div className="flex-1 space-y-3">
                        <div className="h-6 bg-base-300 rounded w-3/4"></div>
                        <div className="h-4 bg-base-300 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
