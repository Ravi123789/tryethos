interface Attestation {
  hash: string;
  profileId: number;
  service: string;
  account: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
}

interface ExtendedAttestation {
  attestation: Attestation;
  extra: {
    attestationHash: string;
    id: string;
    username: string;
    name: string;
    biography: string;
    avatar: string;
    followersCount: number;
    isBlueVerified: boolean;
    joinedAt: number;
    website: string;
  };
}

export async function getAttestations(profileId: number): Promise<Attestation[]> {
  try {
    const response = await fetch('https://api.ethos.network/api/v1/attestations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        profileIds: [profileId],
        limit: 50,
        offset: 0,
        archived: false
      })
    });

    const data = await response.json();
    
    if (data.ok && data.data?.values) {
      return data.data.values;
    }
    
    return [];
  } catch (error) {
    // Error fetching attestations handled
    return [];
  }
}

export async function getExtendedAttestations(profileId: number): Promise<ExtendedAttestation[]> {
  try {
    const response = await fetch('https://api.ethos.network/api/v1/attestations/extended', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        profileIds: [profileId],
        limit: 50,
        offset: 0,
        archived: false
      })
    });

    const data = await response.json();
    
    if (data.ok && data.data?.values) {
      return data.data.values;
    }
    
    return [];
  } catch (error) {
    // Error fetching extended attestations handled
    return [];
  }
}

export function mapServiceToIcon(service: string): string {
  const serviceMap: Record<string, string> = {
    'x.com': '𝕏', // Twitter/X
    'discord': '🎮',
    'github': '🐙',
    'ethereum': '⟠',
    'ens': '🌐'
  };
  
  return serviceMap[service.toLowerCase()] || '🔗';
}

export function formatServiceName(service: string): string {
  const serviceNames: Record<string, string> = {
    'x.com': 'Twitter/X',
    'discord': 'Discord',
    'github': 'GitHub',
    'ethereum': 'Ethereum',
    'ens': 'ENS'
  };
  
  return serviceNames[service.toLowerCase()] || service;
}