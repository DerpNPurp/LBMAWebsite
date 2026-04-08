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
  FeedbackTest,
  Review,
} from '../types';
import {
  ANNOUNCEMENT_COLUMNS,
  ANNOUNCEMENT_COMMENT_COLUMNS,
  BLOG_COMMENT_COLUMNS,
  BLOG_POST_COLUMNS,
  CONVERSATION_COLUMNS,
  CONVERSATION_MEMBER_COLUMNS,
  ENROLLMENT_LEAD_COLUMNS,
  FAMILY_COLUMNS,
  FEEDBACK_TEST_COLUMNS,
  GUARDIAN_COLUMNS,
  MESSAGE_ATTACHMENT_COLUMNS,
  MESSAGE_COLUMNS,
  PROFILE_COLUMNS,
  REVIEW_COLUMNS,
  STUDENT_COLUMNS,
  STUDENT_FEEDBACK_COLUMNS,
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

export async function getAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_COLUMNS)
    .order('first_name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ============================================
// AUTHOR HYDRATION HELPER
// ============================================

/**
 * Given rows with `author_user_id`, fetches display names in a single query
 * and returns rows with a `profiles: { display_name: string | null }` field attached.
 * Falls back gracefully if the profile fetch fails.
 */
async function hydrateAuthorNames<T extends { author_user_id: string }>(
  rows: T[]
): Promise<(T & { profiles: { display_name: string | null } })[]> {
  const authorIds = Array.from(
    new Set(rows.map(r => r.author_user_id).filter((id): id is string => Boolean(id)))
  );
  if (authorIds.length === 0) {
    return rows.map(r => ({ ...r, profiles: { display_name: null } }));
  }
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', authorIds);

  const nameById = new Map(
    (profiles ?? []).map(p => [p.user_id as string, p.display_name as string | null])
  );
  return rows.map(r => ({
    ...r,
    profiles: { display_name: nameById.get(r.author_user_id) ?? null },
  }));
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_COLUMNS)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];
  return hydrateAuthorNames(data as Announcement[]);
}

export async function getAnnouncement(announcementId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_COLUMNS)
    .eq('announcement_id', announcementId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAnnouncementComments(announcementId: string): Promise<AnnouncementComment[]> {
  const { data, error } = await supabase
    .from('announcement_comments')
    .select(`
      ${ANNOUNCEMENT_COMMENT_COLUMNS},
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
    .select(BLOG_POST_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];
  return hydrateAuthorNames(data as BlogPost[]);
}

export async function getBlogPost(postId: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(BLOG_POST_COLUMNS)
    .eq('post_id', postId)
    .single();

  if (error) throw error;
  return data;
}

export async function getBlogComments(postId: string): Promise<BlogComment[]> {
  const { data, error } = await supabase
    .from('blog_comments')
    .select(`
      ${BLOG_COMMENT_COLUMNS},
      profiles!blog_comments_author_user_id_fkey (
        display_name
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch comments for multiple posts in a single query.
 * Returns a map of post_id → comment array.
 */
export async function getBlogCommentsForPosts(
  postIds: string[]
): Promise<Record<string, BlogComment[]>> {
  if (postIds.length === 0) return {};

  const { data, error } = await supabase
    .from('blog_comments')
    .select(`
      ${BLOG_COMMENT_COLUMNS},
      profiles!blog_comments_author_user_id_fkey (
        display_name
      )
    `)
    .in('post_id', postIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const result: Record<string, BlogComment[]> = {};
  for (const row of data ?? []) {
    const postId = (row as BlogComment & { post_id: string }).post_id;
    if (!result[postId]) result[postId] = [];
    result[postId].push(row as BlogComment);
  }
  return result;
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
    .select(ENROLLMENT_LEAD_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// FEEDBACK TESTS
// ============================================

export async function getAllFeedbackTests(): Promise<FeedbackTest[]> {
  const { data, error } = await supabase
    .from('feedback_tests')
    .select(FEEDBACK_TEST_COLUMNS)
    .order('test_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getFeedbackTestsByFamily(familyId: string): Promise<FeedbackTest[]> {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('student_id')
    .eq('family_id', familyId);

  if (studentsError) throw studentsError;
  if (!students || students.length === 0) return [];

  const studentIds = students.map((s: any) => s.student_id);

  // Single join: student_feedback → feedback_tests, deduped client-side
  const { data, error } = await supabase
    .from('student_feedback')
    .select(`test_id, feedback_tests(${FEEDBACK_TEST_COLUMNS})`)
    .in('student_id', studentIds);

  if (error) throw error;

  const testMap = new Map<string, FeedbackTest>();
  for (const row of (data || []) as any[]) {
    const test = row.feedback_tests as FeedbackTest | null;
    if (test) testMap.set(test.test_id, test);
  }

  return Array.from(testMap.values()).sort((a, b) => b.test_date.localeCompare(a.test_date));
}

// ============================================
// STUDENT FEEDBACK
// ============================================

type FeedbackWithRelations = StudentFeedback & {
  profiles: { display_name: string | null } | null;
};

async function attachAuthorNames(rows: StudentFeedback[]): Promise<FeedbackWithRelations[]> {
  if (rows.length === 0) return [];
  const authorIds = Array.from(new Set(rows.map((r) => r.author_user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', authorIds);
  const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));
  return rows.map((r) => ({
    ...r,
    profiles: { display_name: nameMap.get(r.author_user_id) ?? null },
  }));
}

export async function getStudentFeedbackByFamily(familyId: string): Promise<FeedbackWithRelations[]> {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('student_id')
    .eq('family_id', familyId);

  if (studentsError) throw studentsError;
  if (!students || students.length === 0) return [];

  const studentIds = students.map((s: any) => s.student_id);

  const { data, error } = await supabase
    .from('student_feedback')
    .select(STUDENT_FEEDBACK_COLUMNS)
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachAuthorNames(data || []);
}

export async function getAllStudentFeedback(): Promise<FeedbackWithRelations[]> {
  const { data, error } = await supabase
    .from('student_feedback')
    .select(STUDENT_FEEDBACK_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachAuthorNames(data || []);
}

// ============================================
// REVIEWS
// ============================================

export async function getReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getReviewByFamily(familyId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('family_id', familyId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getUserReview(userId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      ${REVIEW_COLUMNS},
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
