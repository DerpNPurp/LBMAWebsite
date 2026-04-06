import { useState, useEffect } from 'react';
import {
  getFamilyByOwner,
  getGuardiansByFamily,
  getStudentsByFamily,
  getReviewByFamily,
} from '../lib/supabase/queries';
import {
  updateFamily,
  createGuardian,
  updateGuardian,
  deleteGuardian,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../lib/supabase/mutations';
import type { Family, Guardian, Student, Review } from '../lib/types';

type ProfileUser = {
  id: string;
  email: string;
};

export function useProfile(user: ProfileUser | null) {
  const [family, setFamily] = useState<Family | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const familyData = await getFamilyByOwner(user.id);

      if (!familyData) {
        setFamily(null);
        setGuardians([]);
        setStudents([]);
        setReview(null);
        setError('Family profile is not set up yet.');
        return;
      }

      setFamily(familyData);

      // Load guardians and students
      const [guardiansData, studentsData, reviewData] = await Promise.all([
        getGuardiansByFamily(familyData.family_id),
        getStudentsByFamily(familyData.family_id),
        getReviewByFamily(familyData.family_id).catch(() => null), // Review might not exist
      ]);

      setGuardians(guardiansData);
      setStudents(studentsData);
      setReview(reviewData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const saveFamily = async (updates: Partial<Family>) => {
    if (!family) throw new Error('No family found');
    
    const updated = await updateFamily(family.family_id, updates);
    setFamily(updated);
    return updated;
  };

  const addGuardian = async (guardian: Omit<Guardian, 'guardian_id' | 'created_at' | 'updated_at'>) => {
    if (!family) throw new Error('No family found');
    
    const newGuardian = await createGuardian({
      ...guardian,
      family_id: family.family_id,
    });
    setGuardians([...guardians, newGuardian]);
    return newGuardian;
  };

  const updateGuardianData = async (guardianId: string, updates: Partial<Guardian>) => {
    const updated = await updateGuardian(guardianId, updates);
    setGuardians(guardians.map(g => g.guardian_id === guardianId ? updated : g));
    return updated;
  };

  const removeGuardian = async (guardianId: string) => {
    await deleteGuardian(guardianId);
    setGuardians(guardians.filter(g => g.guardian_id !== guardianId));
  };

  const addStudent = async (student: Omit<Student, 'student_id' | 'created_at' | 'updated_at'>) => {
    if (!family) throw new Error('No family found');
    
    const newStudent = await createStudent({
      ...student,
      family_id: family.family_id,
    });
    setStudents([...students, newStudent]);
    return newStudent;
  };

  const updateStudentData = async (studentId: string, updates: Partial<Student>) => {
    const updated = await updateStudent(studentId, updates);
    setStudents(students.map(s => s.student_id === studentId ? updated : s));
    return updated;
  };

  const removeStudent = async (studentId: string) => {
    await deleteStudent(studentId);
    setStudents(students.filter(s => s.student_id !== studentId));
  };

  return {
    family,
    guardians,
    students,
    review,
    loading,
    error,
    saveFamily,
    addGuardian,
    updateGuardian: updateGuardianData,
    removeGuardian,
    addStudent,
    updateStudent: updateStudentData,
    removeStudent,
    reload: loadProfile,
  };
}
