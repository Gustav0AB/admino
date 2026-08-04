import { Card } from "@/shared/ui";

type Props = {
  featureName: string;
};

export function ComingSoon({ featureName }: Props) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-6">
      <Card className="max-w-sm text-center">
        <div className="mb-3 text-5xl">🚧</div>
        <h1 className="text-xl font-bold text-gray-900">{featureName}</h1>
        <p className="mt-2 text-sm font-medium text-gray-500">Coming soon</p>
        <p className="mt-2 text-sm text-gray-400">
          This feature is under development and will be available in a future update.
        </p>
      </Card>
    </div>
  );
}
