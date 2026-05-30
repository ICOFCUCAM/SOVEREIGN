-- M8 — allow governance roles to create the post-approval render job.
-- M2's jobs_insert policy gated INSERT to author/tenant_admin/service. With the
-- governance layer (M7), a render job is created when an approver/publisher
-- approves a document (Submit → Approve → Render). Widen the insert role set so
-- the approval handler can queue the render under the approver's tenant claim.
-- Forward-only; replaces the policy in place.

drop policy if exists jobs_insert on dispatch.jobs;
create policy jobs_insert on dispatch.jobs for insert
  with check (dispatch.current_tenant() is not null
              and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() in
                  ('author','reviewer','approver','publisher','tenant_admin','service'));
