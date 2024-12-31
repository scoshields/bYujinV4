import React from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface FriendRequest {
  id: string;
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface FriendRequestsProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export default function FriendRequests({ requests, onAccept, onDecline }: FriendRequestsProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-4 text-text-secondary">
        No pending friend requests
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-3 border border-divider rounded-lg bg-surface"
        >
          <div className="flex items-center gap-3">
            {request.user.avatar_url ? (
              <img
                src={request.user.avatar_url}
                alt={request.user.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
                <span className="text-accent-blue font-medium">
                  {request.user.first_name[0]}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-text-primary">
                {request.user.first_name} {request.user.last_name}
              </div>
              <div className="text-sm text-text-secondary">
                @{request.user.username}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAccept(request.id)}
              className="p-1 text-accent-green hover:text-accent-green-hover"
              title="Accept request"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDecline(request.id)}
              className="p-1 text-error hover:text-error/80"
              title="Decline request"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}