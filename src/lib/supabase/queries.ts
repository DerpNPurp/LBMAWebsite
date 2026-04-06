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
  EnrollmentLead,
  StudentFeedback,
  Review,
} from '../types';
import {
  CONVERSATION_COLUMNS,
  CONVERSATION_MEMBER_COLUMNS,
  FAMILY_COLUMNS,
  GUARDIAN_COLUMNS,
  MESSAGE_ATTACHMENT_COLUMNS,
  MESSAGE_COLUMNS,
  PROFILE_COLUMNS,
  STUDENT_COLUMNS,
} from './selects';

// ============================================
// PROFILES
// ============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
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
    .select(FAMILY_COLUMNS)
    .eq('owner_user_id', ownerUserId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data || null;
}

export async function getAllFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select(FAMILY_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getFamilyWithRelations(familyId: string) {
  const { data, error } = await supabase
    .from('families')
    .select(`
      ${FAMILY_COLUMNS},
      guardians (${GUARDIAN_COLUMNS}),
      students (${STUDENT_COLUMNS})
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
    .select(GUARDIAN_COLUMNS)
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
    .select(STUDENT_COLUMNS)
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
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  const rows = data || [];
  if (rows.length === 0) return [];

  const authorIds = Array.from(
    new Set(
      rows
        .map((row: any) => row.author_user_id)
        .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
    ),
  );

  if (authorIds.length === 0) return rows;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', authorIds);

  if (profilesError) {
    return rows;
  }

  const profileById = new Map((profiles || []).map((profile: any) => [profile.user_id, profile.display_name]));
  return rows.map((row: any) => ({
    ...row,
    profiles: { display_name: profileById.get(row.author_user_id) || null },
  }));
}

export async function getAnnouncement(announcementId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
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
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  const rows = data || [];
  if (rows.length === 0) return [];

  const authorIds = Array.from(
    new Set(
      rows
        .map((row: any) => row.author_user_id)
        .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
    ),
  );

  if (authorIds.length === 0) return rows;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', authorIds);

  if (profilesError) {
    return rows;
  }

  const profileById = new Map((profiles || []).map((profile: any) => [profile.user_id, profile.display_name]));
  return rows.map((row: any) => ({
    ...row,
    profiles: { display_name: profileById.get(row.author_user_id) || null },
  }));
}

export async function getBlogPost(postId: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
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
    .select(CONVERSATION_COLUMNS)
    .eq('type', 'global')
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      ${CONVERSATION_COLUMNS},
      conversation_members!inner (${CONVERSATION_MEMBER_COLUMNS})
    `)
    .eq('conversation_members.user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (error.code === '42703' || error.message?.toLowerCase().includes('last_read_at')) {
      const fallback = await supabase
        .from('conversations')
        .select(`
          ${CONVERSATION_COLUMNS},
          conversation_members!inner (user_id)
        `)
        .eq('conversation_members.user_id', userId)
        .order('updated_at', { ascending: false });

      if (fallback.error) throw fallback.error;
      return fallback.data || [];
    }
    throw error;
  }
  return data || [];
}

