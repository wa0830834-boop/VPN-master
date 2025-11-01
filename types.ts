export interface Server {
  id: string;
  country: string;
  city: string;
  flag: string;
  ipPrefix: string;
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  AUTHENTICATING = 'AUTHENTICATING',
  SECURING = 'SECURING',
  DISCONNECTED = 'DISCONNECTED',
  DISCONNECTING = 'DISCONNECTING',
}