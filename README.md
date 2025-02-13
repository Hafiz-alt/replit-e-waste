git clone https://github.com/Hafiz-alt/replit-e-waste-13-feb.git
cd replit-e-waste-13-feb
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:

a. Create a PostgreSQL database:
```bash
createdb ewaste_management
```

b. Execute the database schema:
```bash
psql -d ewaste_management -f database_schema.sql
```

4. Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://[user]:[password]@localhost:5432/ewaste_management
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=ewaste_management
PGHOST=localhost
PGPORT=5432
```

5. Push the database schema:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/      # Custom React hooks
│   │   └── pages/      # Page components
├── server/              # Backend Express application
│   ├── routes.ts       # API routes
│   └── db.ts           # Database configuration
├── shared/             # Shared types and schemas
│   └── schema.ts       # Drizzle schema definitions