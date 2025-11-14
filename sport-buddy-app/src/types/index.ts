import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Sport = Database['public']['Tables']['sports']['Row'];
export type SportSession = Database['public']['Tables']['sport_sessions']['Row'];
export type SessionParticipant = Database['public']['Tables']['session_participants']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

export type SportSessionWithDetails = SportSession & {
  creator?: Profile;
  sport?: Sport;
  participants?: SessionParticipant[];
  participant_count?: number;
};

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'any';
export type SessionStatus = 'open' | 'full' | 'cancelled' | 'completed';
export type ParticipantStatus = 'pending' | 'approved' | 'rejected';
