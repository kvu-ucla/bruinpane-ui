import { ModuleData } from '../models';

interface SystemModulesProps {
  moduleIds: string[];
  modules: ModuleData[];
}

export default function SystemModules({ moduleIds, modules }: SystemModulesProps) {
  if (!moduleIds || moduleIds.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Modules ({moduleIds.length})</h2>
        <div className="mt-4 space-y-2">
          {moduleIds.map((moduleId, index) => {
            const moduleInfo = modules.find((m) => m.id === moduleId);
            const displayName = moduleInfo?.custom_name || moduleInfo?.name || moduleId;

            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-base-300 rounded-lg hover:bg-base-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-xs text-base-content/60 font-mono mt-1">
                    ID: {moduleId}
                  </div>
                  {moduleInfo?.driver_id && (
                    <div className="text-xs text-base-content/60 mt-1">
                      Driver: {moduleInfo.driver_id}
                    </div>
                  )}
                  {moduleInfo?.ip && (
                    <div className="text-xs text-base-content/60 mt-1">
                      IP: {moduleInfo.ip}
                      {moduleInfo.port && `:${moduleInfo.port}`}
                    </div>
                  )}
                  {moduleInfo?.edge_id && (
                    <div className="text-xs text-base-content/60 mt-1">
                      Edge: {moduleInfo.edge_id}
                    </div>
                  )}
                  {moduleInfo?.connected !== undefined && (
                    <div className="text-xs mt-1">
                      <span
                        className={`badge badge-xs ${
                          moduleInfo.connected ? 'badge-success' : 'badge-error'
                        }`}
                      >
                        {moduleInfo.connected ? 'Connected' : 'Disconnected'}
                      </span>
                      {moduleInfo.running !== undefined && (
                        <span
                          className={`badge badge-xs ml-1 ${
                            moduleInfo.running ? 'badge-info' : 'badge-warning'
                          }`}
                        >
                          {moduleInfo.running ? 'Running' : 'Stopped'}
                        </span>
                      )}
                      {moduleInfo.has_runtime_error && (
                        <span className="badge badge-xs badge-error ml-1">Error</span>
                      )}
                    </div>
                  )}
                  {moduleInfo?.role !== undefined && (
                    <div className="text-xs text-base-content/60 mt-1">
                      Role: {moduleInfo.role}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
