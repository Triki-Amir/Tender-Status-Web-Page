-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_documents_tenant_id ON documents (tenant_id);
CREATE INDEX IF NOT EXISTS ix_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX IF NOT EXISTS ix_documents_status ON documents (status);
CREATE INDEX IF NOT EXISTS ix_documents_language ON documents (language);
CREATE INDEX IF NOT EXISTS ix_documents_created_at ON documents (created_at);
CREATE INDEX IF NOT EXISTS ix_documents_is_deleted ON documents (is_deleted) WHERE is_deleted = false;

-- Create helper function for multilingual text search (simplified version)
-- Note: The full multilingual_tsvector function would need to be defined based on your specific requirements
-- For now, we'll create a basic full-text search index
CREATE INDEX IF NOT EXISTS ix_documents_filename_fts ON documents 
USING gin(to_tsvector('simple', filename))
WHERE is_deleted = false;

-- Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_update_documents_updated_at ON documents;
CREATE TRIGGER trigger_update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view documents in their tenant
CREATE POLICY documents_select_policy ON documents
    FOR SELECT
    USING (true); -- For now, allow all reads. You can restrict based on auth.uid() and tenant_id

-- Policy: Users can insert documents
CREATE POLICY documents_insert_policy ON documents
    FOR INSERT
    WITH CHECK (true); -- For now, allow all inserts. You can restrict based on auth.uid()

-- Policy: Users can update documents in their tenant
CREATE POLICY documents_update_policy ON documents
    FOR UPDATE
    USING (true); -- For now, allow all updates. You can restrict based on auth.uid() and tenant_id

-- Policy: Users can delete (soft delete) documents in their tenant
CREATE POLICY documents_delete_policy ON documents
    FOR DELETE
    USING (true); -- For now, allow all deletes. You can restrict based on auth.uid() and tenant_id
