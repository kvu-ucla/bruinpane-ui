export const ForbiddenPage = () => {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-4xl font-bold">403 FORBIDDEN</h1>
            <p className="text-base-content/60">
                You do not have access to this page or resource. Contact the system administrator. 
            </p>
            {/*{auth?.user?.email && (*/}
            {/*    <p className="text-sm text-base-content/40">Signed in as {auth.user.email}</p>*/}
            {/*)}*/}
            {/*<button onClick={() => auth?.logOut()} className="btn btn-outline btn-sm mt-2">*/}
            {/*    Sign out*/}
            {/*</button>*/}
        </div>
    );
};
