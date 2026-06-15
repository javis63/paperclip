import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  resetting: boolean;
}

/**
 * Top-level error boundary for the whole board app.
 *
 * Without this, any uncaught render error unmounts the React tree and leaves a
 * blank white page with no way to recover — a failure that disproportionately
 * hits mobile/installed-PWA sessions, where a device-specific error or a stale
 * cached asset bundle can no longer resolve. Instead of a dead screen we show
 * an actionable recovery card and surface the real error to the console so the
 * underlying cause stays diagnosable.
 *
 * "Reset & reload" purges Cache Storage and unregisters service workers before
 * reloading, which clears the classic stale-PWA-cache state that bricks a
 * previously-working install after a deploy.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { hasError: false, error: null, resetting: false };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Paperclip UI crashed; showing recovery screen", {
      error,
      componentStack: info.componentStack,
    });
  }

  private reload = () => {
    window.location.reload();
  };

  private resetAndReload = async () => {
    this.setState({ resetting: true });
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } catch (error) {
      console.error("Failed to clear cached app state", error);
    } finally {
      window.location.reload();
    }
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="bg-background text-foreground flex min-h-dvh items-center justify-center p-6 pt-[env(safe-area-inset-top)]">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The app hit an unexpected error and couldn&apos;t finish loading. Reloading usually
            fixes it. If it keeps happening, reset the app to clear cached data.
          </p>
          {this.state.error?.message ? (
            <p className="mt-3 break-words rounded-md bg-muted px-3 py-2 text-left text-xs font-mono text-muted-foreground">
              {this.state.error.message}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={this.reload} disabled={this.state.resetting}>
              Reload
            </Button>
            <Button
              variant="outline"
              onClick={() => void this.resetAndReload()}
              disabled={this.state.resetting}
            >
              {this.state.resetting ? "Resetting…" : "Reset & reload"}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
