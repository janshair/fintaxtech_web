/**
 * Controllers.js - Controller Classes for MVC Architecture
 * Handles business logic and coordinates between models and views
 */

// Base Controller Class
class BaseController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    this.bindModelEvents();
    this.bindViewEvents();
    this.isInitialized = true;
  }

  bindModelEvents() {
    // Override in subclasses
  }

  bindViewEvents() {
    // Override in subclasses
  }

  destroy() {
    this.isInitialized = false;
  }
}

// Navigation Controller - Handles navigation logic
class NavigationController extends BaseController {
  constructor(model, view) {
    super(model, view);
  }

  bindModelEvents() {
    this.model.subscribe((data) => {
      this.handleModelUpdate(data);
    });
  }

  bindViewEvents() {
    // Listen for navigation events from the view
    document.addEventListener('navigation', (e) => {
      this.handleNavigation(e.detail);
    });

    // Listen for browser back/forward
    window.addEventListener('popstate', (e) => {
      this.handlePopState(e);
    });

    // Listen for menu toggle events
    document.addEventListener('menu_toggle', (e) => {
      this.handleMenuToggle(e.detail);
    });
  }

  handleModelUpdate(data) {
    switch (data.type) {
      case 'navigation':
        this.updateViewForNavigation(data);
        break;
      case 'menu_toggle':
        this.updateViewForMenuToggle(data);
        break;
    }
  }

