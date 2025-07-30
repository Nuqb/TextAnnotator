# 📝 Text Context - Study Lyrics & Texts

**A powerful text annotation tool for studying lyrics, poems, literature, and any text that needs deeper analysis.**

🌐 **[Try it live here: https://textannotator.onrender.com/](https://textannotator.onrender.com/)**

---

## 🎯 What is Text Context?

Text Context is a web application designed to help students, researchers, writers, and anyone who works with text to **add meaningful annotations and context** to their documents. 

## ✨ Key Features

🔍 **Smart Text Selection** - Simply highlight any text to add your annotations <br>
📝 **Rich Context Notes** - Add detailed explanations, interpretations, and analysis <br>
🌙 **Dark Mode** - Easy on the eyes for long study sessions <br>
📤 **Export Options** - Download your annotated texts <br>
👥 **User Accounts** - Keep your documents organized and private <br>
🎨 **Customizable** - Choose annotation styles and colors that work for you <br>

---

## 🚀 Getting Started

1. **Visit [https://textannotator.onrender.com/](https://textannotator.onrender.com/)**
2. **Create a free account** or try it as a guest
3. **Create a new document** or import an existing text
4. **Select any text** to start adding your annotations
5. **Add context** with your insights, analysis, or notes
6. **Save and export** your annotated documents

No installation required - it runs entirely in your browser!

---

## 🛠️ For Developers

### Technologies Used

**Frontend:**
- **Vanilla JavaScript (ES6+)** - Modern, modular architecture
- **HTML5 & CSS3** - Semantic markup and responsive design
- **CSS Grid & Flexbox** - Modern layout techniques

**Backend & Database:**
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Secure, user-isolated data
- **Authentication** - Email/password with secure session management

**Deployment & Infrastructure:**
- **Render** - Static site hosting with automatic deployments
- **CDN** - Global content delivery for fast performance
- **Environment Variables** - Secure configuration management

### Project Structure

```
musicContext/
├── index.html              # Main application entry point
├── styles.css              # Application styles and responsive design
├── js/                     # JavaScript modules
│   ├── app.js             # Main application controller
│   ├── config/            # Configuration and environment setup
│   │   └── supabase.js    # Database connection configuration
│   ├── modules/           # Core application modules
│   │   ├── AuthManager.js         # User authentication
│   │   ├── DocumentManager.js     # Document CRUD operations
│   │   ├── AnnotationManager.js   # Annotation system
│   │   ├── TextEditor.js          # Rich text editing
│   │   └── SettingsManager.js     # User preferences
│   ├── utils/             # Utility functions
│   │   └── dom.js         # DOM manipulation helpers
│   └── components/        # Reusable UI components
├── render.yaml            # Render deployment configuration
├── package.json           # Project metadata and dependencies
├── build.sh              # Build script for deployment
├── _headers              # Security and caching headers
├── .gitignore            # Git ignore rules for security
└── DEPLOYMENT.md         # Deployment instructions
```

### Key Features Implementation

**📝 Text Annotation System:**
- Real-time text selection and annotation
- Persistent annotation storage with Supabase
- Rich text editing with customizable styles

**👥 User Management:**
- Secure authentication with Supabase Auth
- User-isolated documents with Row Level Security
- Guest mode for trying without account

**💾 Data Persistence:**
- Auto-save functionality prevents data loss
- Document versioning and history
- Export to multiple formats (PDF, TXT, JSON)

**🎨 Responsive UI:**
- Mobile-first responsive design
- Dark/light theme support
- Accessible interface following WCAG guidelines

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/musicContext.git
   cd musicContext
   ```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-setup.sql`
   - Configure Row Level Security policies

3. **Environment Configuration:**
   ```bash
   # Create a local .env file (gitignored)
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Local Development:**
   - Serve files with any local server (Live Server, Python http.server, etc.)
   - The app uses ES6 modules, so requires a proper HTTP server

### Deployment

This project is configured for **one-click deployment** to Render:

1. **Fork/clone this repository**
2. **Connect to Render** as a Static Site
3. **Set environment variables** in Render dashboard
4. **Deploy!** - Automatic builds and deployments

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Architecture Highlights

**🏗️ Modular Design:**
- Clean separation of concerns with dedicated managers
- ES6 modules for better code organization
- Event-driven architecture for loose coupling

**🔒 Security First:**
- No sensitive data in client-side code
- Environment variables for configuration
- Comprehensive `.gitignore` for secret protection
- Security headers for XSS and clickjacking protection

**⚡ Performance Optimized:**
- Minimal dependencies (vanilla JS)
- Efficient DOM manipulation
- Optimized for static site hosting
- CDN delivery for global performance

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
