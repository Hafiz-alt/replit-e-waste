DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_database_name
PGHOST=localhost
PGPORT=5432
```

## Local Development Setup

1. Clone the repository:
```bash
git clone [your-repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
   - Create a PostgreSQL database
   - Update the `.env` file with your database credentials
   - Run migrations:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Database Schema

The application uses Drizzle ORM with the following main tables:
- users
- pickup_requests
- repair_requests
- marketplace_listings
- notifications
- achievements

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