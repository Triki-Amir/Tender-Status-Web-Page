import { supabase } from './supabaseClient';

export interface DocumentRecord {
  id: string;
  tenant_id: string;
  uploaded_by: string | null;
  filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  language: string | null;
  status: string;
  metadata: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_BUCKET = 'documents';

/**
 * Uploads a file to Supabase Storage and inserts a record in the documents table.
 */
export async function uploadDocument(
  file: File,
  tenantId: string
): Promise<DocumentRecord> {
  const fileId = crypto.randomUUID();
  const fileExtension = file.name.split('.').pop() || '';
  const storagePath = `${tenantId}/${fileId}.${fileExtension}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`);
  }

  // Insert document record into database
  const documentRecord = {
    id: fileId,
    tenant_id: tenantId,
    filename: file.name,
    storage_path: storagePath,
    file_size: file.size,
    mime_type: file.type,
    status: 'pending',
    metadata: {},
    is_deleted: false,
  };

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert(documentRecord)
    .select()
    .single();

  if (insertError) {
    // Attempt to clean up the uploaded file if DB insert fails
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Document record creation failed: ${insertError.message}`);
  }

  return data as DocumentRecord;
}
