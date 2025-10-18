import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Simple Test', () => {
  it('renders without crashing', () => {
    render(
      <div>
        <h1>Test Component</h1>
      </div>
    );
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