  handleNavigation(detail) {
    const { page } = detail;
    
    // Update model
    this.model.navigateTo(page);
    
    // Update URL if needed
    this.updateURL(page);
    
    // Update page title and meta
    this.updatePageMeta(page);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handlePopState(e) {
    const currentPage = this.model.getCurrentPage();
    this.model.setCurrentPage(currentPage);
  }

  handleMenuToggle(detail) {
    const { menuOpen } = detail;
    this.model.setMenuOpen(menuOpen);
  }

  updateViewForNavigation(data) {
    // Update active navigation item
    this.updateActiveNavigation(data.currentPage);
    
    // Update page content if needed
    this.loadPageContent(data.currentPage);
  }

  updateViewForMenuToggle(data) {
    // Menu toggle is handled by the view itself
  }

  updateURL(page) {
    const pageUrls = {
      home: '/',
      services: '/services.html',
      portfolio: '/portfolio.html',
      packages: '/packages.html',
      contact: '/contact.html',
      privacy: '/privacy.html',
      terms: '/terms.html'
    };

    const url = pageUrls[page];
    if (url && window.location.pathname !== url) {
      history.pushState({ page }, '', url);
    }
  }

  updatePageMeta(page) {
    // Update page title
    const titles = {
      home: 'Fintaxtech Ltd - Professional Digital Solutions',
      services: 'Our Services - Mobile Apps, Web Development & Branding',
      portfolio: 'Our Portfolio - Recent Projects & Case Studies',
      packages: 'Our Packages - Affordable Digital Solutions',
      contact: 'Get In Touch - Contact Fintaxtech Ltd',
      privacy: 'Privacy Policy - Fintaxtech Ltd',
      terms: 'Terms of Service - Fintaxtech Ltd'
    };

    document.title = titles[page] || titles.home;
  }

  updateActiveNavigation(currentPage) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const page = link.dataset.page;
      if (page === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  loadPageContent(page) {
    // Load page-specific content or scripts
    switch (page) {
      case 'portfolio':
        this.loadPortfolioContent();
        break;
      case 'contact':
        this.loadContactContent();
        break;
    }
  }

  loadPortfolioContent() {
    // Initialize portfolio-specific features
    this.initPortfolioFilter();
    this.initPortfolioLightbox();
  }

  loadContactContent() {
    // Initialize contact-specific features
    this.initContactForm();
  }

  initPortfolioFilter() {
    // Portfolio filtering logic
    const filterButtons = document.querySelectorAll('.portfolio-filter button');
    const portfolioItems = document.querySelectorAll('.portfolio-card');

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        this.filterPortfolioItems(filter, portfolioItems);
        this.updateFilterButtons(button, filterButtons);
      });
    });
  }

  filterPortfolioItems(filter, items) {
    items.forEach(item => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.style.display = 'block';
        item.style.animation = 'fadeIn 0.3s ease-in';
      } else {
        item.style.display = 'none';
      }
    });
  }

  updateFilterButtons(activeButton, allButtons) {
    allButtons.forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
  }

  initPortfolioLightbox() {
    // Portfolio lightbox logic
    const portfolioImages = document.querySelectorAll('.portfolio-image');
    portfolioImages.forEach(image => {
      image.addEventListener('click', () => {
        this.openLightbox(image.src, image.alt);
      });
    });
  }

  openLightbox(src, alt) {
    // Create lightbox modal
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
        <img src="${src}" alt="${alt}" class="lightbox-image">
      </div>
    `;

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    // Close lightbox
    const closeBtn = lightbox.querySelector('.lightbox-close');
    closeBtn.addEventListener('click', () => {
      this.closeLightbox(lightbox);
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        this.closeLightbox(lightbox);
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeLightbox(lightbox);
      }
    });
  }

  closeLightbox(lightbox) {
    lightbox.remove();
    document.body.style.overflow = '';
  }

  initContactForm() {
    // Contact form initialization
    const form = document.querySelector('#contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleContactFormSubmission(form);
      });
    }
  }

  handleContactFormSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate and submit
    this.validateAndSubmitContactForm(data);
  }

  validateAndSubmitContactForm(data) {
    // Basic validation
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name is required and must be at least 2 characters');
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Message is required and must be at least 10 characters');
    }
    
    if (errors.length > 0) {
      this.showFormErrors(errors);
      return;
    }
    
    // Submit form
    this.submitContactForm(data);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showFormErrors(errors) {
    const errorContainer = document.querySelector('.form-errors');
    if (errorContainer) {
      errorContainer.innerHTML = errors.map(error => `<div class="error">${error}</div>`).join('');
      errorContainer.style.display = 'block';
    }
  }

  submitContactForm(data) {
    // Show loading state
    const submitButton = document.querySelector('#contact-form button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
      this.showSuccessMessage();
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      document.querySelector('#contact-form').reset();
    }, 2000);
  }

  showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
      <div class="success-content">
        <h3>Thank you!</h3>
        <p>Your message has been sent successfully. We'll get back to you soon.</p>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  handleResize() {
    // Handle window resize for navigation
    const nav = document.querySelector('.nav');
    if (nav && nav.classList.contains('active')) {
      // Close mobile menu on resize to desktop
      if (window.innerWidth > 768) {
        nav.classList.remove('active');
        document.querySelector('.mobile-menu-toggle').setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  }
}

// Cookie Controller - Handles cookie consent logic
class CookieController extends BaseController {
  constructor(model, view) {
    super(model, view);
  }

  bindModelEvents() {
    this.model.subscribe((data) => {
      this.handleModelUpdate(data);
    });
  }

  bindViewEvents() {
    // Listen for cookie events from the view
    document.addEventListener('cookie-accept-all', () => {
      this.acceptAllCookies();
    });

    document.addEventListener('cookie-reject-all', () => {
      this.rejectAllCookies();
    });

    document.addEventListener('cookie-save-preferences', (e) => {
      this.saveCookiePreferences(e.detail.preferences);
    });

    document.addEventListener('cookie-category-updated', (e) => {
      this.updateCookieCategory(e.detail.category, e.detail.enabled);
    });
  }

  handleModelUpdate(data) {
    switch (data.type) {
      case 'preferences_saved':
        this.handlePreferencesSaved(data);
        break;
      case 'category_updated':
        this.handleCategoryUpdated(data);
        break;
      case 'all_accepted':
        this.handleAllAccepted(data);
        break;
      case 'all_rejected':
        this.handleAllRejected(data);
        break;
    }
  }

  acceptAllCookies() {
    this.model.acceptAll();
    this.loadAnalytics();
    this.loadMarketing();
  }

  rejectAllCookies() {
    this.model.rejectAll();
    this.removeAnalytics();
    this.removeMarketing();
  }

  saveCookiePreferences(preferences) {
    Object.keys(preferences).forEach(category => {
      this.model.updateCategory(category, preferences[category]);
    });
    
    // Load/remove scripts based on preferences
    if (preferences.analytics) {
      this.loadAnalytics();
    } else {
      this.removeAnalytics();
    }
    
    if (preferences.marketing) {
      this.loadMarketing();
    } else {
      this.removeMarketing();
    }
  }

  updateCookieCategory(category, enabled) {
    this.model.updateCategory(category, enabled);
    
    // Load/remove scripts based on category
    switch (category) {
      case 'analytics':
        if (enabled) {
          this.loadAnalytics();
        } else {
          this.removeAnalytics();
        }
        break;
      case 'marketing':
        if (enabled) {
          this.loadMarketing();
        } else {
          this.removeMarketing();
        }
        break;
    }
  }

  handlePreferencesSaved(data) {
    console.log('Cookie preferences saved:', data.categories);
    this.showNotification('Cookie preferences saved successfully');
  }

  handleCategoryUpdated(data) {
    console.log(`Cookie category ${data.category} updated:`, data.enabled);
  }

  handleAllAccepted(data) {
    console.log('All cookies accepted:', data.categories);
    this.showNotification('All cookies accepted');
  }

  handleAllRejected(data) {
    console.log('All cookies rejected:', data.categories);
    this.showNotification('All cookies rejected');
  }

  loadAnalytics() {
    // Load Google Analytics or other analytics scripts
    if (!window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID');
    }
  }

  removeAnalytics() {
    // Remove analytics scripts
    const analyticsScripts = document.querySelectorAll('script[src*="googletagmanager"]');
    analyticsScripts.forEach(script => script.remove());
    
    if (window.gtag) {
      delete window.gtag;
    }
  }

  loadMarketing() {
    // Load marketing scripts (Facebook Pixel, etc.)
    console.log('Marketing cookies enabled');
  }

  removeMarketing() {
    // Remove marketing scripts
    console.log('Marketing cookies disabled');
  }

  showNotification(message) {
    // Show a temporary notification
    const notification = document.createElement('div');
    notification.className = 'cookie-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-success);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Contact Controller - Handles contact form logic
class ContactController extends BaseController {
  constructor(model) {
    super(model, null);
  }

  bindModelEvents() {
    this.model.subscribe((data) => {
      this.handleModelUpdate(data);
    });
  }

  bindViewEvents() {
    // Contact form events are handled by the navigation controller
    // This controller focuses on data management
  }

  handleModelUpdate(data) {
    switch (data.type) {
      case 'submission_success':
        this.handleSubmissionSuccess(data);
        break;
      case 'submission_error':
        this.handleSubmissionError(data);
        break;
      case 'validation_error':
        this.handleValidationError(data);
        break;
    }
  }

  handleSubmissionSuccess(data) {
    console.log('Contact form submitted successfully:', data.submission);
    this.showSuccessMessage();
    this.clearForm();
  }

  handleSubmissionError(data) {
    console.error('Contact form submission error:', data.error);
    this.showErrorMessage(data.error);
  }

  handleValidationError(data) {
    console.log('Contact form validation errors:', data.errors);
    this.showValidationErrors(data.errors);
  }

  showSuccessMessage() {
    // Success message is handled by navigation controller
  }

  showErrorMessage(error) {
    const errorContainer = document.querySelector('.form-errors');
    if (errorContainer) {
      errorContainer.innerHTML = `<div class="error">${error}</div>`;
      errorContainer.style.display = 'block';
    }
  }

  showValidationErrors(errors) {
    const errorContainer = document.querySelector('.form-errors');
    if (errorContainer) {
      errorContainer.innerHTML = errors.map(error => `<div class="error">${error}</div>`).join('');
      errorContainer.style.display = 'block';
    }
  }

  clearForm() {
    const form = document.querySelector('#contact-form');
    if (form) {
      form.reset();
    }
  }

  async submitForm(formData) {
    return await this.model.submitForm(formData);
  }
}

// Export controllers for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseController,
    NavigationController,
    CookieController,
    ContactController
  };
} else {
  window.Controllers = {
    BaseController,
    NavigationController,
    CookieController,
    ContactController
  };
}
