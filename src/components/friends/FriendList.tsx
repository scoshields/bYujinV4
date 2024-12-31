import React from 'react';
import { UserX } from 'lucide-react';

interface Friend {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface FriendListProps {
  friends: Friend[];
  onRemove: (friendId: string) => void;
}

export default function FriendList({ friends, onRemove }: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-4 text-text-secondary">
        No friends yet. Use the search above to find friends!
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center justify-between p-4 border border-divider rounded-lg bg-surface"
        >
          <div className="flex items-center gap-3">
            {friend.avatar_url ? (
              <img
                src={friend.avatar_url}
                alt={friend.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
                <span className="text-accent-blue font-medium">
                  {friend.first_name[0]}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-text-primary">
                {friend.first_name} {friend.last_name}
              </div>
              <div className="text-sm text-text-secondary">
                @{friend.username}
              </div>
            </div>
          </div>

          <button
            onClick={() => onRemove(friend.id)}
            className="p-1 text-error hover:text-error/80"
            title="Remove friend"
          >
            <UserX className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
}