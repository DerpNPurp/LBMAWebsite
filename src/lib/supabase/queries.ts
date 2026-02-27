import { supabase } from './client';
import type {
  Profile,
  Family,
  Guardian,
  Student,
  Announcement,
  AnnouncementComment,
  BlogPost,
  BlogComment,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  Review,
} from '../types';

// ============================================
// PROFILES
// ============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// FAMILIES
// ============================================

export async function getFamilyByOwner(ownerUserId: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data || null;
}

export async function getAllFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getFamilyWithRelations(familyId: string) {
  const { data, error } = await supabase
    .from('families')
    .select(`
      *,
      guardians (*),
      students (*)
    `)
    .eq('family_id', familyId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// GUARDIANS
// ============================================

export async function getGuardiansByFamily(familyId: string): Promise<Guardian[]> {
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('family_id', familyId)
    .order('is_primary_contact', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// STUDENTS
// ============================================

export async function getStudentsByFamily(familyId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles!announcements_author_user_id_fkey (
        display_name,
        role
      )
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAnnouncement(announcementId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles!announcements_author_user_id_fkey (
        display_name,
        role
      )
    `)
    .eq('announcement_id', announcementId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAnnouncementComments(announcementId: string): Promise<AnnouncementComment[]> {
  const { data, error } = await supabase
    .from('announcement_comments')
    .select(`
      *,
      profiles!announcement_comments_author_user_id_fkey (
        display_name
      )
    `)
    .eq('announcement_id', announcementId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// BLOG POSTS
// ============================================

export async function getBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      profiles!blog_posts_author_user_id_fkey (
        display_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBlogPost(postId: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      profiles!blog_posts_author_user_id_fkey (
        display_name
      )
    `)
    .eq('post_id', postId)
    .single();

  if (error) throw error;
  return data;
}

export async function getBlogComments(postId: string): Promise<BlogComment[]> {
  const { data, error } = await supabase
    .from('blog_comments')
    .select(`
      *,
      profiles!blog_comments_author_user_id_fkey (
        display_name
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// CONVERSATIONS & MESSAGES
// ============================================

export async function getGlobalConversation(): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('type', 'global')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      conversation_members!inner (user_id)
    `)
    .eq('conversation_members.user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConversationMembers(conversationId: string): Promise<ConversationMember[]> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select(`
      *,
      profiles!conversation_members_user_id_fkey (
        display_name,
        role
      )
    `)
    .eq('conversation_id', conversationId);

  if (error) throw error;
  return data || [];
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles!messages_author_user_id_fkey (
        display_name,
        role
      ),
      message_attachments (*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getDirectMessageConversation(userId1: string, userId2: string): Promise<Conversation | null> {
  // Find DM conversation between two users
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      conversation_members!inner (user_id)
    `)
    .eq('type', 'dm')
    .eq('conversation_members.user_id', userId1);

  if (error) throw error;

  // Filter to find conversation that includes both users
  const conversation = data?.find((conv: any) => {
    const members = conv.conversation_members || [];
    return members.some((m: any) => m.user_id === userId2);
  });

  return conversation || null;
}

// ============================================
// REVIEWS
// ============================================

export async function getReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      families!reviews_family_id_fkey (
        primary_email
      ),
      profiles!reviews_author_user_id_fkey (
        display_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getReviewByFamily(familyId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('family_id', familyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function getUserReview(userId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      families!reviews_family_id_fkey (
        family_id,
        primary_email
      )
    `)
    .eq('author_user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}
