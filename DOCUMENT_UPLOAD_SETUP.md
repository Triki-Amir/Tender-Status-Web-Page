# Document Upload Feature Setup

This document describes how to set up and configure the PostgreSQL database and Supabase Storage for the document upload feature in the Agent AI tab.

## Prerequisites

- Supabase project with database and storage access
- Project ID: `iscswsczvtjwwmwrlnxz`
- Supabase URL: `https://iscswsczvtjwwmwrlnxz.supabase.co`

## Database Setup

### 1. Run the Migration

The database migration file is located at `supabase/migrations/20260210_create_documents_table.sql`.

To apply the migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL file in the Supabase dashboard
# Navigate to: SQL Editor -> New Query -> Paste the contents of the migration file
```

This will create:
- `documents` table with all required columns
- Indexes for performance optimization
- Row Level Security (RLS) policies
- Trigger for automatic `updated_at` updates

### 2. Table Schema

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    uploaded_by UUID,
    created_by UUID,
    updated_by UUID,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    language VARCHAR(10),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## Storage Setup

### 1. Create Storage Bucket

Navigate to your Supabase dashboard:

1. Go to Storage section
2. Create a new bucket named `documents`
3. Configure bucket settings:
   - Public: No (recommended for security)
   - File size limit: 50MB (or as needed)
   - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

### 2. Storage Policies

Create these policies in the Storage section:

**Upload Policy:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

**Download Policy:**
```sql
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

**Delete Policy:**
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

## Environment Variables

The application uses these Supabase environment variables:

- `SUPABASE_URL`: Your project URL (already configured)
- `SUPABASE_ANON_KEY`: Public anonymous key (already configured)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for backend operations)

These are configured in:
- Frontend: `utils/supabase/info.tsx`
- Backend: Supabase Edge Function environment variables

## API Endpoints

The backend provides these endpoints for document management:

### Upload Document
```
POST /make-server-d54e322d/upload-document
Body: {
  filename: string,
  file_size: number,
  mime_type: string,
  language: string,
  tenant_id: string,
  uploaded_by?: string
}
```

### Get Documents
```
GET /make-server-d54e322d/documents?tenant_id={tenant_id}
```

### Get Single Document
```
GET /make-server-d54e322d/documents/{id}
```

### Update Document
```
PATCH /make-server-d54e322d/documents/{id}
Body: {
  status?: string,
  metadata?: object,
  updated_by?: string
}
```

### Delete Document (Soft Delete)
```
DELETE /make-server-d54e322d/documents/{id}
```

## Frontend Integration

The Agent AI tab (`AIAgentSpace.tsx`) now includes:

1. **File Upload**: Drag and drop PDF, DOC, or DOCX files
2. **Storage**: Files are uploaded to Supabase Storage
3. **Database**: Document metadata is stored in PostgreSQL
4. **Status Display**: Shows upload progress, success, or error states
5. **Error Handling**: Displays user-friendly error messages

## Testing

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the Agent AI tab
3. Drag and drop a PDF file into the upload zone
4. Verify:
   - File uploads to Supabase Storage
   - Document record is created in the database
   - Success message is displayed
   - Document ID is shown

## Migration from MinIO

Previously mentioned MinIO configuration has been replaced with Supabase Storage, which provides:
- Better integration with Supabase ecosystem
- Built-in authentication and authorization
- Simplified configuration
- CDN support for file downloads

## Notes

- Tenant IDs are currently generated randomly for demo purposes
- In production, integrate with your authentication system
- Adjust RLS policies based on your security requirements
- Consider adding file type validation and virus scanning
