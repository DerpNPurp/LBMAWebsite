export const PROFILE_COLUMNS = 'user_id, role, display_name, is_active, deactivated_at, created_at, updated_at';

export const FAMILY_COLUMNS =
  'family_id, owner_user_id, primary_email, account_status, deactivated_at, address, city, state, zip, created_at, updated_at';

export const GUARDIAN_COLUMNS =
  'guardian_id, family_id, first_name, last_name, email, phone_number, relationship, is_primary_contact, created_at, updated_at';

export const STUDENT_COLUMNS =
  'student_id, family_id, first_name, last_name, date_of_birth, belt_level, status, notes, created_at, updated_at';

export const CONVERSATION_COLUMNS = 'conversation_id, type, created_by, created_at, updated_at';

export const CONVERSATION_MEMBER_COLUMNS = 'conversation_id, user_id, last_read_at, created_at';

export const MESSAGE_COLUMNS = 'message_id, conversation_id, author_user_id, body, created_at, updated_at';

export const MESSAGE_ATTACHMENT_COLUMNS =
  'attachment_id, message_id, storage_path, file_name, mime_type, size_bytes, created_at';
