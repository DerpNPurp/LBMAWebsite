import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Label } from '../../../ui/label';
import { Badge } from '../../../ui/badge';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../ui/sheet';
import {
  Edit2, Plus, Trash2, Star, Check, Home, Users, User, Phone, Mail,
} from 'lucide-react';
import { useProfile } from '../../../../hooks/useProfile';
import { createReview, updateReview } from '../../../../lib/supabase/mutations';
import { getUserReview, getFamilyByOwner } from '../../../../lib/supabase/queries';
import { useEffect } from 'react';
import type { User as AppUser, Review } from '../../../../lib/types';
import { V2PageHeader } from '../shared/V2PageHeader';
import { V2BeltProgressBar } from '../shared/V2BeltProgressBar';

const BELT_LEVELS = [
  'White Belt', 'Yellow Belt', 'Orange Belt', 'Purple Belt',
  'Blue Belt', 'Green Belt', 'Brown Belt', 'Red Belt', 'Black Belt',
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

function getAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function StarPicker({ rating, onClick }: { rating: number; onClick: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n} type="button"
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onClick(n)}
          className="cursor-pointer hover:scale-110 transition-transform"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className="w-7 h-7"
            fill={(hovered || rating) >= n ? '#F59E0B' : 'none'}
            stroke={(hovered || rating) >= n ? '#F59E0B' : '#D1D5DB'}
          />
        </button>
      ))}
    </div>
  );
}

