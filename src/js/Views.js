/**
 * Views.js - View Classes for MVC Architecture
 * Handles DOM manipulation and user interface updates
 */

// Base View Class
class BaseView {
  constructor() {
    this.element = null;
    this.template = '';
  }

  render() {
    // Override in subclasses
  }

  update(data) {
    // Override in subclasses
  }

  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Header View - Manages header navigation
class HeaderView extends BaseView {
  constructor() {
    super();
    this.template = this.createHeaderTemplate();
  }

  createHeaderTemplate() {
    return `
      <header class="header" role="banner">
        <div class="header-container">
          <a href="/" class="logo" aria-label="Fintaxtech Ltd - Home">
            Fintaxtech
          </a>
          <!-- Navigation temporarily hidden -->
          <!--
          <nav class="nav" role="navigation" aria-label="Main navigation">
            <ul class="nav-list">
              <li><a href="/" class="nav-link" data-page="home">Home</a></li>
              <li><a href="/services.html" class="nav-link" data-page="services">Services</a></li>
              // <li><a href="/portfolio.html" class="nav-link" data-page="portfolio">Portfolio</a></li>
              <li><a href="/packages.html" class="nav-link" data-page="packages">Packages</a></li>
              <li><a href="/contact.html" class="nav-link" data-page="contact">Get In Touch</a></li>
            </ul>
          </nav>
          <button class="mobile-menu-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
            <span class="hamburger"></span>
            <span class="hamburger"></span>
            <span class="hamburger"></span>
          </button>
          -->
        </div>
      </header>
    `;
  }

  render() {
    const header = document.querySelector('.header');
    if (header) {
      header.outerHTML = this.template;
    } else {
      document.body.insertAdjacentHTML('afterbegin', this.template);
    }
    
    this.element = document.querySelector('.header');
    this.bindEvents();
    this.updateActivePage();
  }

  bindEvents() {
    const mobileToggle = this.element.querySelector('.mobile-menu-toggle');
    const nav = this.element.querySelector('.nav');
    const navLinks = this.element.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        this.handleNavigation(e);
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target) && nav.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    const nav = this.element.querySelector('.nav');
    const toggle = this.element.querySelector('.mobile-menu-toggle');
    
    nav.classList.toggle('active');
    const isOpen = nav.classList.contains('active');
    
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  closeMobileMenu() {
    const nav = this.element.querySelector('.nav');
    const toggle = this.element.querySelector('.mobile-menu-toggle');
    
    nav.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  handleNavigation(e) {
    const link = e.currentTarget;
    const page = link.dataset.page;
    
    // Update active state
    this.updateActiveLink(link);
    
    // Close mobile menu
    this.closeMobileMenu();
    
    // Emit navigation event
    this.dispatchEvent('navigation', { page });
  }

  updateActiveLink(activeLink) {
    const navLinks = this.element.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
    });
    activeLink.classList.add('active');
  }

  updateActivePage() {
    const currentPage = this.getCurrentPage();
    const activeLink = this.element.querySelector(`[data-page="${currentPage}"]`);
    if (activeLink) {
      this.updateActiveLink(activeLink);
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('services')) return 'services';
    if (path.includes('portfolio')) return 'portfolio';
    if (path.includes('packages')) return 'packages';
    if (path.includes('contact')) return 'contact';
    return 'home';
  }

  update(data) {
    if (data.type === 'navigation') {
      this.updateActivePage();
    }
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
}

// Footer View - Manages footer content
class FooterView extends BaseView {
  constructor() {
    super();
    this.template = this.createFooterTemplate();
  }

