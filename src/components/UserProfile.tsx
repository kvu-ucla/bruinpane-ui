import { useAuth } from '../AuthContext';

type UserProfileProps = {
    isCollapsed: boolean;
};

const getInitials = (firstName?: string, lastName?: string, name?: string): string => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    return name?.slice(0, 2).toUpperCase() ?? '??';
};

const getRoleLabel = (sysAdmin?: boolean, support?: boolean): string => {
    if (sysAdmin) return 'Admin';
    if (support) return 'Support';
    return 'User';
};

export const UserProfile = ({ isCollapsed }: UserProfileProps) => {
    const auth = useAuth();
    const user = auth?.user;

    const initials = getInitials(user?.first_name, user?.last_name, user?.name);
    const role = getRoleLabel(user?.sys_admin, user?.support);

    return (
        <div className="flex items-center gap-3">
            <div
                className={`avatar placeholder flex-shrink-0 ${isCollapsed ? 'tooltip tooltip-right' : ''}`}
                data-tip={isCollapsed ? user?.name : undefined}
            >
                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                    <span className="text-xs leading-none">{initials}</span>
                </div>
            </div>
            <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'}`}>
                <div className="text-sm font-medium">{user?.name ?? '—'}</div>
                <div className="text-xs text-base-content/60">{role}</div>
            </div>
        </div>
    );
};
