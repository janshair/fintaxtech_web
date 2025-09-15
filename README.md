# Fintaxtech Ltd - Professional Digital Solutions

A modern, responsive website for Fintaxtech Ltd, a digital solutions company specializing in mobile app development, website development, and company branding services.

## 🌟 Features

- **Multi-page Static Website** with clean, modern design
- **Dark Theme** inspired by forward.digital
- **MVC Architecture** with JavaScript modules
- **GDPR Compliant** with cookie consent management
- **WCAG 2.1 AA Accessibility** standards
- **SEO Optimized** with meta tags, JSON-LD, and sitemap
- **Responsive Design** for all devices
- **WhatsApp Integration** for instant contact
- **Professional Portfolio** with project showcases
- **Service Packages** with pricing information
- **Contact Forms** with validation
- **Legal Pages** (Privacy Policy, Terms of Service)

## 📁 Project Structure

```
fintaxtech/
├── src/
│   ├── AppConstants.js          # All strings, design tokens, and configuration
│   ├── css/
│   │   └── main.css            # Main stylesheet with dark theme
│   └── js/
│       ├── App.js              # Main application controller
│       ├── Models.js           # Data models (MVC)
│       ├── Views.js            # View classes (MVC)
│       └── Controllers.js      # Controller classes (MVC)
├── index.html                  # Homepage
├── services.html               # Services page
├── portfolio.html              # Portfolio page
├── packages.html               # Packages page
├── contact.html                # Contact page
├── privacy.html                # Privacy Policy
├── terms.html                  # Terms of Service
├── 404.html                    # 404 Error page
├── robots.txt                  # SEO robots file
├── sitemap.xml                 # SEO sitemap
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- A modern web browser
- A local web server (optional, for development)

### Installation

1. **Clone or download** the project files to your local machine
2. **Open** the project directory in your preferred code editor
3. **Start a local server** (recommended for development):

   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

4. **Open** your browser and navigate to `http://localhost:8000`

### Direct File Access

You can also open `index.html` directly in your browser, though some features may be limited due to CORS restrictions.

## 🎨 Customization

### Design Tokens

All design elements are centralized in `src/AppConstants.js`:

- **Colors**: Primary, secondary, accent colors
- **Typography**: Font families and sizes
- **Spacing**: Consistent spacing scale
- **Breakpoints**: Responsive design breakpoints
- **Content**: All text content and copy

### Adding New Pages

1. Create a new HTML file in the root directory
2. Include the standard header and footer structure
3. Add navigation link to `src/AppConstants.js`
4. Update `sitemap.xml` and `robots.txt`

### Modifying Content

1. **Text Content**: Update `src/AppConstants.js`
2. **Styling**: Modify `src/css/main.css`
3. **Functionality**: Update JavaScript files in `src/js/`

## 📱 Pages Overview

### Homepage (`index.html`)
- Hero section with call-to-action
- Services overview
- Portfolio preview
- Package highlights
- Company information

### Services (`services.html`)
- Detailed service descriptions
- Technology stack information
- Process explanations
- Why choose us section

### Portfolio (`portfolio.html`)
- Project showcase with filtering
- Interactive project modals
- Technology tags
- Project statistics

### Packages (`packages.html`)
- Service packages with pricing
- Additional services
- Process timeline
- FAQ section

### Contact (`contact.html`)
- Contact form with validation
- Contact information
- Company details
- Response time information

### Legal Pages
- **Privacy Policy**: GDPR compliant privacy policy
- **Terms of Service**: Legal terms and conditions
- **404 Page**: Custom error page with navigation

## 🔧 Technical Details

### Architecture

- **MVC Pattern**: Separation of concerns with Models, Views, and Controllers
- **Modular JavaScript**: Organized, maintainable code structure
- **CSS Custom Properties**: Consistent design system
- **Progressive Enhancement**: Works without JavaScript

### Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance

- **Optimized Images**: Lazy loading and responsive images
- **Minified Assets**: Compressed CSS and JavaScript
- **Critical CSS**: Above-the-fold styles prioritized
- **Efficient Loading**: Modular script loading

## 🔒 Privacy & Compliance

### GDPR Compliance

- **Cookie Consent**: Granular cookie preferences
- **Data Protection**: Privacy policy with data handling details
- **User Rights**: Clear information about data rights
- **Consent Management**: Easy opt-in/opt-out options

### Accessibility (WCAG 2.1 AA)

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: High contrast ratios
- **Focus Management**: Clear focus indicators
- **Skip Links**: Quick navigation for screen readers

## 📈 SEO Features

### On-Page SEO

- **Meta Tags**: Unique titles and descriptions per page
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Twitter-specific meta tags
- **Canonical URLs**: Prevent duplicate content issues
- **Structured Data**: JSON-LD for search engines

### Technical SEO

- **Sitemap**: XML sitemap for search engines
- **Robots.txt**: Search engine crawling instructions
- **Mobile-First**: Responsive design priority
- **Page Speed**: Optimized loading times

## 🚀 Deployment

### GitHub Pages

1. **Create a GitHub repository**
2. **Upload all files** to the repository
3. **Enable GitHub Pages** in repository settings
4. **Select source branch** (usually `main` or `master`)
5. **Access your site** at `https://username.github.io/repository-name`

### Custom Domain

1. **Add a CNAME file** with your domain name
2. **Configure DNS** to point to GitHub Pages
3. **Update AppConstants.js** with your domain
4. **Update sitemap.xml** with your domain

### Other Hosting Options

- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **AWS S3**: Static website hosting
- **Traditional Web Hosting**: Upload via FTP

## 📞 Contact Information

**Fintaxtech Ltd**
- **Phone**: +44 7884 594929
- **Email**: info@fintaxtech.com
- **Company Number**: SC807896
- **Registered Office**: Dundee, Scotland, UK

## 📄 License

This project is proprietary to Fintaxtech Ltd. All rights reserved.

## 🤝 Contributing

This is a private project. For suggestions or issues, please contact us directly.

## 📝 Changelog

### Version 1.0.0 (January 2024)
- Initial release
- Complete website with all pages
- MVC architecture implementation
- GDPR compliance features
- Accessibility optimizations
- SEO optimization
- Mobile responsive design

---

**Built with ❤️ by Fintaxtech Ltd**
