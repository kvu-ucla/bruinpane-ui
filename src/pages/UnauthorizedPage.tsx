export const UnauthorizedPage = () => {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-4xl font-bold">Unauthorized</h1>
            <p className="text-base-content/60">
                You do not have access to this page or resource. Contact the system administrator. 
            </p>
        </div>
    );
};
