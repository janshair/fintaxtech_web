/**
 * App.js - Main Application Controller
 * MVC Architecture - Controller layer
 */

class App {
  constructor() {
    this.views = {};
    this.models = {};
    this.controllers = {};
    this.init();
  }

  init() {
    // Initialize core components
    this.initModels();
    this.initViews();
    this.initControllers();
    this.bindEvents();
    this.initializeApp();
  }

  initModels() {
    this.models.cookieModel = new CookieModel();
    this.models.contactModel = new ContactModel();
    this.models.navigationModel = new NavigationModel();
  }

  initViews() {
    this.views.headerView = new HeaderView();
    this.views.footerView = new FooterView();
    this.views.cookieConsentView = new CookieConsentView();
    this.views.whatsappView = new WhatsAppView();
  }

  initControllers() {
    this.controllers.navigationController = new NavigationController(
      this.models.navigationModel,
      this.views.headerView
    );
    this.controllers.cookieController = new CookieController(
      this.models.cookieModel,
      this.views.cookieConsentView
    );
    this.controllers.contactController = new ContactController(
      this.models.contactModel
    );
  }

  bindEvents() {
    // Global event listeners
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeApp();
    });

    // Window events
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));

    window.addEventListener('scroll', this.throttle(() => {
      this.handleScroll();
    }, 100));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
  }

  initializeApp() {
    // Initialize all components
    this.controllers.navigationController.init();
    this.controllers.cookieController.init();
    this.controllers.contactController.init();
    
    // Initialize views
    this.views.headerView.render();
    this.views.footerView.render();
    this.views.whatsappView.render();

    // Load page-specific functionality
    this.loadPageSpecificFeatures();

    // Initialize accessibility features
    this.initAccessibility();

    console.log('Fintaxtech App initialized successfully');
  }

  loadPageSpecificFeatures() {
    const currentPage = this.getCurrentPage();
    
    switch (currentPage) {
      case 'home':
        this.initHomePage();
        break;
      case 'services':
        this.initServicesPage();
        break;
      case 'portfolio':
        this.initPortfolioPage();
        break;
      case 'packages':
        this.initPackagesPage();
        break;
      case 'contact':
        this.initContactPage();
        break;
      case 'privacy':
      case 'terms':
        this.initLegalPages();
        break;
      case '404':
        this.init404Page();
        break;
    }
  }

  initHomePage() {
    // Initialize home page specific features
    this.initHeroAnimations();
    this.initScrollAnimations();
  }

  initServicesPage() {
    // Initialize services page features
    this.initServiceCards();
  }

  initPortfolioPage() {
    // Initialize portfolio page features
    this.initPortfolioFilter();
    this.initPortfolioLightbox();
  }

  initPackagesPage() {
    // Initialize packages page features
    this.initPackageComparison();
  }

  initContactPage() {
    // Initialize contact page features
    this.initContactForm();
    this.initMapIntegration();
  }

  initLegalPages() {
    // Initialize legal pages features
    this.initLegalContent();
  }

  init404Page() {
    // Initialize 404 page features
    this.init404Animations();
  }

  initAccessibility() {
    // Skip to content functionality
    this.initSkipToContent();
    
    // Focus management
    this.initFocusManagement();
    
    // ARIA live regions
    this.initAriaLiveRegions();
  }

  initSkipToContent() {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector('#main-content');
        if (target) {
          target.focus();
          target.scrollIntoView();
        }
      });
    }
  }

  initFocusManagement() {
    // Trap focus in modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.manageFocus(e);
      }
    });
  }

  initAriaLiveRegions() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  }

  initHeroAnimations() {
    // Animate hero elements on load
    const heroElements = document.querySelectorAll('.hero h1, .hero p, .hero .btn');
    heroElements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.6s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 200);
    });
  }

  initScrollAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.card, .service-card, .portfolio-card');
    animatedElements.forEach(element => {
      element.classList.add('animate-on-scroll');
      observer.observe(element);
    });
  }

  initServiceCards() {
    // Add hover effects and interactions to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });
  }

  initPortfolioFilter() {
    // Portfolio filtering functionality
    const filterButtons = document.querySelectorAll('.portfolio-filter button');
    const portfolioItems = document.querySelectorAll('.portfolio-card');

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Filter portfolio items
        portfolioItems.forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = 'block';
            item.style.animation = 'fadeIn 0.3s ease-in';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  initPortfolioLightbox() {
    // Portfolio lightbox functionality
    const portfolioImages = document.querySelectorAll('.portfolio-image');
    portfolioImages.forEach(image => {
      image.addEventListener('click', () => {
        this.openLightbox(image.src, image.alt);
      });
    });
  }

  initPackageComparison() {
    // Package comparison functionality
    const packageCards = document.querySelectorAll('.package-card');
    packageCards.forEach(card => {
      card.addEventListener('click', () => {
        this.selectPackage(card);
      });
    });
  }

  initContactForm() {
    // Contact form validation and submission
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleContactFormSubmission(contactForm);
      });
    }
  }

  initMapIntegration() {
    // Initialize map if present
    const mapElement = document.querySelector('#map');
    if (mapElement) {
      this.loadMap();
    }
  }

  initLegalContent() {
    // Legal content specific functionality
    this.initTableOfContents();
  }

  init404Animations() {
    // 404 page animations
    const errorCode = document.querySelector('.error-code');
    if (errorCode) {
      errorCode.style.animation = 'bounce 1s ease-in-out';
    }
  }

  // Utility methods
  getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('services')) return 'services';
    if (path.includes('portfolio')) return 'portfolio';
    if (path.includes('packages')) return 'packages';
    if (path.includes('contact')) return 'contact';
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('terms')) return 'terms';
    if (path.includes('404')) return '404';
    return 'home';
  }

  handleResize() {
    // Handle window resize
    this.controllers.navigationController.handleResize();
  }

  handleScroll() {
    // Handle scroll events
    const scrollY = window.scrollY;
    const header = document.querySelector('.header');
    
    if (scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  handleKeyboardNavigation(e) {
    // Handle keyboard navigation
    if (e.key === 'Escape') {
      this.closeModals();
    }
  }

  manageFocus(e) {
    // Focus management for accessibility
    const activeElement = document.activeElement;
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  // Event handlers
  handleContactFormSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate form
    if (this.validateContactForm(data)) {
      this.submitContactForm(data);
    }
  }

  validateContactForm(data) {
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
      return false;
    }
    
    return true;
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
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      this.showSuccessMessage();
      submitButton.textContent = originalText;
      submitButton.disabled = false;
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

  // Utility functions
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Public API
  announce(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  closeModals() {
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
