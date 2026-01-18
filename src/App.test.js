import { render, screen } from '@testing-library/react';
import App from './App';

test('renders IDDI homepage', () => {
  render(<App />);
  const headingElement = screen.getByText(/IDDI/i);
  expect(headingElement).toBeInTheDocument();
});
