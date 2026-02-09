interface SystemZonesProps {
  zones: string[];
}

export default function SystemZones({ zones }: SystemZonesProps) {
  if (!zones || zones.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Zones ({zones.length})</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {zones.map((zone, index) => (
            <span key={index} className="badge badge-outline">
              {zone}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
