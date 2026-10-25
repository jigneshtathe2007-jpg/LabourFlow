# LabourFlow deployment and local setup

## Local setup

1. Create a MySQL database named `labourflow_db` and run
   `backend/schema_support.sql` once. The script creates the app tables and
   an initial `users` table. If `users.is_active` already exists, skip the
   final `ALTER TABLE` statement.
2. Copy `backend/.env.example` to `backend/.env` and set your local MySQL
   password and a unique, long `JWT_SECRET`. Keep `.env` private.
3. From the repository root, run `npm --prefix backend install`, then
   `npm --prefix backend start`.
4. Open `http://localhost:3000`. Create the first administrator with
   `node backend/create-admin.js` after configuring the database in
   `backend/.env`.

## Public deployment (Render + TiDB Cloud)

The included `render.yaml` and `Dockerfile` configure a Render web service.
The app serves its frontend and API from the same origin, and the health check
is available at `/api/health`. The Render free web service may sleep when idle;
first requests after inactivity can take longer. Check each provider's current
free-tier limits and terms before relying on it for payroll data.

1. Create a TiDB Cloud Serverless cluster and database named `labourflow_db`.
   Use the cluster's MySQL-compatible connection details. Keep TLS enabled.
2. In the TiDB SQL editor, select `labourflow_db` and run
   `backend/schema_support.sql`. If the database already has
   `users.is_active`, omit the final `ALTER TABLE` statement. Existing payroll
   data is not migrated by this script.
3. Create the initial administrator on a trusted computer. Copy
   `backend/.env.example` to `backend/.env`, set the TiDB connection values
   (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) and
   `DB_SSL=true`, then run `node backend/create-admin.js`. Do not put these
   credentials in source control or share them in chat.
4. Push this repository to GitHub and create a Render Blueprint from it. Render
   will read `render.yaml`; set the requested `DB_HOST`, `DB_USER`,
   `DB_PASSWORD`, and a unique, randomly generated `JWT_SECRET` in the service
   environment. Use the TiDB cluster's actual connection port and database
   name if they differ from the defaults. Keep `DB_SSL=true`.
5. Restrict the TiDB network access rules to the narrowest range supported by
   your hosting plan. If the free web service has changing outbound IPs, a
   broader allowlist may be required; use a strong database password and TLS.
6. Wait for Render's health check to pass, then open the public `onrender.com`
   URL and sign in with the administrator account.

The public service is accessible from anywhere, so use individual accounts,
strong passwords, and HTTPS. Free-tier availability, limits, and pricing can
change; neither provider configuration nor this repository guarantees a
permanently free service. Back up the database independently.
