import { useQuery } from '@tanstack/react-query';
import { getReviews } from '../supabase/queries';
import { queryKeys } from '../queryKeys';

export function useReviews() {
  return useQuery({
    queryKey: queryKeys.reviews(),
    queryFn: getReviews,
  });
}
