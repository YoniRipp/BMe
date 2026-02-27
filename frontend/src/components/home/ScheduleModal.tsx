import { useState, useEffect } from 'react';
import {
  ScheduleItem,
  SCHEDULE_CATEGORIES,
  CATEGORY_EMOJIS,
  SCHEDULE_COLOR_PRESET_IDS,
} from '@/types/schedule';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGroups } from '@/hooks/useGroups';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<ScheduleItem, 'id'>) => void;
  item?: ScheduleItem;
  /** When adding a new item, use this as the default date (YYYY-MM-DD). */
  initialDate?: string;
  /** When adding a new item, preselect this group. */
  initialGroupId?: string;
}

export function ScheduleModal({ open, onOpenChange, onSave, item, initialDate, initialGroupId }: ScheduleModalProps) {
  const { groups } = useGroups();
  const [formData, setFormData] = useState({
    date: todayStr(),
    title: '',
    startTime: '',
    endTime: '',
    category: '',
    order: 0,
    isActive: true,
    color: '' as string,
    groupId: '' as string,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        date: item.date ?? todayStr(),
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        category: item.category,
        order: item.order,
        isActive: item.isActive,
        color: item.color ?? '',
        groupId: item.groupId ?? '',
      });
    } else {
      setFormData({
        date: initialDate ?? todayStr(),
        title: '',
        startTime: '',
        endTime: '',
        category: '',
        order: 0,
        isActive: true,
        color: '',
        groupId: initialGroupId ?? '',
      });
    }
  }, [item, open, initialDate, initialGroupId]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        date: formData.date,
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        category: formData.category,
        emoji: CATEGORY_EMOJIS[formData.category],
        order: formData.order,
        isActive: formData.isActive,
        color: formData.color || undefined,
        groupId: formData.groupId || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Schedule' : 'Add Schedule Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_EMOJIS[cat]} {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color || 'default'}
                onValueChange={(value) => setFormData({ ...formData, color: value === 'default' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default (use category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (use category)</SelectItem>
                  {SCHEDULE_COLOR_PRESET_IDS.map((presetId) => (
                    <SelectItem key={presetId} value={presetId}>
                      {presetId.charAt(0).toUpperCase() + presetId.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="group">Group (optional)</Label>
              <Select
                value={formData.groupId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, groupId: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : `${item ? 'Update' : 'Add'} Item`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
