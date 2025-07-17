import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../components/App';

test('renders numbl title', () => {
  render(<App />);
  const titleElement = screen.getByText(/numbl/i);
  expect(titleElement).toBeInTheDocument();
});
