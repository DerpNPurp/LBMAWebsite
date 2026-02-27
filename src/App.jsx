import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function App() {
  const [user, setUser] = useState(null);

  // auth
  const [email, setEmail] = useState("");

  // profile
  const [displayName, setDisplayName] = useState("Test Admin");
  const [role, setRole] = useState("admin"); // ✅ NEW: admin | family

  // data
  const [profiles, setProfiles] = useState([]);
  const [families, setFamilies] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementComments, setAnnouncementComments] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogComments, setBlogComments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationMembers, setConversationMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageAttachments, setMessageAttachments] = useState([]);

  // selects
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState("");
  const [selectedBlogPostId, setSelectedBlogPostId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState("");

  const isAuthed = useMemo(() => !!user, [user]);

  // forms
  const [familyForm, setFamilyForm] = useState({
    primary_email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const [guardianForm, setGuardianForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    relationship: "",
    is_primary_contact: false,
  });

  const [studentForm, setStudentForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    belt_level: "",
    status: "active",
    notes: "",
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
  });

  const [announcementCommentForm, setAnnouncementCommentForm] = useState({
    body: "",
  });

  const [blogPostForm, setBlogPostForm] = useState({
    title: "",
    body: "",
  });

  const [blogCommentForm, setBlogCommentForm] = useState({
    body: "",
  });

  const [conversationForm, setConversationForm] = useState({
    type: "global",
  });

  const [conversationMemberForm, setConversationMemberForm] = useState({
    user_id: "", // optional (leave blank to add yourself)
  });

  const [messageForm, setMessageForm] = useState({
    body: "",
  });

  const [attachmentForm, setAttachmentForm] = useState({
    storage_path: "test/path/file.png",
    file_name: "file.png",
    mime_type: "image/png",
    size_bytes: 1234,
  });

  // -------- AUTH --------
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendMagicLink(e) {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return alert("Enter an email.");
    const { error } = await supabase.auth.signInWithOtp({ email: clean });
    if (error) alert(error.message);
    else alert("Magic link sent. Check your email.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // -------- LOADERS --------
  async function loadTable(table, setter, orderCol = "created_at") {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderCol, { ascending: false })
      .limit(50);

    if (error) throw new Error(`${table}: ${error.message}`);
    setter(data ?? []);
    return data ?? [];
  }

  async function loadAll() {
    try {
      const [
        profilesData,
        familiesData,
        guardiansData,
        studentsData,
        announcementsData,
        announcementCommentsData,
        blogPostsData,
        blogCommentsData,
        conversationsData,
        conversationMembersData,
        messagesData,
        messageAttachmentsData,
      ] = await Promise.all([
        loadTable("profiles", setProfiles),
        loadTable("families", setFamilies),
        loadTable("guardians", setGuardians),
        loadTable("students", setStudents),
        loadTable("announcements", setAnnouncements),
        loadTable("announcement_comments", setAnnouncementComments),
        loadTable("blog_posts", setBlogPosts),
        loadTable("blog_comments", setBlogComments),
        loadTable("conversations", setConversations),
        loadTable("conversation_members", setConversationMembers),
        loadTable("messages", setMessages),
        loadTable("message_attachments", setMessageAttachments),
      ]);

      // keep selects valid
      if (familiesData.length && !selectedFamilyId)
        setSelectedFamilyId(familiesData[0].family_id);

      if (announcementsData.length && !selectedAnnouncementId)
        setSelectedAnnouncementId(announcementsData[0].announcement_id);

      if (blogPostsData.length && !selectedBlogPostId)
        setSelectedBlogPostId(blogPostsData[0].post_id);

      if (conversationsData.length && !selectedConversationId)
        setSelectedConversationId(conversationsData[0].conversation_id);

      if (messagesData.length && !selectedMessageId)
        setSelectedMessageId(messagesData[0].message_id);
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  useEffect(() => {
    if (!isAuthed) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // -------- ACTION HELPERS --------
  function mustAuthed() {
    if (!user) throw new Error("Not signed in.");
  }

  async function run(actionName, fn) {
    try {
      await fn();
      await loadAll();
      alert(`${actionName}: OK`);
    } catch (e) {
      alert(`${actionName}: ${String(e.message || e)}`);
    }
  }

  // -------- INSERTS --------
  async function upsertMyProfile() {
    mustAuthed();

    // ✅ role now comes from UI (admin/family)
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      role,
      display_name: displayName,
    });

    if (error) throw error;
  }

  async function createFamily(e) {
    e.preventDefault();
    mustAuthed();

    const payload = {
      owner_user_id: user.id,
      primary_email: familyForm.primary_email.trim(),
      address: familyForm.address.trim() || null,
      city: familyForm.city.trim() || null,
      state: familyForm.state.trim() || null,
      zip: familyForm.zip.trim() || null,
    };

    if (!payload.primary_email) throw new Error("primary_email required");

    const { error } = await supabase.from("families").insert(payload);
    if (error) throw error;

    setFamilyForm({ primary_email: "", address: "", city: "", state: "", zip: "" });
  }

  async function createGuardian(e) {
    e.preventDefault();
    if (!selectedFamilyId) throw new Error("Select a family first.");

    const payload = {
      family_id: selectedFamilyId,
      first_name: guardianForm.first_name.trim(),
      last_name: guardianForm.last_name.trim(),
      email: guardianForm.email.trim() || null,
      phone_number: guardianForm.phone_number.trim() || null,
      relationship: guardianForm.relationship.trim() || null,
      is_primary_contact: !!guardianForm.is_primary_contact,
    };

    if (!payload.first_name || !payload.last_name)
      throw new Error("Guardian first/last name required.");

    const { error } = await supabase.from("guardians").insert(payload);
    if (error) throw error;

    setGuardianForm({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      relationship: "",
      is_primary_contact: false,
    });
  }

  async function createStudent(e) {
    e.preventDefault();
    if (!selectedFamilyId) throw new Error("Select a family first.");

    const payload = {
      family_id: selectedFamilyId,
      first_name: studentForm.first_name.trim(),
      last_name: studentForm.last_name.trim(),
      date_of_birth: studentForm.date_of_birth || null,
      belt_level: studentForm.belt_level.trim() || null,
      status: studentForm.status,
      notes: studentForm.notes.trim() || null,
    };

    if (!payload.first_name || !payload.last_name)
      throw new Error("Student first/last name required.");

    const { error } = await supabase.from("students").insert(payload);
    if (error) throw error;

    setStudentForm({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      belt_level: "",
      status: "active",
      notes: "",
    });
  }

  async function createAnnouncement(e) {
    e.preventDefault();
    mustAuthed();

    const payload = {
      author_user_id: user.id,
      title: announcementForm.title.trim(),
      body: announcementForm.body.trim(),
    };

    if (!payload.title || !payload.body) throw new Error("Title and body required.");

    const { error } = await supabase.from("announcements").insert(payload);
    if (error) throw error;

    setAnnouncementForm({ title: "", body: "" });
  }

  async function createAnnouncementComment(e) {
    e.preventDefault();
    mustAuthed();
    if (!selectedAnnouncementId) throw new Error("Select an announcement first.");

    const payload = {
      announcement_id: selectedAnnouncementId,
      author_user_id: user.id,
      body: announcementCommentForm.body.trim(),
    };

    if (!payload.body) throw new Error("Comment body required.");

    const { error } = await supabase.from("announcement_comments").insert(payload);
    if (error) throw error;

    setAnnouncementCommentForm({ body: "" });
  }

  async function createBlogPost(e) {
    e.preventDefault();
    mustAuthed();

    const payload = {
      author_user_id: user.id,
      title: blogPostForm.title.trim(),
      body: blogPostForm.body.trim(),
    };

    if (!payload.title || !payload.body) throw new Error("Title and body required.");

    const { error } = await supabase.from("blog_posts").insert(payload);
    if (error) throw error;

    setBlogPostForm({ title: "", body: "" });
  }

  async function createBlogComment(e) {
    e.preventDefault();
    mustAuthed();
    if (!selectedBlogPostId) throw new Error("Select a blog post first.");

    const payload = {
      post_id: selectedBlogPostId,
      author_user_id: user.id,
      body: blogCommentForm.body.trim(),
    };

    if (!payload.body) throw new Error("Comment body required.");

    const { error } = await supabase.from("blog_comments").insert(payload);
    if (error) throw error;

    setBlogCommentForm({ body: "" });
  }

  async function createConversation(e) {
    e.preventDefault();
    mustAuthed();

    const payload = {
      type: conversationForm.type,
      created_by: user.id,
    };

    const { error } = await supabase.from("conversations").insert(payload);
    if (error) throw error;
  }

  async function addConversationMember(e) {
    e.preventDefault();
    mustAuthed();
    if (!selectedConversationId) throw new Error("Select a conversation first.");

    const memberUserId = conversationMemberForm.user_id.trim() || user.id;

    const payload = {
      conversation_id: selectedConversationId,
      user_id: memberUserId,
    };

    const { error } = await supabase.from("conversation_members").insert(payload);
    if (error) throw error;

    setConversationMemberForm({ user_id: "" });
  }

  async function createMessage(e) {
    e.preventDefault();
    mustAuthed();
    if (!selectedConversationId) throw new Error("Select a conversation first.");

    const payload = {
      conversation_id: selectedConversationId,
      author_user_id: user.id,
      body: messageForm.body.trim(),
    };

    if (!payload.body) throw new Error("Message body required.");

    const { error } = await supabase.from("messages").insert(payload);
    if (error) throw error;

    setMessageForm({ body: "" });
  }

  async function createAttachment(e) {
    e.preventDefault();
    if (!selectedMessageId) throw new Error("Select a message first.");

    const payload = {
      message_id: selectedMessageId,
      storage_path: attachmentForm.storage_path.trim(),
      file_name: attachmentForm.file_name.trim(),
      mime_type: attachmentForm.mime_type.trim() || null,
      size_bytes: Number(attachmentForm.size_bytes) || null,
    };

    if (!payload.storage_path || !payload.file_name)
      throw new Error("storage_path and file_name required.");

    const { error } = await supabase.from("message_attachments").insert(payload);
    if (error) throw error;
  }

  // -------- RESET (DELETE EVERYTHING) --------
  async function resetDatabase() {
    const ok = window.confirm(
      "This will DELETE rows from ALL tables (profiles, families, messages, etc). Continue?"
    );
    if (!ok) return;

    const del = async (table, pk = "id") => {
      // delete where pk is not null (works even with UUID PKs)
      const { error } = await supabase.from(table).delete().not(pk, "is", null);
      if (error) throw new Error(`${table}: ${error.message}`);
    };

    await run("RESET", async () => {
      await del("message_attachments", "attachment_id");
      await del("messages", "message_id");
      await del("conversation_members", "conversation_id"); // composite-ish; any non-null works
      await del("conversations", "conversation_id");

      await del("blog_comments", "comment_id");
      await del("blog_posts", "post_id");

      await del("announcement_comments", "comment_id");
      await del("announcements", "announcement_id");

      await del("students", "student_id");
      await del("guardians", "guardian_id");
      await del("families", "family_id");

      await del("profiles", "user_id"); // does NOT delete auth.users
    });

    setSelectedFamilyId("");
    setSelectedAnnouncementId("");
    setSelectedBlogPostId("");
    setSelectedConversationId("");
    setSelectedMessageId("");
  }

  // -------- UI --------
  if (!isAuthed) {
    return (
      <div>
        <h1>LBMA Test Admin</h1>
        <p>Sign in with magic link to test database inserts.</p>

        <form onSubmit={sendMagicLink}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <button>Send magic link</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1>LBMA Test Admin</h1>
      <div>
        Signed in as: <b>{user.email}</b>{" "}
        <button onClick={signOut} style={{ marginLeft: 8 }}>
          Sign out
        </button>{" "}
        <button onClick={loadAll} style={{ marginLeft: 8 }}>
          Refresh all
        </button>{" "}
        <button onClick={resetDatabase} style={{ marginLeft: 8 }}>
          RESET (delete everything)
        </button>
      </div>

      <hr />

      <h2>0) Profile (required for FKs)</h2>
      <label>Display name</label>
      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

      <label>Role</label>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="admin">admin</option>
        <option value="family">family</option>
      </select>

      <button onClick={() => run("Upsert Profile", upsertMyProfile)}>
        Upsert my profile
      </button>

      <hr />

      <h2>1) Families</h2>
      <form onSubmit={(e) => run("Insert Family", () => createFamily(e))}>
        <label>Primary email *</label>
        <input
          value={familyForm.primary_email}
          onChange={(e) =>
            setFamilyForm((p) => ({ ...p, primary_email: e.target.value }))
          }
        />

        <label>Address</label>
        <input
          value={familyForm.address}
          onChange={(e) => setFamilyForm((p) => ({ ...p, address: e.target.value }))}
        />

        <label>City</label>
        <input
          value={familyForm.city}
          onChange={(e) => setFamilyForm((p) => ({ ...p, city: e.target.value }))}
        />

        <label>State</label>
        <input
          value={familyForm.state}
          onChange={(e) => setFamilyForm((p) => ({ ...p, state: e.target.value }))}
        />

        <label>Zip</label>
        <input
          value={familyForm.zip}
          onChange={(e) => setFamilyForm((p) => ({ ...p, zip: e.target.value }))}
        />

        <button>Insert Family</button>
      </form>

      <label>Select family (for guardians/students)</label>
      <select
        value={selectedFamilyId}
        onChange={(e) => setSelectedFamilyId(e.target.value)}
      >
        <option value="">-- none --</option>
        {families.map((f) => (
          <option key={f.family_id} value={f.family_id}>
            {f.primary_email} ({String(f.family_id).slice(0, 8)})
          </option>
        ))}
      </select>

      <TableDump title="families" rows={families} />

      <hr />

      <h2>2) Guardians (needs family)</h2>
      <form onSubmit={(e) => run("Insert Guardian", () => createGuardian(e))}>
        <label>First name *</label>
        <input
          value={guardianForm.first_name}
          onChange={(e) =>
            setGuardianForm((p) => ({ ...p, first_name: e.target.value }))
          }
        />

        <label>Last name *</label>
        <input
          value={guardianForm.last_name}
          onChange={(e) =>
            setGuardianForm((p) => ({ ...p, last_name: e.target.value }))
          }
        />

        <label>Email</label>
        <input
          value={guardianForm.email}
          onChange={(e) => setGuardianForm((p) => ({ ...p, email: e.target.value }))}
        />

        <label>Phone</label>
        <input
          value={guardianForm.phone_number}
          onChange={(e) =>
            setGuardianForm((p) => ({ ...p, phone_number: e.target.value }))
          }
        />

        <label>Relationship</label>
        <input
          value={guardianForm.relationship}
          onChange={(e) =>
            setGuardianForm((p) => ({ ...p, relationship: e.target.value }))
          }
        />

        <label>
          <input
            type="checkbox"
            checked={guardianForm.is_primary_contact}
            onChange={(e) =>
              setGuardianForm((p) => ({
                ...p,
                is_primary_contact: e.target.checked,
              }))
            }
          />{" "}
          Primary contact
        </label>

        <button>Insert Guardian</button>
      </form>

      <TableDump title="guardians" rows={guardians} />

      <hr />

      <h2>3) Students (needs family)</h2>
      <form onSubmit={(e) => run("Insert Student", () => createStudent(e))}>
        <label>First name *</label>
        <input
          value={studentForm.first_name}
          onChange={(e) =>
            setStudentForm((p) => ({ ...p, first_name: e.target.value }))
          }
        />

        <label>Last name *</label>
        <input
          value={studentForm.last_name}
          onChange={(e) =>
            setStudentForm((p) => ({ ...p, last_name: e.target.value }))
          }
        />

        <label>Date of birth</label>
        <input
          type="date"
          value={studentForm.date_of_birth}
          onChange={(e) =>
            setStudentForm((p) => ({ ...p, date_of_birth: e.target.value }))
          }
        />

        <label>Belt level</label>
        <input
          value={studentForm.belt_level}
          onChange={(e) =>
            setStudentForm((p) => ({ ...p, belt_level: e.target.value }))
          }
        />

        <label>Status</label>
        <select
          value={studentForm.status}
          onChange={(e) => setStudentForm((p) => ({ ...p, status: e.target.value }))}
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>

        <label>Notes</label>
        <textarea
          value={studentForm.notes}
          onChange={(e) => setStudentForm((p) => ({ ...p, notes: e.target.value }))}
        />

        <button>Insert Student</button>
      </form>

      <TableDump title="students" rows={students} />

      <hr />

      <h2>4) Announcements</h2>
      <form onSubmit={(e) => run("Insert Announcement", () => createAnnouncement(e))}>
        <label>Title *</label>
        <input
          value={announcementForm.title}
          onChange={(e) =>
            setAnnouncementForm((p) => ({ ...p, title: e.target.value }))
          }
        />

        <label>Body *</label>
        <textarea
          value={announcementForm.body}
          onChange={(e) =>
            setAnnouncementForm((p) => ({ ...p, body: e.target.value }))
          }
        />

        <button>Insert Announcement</button>
      </form>

      <label>Select announcement (for comments)</label>
      <select
        value={selectedAnnouncementId}
        onChange={(e) => setSelectedAnnouncementId(e.target.value)}
      >
        <option value="">-- none --</option>
        {announcements.map((a) => (
          <option key={a.announcement_id} value={a.announcement_id}>
            {a.title} ({String(a.announcement_id).slice(0, 8)})
          </option>
        ))}
      </select>

      <form
        onSubmit={(e) =>
          run("Insert Announcement Comment", () => createAnnouncementComment(e))
        }
      >
        <label>Comment body *</label>
        <textarea
          value={announcementCommentForm.body}
          onChange={(e) => setAnnouncementCommentForm({ body: e.target.value })}
        />
        <button>Insert Comment</button>
      </form>

      <TableDump title="announcements" rows={announcements} />
      <TableDump title="announcement_comments" rows={announcementComments} />

      <hr />

      <h2>5) Blog Posts + Blog Comments</h2>
      <form onSubmit={(e) => run("Insert Blog Post", () => createBlogPost(e))}>
        <label>Title *</label>
        <input
          value={blogPostForm.title}
          onChange={(e) => setBlogPostForm((p) => ({ ...p, title: e.target.value }))}
        />

        <label>Body *</label>
        <textarea
          value={blogPostForm.body}
          onChange={(e) => setBlogPostForm((p) => ({ ...p, body: e.target.value }))}
        />

        <button>Insert Blog Post</button>
      </form>

      <label>Select blog post (for comments)</label>
      <select
        value={selectedBlogPostId}
        onChange={(e) => setSelectedBlogPostId(e.target.value)}
      >
        <option value="">-- none --</option>
        {blogPosts.map((p) => (
          <option key={p.post_id} value={p.post_id}>
            {p.title} ({String(p.post_id).slice(0, 8)})
          </option>
        ))}
      </select>

      <form onSubmit={(e) => run("Insert Blog Comment", () => createBlogComment(e))}>
        <label>Comment body *</label>
        <textarea
          value={blogCommentForm.body}
          onChange={(e) => setBlogCommentForm({ body: e.target.value })}
        />
        <button>Insert Blog Comment</button>
      </form>

      <TableDump title="blog_posts" rows={blogPosts} />
      <TableDump title="blog_comments" rows={blogComments} />

      <hr />

      <h2>6) Conversations / Members / Messages / Attachments</h2>

      <form
        onSubmit={(e) => run("Insert Conversation", () => createConversation(e))}
      >
        <label>Conversation type</label>
        <select
          value={conversationForm.type}
          onChange={(e) => setConversationForm({ type: e.target.value })}
        >
          <option value="global">global</option>
          <option value="dm">dm</option>
        </select>
        <button>Insert Conversation</button>
      </form>

      <label>Select conversation</label>
      <select
        value={selectedConversationId}
        onChange={(e) => setSelectedConversationId(e.target.value)}
      >
        <option value="">-- none --</option>
        {conversations.map((c) => (
          <option key={c.conversation_id} value={c.conversation_id}>
            {c.type} ({String(c.conversation_id).slice(0, 8)})
          </option>
        ))}
      </select>

      <form
        onSubmit={(e) => run("Add Conversation Member", () => addConversationMember(e))}
      >
        <label>Member user_id (optional — leave blank to add yourself)</label>
        <input
          value={conversationMemberForm.user_id}
          onChange={(e) => setConversationMemberForm({ user_id: e.target.value })}
          placeholder="UUID"
        />
        <button>Add Member</button>
      </form>

      <form onSubmit={(e) => run("Insert Message", () => createMessage(e))}>
        <label>Message body *</label>
        <textarea
          value={messageForm.body}
          onChange={(e) => setMessageForm({ body: e.target.value })}
        />
        <button>Insert Message</button>
      </form>

      <label>Select message (for attachments)</label>
      <select
        value={selectedMessageId}
        onChange={(e) => setSelectedMessageId(e.target.value)}
      >
        <option value="">-- none --</option>
        {messages.map((m) => (
          <option key={m.message_id} value={m.message_id}>
            {String(m.message_id).slice(0, 8)} — {String(m.body).slice(0, 20)}
          </option>
        ))}
      </select>

      <form onSubmit={(e) => run("Insert Attachment", () => createAttachment(e))}>
        <label>storage_path *</label>
        <input
          value={attachmentForm.storage_path}
          onChange={(e) =>
            setAttachmentForm((p) => ({ ...p, storage_path: e.target.value }))
          }
        />
        <label>file_name *</label>
        <input
          value={attachmentForm.file_name}
          onChange={(e) => setAttachmentForm((p) => ({ ...p, file_name: e.target.value }))}
        />
        <label>mime_type</label>
        <input
          value={attachmentForm.mime_type}
          onChange={(e) => setAttachmentForm((p) => ({ ...p, mime_type: e.target.value }))}
        />
        <label>size_bytes</label>
        <input
          value={attachmentForm.size_bytes}
          onChange={(e) => setAttachmentForm((p) => ({ ...p, size_bytes: e.target.value }))}
        />
        <button>Insert Attachment</button>
      </form>

      <TableDump title="conversations" rows={conversations} />
      <TableDump title="conversation_members" rows={conversationMembers} />
      <TableDump title="messages" rows={messages} />
      <TableDump title="message_attachments" rows={messageAttachments} />

      <hr />

      <h2>7) Profiles (readback)</h2>
      <TableDump title="profiles" rows={profiles} />
    </div>
  );
}

function TableDump({ title, rows }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {title} ({rows.length})
      </div>
      <pre
        style={{
          background: "#f6f6f6",
          padding: 12,
          overflowX: "auto",
          border: "1px solid #ddd",
        }}
      >
        {JSON.stringify(rows, null, 2)}
      </pre>
    </div>
  );
}