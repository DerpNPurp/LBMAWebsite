import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllFamilies, getFamilyWithRelations } from '../lib/supabase/queries';
import { setFamilyAccountStatus, updateGuardian, updateStudent, updateStudentsByFamily } from '../lib/supabase/mutations';

export type FamilyStatus = 'active' | 'inactive' | 'archived';
export type StudentStatus = 'active' | 'inactive';

export type GuardianRow = {
  guardianId: string;
  name: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  isPrimaryContact: boolean;
};

export type StudentRow = {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  age: number;
  beltLevel: string;
  status: StudentStatus;
  notes: string;
  familyId: string;
  familyName: string;
  primaryContact: string;
  primaryEmail: string;
};

export type Family = {
  id: string;
  primaryEmail: string;
  primaryContact: string;
  phoneNumber: string;
  address: string;
  studentCount: number;
  status: FamilyStatus;
  joinedDate: string;
  students: StudentRow[];
  guardians: GuardianRow[];
};

export type FamilyDetails = {
  family: Family;
  guardians: GuardianRow[];
  students: StudentRow[];
};

function calculateAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365));
}

function toFamilyStatus(status: unknown): FamilyStatus {
  return status === 'inactive' || status === 'archived' ? status : 'active';
}

function mapFamilyRecord(details: any): Family {
  const guardians: GuardianRow[] = (details.guardians || []).map((guardian: any) => ({
    guardianId: guardian.guardian_id,
    name: `${guardian.first_name} ${guardian.last_name}`,
    firstName: guardian.first_name,
    lastName: guardian.last_name,
    relationship: guardian.relationship || 'Guardian',
    email: guardian.email || 'Not set',
    phone: guardian.phone_number || 'Not set',
    isPrimaryContact: Boolean(guardian.is_primary_contact),
  }));

  const primaryGuardian = guardians.find((guardian) => guardian.isPrimaryContact) || guardians[0];
  const students: StudentRow[] = (details.students || []).map((student: any) => ({
    studentId: student.student_id,
    studentName: `${student.first_name} ${student.last_name}`,
    firstName: student.first_name,
    lastName: student.last_name,
    age: calculateAge(student.date_of_birth),
    beltLevel: student.belt_level || 'White Belt',
    status: student.status === 'inactive' ? 'inactive' : 'active',
    notes: student.notes || '',
    familyId: details.family_id,
    familyName: `${primaryGuardian?.name || 'Unknown'} Family`,
    primaryContact: primaryGuardian?.name || 'Unknown',
    primaryEmail: details.primary_email,
  }));

  return {
    id: details.family_id,
    primaryEmail: details.primary_email,
    primaryContact: primaryGuardian?.name || 'Unknown',
    phoneNumber: primaryGuardian?.phone || 'Not set',
    address: [details.address, details.city, details.state, details.zip].filter(Boolean).join(', ') || 'Not set',
    studentCount: students.length,
    status: toFamilyStatus(details.account_status),
    joinedDate: details.created_at,
    students,
    guardians,
  };
}

export function useAdminFamilies(searchTerm: string) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<FamilyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshFamilies = useCallback(async () => {
    setLoading(true);
    try {
      const familiesData = await getAllFamilies();
      const familyRows = await Promise.all(
        familiesData.map(async (family: any) => {
          const details = await getFamilyWithRelations(family.family_id);
          return mapFamilyRecord({ ...details, account_status: family.account_status });
        }),
      );
      setFamilies(familyRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFamilies();
  }, [refreshFamilies]);

  const allStudents: StudentRow[] = useMemo(() => families.flatMap((family) => family.students), [families]);

  const filteredFamilies = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return families;

    return families.filter((family) => {
      if (family.primaryContact.toLowerCase().includes(searchLower)) return true;
      if (family.primaryEmail.toLowerCase().includes(searchLower)) return true;
      return family.guardians.some(
        (guardian) =>
          guardian.name.toLowerCase().includes(searchLower) || guardian.email.toLowerCase().includes(searchLower),
      );
    });
  }, [families, searchTerm]);

  const filteredStudents = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return allStudents;

    return allStudents.filter((student) => {
      if (student.studentName.toLowerCase().includes(searchLower)) return true;
      if (student.primaryContact.toLowerCase().includes(searchLower)) return true;
      return student.primaryEmail.toLowerCase().includes(searchLower);
    });
  }, [allStudents, searchTerm]);

  const loadFamilyDetails = useCallback(async (familyId: string) => {
    const details = await getFamilyWithRelations(familyId);
    const mappedFamily = mapFamilyRecord(details);

    setSelectedFamily({
      family: mappedFamily,
      guardians: mappedFamily.guardians,
      students: mappedFamily.students,
    });
  }, []);

  const reloadSelectedFamily = useCallback(async () => {
    if (!selectedFamily) return;
    await loadFamilyDetails(selectedFamily.family.id);
  }, [loadFamilyDetails, selectedFamily]);

  const updateFamilyStatus = useCallback(
    async (familyId: string, status: FamilyStatus) => {
      setSaving(true);
      try {
        await setFamilyAccountStatus(familyId, status);
        if (status !== 'active') {
          await updateStudentsByFamily(familyId, { status: 'inactive' });
        }
        await refreshFamilies();
        await reloadSelectedFamily();
      } finally {
        setSaving(false);
      }
    },
    [refreshFamilies, reloadSelectedFamily],
  );

  const saveStudent = useCallback(
    async (studentId: string, updates: { belt_level?: string | null; status?: StudentStatus; notes?: string | null }) => {
      setSaving(true);
      try {
        await updateStudent(studentId, updates);
        await refreshFamilies();
        await reloadSelectedFamily();
      } finally {
        setSaving(false);
      }
    },
    [refreshFamilies, reloadSelectedFamily],
  );

  const saveGuardian = useCallback(
    async (guardianId: string, updates: any) => {
      setSaving(true);
      try {
        await updateGuardian(guardianId, updates);
        await refreshFamilies();
        await reloadSelectedFamily();
      } finally {
        setSaving(false);
      }
    },
    [refreshFamilies, reloadSelectedFamily],
  );

  const setPrimaryGuardian = useCallback(
    async (guardianId: string) => {
      if (!selectedFamily) return;

      setSaving(true);
      try {
        await Promise.all(
          selectedFamily.guardians.map((guardian) =>
            updateGuardian(guardian.guardianId, { is_primary_contact: guardian.guardianId === guardianId }),
          ),
        );
        await refreshFamilies();
        await reloadSelectedFamily();
      } finally {
        setSaving(false);
      }
    },
    [refreshFamilies, reloadSelectedFamily, selectedFamily],
  );

  return {
    families,
    filteredFamilies,
    filteredStudents,
    selectedFamily,
    setSelectedFamily,
    loading,
    saving,
    refreshFamilies,
    loadFamilyDetails,
    updateFamilyStatus,
    saveStudent,
    saveGuardian,
    setPrimaryGuardian,
  };
}
