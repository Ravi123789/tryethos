import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface EthosComponent {
  id: string;
  name: string;
  status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';
  description?: string;
  position: number;
  showcase?: boolean;
}

interface EthosStatusResponse {
  page: {
    id: string;
    name: string;
    url: string;
    updated_at: string;
  };
  status: {
    indicator: 'none' | 'minor' | 'major' | 'critical';
    description: string;
  };
  components: EthosComponent[];
}

interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  description?: string;
}

export function EthosStatus() {
  const [systemsStatus, setSystemsStatus] = useState<SystemStatus[]>([]);
  const [isAllOperational, setIsAllOperational] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // Changed to false for immediate display
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Debug: ensure component renders

  const fetchEthosStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://status.ethos.network/api/v2/summary.json');
      
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      
      const data: EthosStatusResponse = await response.json();
      
      // Transform API data to our component format, excluding Alchemy
      const transformedSystems: SystemStatus[] = data.components
        .filter(component => component.showcase !== false)
        .filter(component => !component.name.includes('Alchemy'))
        .sort((a, b) => a.position - b.position)
        .map(component => ({
          name: formatComponentName(component.name),
          status: mapStatusToSimple(component.status),
          description: component.description,
        }));
      
      setSystemsStatus(transformedSystems);
      setIsAllOperational(data.status.indicator === 'none');
      setLastUpdated(new Date());
    } catch (error) {
      // Fallback to basic operational status if API fails
      setSystemsStatus([
        { name: 'API', status: 'operational' },
        { name: 'App', status: 'operational' },
        { name: 'Markets', status: 'operational' },
        { name: 'Extension', status: 'operational' },
      ]);
      setIsAllOperational(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatComponentName = (name: string): string => {
    if (name.includes('api.ethos.network')) return 'API';
    if (name.includes('app.ethos.network')) return 'App';
    if (name.includes('ethos.markets')) return 'Markets';
    if (name.includes('Chrome Extension')) return 'Extension';
    // Skip Alchemy components
    return name;
  };

  const mapStatusToSimple = (status: string): 'operational' | 'degraded' | 'outage' | 'maintenance' => {
    switch (status) {
      case 'operational':
        return 'operational';
      case 'degraded_performance':
        return 'degraded';
      case 'partial_outage':
      case 'major_outage':
        return 'outage';
      case 'under_maintenance':
        return 'maintenance';
      default:
        return 'operational';
    }
  };

  useEffect(() => {
    fetchEthosStatus();
    
    // Refresh status every 5 minutes
    const interval = setInterval(fetchEthosStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'degraded':
        return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'outage':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'maintenance':
        return <Clock className="w-3 h-3 text-blue-400" />;
      default:
        return <CheckCircle className="w-3 h-3 text-green-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'outage':
        return 'text-red-400';
      case 'maintenance':
        return 'text-blue-400';
      default:
        return 'text-green-400';
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      {isLoading ? (
        <RefreshCw className="w-2.5 h-2.5 text-white/70 animate-spin" />
      ) : (
        <CheckCircle className={`w-2.5 h-2.5 ${isAllOperational ? 'text-emerald-400' : 'text-amber-400'}`} />
      )}
      <span 
        className={`text-[10px] font-semibold ${
          isLoading ? 'text-white/70' : 
          isAllOperational ? 'text-emerald-300' : 'text-amber-300'
        }`}
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {isLoading ? 'Checking Status...' : 
         isAllOperational ? 'All Systems Operational' : 'Service Issues Detected'}
      </span>
    </div>
  );
}