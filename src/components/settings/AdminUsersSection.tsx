import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usersApi, type ApiUserListItem } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { Badge } from '@/components/ui/badge';

export function AdminUsersSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState<ApiUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<ApiUserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<ApiUserListItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await usersApi.list();
      setUsers(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modalOpen) {
      fetchUsers();
    }
  }, [modalOpen, fetchUsers]);

  return (
    <>
      <Button variant="outline" onClick={() => setModalOpen(true)}>
        <Users className="w-4 h-4 mr-2" />
        Manage users
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[85vh] flex flex-col max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage users</DialogTitle>
            <DialogDescription>
              Add, edit, or remove user accounts. Role changes in the database take effect after you sign out and sign in again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add user
              </Button>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="space-y-2 overflow-y-auto min-h-0">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-md border bg-muted/30 shrink-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditUser(u)}
                        aria-label="Edit user"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteUser(u)}
                        aria-label="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => { setCreateOpen(false); fetchUsers(); }}
      />
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => { if (!open) setEditUser(null); }}
          onSuccess={() => { setEditUser(null); fetchUsers(); }}
        />
      )}
      {deleteUser && (
        <ConfirmationDialog
          open={!!deleteUser}
          onOpenChange={(open) => { if (!open) setDeleteUser(null); }}
          title="Delete user"
          message={`Are you sure you want to delete ${deleteUser.name} (${deleteUser.email})? This cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={async () => {
            try {
              await usersApi.delete(deleteUser.id);
              toast.success('User deleted');
              setDeleteUser(null);
              fetchUsers();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Failed to delete user');
            }
          }}
        />
      )}
    </>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.create({ email: email.trim(), password, name: name.trim(), role });
      toast.success('User created');
      setEmail(''); setPassword(''); setName(''); setRole('user');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>Create a new user account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="create-name">Name</Label>
            <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="create-email">Email</Label>
            <Input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="create-password">Password</Label>
            <Input id="create-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'admin')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: ApiUserListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<'user' | 'admin'>(user.role);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length > 0 && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.update(user.id, {
        name: name.trim(),
        role,
        ...(password ? { password } : {}),
      });
      toast.success('User updated');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update name, role, or password for {user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'admin')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-password">New password (leave blank to keep)</Label>
            <Input id="edit-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Optional" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