  createFooterTemplate() {
    return `
      <footer class="footer" role="contentinfo">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>Fintaxtech Ltd</h3>
              <p>Professional digital solutions for modern businesses. Specializing in mobile app development, website development, and company branding.</p>
              <div class="contact-info">
                <p><strong>Phone:</strong> <a href="tel:+447884594929">+44 7884 594929</a></p>
                <p><strong>Email:</strong> <a href="mailto:info@fintaxtech.co.uk">info@fintaxtech.co.uk</a></p>
                <p><strong>Company No:</strong> SC807896</p>
                <p><strong>Registered Office:</strong> Dundee, Scotland, UK</p>
              </div>
            </div>
            
            <div class="footer-section">
              <h3>Services</h3>
              <ul>
                <li><a href="/services.html#mobile-apps">Mobile App Development</a></li>
                <li><a href="/services.html#web-development">Website Development</a></li>
                <li><a href="/services.html#branding">Company Branding</a></li>
                <li><a href="/packages.html">Our Packages</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h3>Company</h3>
              <ul>
               <!-- <li><a href="/portfolio.html">Our Portfolio</a></li> -->
                <li><a href="/contact.html">Get In Touch</a></li>
                <li><a href="/privacy.html">Privacy Policy</a></li>
                <li><a href="/terms.html">Terms of Service</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h3>Legal</h3>
              <ul>
                <li><a href="/privacy.html">Privacy Policy</a></li>
                <li><a href="/terms.html">Terms of Service</a></li>
                <li><a href="/privacy.html#cookies">Cookie Policy</a></li>
              </ul>
            </div>

            <div class="footer-section">
              <h3>Social Media</h3>
              <ul>
                <li>
                  <a href="https://www.facebook.com/fintaxtechuk/" target="_blank" rel="noopener">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/fintaxtechuk/" target="_blank" rel="noopener">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} Fintaxtech Ltd. All rights reserved. | Company Registration: SC807896 | Registered in Scotland</p>
          </div>
        </div>
      </footer>
    `;
  }

  render() {
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.outerHTML = this.template;
    } else {
      document.body.insertAdjacentHTML('beforeend', this.template);
    }
    
    this.element = document.querySelector('.footer');
  }
}

// Cookie Consent View - Manages cookie consent banner
class CookieConsentView extends BaseView {
  constructor() {
    super();
    this.template = this.createCookieConsentTemplate();
    this.settingsTemplate = this.createCookieSettingsTemplate();
  }

  createCookieConsentTemplate() {
    return `
      <div class="cookie-consent" id="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description">
        <div class="cookie-consent-content">
          <div class="cookie-consent-text">
            <h3 id="cookie-consent-title">Cookie Consent</h3>
            <p id="cookie-consent-description">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies.
            </p>
          </div>
          <div class="cookie-consent-actions">
            <button class="btn btn-secondary" id="cookie-settings-btn">Manage Preferences</button>
            <button class="btn btn-secondary" id="cookie-reject-btn">Reject All</button>
            <button class="btn btn-primary" id="cookie-accept-btn">Accept All</button>
          </div>
        </div>
        <div class="cookie-settings" id="cookie-settings" style="display: none;">
          ${this.settingsTemplate}
        </div>
      </div>
    `;
  }

  createCookieSettingsTemplate() {
    return `
      <h4>Cookie Preferences</h4>
      <p>You can manage your cookie preferences below. Some cookies are necessary for the website to function properly.</p>
      
      <div class="cookie-category">
        <div class="cookie-toggle">
          <input type="checkbox" id="necessary-cookies" checked disabled>
          <label for="necessary-cookies">Necessary Cookies</label>
        </div>
        <p>Essential cookies required for the website to function properly. These cannot be disabled.</p>
      </div>
      
      <div class="cookie-category">
        <div class="cookie-toggle">
          <input type="checkbox" id="analytics-cookies">
          <label for="analytics-cookies">Analytics Cookies</label>
        </div>
        <p>Help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
      </div>
      
      <div class="cookie-category">
        <div class="cookie-toggle">
          <input type="checkbox" id="marketing-cookies">
          <label for="marketing-cookies">Marketing Cookies</label>
        </div>
        <p>Used to track visitors across websites for advertising purposes and to display relevant ads.</p>
      </div>
      
      <div class="cookie-settings-actions">
        <button class="btn btn-secondary" id="cookie-save-btn">Save Preferences</button>
        <button class="btn btn-primary" id="cookie-accept-all-settings">Accept All</button>
      </div>
    `;
  }

  render() {
    // Only show if consent hasn't been given
    if (!this.hasConsent()) {
      document.body.insertAdjacentHTML('beforeend', this.template);
      this.element = document.getElementById('cookie-consent');
      this.bindEvents();
    }
  }

