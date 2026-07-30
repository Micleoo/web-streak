import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Navbar from '../Navbar';

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNavbar = () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  it('renders login and get started links when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      profile: null,
      signOut: vi.fn(),
    });

    renderNavbar();

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders dashboard and profile name when authenticated', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } },
      user: {
        id: '1',
        name: 'Test User',
      },
      profile: {
        name: 'Test User',
        username: 'testuser',
        currentStreak: 5,
        totalXp: 100
      },
      signOut: vi.fn(),
    });

    renderNavbar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
