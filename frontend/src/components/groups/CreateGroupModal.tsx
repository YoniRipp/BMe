import { useState, useEffect } from 'react';
import { Group, GROUP_TYPES } from '@/types/group';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STORAGE_KEYS, storage } from '@/lib/storage';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: Omit<Group, 'id' | 'createdAt'>) => void;
}

export function CreateGroupModal({ open, onOpenChange, onSave }: CreateGroupModalProps) {
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'household' as typeof GROUP_TYPES[number] | string,
    customTypeName: '',
  });

  // Load custom types when modal opens
  useEffect(() => {
    if (open) {
      const saved = storage.get<string[]>(STORAGE_KEYS.CUSTOM_GROUP_TYPES) || [];
      setCustomTypes(saved);
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: '', description: '', type: 'household', customTypeName: '' });
    }
  }, [open]);

  const allTypes = [...GROUP_TYPES.filter(t => t !== 'other'), ...customTypes, 'other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalType = formData.type;
    
    // If "other" is selected and custom type name is provided
    if (formData.type === 'other' && formData.customTypeName.trim()) {
      finalType = formData.customTypeName.trim();
      
      // Save custom type if it doesn't exist
      if (!customTypes.includes(finalType)) {
        const updated = [...customTypes, finalType];
        storage.set(STORAGE_KEYS.CUSTOM_GROUP_TYPES, updated);
        setCustomTypes(updated);
      }
    }

    onSave({
      name: formData.name,
      description: formData.description,
      type: finalType,
      members: [],
      invitations: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value, customTypeName: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'other' ? 'Other' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'other' && (
              <div>
                <Label htmlFor="customTypeName">Custom Type Name</Label>
                <Input
                  id="customTypeName"
                  required
                  value={formData.customTypeName}
                  onChange={(e) => setFormData({ ...formData, customTypeName: e.target.value })}
                  placeholder="e.g., Family, Club, etc."
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Group</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
