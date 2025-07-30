import { useQuery } from '@tanstack/react-query';

export interface SocialAttestation {
  service: string;
  serviceName: string;
  icon: string;
  account: string;
  username: string;
  displayName: string;
  avatar: string;
  website: string;
  followers: number;
  verified: boolean;
  createdAt: number;
  joinedAt?: number | null;
}

export function useAttestations(userkey: string, enabled = true) {
  return useQuery({
    queryKey: ['/api/attestations', userkey],
    enabled: enabled && !!userkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}