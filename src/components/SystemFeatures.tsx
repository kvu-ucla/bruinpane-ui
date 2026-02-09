interface SystemFeaturesProps {
  features?: string[];
}

export default function SystemFeatures({ features }: SystemFeaturesProps) {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Features</h2>
        <div className="flex flex-wrap gap-2">
          {features.map((feature, index) => (
            <span key={index} className="badge badge-primary badge-lg">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
