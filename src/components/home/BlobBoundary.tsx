import { Component, type ReactNode } from 'react';

interface BlobBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface BlobBoundaryState {
  hasError: boolean;
}

export class BlobBoundary extends Component<BlobBoundaryProps, BlobBoundaryState> {
  state: BlobBoundaryState = { hasError: false };

  static getDerivedStateFromError(): BlobBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Silently swap to fallback — 3D init failures on simulators or missing GL contexts
    // are expected and recovered via the SVG fallback.
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
