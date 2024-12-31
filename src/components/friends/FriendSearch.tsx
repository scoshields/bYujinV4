import React, { useState } from 'react';
import { Search, UserPlus, Check, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface SearchResult {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  friendship_status: 'pending' | 'accepted' | null;
}

export default function FriendSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { session } = useAuthStore();

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // First check if we can access profiles
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (profileError) {
        console.error('Error accessing profiles:', profileError);
        return;
      }

      const { data, error } = await supabase
        .rpc('search_users', {
          search_query: value,
          current_user_id: session?.user.id
        });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: session?.user.id,
          friend_id: friendId
        });

      if (error) throw error;

      // Update local state
      setResults(prev => prev.map(user => 
        user.id === friendId 
          ? { ...user, friendship_status: 'pending' }
          : user
      ));
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-secondary" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users by name or username..."
          className="block w-full pl-10 pr-3 py-2 border border-divider rounded-md bg-background text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
        />
      </div>

      {loading && (
        <div className="text-center py-4 text-text-secondary">
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 border border-divider rounded-lg bg-surface"
            >
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
                    <span className="text-accent-blue font-medium">
                      {user.first_name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-text-primary">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-text-secondary">
                    @{user.username}
                  </div>
                </div>
              </div>

              {user.friendship_status === 'accepted' ? (
                <span className="flex items-center gap-1 text-accent-green">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Friends</span>
                </span>
              ) : user.friendship_status === 'pending' ? (
                <span className="flex items-center gap-1 text-accent-blue">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Pending</span>
                </span>
              ) : (
                <button
                  onClick={() => handleAddFriend(user.id)}
                  className="flex items-center gap-1 text-accent-blue hover:text-accent-blue-hover"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm">Add Friend</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {query.length >= 3 && results.length === 0 && !loading && (
        <div className="text-center py-4 text-text-secondary">
          No users found
        </div>
      )}
      
      {query.length > 0 && query.length < 3 && (
        <div className="text-center py-4 text-text-secondary">
          Enter at least 3 characters to search
        </div>
      )}
    </div>
  );
}