  bindEvents() {
    if (!this.element) return;

    const acceptBtn = this.element.querySelector('#cookie-accept-btn');
    const rejectBtn = this.element.querySelector('#cookie-reject-btn');
    const settingsBtn = this.element.querySelector('#cookie-settings-btn');
    const saveBtn = this.element.querySelector('#cookie-save-btn');
    const acceptAllSettingsBtn = this.element.querySelector('#cookie-accept-all-settings');
    const settings = this.element.querySelector('#cookie-settings');

    // Accept all cookies
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        this.acceptAll();
      });
    }

    // Reject all cookies
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        this.rejectAll();
      });
    }

    // Show settings
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }

    // Save preferences
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.savePreferences();
      });
    }

    // Accept all from settings
    if (acceptAllSettingsBtn) {
      acceptAllSettingsBtn.addEventListener('click', () => {
        this.acceptAll();
      });
    }

    // Category toggles
    const categoryToggles = this.element.querySelectorAll('.cookie-category input[type="checkbox"]');
    categoryToggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        this.updateCategoryPreference(e.target);
      });
    });
  }

  showSettings() {
    const settings = this.element.querySelector('#cookie-settings');
    if (settings) {
      settings.style.display = 'block';
      this.loadCurrentPreferences();
    }
  }

  hideSettings() {
    const settings = this.element.querySelector('#cookie-settings');
    if (settings) {
      settings.style.display = 'none';
    }
  }

  loadCurrentPreferences() {
    const preferences = this.getStoredPreferences();
    
    Object.keys(preferences).forEach(category => {
      const checkbox = this.element.querySelector(`#${category}-cookies`);
      if (checkbox) {
        checkbox.checked = preferences[category];
      }
    });
  }

  updateCategoryPreference(checkbox) {
    const category = checkbox.id.replace('-cookies', '');
    const enabled = checkbox.checked;
    
    this.dispatchEvent('cookie-category-updated', { category, enabled });
  }

  acceptAll() {
    this.dispatchEvent('cookie-accept-all');
    this.hide();
  }

  rejectAll() {
    this.dispatchEvent('cookie-reject-all');
    this.hide();
  }

  savePreferences() {
    const preferences = {};
    const checkboxes = this.element.querySelectorAll('.cookie-category input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      const category = checkbox.id.replace('-cookies', '');
      preferences[category] = checkbox.checked;
    });
    
    this.dispatchEvent('cookie-save-preferences', { preferences });
    this.hide();
  }

  hide() {
    if (this.element) {
      this.element.classList.add('show');
      setTimeout(() => {
        this.element.remove();
      }, 300);
    }
  }

  hasConsent() {
    return localStorage.getItem('fintaxtech_cookie_consent') !== null;
  }

  getStoredPreferences() {
    try {
      const stored = localStorage.getItem('fintaxtech_cookie_consent');
      return stored ? JSON.parse(stored) : {
        necessary: true,
        analytics: false,
        marketing: false
      };
    } catch (error) {
      return {
        necessary: true,
        analytics: false,
        marketing: false
      };
    }
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
}

// WhatsApp View - Manages WhatsApp floating button
class WhatsAppView extends BaseView {
  constructor() {
    super();
    this.template = this.createWhatsAppTemplate();
  }

  createWhatsAppTemplate() {
    return `
      <a href="https://wa.me/447884594929?text=Hi! I'm interested in your digital services. Can you help me?" 
         class="whatsapp-float" 
         target="_blank" 
         rel="noopener"
         aria-label="Contact us on WhatsApp">
        <span class="whatsapp-text">Contact Now</span>
      </a>
    `;
  }

  render() {
    // Only add if not already present
    if (!document.querySelector('.whatsapp-float')) {
      document.body.insertAdjacentHTML('beforeend', this.template);
      this.element = document.querySelector('.whatsapp-float');
      this.bindEvents();
    }
  }

  bindEvents() {
    if (!this.element) return;

    this.element.addEventListener('click', (e) => {
      // Track WhatsApp clicks for analytics
      this.dispatchEvent('whatsapp-click', {
        url: this.element.href,
        timestamp: new Date().toISOString()
      });
    });
  }

  update(data) {
    if (data.type === 'whatsapp-message-updated') {
      this.updateMessage(data.message);
    }
  }

  updateMessage(message) {
    if (this.element) {
      const encodedMessage = encodeURIComponent(message);
      this.element.href = `https://wa.me/447884594929?text=${encodedMessage}`;
    }
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
}

// Export views for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseView,
    HeaderView,
    FooterView,
    CookieConsentView,
    WhatsAppView
  };
} else {
  window.Views = {
    BaseView,
    HeaderView,
    FooterView,
    CookieConsentView,
    WhatsAppView
  };
}
