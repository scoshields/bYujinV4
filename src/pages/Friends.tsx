import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import FriendSearch from '../components/friends/FriendSearch';
import FriendRequests from '../components/friends/FriendRequests';
import FriendActivity from '../components/friends/FriendActivity';
import FriendList from '../components/friends/FriendList';

export default function Friends() {
  const { session } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (session?.user.id) {
        await Promise.all([
          loadFriends(),
          loadFriendRequests(),
          loadFriendActivity(),
          loadFriendStats()
        ]);
        setLoading(false);
      }
    }
    loadData();
  }, [session?.user.id]);

  const loadFriendStats = async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .rpc('get_friend_stats', {
          p_user_id: session?.user.id,
          p_start_date: startOfWeek.toISOString(),
          p_end_date: endOfWeek.toISOString()
        });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading friend stats:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          friend:profiles!friendships_friend_id_fkey (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          ),
          user:profiles!friendships_user_id_fkey (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${session?.user.id},friend_id.eq.${session?.user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Transform data to get friend info regardless of whether they're user or friend
      const friendsList = friendships?.map(friendship => {
        const isFriend = friendship.friend.id === session?.user.id;
        return isFriend ? friendship.user : friendship.friend;
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user:profiles!friendships_user_id_fkey (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('friend_id', session?.user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadFriendActivity = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_friend_activity', {
          p_user_id: session?.user.id
        }); 

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading friend activity:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      // Reload data
      await Promise.all([
        loadFriends(),
        loadFriendRequests(),
        loadFriendActivity()
      ]);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Reload requests
      await loadFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${session?.user.id},friend_id.eq.${friendId}),and(friend_id.eq.${session?.user.id},user_id.eq.${friendId})`);

      if (error) throw error;

      // Reload data
      await Promise.all([
        loadFriends(),
        loadFriendActivity()
      ]);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-highlight mb-4">Find Friends</h2>
        <FriendSearch />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-highlight mb-4">Your Friends</h2>
        <FriendList
          friends={friends}
          onRemove={handleRemoveFriend}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-highlight mb-4">Friend Requests</h2>
        <FriendRequests
          requests={requests}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-highlight mb-4">Friend Activity</h2>
        <FriendActivity activities={activities} stats={stats} />
      </div>
    </div>
  );
}