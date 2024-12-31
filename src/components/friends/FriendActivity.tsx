import React from 'react';
import { formatDate } from '../../utils/dateUtils';

interface FriendActivity {
  id: string;
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  workout_id: string;
  workout_name: string;
  completed_at: string;
  total_exercises: number;
  total_sets: number;
  completed_sets: number;
  exercises: Array<{
    name: string;
    target_muscle_group: string;
    sets: number;
    reps: number;
    weight_lbs: number;
  }>;
}

interface FriendStats {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  total_workouts: number;
  total_sets: number;
  completed_sets: number;
  total_exercises: number;
  total_sets: number;
  total_weight: number;
}

interface FriendActivityProps {
  activities: FriendActivity[];
  stats: FriendStats[];
}

export default function FriendActivity({ activities, stats }: FriendActivityProps) {
  if (activities.length === 0 && stats.length === 0) {
    return (
      <div className="text-center py-4 text-text-secondary">
        No recent friend activity
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Weekly Stats */}
      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.user_id} className="card p-4">
              <div className="flex items-center gap-3 mb-4">
                {stat.avatar_url ? (
                  <img
                    src={stat.avatar_url}
                    alt={stat.username || 'User avatar'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
                    <span className="text-accent-blue font-medium">
                      {(stat.first_name || 'U')[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-text-primary">
                    {stat.first_name || ''} {stat.last_name || ''}
                  </div>
                  <div className="text-sm text-text-secondary">
                    @{stat.username || 'user'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 bg-surface rounded-lg border border-divider">
                  <div className="text-lg font-bold text-accent-blue mb-1">
                    {stat.total_workouts}
                  </div>
                  <div className="text-xs text-text-secondary">Workouts completed this week</div>
                </div>
                
                <div className="text-center p-2 bg-surface rounded-lg border border-divider">
                  <div className="text-lg font-bold text-accent-green mb-1">
                    {stat.total_sets}
                  </div>
                  <div className="text-xs text-text-secondary">Sets completed this week</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-text-highlight">Recent Activity</h3>
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="card p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                {activity.avatar_url ? (
                  <img
                    src={activity.avatar_url}
                    alt={activity.username || 'User avatar'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
                    <span className="text-accent-blue font-medium">
                      {(activity.first_name || 'U')[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-text-primary">
                    {activity.first_name || ''} {activity.last_name || ''}
                  </div>
                  <div className="text-sm text-text-secondary">
                    @{activity.username || 'user'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-text-primary">{activity.workout_name}</div>
                  <div className="text-sm text-text-secondary">
                    Completed {formatDate(activity.completed_at)}
                    <div className="mt-1">
                      {activity.total_exercises} exercises • {activity.total_sets} sets
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                  {activity.exercises.map((exercise, i) => (
                    <div key={i} className="bg-surface p-2 rounded-lg">
                      <div className="font-medium text-text-primary">{exercise.name}</div>
                      <div className="text-text-secondary text-xs">
                        {exercise.target_muscle_group}
                        <div className="mt-1 flex items-center gap-2">
                          <span>{exercise.sets} sets × {exercise.reps} reps</span>
                          <span className="text-accent-blue">{exercise.weight_lbs} lbs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}