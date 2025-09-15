/**
 * Models.js - Data Models for MVC Architecture
 * Contains all data models and business logic
 */

// Base Model Class
class BaseModel {
  constructor() {
    this.data = {};
    this.listeners = [];
  }

  // Observer pattern implementation
  subscribe(listener) {
    this.listeners.push(listener);
  }

  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notify(data) {
    this.listeners.forEach(listener => listener(data));
  }

  // Data management
  setData(key, value) {
    this.data[key] = value;
    this.notify({ key, value, data: this.data });
  }

  getData(key) {
    return this.data[key];
  }

  getAllData() {
    return { ...this.data };
  }
}

// Cookie Model - Manages cookie consent and preferences
class CookieModel extends BaseModel {
  constructor() {
    super();
    this.cookieKey = 'fintaxtech_cookie_consent';
    this.categories = {
      necessary: { enabled: true, required: true },
      analytics: { enabled: false, required: false },
      marketing: { enabled: false, required: false }
    };
    this.loadPreferences();
  }

  loadPreferences() {
    try {
      const stored = localStorage.getItem(this.cookieKey);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.categories = { ...this.categories, ...preferences };
      }
    } catch (error) {
      console.warn('Failed to load cookie preferences:', error);
    }
  }

  savePreferences() {
    try {
      localStorage.setItem(this.cookieKey, JSON.stringify(this.categories));
      this.notify({ type: 'preferences_saved', categories: this.categories });
    } catch (error) {
      console.warn('Failed to save cookie preferences:', error);
    }
  }

  updateCategory(category, enabled) {
    if (this.categories[category] && !this.categories[category].required) {
      this.categories[category].enabled = enabled;
      this.savePreferences();
      this.notify({ type: 'category_updated', category, enabled });
    }
  }

  getCategoryStatus(category) {
    return this.categories[category]?.enabled || false;
  }

  hasConsent() {
    return Object.values(this.categories).some(cat => cat.enabled);
  }

  acceptAll() {
    Object.keys(this.categories).forEach(category => {
      this.categories[category].enabled = true;
    });
    this.savePreferences();
    this.notify({ type: 'all_accepted', categories: this.categories });
  }

  rejectAll() {
    Object.keys(this.categories).forEach(category => {
      if (!this.categories[category].required) {
        this.categories[category].enabled = false;
      }
    });
    this.savePreferences();
    this.notify({ type: 'all_rejected', categories: this.categories });
  }

  getConsentStatus() {
    return {
      hasConsent: this.hasConsent(),
      categories: this.categories,
      timestamp: new Date().toISOString()
    };
  }
}

// Contact Model - Manages contact form data and submissions
class ContactModel extends BaseModel {
  constructor() {
    super();
    this.submissions = [];
    this.validationRules = {
      name: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      phone: { required: false, pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/ },
      company: { required: false, maxLength: 100 },
      service: { required: true },
      message: { required: true, minLength: 10, maxLength: 1000 }
    };
  }

