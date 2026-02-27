import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional label for context (e.g. "Insights", "Voice") */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Local error boundary with minimal fallback: message + "Try again".
 * Use around Insights, Charts, Voice panel so one failing component does not take down the whole screen.
 */
export class LocalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`LocalErrorBoundary [${this.props.label ?? 'local'}]:`, error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {this.props.label ? `${this.props.label}: ` : ''}Something went wrong
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message ?? 'An error occurred'}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
