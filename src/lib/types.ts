export type UserRole = 'admin' | 'family';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
} | null;

export type Profile = {
  user_id: string;
  role: UserRole;
  display_name: string;
  is_active?: boolean;
  deactivated_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Family = {
  family_id: string;
  owner_user_id: string;
  primary_email: string;
  account_status?: 'active' | 'inactive' | 'archived';
  deactivated_at?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
  updated_at: string;
};

export type Guardian = {
  guardian_id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  relationship: string | null;
  is_primary_contact: boolean;
  created_at: string;
  updated_at: string;
};

export type Student = {
  student_id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  belt_level: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  announcement_id: string;
  author_user_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementComment = {
  comment_id: string;
  announcement_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type BlogPost = {
  post_id: string;
  author_user_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type BlogComment = {
  comment_id: string;
  post_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  conversation_id: string;
  type: 'global' | 'dm';
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ConversationMember = {
  conversation_id: string;
  user_id: string;
  last_read_at?: string | null;
  created_at: string;
};

export type Message = {
  message_id: string;
  conversation_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type MessageAttachment = {
  attachment_id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type EnrollmentLead = {
  lead_id: string;
  parent_name: string;
  parent_email: string;
  phone: string | null;
  student_name: string | null;
  student_age: number | null;
  message: string;
  source_page: string;
  notification_status: 'queued' | 'sent' | 'failed';
  notified_at: string | null;
  status: 'new' | 'approved' | 'appointment_scheduled' | 'enrolled' | 'closed';
  approved_at: string | null;
  approval_email_sent_at: string | null;
  created_at: string;
};

export type StudentFeedback = {
  feedback_id: string;
  student_id: string;
  author_user_id: string;
  event_title: string;
  event_date: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type Review = {
  review_id: string;
  family_id: string;
  author_user_id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
};
