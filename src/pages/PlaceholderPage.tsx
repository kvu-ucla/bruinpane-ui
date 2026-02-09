import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Construction className="mx-auto mb-4 text-base-content/40" size={64} />
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-base-content/60">This page is under construction</p>
      </div>
    </div>
  );
}
