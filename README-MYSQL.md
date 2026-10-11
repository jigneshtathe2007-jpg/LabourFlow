# LabourFlow (MySQL migration)

## Before running
- Keep your own `backend/.env` private; do not commit or share it. Copy `backend/.env.example` to `backend/.env` and fill in local values.
- Install backend packages from `backend/` with `npm install`.
- In MySQL Workbench, select the `labourflow_db` schema and run `backend/schema_support.sql` once. It creates supporting tables used by the app and adds `users.is_active`.
- If MySQL reports that a column/table already exists, inspect with `DESCRIBE table_name;` before rerunning that specific statement.
- Ensure the existing core tables use the column names expected by `backend/server.js` (snake_case).

## Start
In a terminal: `cd backend`, then `npm start`. Keep the terminal open. Open `login.html` with Live Server.

## Notes
- Frontend JavaScript modules are centralized under `js/`; obsolete root-level duplicate JS files and Firebase config/rules were removed after the imports were migrated.
- The backend supports JWT-protected CRUD routes for the project collections. The API maps UI collection names such as `labours`, `tradeRateMaster`, and `monthlyPayrollSummary` to SQL tables.
- Passwords are stored as bcrypt hashes. Keep `.env` out of Git and use a unique, long `JWT_SECRET`.
- This project package cannot verify your local MySQL column definitions or credentials. If a route returns a schema error, compare the named table with `DESCRIBE table_name;`.
