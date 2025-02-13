createdb ewaste_management
```

3. Execute the SQL schema:
```bash
psql -d ewaste_management -f database_schema.sql
```

### Option 2: Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `database_schema.sql` into the SQL editor
4. Execute the SQL to create all necessary tables and indexes
5. Get your database connection string from: Project Settings > Database > Connection string
   - Use the "URI" format that starts with `postgresql://`

## Project Setup
1. Clone the repository to your local machine

2. Install dependencies:
```bash
npm install
```

This will install all required packages including:
- React and React DOM
- Express for the backend
- Drizzle ORM and related tools
- TanStack Query for data fetching
- Shadcn UI components
- Authentication-related packages
- Type definitions and development tools

3. Create a `.env` file in the project root with the following variables:
```env
# For local PostgreSQL:
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/ewaste_management

# For Supabase:
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure
```
.
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── dashboard/  # Role-specific dashboards
│   │   │   └── ui/        # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   └── pages/      # Page components
├── server/              # Backend Express application
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Database operations
│   ├── db.ts          # Database connection
│   └── auth.ts         # Authentication logic
└── shared/             # Shared code between frontend and backend
    └── schema.ts       # Database schema and types
```

## Features
- Role-based access control (User, Admin, Recycler, Technician, Educator, Business)
- E-waste pickup request management
- Educational content management
- Support ticket system
- Real-time status updates
- Responsive dashboard interfaces

## Common Issues & Troubleshooting
1. Database Connection Issues
   - Verify your DATABASE_URL is correct
   - Ensure PostgreSQL service is running
   - Check if the database exists and user has proper permissions

2. Build Errors
   - Run `npm install` to ensure all dependencies are installed
   - Clear node_modules and package-lock.json and reinstall if needed
   - Ensure Node.js version matches requirements

3. Type Errors
   - Run `npm run check` to verify TypeScript types
   - Make sure all necessary type definitions are installed

For additional help or questions, please refer to the project documentation or create an issue in the repository.

## Running Tests
```bash
npm test