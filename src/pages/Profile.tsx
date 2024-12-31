import React from 'react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Profile as ProfileType } from '../types/auth';
import ProfileForm from '../components/profile/ProfileForm';
import { Loader2 } from 'lucide-react';

export default function Profile() {
  const { session } = useAuthStore();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [session?.user.id]);

  const loadProfile = async () => {
    if (!session?.user.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, create it
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                username: userData.user.user_metadata.username || 'user',
                first_name: 'New',
                last_name: 'User',
              })
              .select()
              .single();

            if (createError) throw createError;
            setProfile(newProfile);
            return;
          }
        }
        throw error;
      }

      if (!data) throw new Error('Profile not found');
      
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data: Partial<ProfileType>) => {
    if (!session?.user.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', session.user.id);

      if (error) throw error;
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!session?.user.id) return;

    try {
      // Upload the file
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await handleProfileUpdate({ avatar_url: publicUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8 text-text-secondary">
        Profile not found
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-highlight">Profile Settings</h1>
      <div className="card p-6">
      <ProfileForm
        profile={profile}
        onSave={handleProfileUpdate}
        onAvatarChange={handleAvatarChange}
      />
      </div>
    </div>
  );
}