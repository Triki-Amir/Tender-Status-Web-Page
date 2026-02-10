import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Document {
  id: string;
  tenant_id: string;
  uploaded_by?: string;
  created_by?: string;
  updated_by?: string;
  filename: string;
  storage_path: string;
  file_size?: number;
  mime_type?: string;
  language?: string;
  status: string;
  metadata: Record<string, any>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentRequest {
  filename: string;
  file_size?: number;
  mime_type?: string;
  language?: string;
  tenant_id: string;
  uploaded_by?: string;
}

export interface UpdateDocumentRequest {
  status?: string;
  metadata?: Record<string, any>;
  updated_by?: string;
}

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/server/make-server-d54e322d`;

export const uploadDocument = async (request: UploadDocumentRequest): Promise<Document> => {
  const response = await fetch(`${API_BASE_URL}/upload-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload document');
  }

  const result = await response.json();
  return result.document;
};

export const getDocuments = async (tenantId: string): Promise<Document[]> => {
  const response = await fetch(`${API_BASE_URL}/documents?tenant_id=${tenantId}`, {
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch documents');
  }

  const result = await response.json();
  return result.documents;
};

export const getDocument = async (id: string): Promise<Document> => {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch document');
  }

  const result = await response.json();
  return result.document;
};

export const updateDocument = async (id: string, request: UpdateDocumentRequest): Promise<Document> => {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update document');
  }

  const result = await response.json();
  return result.document;
};

export const deleteDocument = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete document');
  }
};

// Storage helpers for file upload/download with Supabase Storage
export const uploadFileToStorage = async (
  file: File,
  path: string
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data.path;
};

export const getFileUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(path);

  return data.publicUrl;
};

export const downloadFile = async (path: string): Promise<Blob> => {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(path);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
