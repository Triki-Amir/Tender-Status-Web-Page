import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

const supabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-d54e322d/health", (c) => {
  return c.json({ status: "ok" });
});

// Document upload endpoint
app.post("/make-server-d54e322d/upload-document", async (c) => {
  try {
    const body = await c.req.json();
    const { filename, file_size, mime_type, language, tenant_id, uploaded_by } = body;

    if (!filename || !tenant_id) {
      return c.json({ error: "Missing required fields: filename and tenant_id" }, 400);
    }

    // Generate a unique storage path
    const timestamp = Date.now();
    const storage_path = `documents/${tenant_id}/${timestamp}_${filename}`;

    // Insert document record into database
    const supabase = supabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .insert({
        tenant_id,
        uploaded_by,
        created_by: uploaded_by,
        filename,
        storage_path,
        file_size,
        mime_type,
        language: language || 'en',
        status: 'pending',
        metadata: {},
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return c.json({ error: "Failed to create document record", details: error.message }, 500);
    }

    return c.json({ 
      success: true, 
      document: data,
      message: "Document uploaded successfully" 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Internal server error", details: error.message }, 500);
  }
});

// Get documents endpoint
app.get("/make-server-d54e322d/documents", async (c) => {
  try {
    const tenant_id = c.req.query("tenant_id");
    
    if (!tenant_id) {
      return c.json({ error: "Missing tenant_id parameter" }, 400);
    }

    const supabase = supabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return c.json({ error: "Failed to fetch documents", details: error.message }, 500);
    }

    return c.json({ documents: data });
  } catch (error) {
    console.error("Fetch error:", error);
    return c.json({ error: "Internal server error", details: error.message }, 500);
  }
});

// Get single document endpoint
app.get("/make-server-d54e322d/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const supabase = supabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) {
      console.error("Database error:", error);
      return c.json({ error: "Document not found", details: error.message }, 404);
    }

    return c.json({ document: data });
  } catch (error) {
    console.error("Fetch error:", error);
    return c.json({ error: "Internal server error", details: error.message }, 500);
  }
});

// Update document status endpoint
app.patch("/make-server-d54e322d/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { status, metadata, updated_by } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (metadata) updateData.metadata = metadata;
    if (updated_by) updateData.updated_by = updated_by;

    const supabase = supabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return c.json({ error: "Failed to update document", details: error.message }, 500);
    }

    return c.json({ 
      success: true, 
      document: data 
    });
  } catch (error) {
    console.error("Update error:", error);
    return c.json({ error: "Internal server error", details: error.message }, 500);
  }
});

// Soft delete document endpoint
app.delete("/make-server-d54e322d/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const supabase = supabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .update({ is_deleted: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return c.json({ error: "Failed to delete document", details: error.message }, 500);
    }

    return c.json({ 
      success: true, 
      message: "Document deleted successfully" 
    });
  } catch (error) {
    console.error("Delete error:", error);
    return c.json({ error: "Internal server error", details: error.message }, 500);
  }
});

Deno.serve(app.fetch);