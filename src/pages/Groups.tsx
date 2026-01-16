import { useState } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { Group } from '@/types/group';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { GroupCard } from '@/components/groups/GroupCard';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { GroupSettingsModal } from '@/components/groups/GroupSettingsModal';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

export function Groups() {
  const { groups, addGroup } = useGroups();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);

  const handleSettings = (group: Group) => {
    setSelectedGroup(group);
    setSettingsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Groups"
        subtitle="Manage shared groups, expenses and tasks"
        icon={Users}
        iconColor="text-indigo-600"
      />

      <div className="flex justify-end">
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="You don't have any groups yet"
          description="Create your first group to collaborate with others"
          action={{
            label: "Create your first group",
            onClick: () => setCreateModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onSettings={handleSettings}
            />
          ))}
        </div>
      )}

      <CreateGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={addGroup}
      />

      <GroupSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        group={selectedGroup}
      />
    </div>
  );
}
