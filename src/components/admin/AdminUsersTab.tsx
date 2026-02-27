import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Eye, UserPlus, Mail, Edit2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getAllFamilies, getFamilyWithRelations } from '../../lib/supabase/queries';
import { updateStudent, updateFamily } from '../../lib/supabase/mutations';
import { supabase } from '../../lib/supabase/client';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'family';
  displayName: string;
};

type Family = {
  id: string;
  primaryEmail: string;
  primaryContact: string;
  phoneNumber: string;
  address: string;
  studentCount: number;
  status: 'active' | 'inactive';
  joinedDate: string;
  students: { name: string; age: number; beltLevel: string; status: string }[];
  guardians: { name: string; relationship: string; email: string; phone: string }[];
};

const mockFamilies: Family[] = [
  {
    id: '1',
    primaryEmail: 'johnson@example.com',
    primaryContact: 'Sarah Johnson',
    phoneNumber: '(555) 123-4567',
    address: '123 Oak Street, Los Banos, CA',
    studentCount: 2,
    status: 'active',
    joinedDate: '2024-06-15',
    guardians: [
      { name: 'Sarah Johnson', relationship: 'Mother', email: 'johnson@example.com', phone: '(555) 123-4567' },
      { name: 'David Johnson', relationship: 'Father', email: 'david.j@example.com', phone: '(555) 123-4568' }
    ],
    students: [
      { name: 'Emma Johnson', age: 9, beltLevel: 'Orange Belt', status: 'active' },
      { name: 'Oliver Johnson', age: 7, beltLevel: 'Yellow Belt', status: 'active' }
    ]
  },
  {
    id: '2',
    primaryEmail: 'martinez@example.com',
    primaryContact: 'Jennifer Martinez',
    phoneNumber: '(555) 234-5678',
    address: '456 Maple Ave, Los Banos, CA',
    studentCount: 1,
    status: 'active',
    joinedDate: '2023-09-20',
    guardians: [
      { name: 'Jennifer Martinez', relationship: 'Mother', email: 'martinez@example.com', phone: '(555) 234-5678' },
      { name: 'Carlos Martinez', relationship: 'Father', email: 'carlos.m@example.com', phone: '(555) 234-5679' }
    ],
    students: [
      { name: 'Sofia Martinez', age: 8, beltLevel: 'Yellow Belt', status: 'active' }
    ]
  },
  {
    id: '3',
    primaryEmail: 'chen@example.com',
    primaryContact: 'Mike Chen',
    phoneNumber: '(555) 345-6789',
    address: '789 Pine Road, Los Banos, CA',
    studentCount: 3,
    status: 'active',
    joinedDate: '2025-01-10',
    guardians: [
      { name: 'Mike Chen', relationship: 'Father', email: 'chen@example.com', phone: '(555) 345-6789' },
      { name: 'Lisa Chen', relationship: 'Mother', email: 'lisa.chen@example.com', phone: '(555) 345-6790' }
    ],
    students: [
      { name: 'Nathan Chen', age: 10, beltLevel: 'Green Belt', status: 'active' },
      { name: 'Lily Chen', age: 8, beltLevel: 'Orange Belt', status: 'active' },
      { name: 'Max Chen', age: 6, beltLevel: 'White Belt', status: 'active' }
    ]
  },
  {
    id: '4',
    primaryEmail: 'torres@example.com',
    primaryContact: 'Michael Torres',
    phoneNumber: '(555) 456-7890',
    address: '321 Elm Street, Los Banos, CA',
    studentCount: 1,
    status: 'inactive',
    joinedDate: '2023-03-05',
    guardians: [
      { name: 'Michael Torres', relationship: 'Father', email: 'torres@example.com', phone: '(555) 456-7890' }
    ],
    students: [
      { name: 'Diego Torres', age: 9, beltLevel: 'Yellow Belt', status: 'inactive' }
    ]
  }
];

type FamilyDetails = {
  family: Family;
  guardians: { name: string; relationship: string; email: string; phone: string }[];
  students: { name: string; age: number; beltLevel: string; status: string }[];
};

