# Feedback Test Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a search input to the test list panel in `FeedbackTab` that filters tests by title, date, description, and student names — all client-side.

**Architecture:** All required data (`tests`, `feedback`, `students`) is already loaded on mount. We derive a `studentNamesByTest` map and a `filteredTests` array from existing state on every render — no new queries needed. The search input lives at the top of the left panel's `CardContent`.

**Tech Stack:** React, TypeScript, Tailwind, shadcn/ui (`Input`), lucide-react (`Search` — already imported)

---

### Task 1: Add `testSearchQuery` state and derive filtered tests

**Files:**
- Modify: `src/components/admin/FeedbackTab.tsx`

- [ ] **Step 1: Add `testSearchQuery` state**

In `FeedbackTab.tsx`, after the existing `feedbackSearchQuery` state on line 56, add:

```tsx
// Test list search
const [testSearchQuery, setTestSearchQuery] = useState('');
```

- [ ] **Step 2: Derive `studentNamesByTest` map and `filteredTests`**

After the existing `filteredFeedback` block (after line 98), add:

```tsx
const studentNamesByTest = new Map<string, string[]>();
for (const entry of feedback) {
  const student = students.find((s) => s.student_id === entry.student_id);
  if (student) {
    const names = studentNamesByTest.get(entry.test_id) ?? [];
    names.push(`${student.first_name} ${student.last_name}`);
    studentNamesByTest.set(entry.test_id, names);
  }
}

const filteredTests = testSearchQuery.trim()
  ? tests.filter((test) => {
      const q = testSearchQuery.toLowerCase();
      if (test.title.toLowerCase().includes(q)) return true;
      if (test.description?.toLowerCase().includes(q)) return true;
      if (formatTestDate(test.test_date).toLowerCase().includes(q)) return true;
      return (studentNamesByTest.get(test.test_id) ?? []).some((name) =>
        name.toLowerCase().includes(q)
      );
    })
  : tests;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/FeedbackTab.tsx
git commit -m "feat: derive filteredTests from testSearchQuery for test list search"
```

---

### Task 2: Add search input UI and update the test list render

**Files:**
- Modify: `src/components/admin/FeedbackTab.tsx`

- [ ] **Step 1: Add search input at the top of the test list `CardContent`**

Find the left panel `CardContent` block (currently line 304):

```tsx
          <CardContent className="space-y-3">
            {tests.map((test) => {
```

Replace it with:

```tsx
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name, date, or student…"
                className="pl-9"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
              />
            </div>
            {filteredTests.map((test) => {
```

- [ ] **Step 2: Update the empty state block at the bottom of the test list**

Find the existing empty state block (currently lines 342-349):

```tsx
            {tests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tests yet</p>
                <p className="text-sm mt-1">Create a test to get started</p>
              </div>
            )}
```

Replace it with:

```tsx
            {tests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tests yet</p>
                <p className="text-sm mt-1">Create a test to get started</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No tests match your search.
              </div>
            ) : null}
```

- [ ] **Step 3: Verify the dev server renders correctly**

Run: `npm run dev`

Manual checks:
1. Left panel shows the search input above the test list
2. Typing a test title filters the list instantly
3. Typing "april" or "2026" filters by date
4. Typing a student's first or last name shows tests where that student has feedback
5. Typing something with no match shows "No tests match your search."
6. Clearing the input restores all tests
7. When there are no tests at all, the "No tests yet" empty state still shows (not the search empty state)
8. Selecting a test, editing a test, and all other existing functionality still works

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/FeedbackTab.tsx
git commit -m "feat: add search input to test list panel in FeedbackTab"
```
