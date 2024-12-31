import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dumbbell } from 'lucide-react';
import { SignUpData } from '../types/auth';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        if (!username || !firstName || !lastName) {
          throw new Error('Username, first name, and last name are required');
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Signup failed - no user returned');
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            username,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
            height_inches: heightInches ? parseInt(heightInches) : null,
            weight_lbs: weightLbs ? parseFloat(weightLbs) : null
          });
        
        if (profileError) throw profileError;

        setMessage('Check your email for the confirmation link.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Dumbbell className="h-12 w-12 text-accent-blue" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-highlight">
          Yujin
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-text-primary">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-primary">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-primary">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-text-primary">
                    Date of Birth (Optional)
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="heightInches" className="block text-sm font-medium text-text-primary">
                      Height (inches) (Optional)
                    </label>
                    <input
                      id="heightInches"
                      type="number"
                      min="1"
                      max="120"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                    />
                  </div>
                  <div>
                    <label htmlFor="weightLbs" className="block text-sm font-medium text-text-primary">
                      Weight (lbs) (Optional)
                    </label>
                    <input
                      id="weightLbs"
                      type="number"
                      min="1"
                      max="1000"
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(e.target.value)}
                      className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-divider bg-background text-text-primary shadow-sm focus:border-accent-blue focus:ring-accent-blue"
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-error text-sm">{error}</div>
            )}

            {message && (
              <div className="text-accent-green text-sm">{message}</div>
            )}

            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {mode === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="btn-secondary w-full"
              >
                {mode === 'signin' ? 'Create an account' : 'Already have an account?'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}