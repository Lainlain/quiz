# Admin Dashboard - Mitsuki JPY Language School

A beautiful, modern admin dashboard built with **Go HTML Templates**, **Tailwind CSS**, and **Alpine.js**.

## 🎨 Features

### Modern & Compact Design
- **Tailwind CSS** - Utility-first CSS framework for sleek, responsive UI
- **Alpine.js** - Lightweight JavaScript framework for reactivity
- **Go HTML Templates** - Server-side rendering for security and performance
- Clean, minimal interface with smooth transitions

### Functionality
✅ **Admin Authentication** - Secure JWT-based login  
✅ **Course Management** - Create, edit, delete courses with full configuration  
✅ **Quiz Package Management** - Organize quizzes within courses  
✅ **Question Management** - Add multiple choice, true/false, and short answer questions  
✅ **Real-time Statistics** - Dashboard overview with live stats  
✅ **Responsive Design** - Works perfectly on desktop, tablet, and mobile

## 🚀 Access the Dashboard

### 1. Create Admin User
```bash
go run cmd/create-admin/main.go
```

### 2. Start the Server
```bash
go run cmd/server/main.go
```

### 3. Open Dashboard
Navigate to: **http://localhost:8080**

### 4. Login
```
Email: admin@mitsuki-jpy.com
Password: admin123
```

## 📁 Project Structure

```
web/
├── templates/
│   └── admin/
│       ├── login.html          # Login page with Tailwind styling
│       └── dashboard.html      # Main dashboard with Alpine.js
└── static/
    └── js/
        └── dashboard.js        # Dashboard logic and API calls
```

## 🎯 Dashboard Views

### Overview
- **Statistics Cards**: Total courses, quiz packages, questions, and students
- **Visual Metrics**: Clean cards with icons and color coding

### Courses
- **List View**: All courses with configuration details
- **Actions**: Create, edit, delete courses
- **Configuration**: Student limits, retry counts, exam duration

### Quiz Packages
- **Organized by Course**: Link packages to specific courses
- **Easy Management**: Create, edit, delete packages
- **Status Indicators**: Active/inactive badges

### Questions
- **Multiple Types**: Multiple choice, true/false, short answer
- **Rich Editor**: JSON options for multiple choice
- **Points System**: Customizable point values

## 🔧 Technology Stack

### Frontend
- **Tailwind CSS 3.x** (CDN) - Utility-first CSS
- **Alpine.js 3.x** (CDN) - Reactive components
- **Font Awesome** - Icons
- **Vanilla JavaScript** - API interactions

### Backend
- **Go HTML Templates** - Server-side rendering
- **Gin Framework** - HTTP routing and static file serving
- **JWT Authentication** - Secure token-based auth

## 🎨 Design Principles

### Thin & Compact
- Minimal padding and spacing
- Dense information display
- Efficient use of screen space

### Modern
- Gradient accents
- Smooth transitions
- Hover effects
- Clean typography

### Responsive
- Mobile-first approach
- Flexible grid layouts
- Adaptive components

## 🔐 Security

- **JWT Authentication**: All API calls require valid tokens
- **Role-Based Access**: Admin-only routes protected by middleware
- **Secure Storage**: Tokens stored in localStorage
- **Auto-redirect**: Unauthorized users redirected to login

## 📝 API Integration

Dashboard communicates with these API endpoints:

### Authentication
```
POST /api/auth/admin/login
```

### Courses
```
GET    /api/student/courses
POST   /api/admin/courses
PUT    /api/admin/courses/:id
DELETE /api/admin/courses/:id
```

### Quiz Packages
```
POST   /api/admin/quiz-packages
PUT    /api/admin/quiz-packages/:id
DELETE /api/admin/quiz-packages/:id
```

### Questions
```
GET    /api/student/questions/package/:packageId
POST   /api/admin/questions
PUT    /api/admin/questions/:id
DELETE /api/admin/questions/:id
```

## 🛠️ Customization

### Colors
Edit Tailwind config in template files:
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    500: '#0ea5e9', // Change primary color
                    600: '#0284c7',
                }
            }
        }
    }
}
```

### Layout
Modify sidebar width in `dashboard.html`:
```html
<aside class="fixed inset-y-0 left-0 w-64"> <!-- Change w-64 -->
<div class="ml-64"> <!-- Match the width -->
```

## 🐛 Troubleshooting

### Templates not loading
Ensure server is run from project root:
```bash
cd "/home/lainlain/Desktop/Go Lang /quiz"
go run cmd/server/main.go
```

### 401 Unauthorized
- Check if admin user exists
- Verify token in localStorage
- Try logging in again

### Styles not appearing
- Check browser console for CDN errors
- Ensure internet connection (Tailwind & Alpine CDN)

## 📱 Mobile Support

Dashboard is fully responsive:
- **Mobile**: Stacked layout, touch-friendly buttons
- **Tablet**: Optimized grid, larger touch targets
- **Desktop**: Full sidebar, multi-column tables

## 🎓 Usage Tips

1. **Start with Courses**: Create courses first
2. **Add Packages**: Link quiz packages to courses
3. **Create Questions**: Add questions to packages
4. **Test Flow**: Try taking a quiz as a student

## 📊 Future Enhancements

- [ ] Dark mode toggle
- [ ] Student management view
- [ ] Analytics and reports
- [ ] Bulk operations
- [ ] Export/import functionality
- [ ] Real-time notifications

---

**Built with ❤️ for Mitsuki JPY Language School**
