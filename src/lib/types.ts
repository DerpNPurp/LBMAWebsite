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
  created_at: string;
  updated_at: string;
};

export type Family = {
  family_id: string;
  owner_user_id: string;
  primary_email: string;
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

export type Review = {
  review_id: string;
  family_id: string;
  author_user_id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
};
