
export interface ModelLayer {
  id: string;
  name: string;
  type: 'input' | 'dense' | 'convolution' | 'pooling' | 'dropout' | 'output' | 'normalization' | 'activation';
  neurons: number;
  activation?: string;
  details?: string;
  contribution: string;
  relativeImportance: number; // Value between 0 and 1 representing layer impact/frequency
}

export interface ModelArchitecture {
  name: string;
  type: string;
  description: string;
  layers: ModelLayer[];
  totalParameters: string;
  useCase: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}
