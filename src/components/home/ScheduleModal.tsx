import { useState, useEffect } from 'react';
import { ScheduleItem, SCHEDULE_CATEGORIES, CATEGORY_EMOJIS } from '@/types/schedule';
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

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<ScheduleItem, 'id'>) => void;
  item?: ScheduleItem;
}

export function ScheduleModal({ open, onOpenChange, onSave, item }: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    category: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        category: item.category,
        order: item.order,
        isActive: item.isActive,
      });
    } else {
      setFormData({
        title: '',
        startTime: '',
        endTime: '',
        category: '',
        order: 0,
        isActive: true,
      });
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: formData.title,
      startTime: formData.startTime,
      endTime: formData.endTime,
      category: formData.category,
      emoji: CATEGORY_EMOJIS[formData.category],
      order: formData.order,
      isActive: formData.isActive,
    });
    // Parent closes modal after successful save (add or update)
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
            <Button type="submit">
              {item ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
