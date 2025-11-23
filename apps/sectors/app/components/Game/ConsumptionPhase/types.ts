export interface ConsumerProfile {
  factorySize: string;
  resources: string[];
  consumerCount: number;
}

export interface Factory {
  id: string;
  size: string;
  resources: string[];
  consumersReceived: number;
  maxConsumers: number;
  profit: number;
  revenue?: number;
  costs?: number;
}

export interface Company {
  id: string;
  name: string;
  brandScore: number;
  sector: string;
  factories: Factory[];
}

export interface Sector {
  id: string;
  name: string;
  consumerProfiles: ConsumerProfile[];
}

export interface FlowLogEntry {
  id: string;
  consumerProfile: string;
  destination: string;
  reason: string;
  timestamp: string;
}

export interface ConsumerFlowPerSectorProps {
  sectors: Sector[];
  companies: Company[];
  gameId?: string;
}

export interface CompanyPerformanceProps {
  companies: Company[];
  gameId?: string;
}

export interface ConsumerFlowLogProps {
  flowLog: FlowLogEntry[];
} 