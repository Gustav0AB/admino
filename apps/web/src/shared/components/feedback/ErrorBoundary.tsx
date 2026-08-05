import { Component, type ReactNode } from "react";
import { Button, Card } from "@/shared/ui";

type ErrorBoundaryState = {
  error: Error | null;
};

type ErrorBoundaryClassProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

class ErrorBoundaryClass extends Component<ErrorBoundaryClassProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return fallback(error, this.reset);

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl font-bold text-red-700">!</div>
          <h1 className="text-xl font-bold text-gray-900">Algo salió mal</h1>
          <p className="mt-2 text-sm text-gray-500">{error.message}</p>
          <Button className="mt-6" onClick={this.reset}>Intentar de nuevo</Button>
        </Card>
      </main>
    );
  }
}

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return <ErrorBoundaryClass fallback={fallback}>{children}</ErrorBoundaryClass>;
}