const mockFamilyDetails: { [key: string]: FamilyDetails } = {
  '1': {
    family: mockFamilies[0],
    guardians: mockFamilies[0].guardians,
    students: mockFamilies[0].students
  },
  '2': {
    family: mockFamilies[1],
    guardians: mockFamilies[1].guardians,
    students: mockFamilies[1].students
  },
  '3': {
    family: mockFamilies[2],
    guardians: mockFamilies[2].guardians,
    students: mockFamilies[2].students
  },
  '4': {
    family: mockFamilies[3],
    guardians: mockFamilies[3].guardians,
    students: mockFamilies[3].students
  }
};

type StudentWithFamily = {
  studentId: string;
  studentName: string;
  age: number;
  beltLevel: string;
  status: string;
  familyId: string;
  familyName: string;
  primaryContact: string;
  primaryEmail: string;
};

const beltLevels = [
  'White Belt',
  'Yellow Belt',
  'Orange Belt',
  'Purple Belt',
  'Blue Belt',
  'Green Belt',
  'Brown Belt',
  'Red Belt',
  'Black Belt'
];

export function AdminUsersTab({ user }: { user: User }) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<FamilyDetails | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingStudent, setEditingStudent] = useState<{ student: StudentWithFamily; newBeltLevel: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const familiesData = await getAllFamilies();
        
        // Load full details for each family
        const familiesWithDetails = await Promise.all(
          familiesData.map(async (f: any) => {
            const details = await getFamilyWithRelations(f.family_id);
            const primaryGuardian = details.guardians?.find((g: any) => g.is_primary_contact) || details.guardians?.[0];
            
            return {
              id: f.family_id,
              primaryEmail: f.primary_email,
              primaryContact: primaryGuardian ? `${primaryGuardian.first_name} ${primaryGuardian.last_name}` : 'Unknown',
              phoneNumber: primaryGuardian?.phone_number || 'Not set',
              address: [f.address, f.city, f.state, f.zip].filter(Boolean).join(', ') || 'Not set',
              studentCount: details.students?.length || 0,
              status: details.students?.some((s: any) => s.status === 'active') ? 'active' : 'inactive',
              joinedDate: f.created_at,
              students: (details.students || []).map((s: any) => ({
                name: `${s.first_name} ${s.last_name}`,
                age: s.date_of_birth ? Math.floor((new Date().getTime() - new Date(s.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0,
                beltLevel: s.belt_level || 'White Belt',
                status: s.status,
              })),
              guardians: (details.guardians || []).map((g: any) => ({
                name: `${g.first_name} ${g.last_name}`,
                relationship: g.relationship || 'Guardian',
                email: g.email || 'Not set',
                phone: g.phone_number || 'Not set',
              })),
            };
          })
        );
        
        setFamilies(familiesWithDetails);
      } catch (error) {
        console.error('Error loading families:', error);
        alert('Error loading families: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, []);

  // Create a flat list of all students with their family information
  const allStudents: StudentWithFamily[] = families.flatMap(family =>
    family.students.map((student, index) => ({
      studentId: `${family.id}-${index}`,
      studentName: student.name,
      age: student.age,
      beltLevel: student.beltLevel,
      status: student.status,
      familyId: family.id,
      familyName: `${family.primaryContact} Family`,
      primaryContact: family.primaryContact,
      primaryEmail: family.primaryEmail
    }))
  );

  const filteredFamilies = families.filter(family => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search by primary contact
    if (family.primaryContact.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search by primary email
    if (family.primaryEmail.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search by any guardian name or email
    const guardianMatch = family.guardians.some(guardian =>
      guardian.name.toLowerCase().includes(searchLower) ||
      guardian.email.toLowerCase().includes(searchLower)
    );
    if (guardianMatch) {
      return true;
    }
    
    return false;
  });

  const filteredStudents = allStudents.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search by student name
    if (student.studentName.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search by family contact
    if (student.primaryContact.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search by family email
    if (student.primaryEmail.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    return false;
  });

  const handleViewDetails = async (familyId: string) => {
    try {
      const details = await getFamilyWithRelations(familyId);
      const primaryGuardian = details.guardians?.find((g: any) => g.is_primary_contact) || details.guardians?.[0];
      
      setSelectedFamily({
        family: {
          id: details.family_id,
          primaryEmail: details.primary_email,
          primaryContact: primaryGuardian ? `${primaryGuardian.first_name} ${primaryGuardian.last_name}` : 'Unknown',
          phoneNumber: primaryGuardian?.phone_number || 'Not set',
          address: [details.address, details.city, details.state, details.zip].filter(Boolean).join(', ') || 'Not set',
          studentCount: details.students?.length || 0,
          status: details.students?.some((s: any) => s.status === 'active') ? 'active' : 'inactive',
          joinedDate: details.created_at,
          students: [],
          guardians: [],
        },
        guardians: (details.guardians || []).map((g: any) => ({
          name: `${g.first_name} ${g.last_name}`,
          relationship: g.relationship || 'Guardian',
          email: g.email || 'Not set',
          phone: g.phone_number || 'Not set',
        })),
        students: (details.students || []).map((s: any) => ({
          name: `${s.first_name} ${s.last_name}`,
          age: s.date_of_birth ? Math.floor((new Date().getTime() - new Date(s.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0,
          beltLevel: s.belt_level || 'White Belt',
          status: s.status,
        })),
      });
    } catch (error) {
      alert('Error loading family details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      // Send magic link invitation
      const { error } = await supabase.auth.signInWithOtp({
        email: inviteEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;

      alert(`Invitation sent to ${inviteEmail}! They will receive an email with a magic link to set up their account.`);
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    } catch (error) {
      alert('Error sending invitation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateStudentStatus = async (studentId: string, newStatus: 'active' | 'inactive') => {
    setSaving(true);
    try {
      await updateStudent(studentId, { status: newStatus });
      // Reload families
      const familiesData = await getAllFamilies();
      const familiesWithDetails = await Promise.all(
        familiesData.map(async (f: any) => {
          const details = await getFamilyWithRelations(f.family_id);
          const primaryGuardian = details.guardians?.find((g: any) => g.is_primary_contact) || details.guardians?.[0];
          
          return {
            id: f.family_id,
            primaryEmail: f.primary_email,
            primaryContact: primaryGuardian ? `${primaryGuardian.first_name} ${primaryGuardian.last_name}` : 'Unknown',
            phoneNumber: primaryGuardian?.phone_number || 'Not set',
            address: [f.address, f.city, f.state, f.zip].filter(Boolean).join(', ') || 'Not set',
            studentCount: details.students?.length || 0,
            status: details.students?.some((s: any) => s.status === 'active') ? 'active' : 'inactive',
            joinedDate: f.created_at,
            students: (details.students || []).map((s: any) => ({
              name: `${s.first_name} ${s.last_name}`,
              age: s.date_of_birth ? Math.floor((new Date().getTime() - new Date(s.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0,
              beltLevel: s.belt_level || 'White Belt',
              status: s.status,
            })),
            guardians: (details.guardians || []).map((g: any) => ({
              name: `${g.first_name} ${g.last_name}`,
              relationship: g.relationship || 'Guardian',
              email: g.email || 'Not set',
              phone: g.phone_number || 'Not set',
            })),
          };
        })
      );
      setFamilies(familiesWithDetails);
      alert('Student status updated successfully!');
    } catch (error) {
      alert('Error updating student status: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const handleEditStudent = (student: StudentWithFamily) => {
    setEditingStudent({ student, newBeltLevel: student.beltLevel });
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    
    setSaving(true);
    try {
      // Extract student ID from the composite ID (familyId-index format)
      const familyId = editingStudent.student.familyId;
      const family = families.find(f => f.id === familyId);
      if (!family) throw new Error('Family not found');
      
      // Find the actual student in the database
      const details = await getFamilyWithRelations(familyId);
      const studentIndex = family.students.findIndex(s => 
        s.name === editingStudent.student.studentName
      );
      
      if (studentIndex >= 0 && details.students[studentIndex]) {
        await updateStudent(details.students[studentIndex].student_id, {
          belt_level: editingStudent.newBeltLevel,
        });
        
        // Reload families
        const familiesData = await getAllFamilies();
        const familiesWithDetails = await Promise.all(
          familiesData.map(async (f: any) => {
            const details = await getFamilyWithRelations(f.family_id);
            const primaryGuardian = details.guardians?.find((g: any) => g.is_primary_contact) || details.guardians?.[0];
            
            return {
              id: f.family_id,
              primaryEmail: f.primary_email,
              primaryContact: primaryGuardian ? `${primaryGuardian.first_name} ${primaryGuardian.last_name}` : 'Unknown',
              phoneNumber: primaryGuardian?.phone_number || 'Not set',
              address: [f.address, f.city, f.state, f.zip].filter(Boolean).join(', ') || 'Not set',
              studentCount: details.students?.length || 0,
              status: details.students?.some((s: any) => s.status === 'active') ? 'active' : 'inactive',
              joinedDate: f.created_at,
              students: (details.students || []).map((s: any) => ({
                name: `${s.first_name} ${s.last_name}`,
                age: s.date_of_birth ? Math.floor((new Date().getTime() - new Date(s.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0,
                beltLevel: s.belt_level || 'White Belt',
                status: s.status,
              })),
              guardians: (details.guardians || []).map((g: any) => ({
                name: `${g.first_name} ${g.last_name}`,
                relationship: g.relationship || 'Guardian',
                email: g.email || 'Not set',
                phone: g.phone_number || 'Not set',
              })),
            };
          })
        );
        setFamilies(familiesWithDetails);
        
        alert(`Updated ${editingStudent.student.studentName}'s belt level to ${editingStudent.newBeltLevel}`);
        setEditingStudent(null);
      }
    } catch (error) {
      alert('Error updating student: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Family Management</h2>
          <p className="text-muted-foreground mt-1">
            View and manage enrolled families and students
          </p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Family
        </Button>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite New Family</DialogTitle>
            <DialogDescription>
              Send an invitation to a new family to join the portal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="family@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-primary/20">
              <p className="text-sm">
                The family will receive an email with a magic link to set up their account 
                and create their profile with student information.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvite}
              disabled={!inviteEmail.trim()}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search families by guardian name/email or students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Families and Students */}
      <Tabs defaultValue="families">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="families">Families ({filteredFamilies.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({filteredStudents.length})</TabsTrigger>
        </TabsList>

        {/* Families Tab */}
        <TabsContent value="families">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Families</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFamilies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No families found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFamilies.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {family.primaryContact.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{family.primaryContact}</span>
                          </div>
                        </TableCell>
                        <TableCell>{family.primaryEmail}</TableCell>
                        <TableCell>{family.phoneNumber}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {family.studentCount} {family.studentCount === 1 ? 'student' : 'students'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={family.status === 'active' ? 'default' : 'secondary'}>
                            {family.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(family.joinedDate)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(family.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Belt Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No students found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {student.studentName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.studentName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>
                          {editingStudent && editingStudent.student.studentId === student.studentId ? (
                            <Select
                              value={editingStudent.newBeltLevel}
                              onValueChange={(value) => setEditingStudent({ ...editingStudent, newBeltLevel: value })}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Select belt level" />
                              </SelectTrigger>
                              <SelectContent>
                                {beltLevels.map(level => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className="bg-[#303030] text-background border-primary">{student.beltLevel}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {student.primaryContact.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{student.primaryContact}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingStudent && editingStudent.student.studentId === student.studentId ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleSaveStudent}
                                disabled={saving}
                              >
                                {saving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Belt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Family Details Dialog */}
      <Dialog open={!!selectedFamily} onOpenChange={(open) => !open && setSelectedFamily(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Family Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedFamily?.family.primaryContact}
            </DialogDescription>
          </DialogHeader>
          {selectedFamily && (
            <div className="space-y-6 py-4">
              {/* Family Info */}
              <div>
                <h3 className="font-semibold mb-3">Family Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Primary Email</p>
                    <p>{selectedFamily.family.primaryEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{selectedFamily.family.phoneNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p>{selectedFamily.family.address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={selectedFamily.family.status === 'active' ? 'default' : 'secondary'}>
                      {selectedFamily.family.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Joined</p>
                    <p>{formatDate(selectedFamily.family.joinedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Guardians */}
              <div>
                <h3 className="font-semibold mb-3">Guardians</h3>
                <div className="space-y-3">
                  {selectedFamily.guardians.map((guardian, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <p className="font-medium">{guardian.name}</p>
                      <p className="text-sm text-muted-foreground">{guardian.relationship}</p>
                      <p className="text-sm">{guardian.email}</p>
                      <p className="text-sm">{guardian.phone}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Students */}
              <div>
                <h3 className="font-semibold mb-3">Students</h3>
                <div className="space-y-3">
                  {selectedFamily.students.map((student, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{student.name}</p>
                        <Badge className="bg-[#303030] text-background border-primary">{student.beltLevel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Age {student.age}</p>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="mt-2">
                        {student.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