  validateField(fieldName, value) {
    const rule = this.validationRules[fieldName];
    if (!rule) return { valid: true };

    const errors = [];

    if (rule.required && (!value || value.trim().length === 0)) {
      errors.push(`${fieldName} is required`);
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateForm(formData) {
    const errors = {};
    let isValid = true;

    Object.keys(this.validationRules).forEach(field => {
      const validation = this.validateField(field, formData[field]);
      if (!validation.valid) {
        errors[field] = validation.errors;
        isValid = false;
      }
    });

    return { isValid, errors };
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  sanitizeFormData(formData) {
    const sanitized = {};
    Object.keys(formData).forEach(key => {
      sanitized[key] = this.sanitizeInput(formData[key]);
    });
    return sanitized;
  }

  async submitForm(formData) {
    const sanitizedData = this.sanitizeFormData(formData);
    const validation = this.validateForm(sanitizedData);

    if (!validation.isValid) {
      this.notify({ 
        type: 'validation_error', 
        errors: validation.errors 
      });
      return { success: false, errors: validation.errors };
    }

    try {
      // Add metadata
      const submission = {
        ...sanitizedData,
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent
      };

      // Store submission locally (in real app, send to server)
      this.submissions.push(submission);
      this.saveSubmissions();

      // Simulate API call
      await this.simulateAPICall(submission);

      this.notify({ 
        type: 'submission_success', 
        submission 
      });

      return { success: true, submission };

    } catch (error) {
      this.notify({ 
        type: 'submission_error', 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  }

  async simulateAPICall(submission) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Network error - please try again');
    }
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  saveSubmissions() {
    try {
      localStorage.setItem('fintaxtech_contact_submissions', 
        JSON.stringify(this.submissions));
    } catch (error) {
      console.warn('Failed to save contact submissions:', error);
    }
  }

  loadSubmissions() {
    try {
      const stored = localStorage.getItem('fintaxtech_contact_submissions');
      if (stored) {
        this.submissions = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load contact submissions:', error);
    }
  }

  getSubmissions() {
    return [...this.submissions];
  }

  clearSubmissions() {
    this.submissions = [];
    localStorage.removeItem('fintaxtech_contact_submissions');
    this.notify({ type: 'submissions_cleared' });
  }
}

// Navigation Model - Manages navigation state and routing
class NavigationModel extends BaseModel {
  constructor() {
    super();
    this.currentPage = this.getCurrentPage();
    this.history = [this.currentPage];
    this.menuOpen = false;
    this.activeSection = null;
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const pageMap = {
      '/': 'home',
      '/index.html': 'home',
      '/services.html': 'services',
      '/portfolio.html': 'portfolio',
      '/packages.html': 'packages',
      '/contact.html': 'contact',
      '/privacy.html': 'privacy',
      '/terms.html': 'terms',
      '/404.html': '404'
    };
    return pageMap[path] || 'home';
  }

  navigateTo(page) {
    const previousPage = this.currentPage;
    this.currentPage = page;
    this.history.push(page);
    
    // Limit history size
    if (this.history.length > 10) {
      this.history.shift();
    }

    this.notify({ 
      type: 'navigation', 
      currentPage: this.currentPage, 
      previousPage 
    });
  }

  goBack() {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current page
      const previousPage = this.history[this.history.length - 1];
      this.currentPage = previousPage;
      
      this.notify({ 
        type: 'navigation_back', 
        currentPage: this.currentPage 
      });
    }
  }

  setMenuOpen(open) {
    this.menuOpen = open;
    this.notify({ 
      type: 'menu_toggle', 
      menuOpen: this.menuOpen 
    });
  }

  toggleMenu() {
    this.setMenuOpen(!this.menuOpen);
  }

  setActiveSection(section) {
    this.activeSection = section;
    this.notify({ 
      type: 'section_change', 
      activeSection: this.activeSection 
    });
  }

  getNavigationItems() {
    return [
      { id: 'home', label: 'Home', url: '/', active: this.currentPage === 'home' },
      { id: 'services', label: 'Services', url: '/services.html', active: this.currentPage === 'services' },
      { id: 'portfolio', label: 'Portfolio', url: '/portfolio.html', active: this.currentPage === 'portfolio' },
      { id: 'packages', label: 'Packages', url: '/packages.html', active: this.currentPage === 'packages' },
      { id: 'contact', label: 'Get In Touch', url: '/contact.html', active: this.currentPage === 'contact' }
    ];
  }

  getFooterItems() {
    return [
      { id: 'privacy', label: 'Privacy Policy', url: '/privacy.html' },
      { id: 'terms', label: 'Terms of Service', url: '/terms.html' },
      { id: 'cookies', label: 'Cookie Policy', url: '/privacy.html#cookies' }
    ];
  }
}

// SEO Model - Manages SEO data and meta information
class SEOModel extends BaseModel {
  constructor() {
    super();
    this.metaData = this.loadMetaData();
  }

  loadMetaData() {
    return {
      home: {
        title: 'Fintaxtech Ltd - Professional Digital Solutions',
        description: 'Leading provider of mobile app development, website development, and company branding services. Based in Scotland, serving clients worldwide.',
        keywords: 'mobile app development, website development, branding, digital solutions, Scotland',
        canonical: 'https://fintaxtech.com/',
        ogImage: 'https://fintaxtech.com/src/images/og-image.jpg'
      },
      services: {
        title: 'Our Services - Mobile Apps, Web Development & Branding',
        description: 'Comprehensive digital services including mobile app development, website development, and company branding solutions.',
        keywords: 'mobile apps, web development, branding, digital services',
        canonical: 'https://fintaxtech.com/services.html',
        ogImage: 'https://fintaxtech.com/src/images/og-services.jpg'
      },
      portfolio: {
        title: 'Our Portfolio - Recent Projects & Case Studies',
        description: 'Explore our recent projects including mobile apps, websites, and branding work for clients across various industries.',
        keywords: 'portfolio, projects, case studies, mobile apps, websites, branding',
        canonical: 'https://fintaxtech.com/portfolio.html',
        ogImage: 'https://fintaxtech.com/src/images/og-portfolio.jpg'
      },
      packages: {
        title: 'Our Packages - Affordable Digital Solutions',
        description: 'Choose from our carefully crafted packages for mobile app development, website development, and branding services.',
        keywords: 'packages, pricing, mobile apps, web development, branding',
        canonical: 'https://fintaxtech.com/packages.html',
        ogImage: 'https://fintaxtech.com/src/images/og-packages.jpg'
      },
      contact: {
        title: 'Get In Touch - Contact Fintaxtech Ltd',
        description: 'Ready to start your project? Contact us for a free consultation and quote for your digital needs.',
        keywords: 'contact, consultation, quote, mobile apps, web development, branding',
        canonical: 'https://fintaxtech.com/contact.html',
        ogImage: 'https://fintaxtech.com/src/images/og-contact.jpg'
      }
    };
  }

  getMetaData(page) {
    return this.metaData[page] || this.metaData.home;
  }

  updatePageMeta(page) {
    const meta = this.getMetaData(page);
    
    // Update title
    document.title = meta.title;
    
    // Update meta description
    this.updateMetaTag('description', meta.description);
    
    // Update meta keywords
    this.updateMetaTag('keywords', meta.keywords);
    
    // Update canonical URL
    this.updateCanonical(meta.canonical);
    
    // Update Open Graph tags
    this.updateOpenGraph(meta);
    
    // Update Twitter Card tags
    this.updateTwitterCard(meta);
    
    this.notify({ type: 'meta_updated', page, meta });
  }

  updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  updateCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  updateOpenGraph(meta) {
    const ogTags = {
      'og:title': meta.title,
      'og:description': meta.description,
      'og:image': meta.ogImage,
      'og:url': meta.canonical,
      'og:type': 'website',
      'og:site_name': 'Fintaxtech Ltd'
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      this.updateMetaTag(property, content, 'property');
    });
  }

  updateTwitterCard(meta) {
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': meta.title,
      'twitter:description': meta.description,
      'twitter:image': meta.ogImage
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      this.updateMetaTag(name, content);
    });
  }

  updateMetaTag(name, content, attribute = 'name') {
    let meta = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  generateJSONLD(page) {
    const baseData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Fintaxtech Ltd",
      "description": "Professional digital solutions including mobile app development, website development, and company branding services.",
      "url": "https://fintaxtech.com",
      "telephone": "+447884594929",
      "email": "info@fintaxtech.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Dundee",
        "addressRegion": "Scotland",
        "addressCountry": "United Kingdom"
      },
      "sameAs": [
        "https://find-and-update.company-information.service.gov.uk/company/SC807896"
      ],
      "foundingDate": "2024",
      "numberOfEmployees": "1-10",
      "priceRange": "£££"
    };

    // Add page-specific data
    switch (page) {
      case 'services':
        baseData.service = [
          "Mobile App Development",
          "Website Development",
          "Company Branding"
        ];
        break;
      case 'contact':
        baseData.contactPoint = {
          "@type": "ContactPoint",
          "telephone": "+447884594929",
          "contactType": "customer service",
          "availableLanguage": "English"
        };
        break;
    }

    return baseData;
  }

  injectJSONLD(page) {
    // Remove existing JSON-LD
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    // Create new JSON-LD
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(this.generateJSONLD(page));
    document.head.appendChild(script);
  }
}

// Export models for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseModel,
    CookieModel,
    ContactModel,
    NavigationModel,
    SEOModel
  };
} else {
  window.Models = {
    BaseModel,
    CookieModel,
    ContactModel,
    NavigationModel,
    SEOModel
  };
}
