import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ScheduleProvider } from './ScheduleContext';
import { useSchedule } from '@/hooks/useSchedule';
import { ScheduleItem } from '@/types/schedule';

const mockList = vi.fn().mockResolvedValue([]);
const mockAdd = vi.fn().mockImplementation((item: { title: string }) =>
  Promise.resolve({
    id: 'new-id',
    title: item.title,
    startTime: '09:00',
    endTime: '10:00',
    category: 'Other',
    order: 0,
    isActive: true,
  })
);
const mockUpdate = vi.fn().mockImplementation((id: string, updates: Partial<ScheduleItem>) =>
  Promise.resolve({ id, title: 'Updated', startTime: '09:00', endTime: '10:00', category: 'Other', order: 0, isActive: true, ...updates })
);
const mockDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/api', () => ({
  scheduleApi: {
    list: () => mockList(),
    add: (item: unknown) => mockAdd(item),
    addBatch: vi.fn().mockResolvedValue([]),
    update: (id: string, updates: unknown) => mockUpdate(id, updates),
    delete: (id: string) => mockDelete(id),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ScheduleProvider>{children}</ScheduleProvider>
);

describe('ScheduleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([]);
  });

  it('provides schedule items and loading state', async () => {
    const { result } = renderHook(() => useSchedule(), { wrapper });
    expect(result.current.scheduleItems).toBeDefined();
    expect(Array.isArray(result.current.scheduleItems)).toBe(true);
    await waitFor(() => {
      expect(result.current.scheduleLoading).toBe(false);
    });
  });

  it('adds schedule item via API', async () => {
    mockList.mockResolvedValue([]);
    const { result } = renderHook(() => useSchedule(), { wrapper });

    await waitFor(() => expect(result.current.scheduleLoading).toBe(false));

    const newItem: Omit<ScheduleItem, 'id'> = {
      title: 'Test Schedule',
      startTime: '09:00',
      endTime: '10:00',
      category: 'Work',
      isActive: true,
      order: 0,
    };

    act(() => {
      result.current.addScheduleItem(newItem);
    });

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test Schedule' }));
      expect(result.current.scheduleItems.length).toBe(1);
      expect(result.current.scheduleItems[0].title).toBe('Test Schedule');
    });
  });

  it('updates schedule item via API', async () => {
    mockList.mockResolvedValue([{ id: 'test-id', title: 'Test', startTime: '09:00', endTime: '10:00', category: 'Work', order: 0, isActive: true }]);
    const { result } = renderHook(() => useSchedule(), { wrapper });

    await waitFor(() => expect(result.current.scheduleLoading).toBe(false));

    act(() => {
      result.current.updateScheduleItem('test-id', { title: 'Updated Title' });
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('test-id', { title: 'Updated Title' });
    });
  });

  it('deletes schedule item via API', async () => {
    mockList.mockResolvedValue([{ id: 'test-id', title: 'Test', startTime: '09:00', endTime: '10:00', category: 'Work', order: 0, isActive: true }]);
    const { result } = renderHook(() => useSchedule(), { wrapper });

    await waitFor(() => expect(result.current.scheduleLoading).toBe(false));

    act(() => {
      result.current.deleteScheduleItem('test-id');
    });

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('test-id');
    });
  });

  it('gets schedule item by id', async () => {
    mockList.mockResolvedValue([
      { id: 'test-id', title: 'Test Schedule', startTime: '09:00', endTime: '10:00', category: 'Work', order: 0, isActive: true },
    ]);
    const { result } = renderHook(() => useSchedule(), { wrapper });

    await waitFor(() => expect(result.current.scheduleLoading).toBe(false));

    const item = result.current.getScheduleItemById('test-id');
    expect(item).toBeDefined();
    expect(item?.title).toBe('Test Schedule');
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSchedule());
    }).toThrow('useSchedule must be used within ScheduleProvider');

    consoleSpy.mockRestore();
  });
});
