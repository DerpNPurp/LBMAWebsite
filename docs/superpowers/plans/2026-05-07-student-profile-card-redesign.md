# Student Profile Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the student card in the family portal Profile tab so the photo is large and anchors the left side, with upload/remove buttons stacked below it and all student info to the right.

**Architecture:** Add a `layout` prop to `PhotoUploader` to support a vertical stack variant, then update the student card in `ProfileTab` to use a two-column grid with the new vertical uploader on the left and all info (name, status, age, belt, notes, edit) on the right. Belt badge also gets `self-start` to fix its full-width stretch.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, shadcn/ui (Badge, Button, Card, Label)

---

## Files

| File | Change |
|---|---|
| `src/components/dashboard/PhotoUploader.tsx` | Add `layout?: 'horizontal' \| 'vertical'` prop; vertical mode stacks buttons below avatar |
| `src/components/dashboard/ProfileTab.tsx` | Student card switches to two-column grid; passes `layout="vertical"` and `size="lg"` to PhotoUploader; belt badge gets `self-start` |

---

## Task 1: Add `layout` prop to `PhotoUploader`

**Files:**
- Modify: `src/components/dashboard/PhotoUploader.tsx:10-32` (type + destructure)
- Modify: `src/components/dashboard/PhotoUploader.tsx:71-134` (render)

No test infrastructure exists in this project. Verify visually via `npm run dev`.

- [ ] **Step 1: Add `layout` to the props type and destructure it**

In `src/components/dashboard/PhotoUploader.tsx`, replace lines 10–32:

```tsx
type PhotoUploaderProps = {
  currentUrl: string | null;
  fallback: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  disabled?: boolean;
};

const sizeClasses: Record<NonNullable<PhotoUploaderProps['size']>, string> = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
};

export function PhotoUploader({
  currentUrl,
  fallback,
  onUpload,
  onRemove,
  size = 'lg',
  layout = 'horizontal',
  disabled,
}: PhotoUploaderProps) {
```

- [ ] **Step 2: Update the render to use `layout`**

In `src/components/dashboard/PhotoUploader.tsx`, replace the `return (...)` block (lines 71–155) with:

```tsx
  const isVertical = layout === 'vertical';

  return (
    <div className={isVertical ? 'flex flex-col items-center gap-2 w-full' : 'flex items-center gap-4'}>
      <div className="relative group">
        <Avatar key={currentUrl ?? 'no-image'} className={sizeClasses[size]}>
          {currentUrl && <AvatarImage src={currentUrl} alt="Profile photo" />}
          <AvatarFallback className="text-lg bg-sidebar-primary text-sidebar-primary-foreground font-semibold">{fallback}</AvatarFallback>
        </Avatar>
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            aria-label="Change photo"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        disabled={disabled}
      />

      <div className={isVertical ? 'flex flex-col gap-1 w-full' : 'flex flex-col gap-1'}>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className={isVertical ? 'w-full text-xs' : ''}
          >
            Upload Photo
          </Button>
        )}
        {currentUrl && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmRemove(true)}
            disabled={busy}
            className={isVertical ? 'w-full text-xs text-destructive hover:text-destructive' : 'text-destructive hover:text-destructive'}
          >
            {removing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Photo
              </>
            )}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove photo"
        description="Remove your photo? You'll revert to the initials avatar."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmRemove(false)}
      />

      <AvatarCropperDialog
        file={pendingCropFile}
        onConfirm={async (croppedFile) => {
          await onUpload(croppedFile);
          setPendingCropFile(null);
        }}
        onCancel={() => setPendingCropFile(null)}
      />
    </div>
  );
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no TypeScript errors. (Ignore any unrelated warnings.)

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/PhotoUploader.tsx
git commit -m "add vertical layout variant to PhotoUploader"
```

---

## Task 2: Redesign student card in ProfileTab

**Files:**
- Modify: `src/components/dashboard/ProfileTab.tsx:806-851`

- [ ] **Step 1: Replace the student card JSX**

In `src/components/dashboard/ProfileTab.tsx`, replace lines 806–851:

```tsx
            <div key={student.id} className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[108px_1fr]">
                <div className="flex flex-col items-center justify-center gap-2 px-3 py-4 border-r border-border">
                  <PhotoUploader
                    currentUrl={student.photoUrl}
                    fallback={`${student.firstName[0]}${student.lastName[0]}`}
                    size="lg"
                    layout="vertical"
                    onUpload={(file) => handleUploadStudentPhoto(student.id, file)}
                    onRemove={() => handleRemoveStudentPhoto(student.id)}
                  />
                </div>
                <div className="p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-semibold text-lg leading-tight">
                        {student.firstName} {student.lastName}
                      </h3>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingStudent(student)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Age {calculateAge(student.dateOfBirth)} • Born {new Date(student.dateOfBirth).toLocaleDateString()}
                  </p>
                  <Badge className="bg-[#303030] text-background border-primary self-start">
                    {student.beltLevel}
                  </Badge>
                  {student.notes && (
                    <div className="mt-3 p-3 bg-secondary rounded-md">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{student.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
```

- [ ] **Step 2: Build and verify no TypeScript errors**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 3: Run dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:5173`, log in as a family user, navigate to the Profile tab, and verify:

1. Student card shows a large circle photo (80×80px) anchoring the full height of the left column
2. "Upload Photo" button appears below the photo, full-width within the column
3. "Remove Photo" button appears below "Upload Photo" only when a photo exists
4. Hovering the photo shows the camera icon overlay
5. Student name, status badge, age/dob, belt badge, and notes all appear in the right column
6. Belt badge only wraps its text — it does not stretch to the full column width
7. Edit button sits top-right of the info column
8. Existing guardian photo uploaders (horizontal layout) are visually unchanged

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ProfileTab.tsx
git commit -m "redesign student card with large photo and two-column layout"
```
