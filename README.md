# Tutorial Frontend in Vue 3

This application allows users to create and maintain a list of tutorials that can have multiple lessons within. Please visit https://github.com/OC-ComputerScience/tutorial-backend for the backend repository.

#### Please note:

- This project utilizes **Google Authentication** to allow users to log in.
- You will need to provide a **Client ID and Client Secret from Google** for this project to run locally.
- You will need to provide a **Refresh Token** generated through the **Google Developers OAuth 2.0 Playground** for Cypress testing to work.

## Project Setup

1. Clone the project into your **XAMPP/xamppfiles/htdocs** directory.

```
git clone https://github.com/OC-ComputerScience/tutorial-frontend-vue3.git
```

2. Install the project.

```
npm install
```
3. Install cross-env to allow correct use of .env files.

```
npm install cross-env
```
4. Make sure **Apache** is running.

   - We recommend using XAMPP to serve this project.
   - In XAMPP, make sure that **Apache** is running.

5. In order to make the Google authentication work, have a project registered with the **Google Developer console**.

   - https://console.developers.google.com/
   - Enable **Google+ API** and **Google Analytics API**.
   - Enable an **OAuth consent screen**.
   - Create an **OAuth client ID**.
   - Save your **Client ID** and **Client Secret** in a safe place.

6. In order to make the **Cypress testing** work, get a **Refresh Token** for your Google application through the **Google Developers OAuth 2.0 Playground**.

   - https://developers.google.com/oauthplayground/
   - Click the gear button on the right.
   - Check **Use your own OAuth credentials**.
   - Configure the Playground to use your Google project's **client ID** and **client secret**.
   - On the left, find Google OAuth2 API v2 and check all three items.
     - https://www.googleapis.com/auth/userinfo.email
     - https://www.googleapis.com/auth/userinfo.profile
     - openid
   - Click **Authorize APIs**.
   - Click **Exchange authorization code for tokens**.
   - Save the generated **Refresh token** in a safe place.

7. Add a local **.env** file and make sure the **client ID** and **client secret** are the values you have registered with Google and that the **refresh token** is the value you generated through the OAuth 2.0 Playground.

   - VITE_APP_CLIENT_ID = '**your-google-client-id**'
   - VITE_APP_CLIENT_SECRET = '**your-google-client-secret**'
   - VITE_APP_REFRESH_TOKEN = '**your-google-refresh-token**'
   - VITE_APP_CLIENT_URL = 'http://localhost:8081'
   - VITE_APP_API_URL = 'https://accounts.google.com/gsi/client'

8. Compile and run the project locally.

```
npm run dev
```

9. Test your project.
   - Note that your frontend and backend must be running for testing to be successful.

```
npm run test
```

10. Test your project and watch the tests run with Cypress.

```
npm run test:open
```

11. If you are wanting to serve your project for production:
    - You will need to have a **.htaccess** file.
    - It should be in your **public** folder.
    - Visual Studio Code will auto format it to where the file will not be read correctly, so add the following rule to your **settings.json** in Visual Studio Code.

```
"files.associations": {
    "**/*.htaccess": "plaintext"
},
```

12. (Optional) Compile the project for production.

```
npm run build
```

13. (Optional) Lint and fix the project files.

```
npm run lint
```

## Quick Troubleshooting

- **Login issues**: Ensure backend is running on port 3100 and check backend logs for specific errors
- **CORS warnings**: The Cross-Origin-Opener-Policy warnings from Google's auth iframe can be safely ignored
- **Port conflicts**: If port 8081 is in use, kill the process with: `lsof -ti:8081 | xargs kill -9`

## Troubleshooting Guide

### Complete Working Setup

#### Prerequisites Checklist
- [ ] XAMPP installed and running (Apache + MySQL/MariaDB)
- [ ] Backend server running on port 3100
- [ ] Frontend dev server running on port 8081
- [ ] Google OAuth credentials configured
- [ ] Database 'tutorial' created

