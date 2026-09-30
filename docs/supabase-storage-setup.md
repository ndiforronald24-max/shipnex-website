# Supabase Storage — Secure Shipment Document Setup

ShipNex stores shipment documents (invoices, customs papers, pet health/veterinary
records, …) in a **private** Supabase Storage bucket. Objects are never publicly
readable; access is granted either by the backend (service key, server-side only)
or via short-lived signed URLs minted by the API.

## 1. Create the private bucket

Run in the Supabase SQL editor (or Dashboard → Storage):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shipment-documents',
  'shipment-documents',
  false, -- PRIVATE: no anonymous reads, ever
  10485760, -- 10 MB, matches DocumentUploadValidator.MaxFileSizeBytes
  array[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv'
  ]
);
```

## 2. RLS policies (defense in depth)

The backend talks to Storage with the `service_role` key, which bypasses RLS.
No client-facing policies are created — anonymous/authenticated users have no
direct Storage access. If you must add policies, never add a public `SELECT`
policy on this bucket:

```sql
-- Intentionally NO policies: only the service key (backend) may touch objects.
-- The backend enforces authorization + audit logging on every read/write.
```

## 3. Backend configuration

```json
"FileStorage": {
  "Provider": "Supabase",
  "SupabaseUrl": "https://<project-ref>.supabase.co",
  "SupabaseServiceKey": "<service_role key — SERVER ONLY>",
  "SupabaseBucket": "shipment-documents"
}
```

Or via environment variables:

```
FileStorage__Provider=Supabase
FileStorage__SupabaseUrl=https://<project-ref>.supabase.co
FileStorage__SupabaseServiceKey=<service_role key>
FileStorage__SupabaseBucket=shipment-documents
```

### 3.1 Production default

`docker-compose.prod.yml` already selects this provider:

```
FileStorage__Provider=${FILE_STORAGE_PROVIDER:-Supabase}
FileStorage__SupabaseUrl=${SUPABASE_URL:-}
FileStorage__SupabaseServiceKey=${SUPABASE_SERVICE_KEY:-}
FileStorage__SupabaseBucket=${SUPABASE_BUCKET:-shipment-documents}
```

Set `FILE_STORAGE_PROVIDER=Local` to fall back to the `uploads_data` volume —
useful only for a single-replica deployment that cannot reach Supabase.

If Supabase is selected and either value is empty, `Program.cs` throws during
startup. The service's own constructor check would otherwise run only when the
first document request resolves `IFileStorageService`, turning a missing secret
into a 500 on an already-"healthy" container instead of a failed boot.

**Existing documents:** object keys are looked up by `fileId` and both providers
store the file under `/api/documents/download/{fileId}`, so switching providers
does not require a data migration *as long as no files were uploaded to the
local volume*. Files already on `uploads_data` are not copied — re-upload them
or copy the volume into the bucket first.

## 4. How access control works

| Action | Who | Mechanism |
|---|---|---|
| Upload / delete / toggle visibility | Staff (manage roles) | `POST/PATCH/DELETE /api/documents/*` — validated, audited |
| View / download (staff) | Staff (view roles) | `GET /api/documents/{id}/download`, `GET /api/documents/{id}/access-url` (signed URL, 60–3600 s) |
| Public tracking documents | Anyone | `GET /api/documents/public/{trackingNumber}` — **only** `CustomerVisible` documents |
| Public file download | Anyone | `GET /api/documents/public-file/{id}` — re-checks `CustomerVisible` on every request |

- Storage object paths are generated **server-side** (`yyyy/MM/<guid><ext>`);
  client file names are metadata only, so path traversal is impossible.
- Executables/scripts and MIME/extension mismatches are rejected on upload.
- Every sensitive action (upload, view, download, delete, visibility change,
  public access, rejected upload) writes an audit log entry.
