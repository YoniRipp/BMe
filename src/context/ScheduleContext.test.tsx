import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ScheduleProvider, useSchedule } from './ScheduleContext';
import { ScheduleItem } from '@/types/schedule';

// Mock storage
vi.mock('@/lib/storage', () => ({
  storage: {
    get: vi.fn(() => null),
    set: vi.fn(),
  },
  STORAGE_KEYS: {
    SCHEDULE: 'beme_schedule',
  },
}));

// Mock useLocalStorage
const mockSetScheduleItems = vi.fn();
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [[], mockSetScheduleItems]),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ScheduleProvider>{children}</ScheduleProvider>
);

describe('ScheduleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides schedule items', () => {
    const { result } = renderHook(() => useSchedule(), { wrapper });
    expect(result.current.scheduleItems).toBeDefined();
    expect(Array.isArray(result.current.scheduleItems)).toBe(true);
  });

  it('adds schedule item', () => {
    const { result } = renderHook(() => useSchedule(), { wrapper });
    
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

    expect(mockSetScheduleItems).toHaveBeenCalled();
  });

  it('updates schedule item', () => {
    const { result } = renderHook(() => useSchedule(), { wrapper });
    
    act(() => {
      result.current.updateScheduleItem('test-id', { title: 'Updated Title' });
    });

    expect(mockSetScheduleItems).toHaveBeenCalled();
  });

  it('deletes schedule item', () => {
    const { result } = renderHook(() => useSchedule(), { wrapper });
    
    act(() => {
      result.current.deleteScheduleItem('test-id');
    });

    expect(mockSetScheduleItems).toHaveBeenCalled();
  });

  it('gets schedule item by id', () => {
    const mockItems: ScheduleItem[] = [
      {
        id: 'test-id',
        title: 'Test Schedule',
        startTime: '09:00',
        endTime: '10:00',
        category: 'Work',
        isActive: true,
        order: 0,
      },
    ];

    vi.mocked(require('@/hooks/useLocalStorage').useLocalStorage).mockReturnValue([
      mockItems,
      mockSetScheduleItems,
    ]);

    const { result } = renderHook(() => useSchedule(), { wrapper });
    
    const item = result.current.getScheduleItemById('test-id');
    expect(item).toBeDefined();
    expect(item?.title).toBe('Test Schedule');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useSchedule());
    }).toThrow('useSchedule must be used within ScheduleProvider');
    
    consoleSpy.mockRestore();
  });
});