#### Quick Start Commands
```bash
# Terminal 1 - Backend
cd /Applications/XAMPP/xamppfiles/htdocs/SEIVPROJECT3/seivproject3-backend
npm start

# Terminal 2 - Frontend
cd /Applications/XAMPP/xamppfiles/htdocs/SEIVPROJECT3/seivproject3-frontend
npm run dev
```

### Common Issues & Solutions

#### 1. Login Redirects Back to Login Page
**Problem:** After Google OAuth, you're redirected back to login instead of tutorials page.

**Possible Causes:**
- Backend server not running or crashed
- Database connection issues
- Session creation failed

**Solution:**
1. Check backend console for errors
2. Ensure the backend has the null lastName fix
3. Verify database is accessible

#### 2. CORS/Cross-Origin-Opener-Policy Warnings
**Problem:** Console shows "Cross-Origin-Opener-Policy policy would block the window.postMessage call"

**Solution:** These are warnings from Google's authentication iframe and are safe to ignore. They don't affect functionality.

#### 3. "Request Failed with Status Code 500"
**Problem:** Login fails with 500 error in console.

**Solution:** Check backend logs for specific error:
- If "user.lName cannot be null" - backend needs the null lastName fix
- If "headers already sent" - backend needs response handling fix
- If database error - check MySQL/MariaDB is running

#### 4. Frontend Can't Connect to Backend
**Problem:** API calls fail, no response from backend.

**Solution:**
1. Verify Apache ProxyPass is configured correctly in httpd.conf:
   ```
   ProxyPass /tutorial http://localhost:3100/tutorial
   ```
2. Ensure backend is running on port 3100
3. Check that Apache modules are loaded (remove # from these lines):
   ```
   LoadModule proxy_http_module modules/mod_proxy_http.so
   LoadModule proxy_http2_module modules/mod_proxy_http2.so
   ```

#### 5. Vite Port Already in Use
**Problem:** "Port 8081 is already in use"

**Solution:** Either:
- Kill the process using port 8081: `lsof -ti:8081 | xargs kill -9`
- Or change the port in vite.config.js

### Environment Variables Setup

Create `.env` file in frontend folder:
```env
# Google OAuth Configuration
VITE_APP_CLIENT_ID=your-google-client-id-here
VITE_APP_CLIENT_SECRET=your-google-client-secret-here
VITE_APP_REFRESH_TOKEN=your-google-refresh-token-here

# Application URLs
VITE_APP_CLIENT_URL=http://localhost:8081
VITE_APP_API_URL=https://accounts.google.com/gsi/client
```

### Testing the Full Stack

1. **Test Backend API:**
   ```bash
   curl http://localhost:3100/tutorial/tutorials
   ```

2. **Test Frontend Access:**
   - Open http://localhost:8081
   - Should see login page with Google Sign-in button

3. **Test Authentication Flow:**
   - Click "Sign up with Google"
   - Complete Google authentication
   - Should redirect to /tutorials page
   - Should see CRUD interface for tutorials

### Debugging Tips

#### Check Backend Logs
The backend now includes detailed logging:
```
=== LOGIN STARTED ===
Step 1: Finding user with email: user@example.com
Step 2: Found existing user: 1
Step 3: Creating new user (if needed)
Step 4: Looking for existing session
```

#### Check Browser Console
- Network tab: Verify API calls to /tutorial/login
- Console: Look for specific error messages
- Application tab: Check localStorage for user data

### Development Workflow

1. **Always work from feature branches:**
   ```bash
   git switch dev
   git pull origin dev
   git switch -c feature-name
   ```

2. **Commit without Claude attributions** (see CLAUDE.md)

3. **Test before pushing:**
   ```bash
   npm run test  # Frontend tests
   ```

4. **Create PR to dev branch, not main**

### Contact & Support

If issues persist after following this guide:
1. Check backend README.md for backend-specific issues
2. Verify all environment variables are set correctly
3. Ensure XAMPP services are running
4. Check that both servers are running without errors
