import { useQuery } from '@tanstack/react-query';
import { getAllProfiles } from '../supabase/queries';
import { queryKeys } from '../queryKeys';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: getAllProfiles,
  });
}
