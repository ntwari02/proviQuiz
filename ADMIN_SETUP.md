# Admin Account Setup Guide

## How to Create an Admin Account

Since all new user registrations default to the "student" role, you need to create an admin account using a special script.

### Method 1: Using the Script (Recommended)

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Run the admin creation script:**
   ```bash
   npm run create:admin
   ```

3. **Follow the prompts:**
   - Enter the email address for the admin account
   - Enter the name (optional)
   - Enter a password (minimum 6 characters)
   - Choose the role: `admin` or `superadmin` (defaults to `admin`)

4. **Example:**
   ```
   === Create Admin Account ===

   Email: admin@example.com
   Name (optional): Admin User
   Password (min 6 characters): securepassword123
   Role (admin/superadmin) [default: admin]: admin

   ✅ Admin account created successfully!
      ID: 507f1f77bcf86cd799439011
      Email: admin@example.com
      Name: Admin User
      Role: admin
   ```

### Method 2: Update Existing User to Admin

If you already have a user account registered, you can:

1. **Run the script and use the same email:**
   ```bash
   npm run create:admin
   ```
   - Enter the existing user's email
   - When prompted, choose "y" to update their role

### Method 3: Manual Database Update (Advanced)

If you have direct database access, you can manually update a user's role:

```javascript
// In MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

## Accessing the Admin Dashboard

Once you have an admin account:

1. **Log in** at: `http://localhost:5173/login`
2. **Navigate to admin dashboard** at: `http://localhost:5173/admin`

Or simply click the **"Admin"** button in the header (visible only to admin users).

## Admin Routes

- `/admin` - Dashboard Overview
- `/admin/users` - User Management
- `/admin/exams` - Exam Submissions
- `/admin/questions` - Question Management
- `/admin/categories` - Category & Topic Management
- `/admin/increments` - Increment Management
- `/admin/exam-config` - Exam Configuration
- `/admin/analytics` - Analytics Dashboard
- `/admin/bulk` - Bulk Import/Export
- `/admin/settings` - System Settings

## Troubleshooting

**Issue:** Script fails with "Cannot find module" or connection error
- **Solution:** Make sure MongoDB is running and `MONGO_URI` is set correctly in your `.env` file

**Issue:** "Email already registered" but you want to make them admin
- **Solution:** Choose "y" when prompted to update the role, or use Method 2 above

**Issue:** Can't access `/admin` after creating account
- **Solution:** Make sure you're logged in with the admin account, and check that the role was set correctly