export function V2ProfileTab({ user }: { user: NonNullable<AppUser> }) {
  const {
    family, guardians, students, loading,
    saveFamily, addGuardian, updateGuardian, removeGuardian,
    addStudent, updateStudent,
  } = useProfile(user);

  // Family edit
  const [editFamilyOpen, setEditFamilyOpen] = useState(false);
  const [familyForm, setFamilyForm] = useState({ address: '', city: '', state: '', zip: '' });

  // Guardian edit
  const [guardianSheetOpen, setGuardianSheetOpen] = useState(false);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [guardianForm, setGuardianForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', relationship: '' });
  const [savingGuardian, setSavingGuardian] = useState(false);

  // Student edit
  const [studentSheetOpen, setStudentSheetOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', beltLevel: 'White Belt', status: 'active' as 'active' | 'inactive', notes: '' });
  const [savingStudent, setSavingStudent] = useState(false);

  // Review
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    getUserReview(user.id).then((r) => { setExistingReview(r); if (r) { setReviewRating(r.rating); setReviewText(r.review); } }).finally(() => setReviewLoading(false));
  }, [user.id]);

  const openEditFamily = () => {
    setFamilyForm({ address: family?.address || '', city: family?.city || '', state: family?.state || '', zip: family?.zip || '' });
    setEditFamilyOpen(true);
  };
  const handleSaveFamily = async () => {
    await saveFamily(familyForm);
    setEditFamilyOpen(false);
  };

  const openAddGuardian = () => {
    setEditingGuardianId(null);
    setGuardianForm({ firstName: '', lastName: '', email: '', phoneNumber: '', relationship: '' });
    setGuardianSheetOpen(true);
  };
  const openEditGuardian = (g: any) => {
    setEditingGuardianId(g.guardian_id);
    setGuardianForm({ firstName: g.first_name, lastName: g.last_name, email: g.email || '', phoneNumber: g.phone_number || '', relationship: g.relationship || '' });
    setGuardianSheetOpen(true);
  };
  const handleSaveGuardian = async () => {
    setSavingGuardian(true);
    try {
      if (editingGuardianId) {
        await updateGuardian(editingGuardianId, { first_name: guardianForm.firstName, last_name: guardianForm.lastName, email: guardianForm.email, phone_number: guardianForm.phoneNumber, relationship: guardianForm.relationship });
      } else {
        await addGuardian({ first_name: guardianForm.firstName, last_name: guardianForm.lastName, email: guardianForm.email, phone_number: guardianForm.phoneNumber, relationship: guardianForm.relationship });
      }
      setGuardianSheetOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save guardian');
    } finally {
      setSavingGuardian(false);
    }
  };

  const openAddStudent = () => {
    setEditingStudentId(null);
    setStudentForm({ firstName: '', lastName: '', dateOfBirth: '', beltLevel: 'White Belt', status: 'active', notes: '' });
    setStudentSheetOpen(true);
  };
  const openEditStudent = (s: any) => {
    setEditingStudentId(s.student_id);
    setStudentForm({ firstName: s.first_name, lastName: s.last_name, dateOfBirth: s.date_of_birth || '', beltLevel: s.belt_level || 'White Belt', status: s.status, notes: s.notes || '' });
    setStudentSheetOpen(true);
  };
  const handleSaveStudent = async () => {
    setSavingStudent(true);
    try {
      if (editingStudentId) {
        await updateStudent(editingStudentId, { first_name: studentForm.firstName, last_name: studentForm.lastName, date_of_birth: studentForm.dateOfBirth || null, belt_level: studentForm.beltLevel, status: studentForm.status, notes: studentForm.notes });
      } else {
        await addStudent({ first_name: studentForm.firstName, last_name: studentForm.lastName, date_of_birth: studentForm.dateOfBirth || null, belt_level: studentForm.beltLevel, status: studentForm.status, notes: studentForm.notes });
      }
      setStudentSheetOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save student');
    } finally {
      setSavingStudent(false);
    }
  };

  const handleSaveReview = async () => {
    if (!reviewText.trim()) return;
    setSavingReview(true);
    try {
      if (existingReview) {
        const updated = await updateReview(existingReview.review_id, { rating: reviewRating, review: reviewText.trim() });
        setExistingReview(updated);
      } else {
        const fam = await getFamilyByOwner(user.id);
        if (!fam) throw new Error('Family profile not found.');
        const created = await createReview({ family_id: fam.family_id, author_user_id: user.id, rating: reviewRating, review: reviewText.trim() });
        setExistingReview(created);
      }
      setIsEditingReview(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const primaryGuardian = guardians.find((g) => g.is_primary_contact);

  return (
    <div className="space-y-6 max-w-3xl">
      <V2PageHeader title="My Profile" description="Manage your family details, guardians, and students." />

      {/* Family Details */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="w-5 h-5 text-primary" />
            Family Details
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openEditFamily}>
            <Edit2 className="w-4 h-4 mr-1.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-foreground">{family?.primary_email || user.email}</span>
          </div>
          {primaryGuardian?.phone_number && (
            <div className="flex gap-2">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-foreground">{primaryGuardian.phone_number}</span>
            </div>
          )}
          {family?.address && (
            <div className="flex gap-2">
              <Home className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-foreground">
                {family.address}{family.city ? `, ${family.city}` : ''}{family.state ? `, ${family.state}` : ''}{family.zip ? ` ${family.zip}` : ''}
              </span>
            </div>
          )}
          {!family?.address && (
            <p className="text-muted-foreground italic">No address on file.</p>
          )}
        </CardContent>
      </Card>

      {/* Guardians */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-primary" />
            Guardians
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAddGuardian}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {guardians.map((g) => (
            <div key={g.guardian_id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getInitials(g.first_name, g.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">{g.first_name} {g.last_name}</p>
                  {g.is_primary_contact && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Primary</Badge>}
                  {g.relationship && <Badge variant="secondary" className="text-xs">{g.relationship}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {g.email && <p>{g.email}</p>}
                  {g.phone_number && <p>{g.phone_number}</p>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {!g.is_primary_contact && (
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => updateGuardian(g.guardian_id, { is_primary_contact: true })}>
                    Set Primary
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEditGuardian(g)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {guardians.length > 1 && !g.is_primary_contact && (
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" onClick={() => removeGuardian(g.guardian_id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-primary" />
            Students
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAddStudent}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Student
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 italic">No students added yet.</p>
          ) : students.map((s) => {
            const age = getAge(s.date_of_birth);
            return (
              <div key={s.student_id} className="p-4 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                      {getInitials(s.first_name, s.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-foreground">{s.first_name} {s.last_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {age !== null && <span className="text-sm text-muted-foreground">{age} years old</span>}
                          <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditStudent(s)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="mt-2">
                      <V2BeltProgressBar beltLevel={s.belt_level || ''} />
                    </div>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{s.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ─── SHEETS ─── */}

      {/* Edit Family Sheet */}
      <Sheet open={editFamilyOpen} onOpenChange={setEditFamilyOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-w-lg mx-auto">
          <SheetHeader className="mb-5"><SheetTitle>Edit Family Details</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="f-addr" className="font-medium">Street Address</Label>
              <Input id="f-addr" value={familyForm.address} onChange={(e) => setFamilyForm((p) => ({ ...p, address: e.target.value }))} className="mt-1.5 h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="f-city" className="font-medium">City</Label>
                <Input id="f-city" value={familyForm.city} onChange={(e) => setFamilyForm((p) => ({ ...p, city: e.target.value }))} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label htmlFor="f-state" className="font-medium">State</Label>
                <Input id="f-state" value={familyForm.state} onChange={(e) => setFamilyForm((p) => ({ ...p, state: e.target.value.slice(0, 2).toUpperCase() }))} maxLength={2} className="mt-1.5 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="f-zip" className="font-medium">ZIP Code</Label>
              <Input id="f-zip" value={familyForm.zip} onChange={(e) => setFamilyForm((p) => ({ ...p, zip: e.target.value.slice(0, 10) }))} className="mt-1.5 h-11" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setEditFamilyOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-11" onClick={handleSaveFamily}>Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Guardian Sheet */}
      <Sheet open={guardianSheetOpen} onOpenChange={setGuardianSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-w-lg mx-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>{editingGuardianId ? 'Edit Guardian' : 'Add Guardian'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="g-fn" className="font-medium">First Name <span className="text-destructive">*</span></Label>
                <Input id="g-fn" value={guardianForm.firstName} onChange={(e) => setGuardianForm((p) => ({ ...p, firstName: e.target.value }))} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label htmlFor="g-ln" className="font-medium">Last Name <span className="text-destructive">*</span></Label>
                <Input id="g-ln" value={guardianForm.lastName} onChange={(e) => setGuardianForm((p) => ({ ...p, lastName: e.target.value }))} className="mt-1.5 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="g-email" className="font-medium">Email <span className="text-destructive">*</span></Label>
              <Input id="g-email" type="email" value={guardianForm.email} onChange={(e) => setGuardianForm((p) => ({ ...p, email: e.target.value }))} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="g-phone" className="font-medium">Phone</Label>
              <Input id="g-phone" type="tel" value={guardianForm.phoneNumber} onChange={(e) => setGuardianForm((p) => ({ ...p, phoneNumber: e.target.value }))} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="g-rel" className="font-medium">Relationship</Label>
              <Input id="g-rel" placeholder="e.g. Mother, Father, Grandparent" value={guardianForm.relationship} onChange={(e) => setGuardianForm((p) => ({ ...p, relationship: e.target.value }))} className="mt-1.5 h-11" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setGuardianSheetOpen(false)}>Cancel</Button>
              <Button
                className="flex-1 h-11"
                disabled={!guardianForm.firstName.trim() || !guardianForm.lastName.trim() || !guardianForm.email.trim() || savingGuardian}
                onClick={handleSaveGuardian}
              >
                {savingGuardian ? 'Saving...' : editingGuardianId ? 'Update' : 'Add Guardian'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Student Sheet */}
      <Sheet open={studentSheetOpen} onOpenChange={setStudentSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-w-lg mx-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>{editingStudentId ? 'Edit Student' : 'Add Student'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="s-fn" className="font-medium">First Name <span className="text-destructive">*</span></Label>
                <Input id="s-fn" value={studentForm.firstName} onChange={(e) => setStudentForm((p) => ({ ...p, firstName: e.target.value }))} className="mt-1.5 h-11" />
              </div>
              <div>
                <Label htmlFor="s-ln" className="font-medium">Last Name <span className="text-destructive">*</span></Label>
                <Input id="s-ln" value={studentForm.lastName} onChange={(e) => setStudentForm((p) => ({ ...p, lastName: e.target.value }))} className="mt-1.5 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="s-dob" className="font-medium">Date of Birth <span className="text-destructive">*</span></Label>
              <Input id="s-dob" type="date" value={studentForm.dateOfBirth} onChange={(e) => setStudentForm((p) => ({ ...p, dateOfBirth: e.target.value }))} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="s-belt" className="font-medium">Belt Level</Label>
              <Select value={studentForm.beltLevel} onValueChange={(v) => setStudentForm((p) => ({ ...p, beltLevel: v }))}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BELT_LEVELS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editingStudentId && (
              <div>
                <Label htmlFor="s-status" className="font-medium">Status</Label>
                <Select value={studentForm.status} onValueChange={(v) => setStudentForm((p) => ({ ...p, status: v as 'active' | 'inactive' }))}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="s-notes" className="font-medium">Notes</Label>
              <Textarea id="s-notes" value={studentForm.notes} onChange={(e) => setStudentForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any allergies, special notes, or preferences..." className="mt-1.5 resize-none" rows={2} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStudentSheetOpen(false)}>Cancel</Button>
              <Button
                className="flex-1 h-11"
                disabled={!studentForm.firstName.trim() || !studentForm.lastName.trim() || !studentForm.dateOfBirth || savingStudent}
                onClick={handleSaveStudent}
              >
                {savingStudent ? 'Saving...' : editingStudentId ? 'Update' : 'Add Student'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
