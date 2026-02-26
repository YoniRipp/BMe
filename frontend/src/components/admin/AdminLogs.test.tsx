import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLogs } from './AdminLogs';

const mockGetLogs = vi.fn();
const mockGetActivity = vi.fn();
const mockSearchUsers = vi.fn();

vi.mock('@/core/api/admin', () => ({
  adminApi: {
    getLogs: (...args: unknown[]) => mockGetLogs(...args),
    getActivity: (...args: unknown[]) => mockGetActivity(...args),
    searchUsers: (...args: unknown[]) => mockSearchUsers(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

const mockEvents = [
  {
    id: 'ev-1',
    eventType: 'auth.Login',
    eventId: 'evid-1',
    summary: 'User logged in',
    payload: null,
    createdAt: '2025-02-24T12:00:00.000Z',
    userId: 'u1',
    userEmail: 'u1@test.com',
    userName: 'User One',
  },
];

describe('AdminLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLogs.mockResolvedValue([]);
    mockGetActivity.mockResolvedValue({ events: mockEvents, nextCursor: undefined });
    mockSearchUsers.mockResolvedValue([]);
  });

  it('renders Logs, Log errors, Activity tabs', () => {
    render(<AdminLogs />);
    expect(screen.getByRole('button', { name: /logs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log errors/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument();
  });

  it('clicking Activity tab calls adminApi.getActivity with from/to and limit', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await user.click(screen.getByRole('button', { name: /activity/i }));

    await waitFor(() => {
      expect(mockGetActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          from: expect.any(String),
          to: expect.any(String),
        })
      );
    });
  });

  it('time presets trigger getActivity with correct range when clicked', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await user.click(screen.getByRole('button', { name: /activity/i }));
    await waitFor(() => expect(mockGetActivity).toHaveBeenCalled());

    mockGetActivity.mockClear();
    await user.click(screen.getByRole('button', { name: /last 7d/i }));
    await waitFor(() => expect(mockGetActivity).toHaveBeenCalled());
    expect(mockGetActivity).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, from: expect.any(String), to: expect.any(String) })
    );

    mockGetActivity.mockClear();
    await user.click(screen.getByRole('button', { name: /last 30d/i }));
    await waitFor(() => expect(mockGetActivity).toHaveBeenCalled());
    expect(mockGetActivity).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, from: expect.any(String), to: expect.any(String) })
    );
  });

  it('when getActivity returns events, table shows rows with Time, User, Event type, Summary', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await user.click(screen.getByRole('button', { name: /activity/i }));

    await waitFor(() => {
      expect(screen.getByText('Time (UTC)')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Event type')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('auth.Login')).toBeInTheDocument();
      expect(screen.getByText('User logged in')).toBeInTheDocument();
    });
  });

  it('when no events, shows No events in selected time range', async () => {
    mockGetActivity.mockResolvedValueOnce({ events: [], nextCursor: undefined });
    const user = userEvent.setup();
    render(<AdminLogs />);

    await user.click(screen.getByRole('button', { name: /activity/i }));

    await waitFor(() => {
      expect(screen.getByText('No events in selected time range')).toBeInTheDocument();
    });
  });

  it('event type filter is present when Activity tab is shown', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await user.click(screen.getByRole('button', { name: /activity/i }));
    await waitFor(() => expect(mockGetActivity).toHaveBeenCalled());

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('user search triggers debounced searchUsers when typing', async () => {
    mockSearchUsers.mockResolvedValue([{ id: 'u1', email: 'u@test.com', name: 'Test User' }]);
    const user = userEvent.setup();
    render(<AdminLogs />);

    await user.click(screen.getByRole('button', { name: /activity/i }));
    await waitFor(() => expect(mockGetActivity).toHaveBeenCalled());

    const input = screen.getByPlaceholderText(/search user by email or name/i);
    await user.type(input, 'test');

    await waitFor(
      () => {
        expect(mockSearchUsers).toHaveBeenCalledWith('test', 20);
      },
      { timeout: 2000 }
    );
  });

  it('load more calls getActivity with before cursor when nextCursor present', async () => {
    mockGetActivity
      .mockResolvedValueOnce({ events: mockEvents, nextCursor: 'cursor-abc' })
      .mockResolvedValueOnce({ events: [], nextCursor: undefined });
    const user = userEvent.setup();
    render(<AdminLogs />);

    await user.click(screen.getByRole('button', { name: /activity/i }));
    await waitFor(() => expect(mockGetActivity).toHaveBeenCalled(), { timeout: 3000 });

    const loadMoreBtn = await screen.findByRole('button', { name: /load more/i }, { timeout: 3000 });
    await user.click(loadMoreBtn);

    await waitFor(
      () => {
        expect(mockGetActivity).toHaveBeenCalledWith(
          expect.objectContaining({ before: 'cursor-abc' })
        );
      },
      { timeout: 3000 }
    );
  }, 10000);
});
