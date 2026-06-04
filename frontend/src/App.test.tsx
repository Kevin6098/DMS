import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login experience at /login', () => {
  window.history.pushState({}, '', '/login');

  render(<App />);

  expect(screen.getByAltText('Task Insight')).toBeInTheDocument();
  expect(document.getElementById('login-email')).toBeInTheDocument();
  expect(document.getElementById('login-password')).toBeInTheDocument();
});
