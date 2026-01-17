# Fahim Annur Rahman - Portfolio Website

A modern, dynamic portfolio website showcasing expertise in Network Administration, Security Operations, and Cloud Networking. Built with vanilla HTML, CSS, and JavaScript, powered by Supabase for dynamic content management.

## 🌟 Features

- **Dynamic Content Management**: All content (homepage sections, blog posts, audit logs) managed through Supabase
- **Admin Panel**: Secure admin interface for content updates without code changes
- **Professional Blog**: Network engineering articles with tagging and soft-delete functionality
- **Responsive Design**: Mobile-first design with smooth animations and theme toggling
- **Security First**: Row-Level Security (RLS) policies ensure data integrity

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL, Authentication, RLS)
- **Hosting**: GitHub Pages
- **Icons**: Font Awesome 6.5.1

## 📁 Project Structure

```
Website/
├── index.html          # Main portfolio page
├── blog.html           # Blog listing page
├── admin.html          # Admin dashboard
├── css/
│   └── styles.css      # Global styles
├── js/
│   ├── script.js       # Homepage logic
│   ├── supabase-client.js    # Supabase integration
│   └── blog-data.js    # Data adapter layer
├── images/             # Static assets
└── assets/             # Additional resources
```

## 🚀 Quick Start

### For Visitors
Simply visit the live site: [https://annurr.github.io](https://annurr.github.io)

### For Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/annurr/annurr.github.io.git
   cd annurr.github.io
   ```

2. **Configure Supabase**
   - Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/supabase-client.js`
   - Ensure RLS policies are enabled on your Supabase project

3. **Run locally**
   ```bash
   # Use a local server (e.g., Live Server in VS Code)
   # or Python's simple HTTP server:
   python -m http.server 8000
   ```

4. **Access Admin Panel**
   - Navigate to `/admin.html`
   - Login with your Supabase Auth credentials

## 🔐 Security

- **Authentication**: Supabase Auth for admin access
- **Row Level Security**: 
  - Public: Read access to homepage config and blog posts
  - Authenticated: Full access to content management
  - Audit logs: Admin-only access
- **Data Validation**: Client-side and server-side validation

## 📝 Content Management

### Adding Blog Posts
1. Login to `/admin.html`
2. Navigate to "Posts" tab
3. Click "Start New Post"
4. Fill in title, excerpt, content, tags, and image
5. Save and publish

### Updating Homepage
1. Login to admin panel
2. Go to "Homepage" tab
3. Edit section content directly
4. Save changes (live immediately)

## 🎨 Customization

### Theme Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
  --primary: #0f172a;
  --accent: #3b82f6;
  /* ... */
}
```

### Sections
Modify `homepage_config` table in Supabase to:
- Reorder sections
- Update content
- Add/remove sections

## 📊 Database Schema

### Tables
- `homepage_config`: Stores dynamic section data
- `blog_posts`: Blog articles with soft-delete support
- `audit_logs`: Admin action tracking

## 🌐 Deployment

### GitHub Pages
1. Push code to GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to `main` branch, root directory
4. Access via `https://annurr.github.io`

### Custom Domain (Optional)
1. Add `CNAME` file with your domain
2. Configure DNS records at your domain provider
3. Update GitHub Pages settings

## 📈 SEO Optimization

- Semantic HTML structure
- Meta descriptions on all pages
- Unique title tags
- `robots.txt` for crawler instructions
- `sitemap.xml` for search indexing
- Fast load times with minimal dependencies

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

## 📄 License

© 2026 Fahim Annur Rahman. All rights reserved.

## 📧 Contact

- **Email**: annurrahman@example.com
- **LinkedIn**: [linkedin.com/in/fahim-annur-rahman](https://linkedin.com/in/fahim-annur-rahman)
- **GitHub**: [github.com/annurr](https://github.com/annurr)

---

**Built with ❤️ by Fahim Annur Rahman**
