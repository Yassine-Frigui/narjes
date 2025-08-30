# ZenShe Spa - Local Development Setup with NGROK

## Prerequisites

1. **MySQL Server** running on port 4306
2. **Node.js** installed
3. **NGROK** installed ([download here](https://ngrok.com/download))

## Quick Setup

### 1. Database Setup

1. Start your MySQL server on port 4306
2. Run the database setup script:
   ```sql
   mysql -u root -P 4306 < setup-database.sql
   ```

### 2. NGROK Setup

1. Run the NGROK setup script:
   ```bash
   setup-ngrok.bat
   ```

### 3. Start Development Servers

1. **Easy way**: Run the start script:
   ```bash
   start-dev.bat
   ```

2. **Manual way**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm install
   npm run dev

   # Terminal 2 - Frontend  
   cd frontend
   npm install
   npm run dev

   # Terminal 3 - NGROK (optional)
   ngrok http --domain=rightly-wise-tadpole.ngrok-free.app 5000
   ```

## Configuration Details

### Backend (.env)
```properties
# Database (Local)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=zenshespa_database
DB_PORT=4306

# CORS
FRONTEND_URL=http://localhost:3000
NGROK_DOMAIN=https://rightly-wise-tadpole.ngrok-free.app
```

### Frontend (.env)
```properties
# Local backend
VITE_API_URL=http://localhost:5000

# Or NGROK backend (if exposing)
# VITE_API_URL=https://rightly-wise-tadpole.ngrok-free.app
```

### NGROK Configuration
- **Auth Token**: `1ke5gA6Er1QvMKOUsYxPAAK67g5_58th2gPZU1x5Mi7HXj5Ga`
- **Domain**: `rightly-wise-tadpole.ngrok-free.app`

## Access URLs

| Service | Local URL | NGROK URL (when enabled) |
|---------|-----------|--------------------------|
| Frontend | http://localhost:3000 | N/A |
| Backend | http://localhost:5000 | https://rightly-wise-tadpole.ngrok-free.app |
| API Test | http://localhost:5000/api/test | https://rightly-wise-tadpole.ngrok-free.app/api/test |

## NGROK Commands

```bash
# Setup authentication (one-time)
ngrok config add-authtoken 1ke5gA6Er1QvMKOUsYxPAAK67g5_58th2gPZU1x5Mi7HXj5Ga

# Start tunnel with custom domain
ngrok http --domain=rightly-wise-tadpole.ngrok-free.app 5000

# Start tunnel with random domain
ngrok http 5000
```

## Troubleshooting

### Database Connection Issues
1. Check MySQL is running on port 4306
2. Verify database `zenshespa_database` exists
3. Check user permissions for root@localhost

### CORS Issues
1. Make sure frontend URL is in CORS origin list
2. Check NGROK domain is properly configured
3. Restart backend after CORS changes

### NGROK Issues
1. Verify auth token is configured: `ngrok config authtoken`
2. Check domain is available: `ngrok domains list`
3. Try without custom domain first: `ngrok http 5000`

## Development Workflow

1. **Local Development**: Use `http://localhost:5000` in frontend
2. **Remote Testing**: Use NGROK domain in frontend
3. **Mobile Testing**: Use NGROK domain for mobile access
4. **API Testing**: Use Postman/curl with local or NGROK URLs

## Database Migration

If you need to migrate from remote to local:

1. Export from remote:
   ```bash
   mysqldump -h mysql-zenshespa.alwaysdata.net -u zenshespa_test -p zenshespa_database > backup.sql
   ```

2. Import to local:
   ```bash
   mysql -u root -P 4306 zenshespa_database < backup.sql
   ```
