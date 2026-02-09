import { SystemData } from '../models';

interface SystemInfoProps {
  system: SystemData;
}

export default function SystemInfo({ system }: SystemInfoProps) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">System Information</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-sm text-base-content/60">System ID</div>
            <div className="font-mono text-sm mt-1">{system.id}</div>
          </div>
          {system.display_name && (
            <div>
              <div className="text-sm text-base-content/60">Display Name</div>
              <div className="text-sm mt-1">{system.display_name}</div>
            </div>
          )}
          {system.capacity !== undefined && (
            <div>
              <div className="text-sm text-base-content/60">Capacity</div>
              <div className="text-sm mt-1">
                {system.capacity} {system.capacity === 1 ? 'person' : 'people'}
              </div>
            </div>
          )}
          {system.bookable !== undefined && (
            <div>
              <div className="text-sm text-base-content/60">Bookable</div>
              <div className="text-sm mt-1">
                <span className={`badge ${system.bookable ? 'badge-success' : 'badge-ghost'}`}>
                  {system.bookable ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          )}
          {system.public !== undefined && (
            <div>
              <div className="text-sm text-base-content/60">Public</div>
              <div className="text-sm mt-1">
                <span className={`badge ${system.public ? 'badge-info' : 'badge-ghost'}`}>
                  {system.public ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          )}
          {system.timezone && (
            <div>
              <div className="text-sm text-base-content/60">Timezone</div>
              <div className="text-sm mt-1">{system.timezone}</div>
            </div>
          )}
          {system.installed_ui_devices !== undefined && (
            <div>
              <div className="text-sm text-base-content/60">UI Devices</div>
              <div className="text-sm mt-1">{system.installed_ui_devices}</div>
            </div>
          )}
          {system.signage !== undefined && (
            <div>
              <div className="text-sm text-base-content/60">Signage</div>
              <div className="text-sm mt-1">
                <span className={`badge ${system.signage ? 'badge-success' : 'badge-ghost'}`}>
                  {system.signage ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          )}
          {system.orientation && (
            <div>
              <div className="text-sm text-base-content/60">Orientation</div>
              <div className="text-sm mt-1 capitalize">{system.orientation}</div>
            </div>
          )}
          {system.version !== undefined && (
            <div>
              <div className="text-sm text-base-content/60">Version</div>
              <div className="text-sm mt-1">{system.version}</div>
            </div>
          )}
          {system.updated_at && (
            <div>
              <div className="text-sm text-base-content/60">Last Updated</div>
              <div className="text-sm mt-1">
                {new Date(system.updated_at * 1000).toLocaleString()}
              </div>
            </div>
          )}
        </div>
        {system.description && (
          <div className="mt-4">
            <div className="text-sm text-base-content/60">Description</div>
            <p className="text-sm mt-1">{system.description}</p>
          </div>
        )}
        {system.support_url && (
          <div className="mt-4">
            <div className="text-sm text-base-content/60">Support URL</div>
            <a
              href={system.support_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-1 inline-block"
            >
              {system.support_url}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
