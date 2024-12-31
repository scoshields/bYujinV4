import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';

interface ShareWorkoutDialogProps {
  workoutId: string;
  onClose: () => void;
  onShare: () => void;
}

interface Friend {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export default function ShareWorkoutDialog({ workoutId, onClose, onShare }: ShareWorkoutDialogProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sharing, setSharing] = useState(false);

  // Load friends when search changes
  React.useEffect(() => {
    if (search.length >= 1) {
      loadFriends();
    } else {
      setFriends([]);
    }
  }, [search]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          first_name,
          last_name,
          avatar_url
        `)
        .neq('id', user.id)
        .like('username', `%${search}%`)
        .limit(5);

      if (data) {
        setFriends(data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (friendId: string) => {
    setSharing(true);
    try {
      const { data, error } = await supabase
        .rpc('share_workout', {
          p_workout_id: workoutId,
          p_recipient_id: friendId
        });

      if (error) throw error;
      onShare();
      onClose();
    } catch (error) {
      console.error('Error sharing workout:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-semibold text-text-highlight">Share Workout</h2>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-secondary" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="block w-full pl-10 pr-3 py-2 border border-divider rounded-md bg-background text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
          />
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-4 text-text-secondary">Loading...</div>
          ) : friends.length > 0 ? (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleShare(friend.id)}
                disabled={sharing}
                className="w-full flex items-center gap-3 p-3 border border-divider rounded-lg hover:border-accent-blue transition-colors"
              >
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
                <div className="text-left">
                  <div className="font-medium text-text-primary">
                    {friend.first_name} {friend.last_name}
                  </div>
                  <div className="text-sm text-text-secondary">
                    @{friend.username}
                  </div>
                </div>
              </button>
            ))
          ) : search.length > 0 ? (
            <div className="text-center py-4 text-text-secondary">
              No friends found
            </div>
          ) : (
            <div className="text-center py-4 text-text-secondary">
              Start typing to search friends
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}