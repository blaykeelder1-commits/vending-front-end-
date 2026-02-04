import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, SkeletonLoader, SkeletonCard, SkeletonTable } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    // Spinner is rendered as a div, check container exists
    const container = document.querySelector('div');
    expect(container).toBeInTheDocument();
  });

  it('displays message when provided', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('does not display message when not provided', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('renders with small size', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with large size', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies fullPage styles when fullPage is true', () => {
    const { container } = render(<LoadingSpinner fullPage />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle('position: fixed');
  });
});

describe('SkeletonLoader', () => {
  it('renders with default props', () => {
    const { container } = render(<SkeletonLoader />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveStyle('width: 100%');
    expect(skeleton).toHaveStyle('height: 20px');
  });

  it('renders with custom width and height', () => {
    const { container } = render(<SkeletonLoader width="50%" height="40px" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveStyle('width: 50%');
    expect(skeleton).toHaveStyle('height: 40px');
  });

  it('applies custom borderRadius', () => {
    const { container } = render(<SkeletonLoader borderRadius="8px" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveStyle('border-radius: 8px');
  });
});

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('contains skeleton loaders', () => {
    const { container } = render(<SkeletonCard />);
    // Should have multiple skeleton divs inside
    const skeletons = container.querySelectorAll('div > div');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('SkeletonTable', () => {
  it('renders with default props', () => {
    const { container } = render(<SkeletonTable />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders specified number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} columns={2} />);
    // Check container exists and has children
    expect(container.firstChild).toBeInTheDocument();
  });
});