export async function getConversationMembers(conversationId: string): Promise<ConversationMember[]> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select(`
      ${CONVERSATION_MEMBER_COLUMNS},
      profiles!conversation_members_user_id_fkey (
        display_name,
        role
      )
    `)
    .eq('conversation_id', conversationId);

  if (!error) return data || [];

  if (error.code === 'PGRST200') {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('conversation_members')
      .select(CONVERSATION_MEMBER_COLUMNS)
      .eq('conversation_id', conversationId);

    if (fallbackError) {
      throw fallbackError;
    }

    const memberUserIds = Array.from(
      new Set((fallbackData || []).map((member: any) => member.user_id).filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)),
    );

    if (memberUserIds.length === 0) return fallbackData || [];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, role')
      .in('user_id', memberUserIds);

    if (profilesError) {
      return fallbackData || [];
    }

    const profileByUserId = new Map((profiles || []).map((profile: any) => [profile.user_id, { display_name: profile.display_name, role: profile.role }]));
    const hydrated = (fallbackData || []).map((member: any) => ({
      ...member,
      profiles: profileByUserId.get(member.user_id) || null,
    }));

    return hydrated;
  }

  throw error;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      ${MESSAGE_COLUMNS},
      profiles!messages_author_user_id_fkey (
        display_name,
        role
      ),
      message_attachments (${MESSAGE_ATTACHMENT_COLUMNS})
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (!error) {
    return data || [];
  }

  if (error.code === 'PGRST200') {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('messages')
      .select(`
        ${MESSAGE_COLUMNS},
        message_attachments (${MESSAGE_ATTACHMENT_COLUMNS})
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (fallbackError) {
      throw fallbackError;
    }

    const authorUserIds = Array.from(
      new Set((fallbackData || []).map((message: any) => message.author_user_id).filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)),
    );

    if (authorUserIds.length === 0) return fallbackData || [];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, role')
      .in('user_id', authorUserIds);

    if (profilesError) {
      return fallbackData || [];
    }

    const profileByUserId = new Map((profiles || []).map((profile: any) => [profile.user_id, { display_name: profile.display_name, role: profile.role }]));
    const hydratedMessages = (fallbackData || []).map((message: any) => ({
      ...message,
      profiles: profileByUserId.get(message.author_user_id) || null,
    }));

    return hydratedMessages;
  }

  throw error;
}

export async function getDirectMessageConversation(userId1: string, userId2: string): Promise<Conversation | null> {
  const userConversations = await getUserConversations(userId1);
  const directMessageConversationIds = userConversations
    .filter((conversation) => conversation.type === 'dm')
    .map((conversation) => conversation.conversation_id);

  if (directMessageConversationIds.length === 0) return null;

  const { data, error } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .in('conversation_id', directMessageConversationIds)
    .eq('user_id', userId2);

  if (error) throw error;

  const matchedConversationIds = new Set((data || []).map((row: any) => row.conversation_id));
  return userConversations.find((conversation) => matchedConversationIds.has(conversation.conversation_id)) || null;
}

export async function getConversationUnreadCount(conversationId: string, userId: string): Promise<number> {
  const { data: member, error: memberError } = await supabase
    .from('conversation_members')
    .select('last_read_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (memberError) {
    if (memberError.code === '42703' || memberError.message?.toLowerCase().includes('last_read_at')) {
      const { count, error: fallbackError } = await supabase
        .from('messages')
        .select('message_id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('author_user_id', userId);
      if (fallbackError) throw fallbackError;
      return count || 0;
    }
    throw memberError;
  }
  if (!member) return 0;

  let query = supabase
    .from('messages')
    .select('message_id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .neq('author_user_id', userId);

  if (member.last_read_at) {
    query = query.gt('created_at', member.last_read_at);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const conversations = await getUserConversations(userId);
  if (conversations.length === 0) return 0;

  const unreadCounts = await Promise.all(
    conversations.map((conversation) => getConversationUnreadCount(conversation.conversation_id, userId)),
  );

  return unreadCounts.reduce((total, current) => total + current, 0);
}

export async function getCommunicationCounts(userId: string): Promise<{
  announcements: number;
  blogPosts: number;
  unreadMessages: number;
}> {
  const [announcementResult, blogResult, unreadMessages] = await Promise.all([
    supabase.from('announcements').select('announcement_id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('post_id', { count: 'exact', head: true }),
    getUnreadMessageCount(userId),
  ]);

  if (announcementResult.error) throw announcementResult.error;
  if (blogResult.error) throw blogResult.error;

  return {
    announcements: announcementResult.count || 0,
    blogPosts: blogResult.count || 0,
    unreadMessages,
  };
}

// ============================================
// ENROLLMENT LEADS
// ============================================

export async function getEnrollmentLeads(): Promise<EnrollmentLead[]> {
  const { data, error } = await supabase
    .from('enrollment_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// STUDENT FEEDBACK
// ============================================

export async function getStudentFeedbackByFamily(familyId: string): Promise<(StudentFeedback & { profiles: { display_name: string | null } | null })[]> {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('student_id')
    .eq('family_id', familyId);

  if (studentsError) throw studentsError;
  if (!students || students.length === 0) return [];

  const studentIds = students.map((s: any) => s.student_id);

  const { data, error } = await supabase
    .from('student_feedback')
    .select(`
      *,
      profiles!student_feedback_author_user_id_fkey (
        display_name
      )
    `)
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllStudentFeedback(): Promise<(StudentFeedback & { profiles: { display_name: string | null } | null })[]> {
  const { data, error } = await supabase
    .from('student_feedback')
    .select(`
      *,
      profiles!student_feedback_author_user_id_fkey (
        display_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
    .maybeSingle();

  if (error) throw error;
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
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
