export interface SystemDiagnostics {
  python_version: string | null;
  pickle_file_exists: boolean;
  pickle_file_size_bytes: number;
  torch_available: boolean;
  transformers_available: boolean;
  torch_version: string | null;
  transformers_version: string | null;
  pillow_available: boolean;
  error: string | null;
}

export interface ModelStatusResponse {
  success: boolean;
  diagnostics?: SystemDiagnostics;
  pkl_at_root: boolean;
  error?: string;
}

export interface CaptionGenerationResponse {
  success: boolean;
  caption?: string;
  source: "pickle" | "gemini" | "BLIP";
  error?: string;
  code?: string;
  model_type?: string;
  diagnostics?: SystemDiagnostics;
  execution_time_ms?: number;
}

export interface CaptionHistoryEntry {
  id: string;
  timestamp: string;
  image_base64: string;
  caption: string;
  source: "pickle" | "gemini" | "BLIP";
  model_type?: string;
  execution_time_ms?: number;
}
