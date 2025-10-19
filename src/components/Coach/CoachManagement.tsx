import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserPlus, UserMinus, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type CoachInvitation = Database['public']['Tables']['coach_invitations']['Row'] & {
  invited_user_profile?: {
    full_name: string | null;
    email: string;
  };
};

export default function CoachManagement() {
  const [invitations, setInvitations] = useState<CoachInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_invitations')
        .select(`
          *,
          invited_user_profile:user_profiles!coach_invitations_invited_user_id_fkey(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load coach invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('coach_invitations')
        .insert({
          invited_by: user.id,
          invited_email: newEmail.toLowerCase().trim(),
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSuccess(`Invitation sent to ${newEmail}`);
      setNewEmail('');
      fetchInvitations();
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      if (err.code === '23505') {
        setError('This email has already been invited');
      } else {
        setError('Failed to send invitation');
      }
    } finally {
      setSending(false);
    }
  };

  const revokeAccess = async (invitationId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke coach access for ${email}?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('coach_invitations')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      if (invitations.find(inv => inv.id === invitationId)?.invited_user_id) {
        const invitedUserId = invitations.find(inv => inv.id === invitationId)?.invited_user_id;
        if (invitedUserId) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ role: 'student' })
            .eq('id', invitedUserId);

          if (profileError) console.error('Error updating user role:', profileError);
        }
      }

      setSuccess(`Coach access revoked for ${email}`);
      fetchInvitations();
    } catch (err) {
      console.error('Error revoking access:', err);
      setError('Failed to revoke access');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Revoked
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-gray-700" />
        <h2 className="text-2xl font-bold text-gray-900">Coach Access Management</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Invite New Coach</h3>
        </div>

        <form onSubmit={sendInvitation} className="flex gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !newEmail}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Coach Invitations</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage all coaches who have been given access to the platform
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading invitations...
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No coach invitations yet. Send an invitation to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{invitation.invited_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {invitation.invited_user_profile?.full_name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invitation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invitation.status !== 'revoked' && (
                        <button
                          onClick={() => revokeAccess(invitation.id, invitation.invited_email)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                          Revoke Access
                        </button>
                      )}
                      {invitation.status === 'revoked' && (
                        <span className="text-gray-400">Access Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}