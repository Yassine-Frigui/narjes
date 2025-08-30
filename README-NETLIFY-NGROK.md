# ZenShe Spa - Backend (NGROK) + Frontend (Netlify) Setup

## Architecture
- **Backend**: Local development exposed via NGROK
- **Frontend**: Deployed on Netlify
- **Database**: Local MySQL on port 4306

## Quick Setup

### 1. Database Setup (Local)
1. Start MySQL server on port 4306
2. Create database:
   ```sql
   mysql -u root -P 4306 < setup-database.sql
   ```

### 2. Backend + NGROK Setup
1. Configure NGROK (one-time):
   ```bash
   setup-ngrok.bat
   ```

2. Start backend and NGROK:
   ```bash
   start-backend-ngrok.bat
   ```

### 3. Frontend Deployment (Netlify)
1. **Build and test locally** (optional):
   ```bash
   cd frontend
   npm install
   npm run build
   npm run preview
   ```

2. **Deploy to Netlify**:
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Deploy!

## Configuration

### Backend (.env)
```properties
# Database (Local)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=zenshespa_database
DB_PORT=4306

# CORS (Netlify + NGROK)
FRONTEND_URL=https://zenshespa.netlify.app
NGROK_DOMAIN=https://rightly-wise-tadpole.ngrok-free.app
```

### Frontend (.env)
```properties
# Backend via NGROK
VITE_API_URL=https://rightly-wise-tadpole.ngrok-free.app
```

### NGROK Configuration
- **Auth Token**: `1ke5gA6Er1QvMKOUsYxPAAK67g5_58th2gPZU1x5Mi7HXj5Ga`
- **Domain**: `rightly-wise-tadpole.ngrok-free.app`

## Access URLs

| Service | URL |
|---------|-----|
| Frontend (Netlify) | `https://zenshespa.netlify.app` |
| Backend (NGROK) | `https://rightly-wise-tadpole.ngrok-free.app` |
| Backend (Local) | `http://localhost:5000` |
| API Test | `https://rightly-wise-tadpole.ngrok-free.app/api/test` |

## Development Workflow

### Day-to-Day Development
1. **Start backend + NGROK**:
   ```bash
   start-backend-ngrok.bat
   ```

2. **Develop frontend locally** (optional):
   ```bash
   cd frontend
   npm run dev
   # Test at http://localhost:3000
   ```

3. **Deploy frontend changes**:
   - Push to GitHub
   - Netlify auto-deploys
   - Or manual deploy via Netlify CLI

### Backend Changes
1. Edit backend code
2. Server auto-restarts (nodemon)
3. NGROK tunnel stays active
4. Frontend (Netlify) immediately sees changes

### Frontend Changes
1. Edit frontend code
2. Test locally if needed
3. Push to repository
4. Netlify auto-builds and deploys

## Netlify Deployment

### Via GitHub (Recommended)
1. Push your code to GitHub
2. Connect repository to Netlify
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `frontend`
4. Add environment variables in Netlify dashboard:
   - `VITE_API_URL`: `https://rightly-wise-tadpole.ngrok-free.app`

### Via Netlify CLI
```bash
cd frontend

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

## Troubleshooting

### Backend Not Accessible
1. Check NGROK tunnel is running
2. Verify NGROK domain is correct
3. Test local backend: `http://localhost:5000/api/test`

### CORS Errors
1. Check Netlify URL is in backend CORS list
2. Restart backend after CORS changes
3. Clear browser cache

### Database Connection
1. Ensure MySQL is running on port 4306
2. Check database exists: `zenshespa_database`
3. Verify credentials: root user, no password

### Frontend Build Issues
1. Check environment variables in Netlify
2. Verify API URL points to NGROK domain
3. Check build logs in Netlify dashboard

## Benefits of This Setup

✅ **Backend**: Full local control and debugging  
✅ **Frontend**: Professional hosting with CDN  
✅ **Database**: Local data for development  
✅ **HTTPS**: NGROK provides SSL for API  
✅ **Performance**: Netlify CDN for frontend  
✅ **Cost**: Free hosting for frontend  

## NGROK Commands Reference

```bash
# Setup (one-time)
ngrok config add-authtoken 1ke5gA6Er1QvMKOUsYxPAAK67g5_58th2gPZU1x5Mi7HXj5Ga

# Start tunnel with custom domain
ngrok http --domain=rightly-wise-tadpole.ngrok-free.app 5000

# Start tunnel with random domain (backup)
ngrok http 5000

# Check tunnel status
ngrok api tunnels list
```
