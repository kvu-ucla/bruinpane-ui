export const SystemCardSkeleton = () => {
    return (
        <div className="card bg-base-200">
            <div className="card-body p-4">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 flex gap-2">
                        <div className="w-48 h-48 rounded-lg bg-base-300 animate-shimmer"></div>
                        <div className="w-48 h-48 rounded-lg bg-base-300 animate-shimmer"></div>
                        <div className="w-48 h-48 rounded-lg bg-base-300 animate-shimmer"></div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-6 bg-base-300 rounded w-3/4 animate-shimmer"></div>
                        <div className="h-3 bg-base-300 rounded w-1/2 animate-shimmer"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
