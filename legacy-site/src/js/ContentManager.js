/**
 * ContentManager.js - Manages dynamic content loading from AppConstants
 * Allows non-technical users to easily update website content
 */

class ContentManager {
  constructor() {
    this.constants = window.AppConstants;
    if (this.constants) {
      this.init();
    } else {
      console.error('AppConstants not available');
    }
  }

  init() {
    // Wait for DOM to be ready and AppConstants to be loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure AppConstants is loaded
        setTimeout(() => this.loadContent(), 100);
      });
    } else {
      // Small delay to ensure AppConstants is loaded
      setTimeout(() => this.loadContent(), 100);
    }
  }

  loadContent() {
    // Check if AppConstants is loaded
    if (!this.constants) {
      console.error('AppConstants not loaded. Retrying...');
      setTimeout(() => this.loadContent(), 200);
      return;
    }

    console.log('Loading content from AppConstants...');
    
    this.updatePageTitle();
    this.updateMetaTags();
    this.updateNavigation();
    this.updateHeroContent();
    this.updateServicesContent();
    this.updatePortfolioContent();
    this.updatePackagesContent();
    this.updateCTAContent();
    this.updateContactContent();
    this.updateFooterContent();
    this.updateLegalContent();
    this.update404Content();
    
    console.log('Content loaded successfully!');
    
    // Add content-loaded class to body to hide loading placeholders
    document.body.classList.add('content-loaded');
  }

  updatePageTitle() {
    const currentPage = this.getCurrentPage();
    const metaData = this.constants.META[currentPage] || this.constants.META.home;
    document.title = metaData.title;
  }

  updateMetaTags() {
    const currentPage = this.getCurrentPage();
    const metaData = this.constants.META[currentPage] || this.constants.META.home;
    
    // Update meta description
    this.updateMetaTag('description', metaData.description);
    
    // Update meta keywords
    this.updateMetaTag('keywords', metaData.keywords);
    
    // Update Open Graph tags
    this.updateOpenGraphTags(metaData);
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

  updateOpenGraphTags(metaData) {
    const ogTags = {
      'og:title': metaData.title,
      'og:description': metaData.description,
      'og:image': metaData.ogImage || this.constants.IMAGES.HERO_BG,
      'og:url': window.location.href,
      'og:type': 'website',
      'og:site_name': this.constants.COMPANY.NAME
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      this.updateMetaTag(property, content, 'property');
    });
  }

  updateNavigation() {
    const navItems = this.constants.NAVIGATION;
    const navList = document.querySelector('.nav-list');
    
    if (navList) {
      navList.innerHTML = Object.values(navItems)
        .filter(item => item.id !== 'privacy' && item.id !== 'terms') // Exclude footer-only items
        .map(item => `
          <li><a href="${item.url}" class="nav-link" data-page="${item.id}">${item.label}</a></li>
        `).join('');
    }
  }

  updateHeroContent() {
    const heroTitle = document.querySelector('#hero-title');
    const heroDescription = document.querySelector('.hero p');
    const heroActions = document.querySelector('.hero-actions');
    
    if (heroTitle) {
      heroTitle.textContent = this.constants.HERO.title;
    }
    
    if (heroDescription) {
      heroDescription.textContent = this.constants.HERO.subtitle;
    }
    
    if (heroActions) {
      let html = `<a href="${this.constants.HERO.primaryButtonLink}" class="btn btn-primary">${this.constants.HERO.primaryButton}</a>`;
      if (this.constants.HERO.secondaryButton && this.constants.HERO.secondaryButtonLink) {
        html += ` <a href="${this.constants.HERO.secondaryButtonLink}" class="btn btn-secondary">${this.constants.HERO.secondaryButton}</a>`;
      }
      heroActions.innerHTML = html;
    }
  }

  updateServicesContent() {
    // Update service section headers
    const servicesTitle = document.querySelector('#services-title');
    const servicesSubtitle = document.querySelector('#services .section-subtitle');
    
    if (servicesTitle) {
      servicesTitle.textContent = this.constants.SECTIONS.SERVICES.title;
    }
    if (servicesSubtitle) {
      servicesSubtitle.textContent = this.constants.SECTIONS.SERVICES.subtitle;
    }
    
    // Update service cards on homepage
    this.updateServiceCards();
    
    // Update services page content
    this.updateServicesPageContent();
  }


  updateServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    const services = this.constants.SERVICES;
    const serviceKeys = Object.keys(services);
    
    serviceCards.forEach((card, index) => {
      const serviceKey = serviceKeys[index];
      const service = services[serviceKey];
      
      if (service) {
        const title = card.querySelector('h3');
        const description = card.querySelector('p');
        const featuresList = card.querySelector('.service-features');
        const link = card.querySelector('a');
        
        if (title) title.textContent = service.title;
        if (description) description.textContent = service.description;
        
        if (featuresList) {
          featuresList.innerHTML = service.features.map(feature => 
            `<li>${feature}</li>`
          ).join('');
        }
        
        if (link) {
          link.href = `/services.html#${serviceKey}`;
          link.textContent = 'Learn More';
        }
      }
    });
  }

  updateServicesPageContent() {
    // Update service detail sections
    Object.keys(this.constants.SERVICES).forEach(serviceKey => {
      const service = this.constants.SERVICES[serviceKey];
      const section = document.getElementById(serviceKey);
      
      if (section) {
        const title = section.querySelector(`#${serviceKey}-title`);
        const description = section.querySelector('.service-description');
        
        if (title) title.textContent = service.title;
        if (description) description.textContent = service.description;
      }
    });
  }

  updatePortfolioContent() {
    const portfolio = this.constants.PORTFOLIO;
    
    // Update portfolio section header
    const portfolioTitle = document.querySelector('#portfolio-title');
    const portfolioSubtitle = document.querySelector('#portfolio-preview .section-subtitle');
    
    if (portfolioTitle) portfolioTitle.textContent = this.constants.SECTIONS.PORTFOLIO.title;
    if (portfolioSubtitle) portfolioSubtitle.textContent = this.constants.SECTIONS.PORTFOLIO.subtitle;
    
    // Update portfolio cards
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    const portfolioKeys = Object.keys(portfolio);
    
    portfolioCards.forEach((card, index) => {
      const portfolioKey = portfolioKeys[index];
      const project = portfolio[portfolioKey];
      
      if (project) {
        const title = card.querySelector('h3');
        const description = card.querySelector('p');
        const category = card.querySelector('.portfolio-category');
        const image = card.querySelector('.portfolio-image');
        const overlayTitle = card.querySelector('.portfolio-overlay h3');
        const overlayCategory = card.querySelector('.portfolio-overlay p');
        
        if (title) title.textContent = project.title;
        if (description) description.textContent = project.description;
        if (category) category.textContent = project.category;
        if (overlayTitle) overlayTitle.textContent = project.title;
        if (overlayCategory) overlayCategory.textContent = project.category;
        if (image) {
          image.src = project.image;
          image.alt = project.alt;
        }
      }
    });
    
    // Update portfolio button
    const portfolioButton = document.querySelector('#portfolio-preview .btn-primary');
    if (portfolioButton) portfolioButton.textContent = 'View All Projects';
  }

  updatePackagesContent() {
    const packages = this.constants.PACKAGES;
    
    // Update packages section header
    const packagesTitle = document.querySelector('#packages-title');
    const packagesSubtitle = document.querySelector('#packages-preview .section-subtitle');
    
    if (packagesTitle) packagesTitle.textContent = this.constants.SECTIONS.PACKAGES.title;
    if (packagesSubtitle) packagesSubtitle.textContent = this.constants.SECTIONS.PACKAGES.subtitle;
    
    // Update package cards
    const packageCards = document.querySelectorAll('.package-card');
    const packageKeys = Object.keys(packages);
    
    packageCards.forEach((card, index) => {
      const packageKey = packageKeys[index];
      const packageData = packages[packageKey];
      
      if (packageData) {
        const title = card.querySelector('h3');
        const subtitle = card.querySelector('.package-subtitle');
        const price = card.querySelector('.package-price');
        const featuresList = card.querySelector('.package-features');
        const link = card.querySelector('a');
        const badge = card.querySelector('.package-badge');
        
        if (title) title.textContent = packageData.title;
        if (subtitle) subtitle.textContent = packageData.subtitle;
        if (price) price.textContent = packageData.price;
        
        if (featuresList) {
          featuresList.innerHTML = packageData.features.map(feature => 
            `<li>${feature}</li>`
          ).join('');
        }
        
        if (link) {
          link.textContent = 'Choose Package';
          link.href = '/packages.html';
        }
        
        // Add popular badge if needed
        if (packageData.popular && badge) {
          badge.textContent = 'Most Popular';
        }
      }
    });
    
    // Update packages button
    const packagesButton = document.querySelector('#packages-preview .text-center .btn-primary');
    if (packagesButton) packagesButton.textContent = 'View All Packages';
  }

  updateContactContent() {
    // Update contact information
    const contactInfo = document.querySelectorAll('.contact-info');
    contactInfo.forEach(info => {
      info.innerHTML = `
        <p><strong>Phone:</strong> <a href="tel:${this.constants.COMPANY.PHONE}">${this.constants.COMPANY.PHONE}</a></p>
        <p><strong>Email:</strong> <a href="mailto:${this.constants.COMPANY.EMAIL}">${this.constants.COMPANY.EMAIL}</a></p>
        <p><strong>Company No:</strong> ${this.constants.COMPANY.COMPANY_NUMBER}</p>
        <p><strong>Registered Office:</strong> ${this.constants.COMPANY.REGISTERED_OFFICE}</p>
      `;
    });

    // Update WhatsApp links
    const whatsappLinks = document.querySelectorAll('.whatsapp-float, a[href*="wa.me"]');
    whatsappLinks.forEach(link => {
      link.href = `${this.constants.COMPANY.WHATSAPP_URL}?text=${encodeURIComponent(this.constants.WHATSAPP.MESSAGE)}`;
    });
  }

  updateCTAContent() {
    // Update CTA section
    const ctaTitle = document.querySelector('#cta-title');
    const ctaSubtitle = document.querySelector('#cta .section-subtitle');
    const ctaButtons = document.querySelectorAll('#cta .btn');
    
    if (ctaTitle) ctaTitle.textContent = this.constants.SECTIONS.CTA.title;
    if (ctaSubtitle) ctaSubtitle.textContent = this.constants.SECTIONS.CTA.subtitle;
    
    if (ctaButtons.length >= 2) {
      ctaButtons[0].textContent = this.constants.SECTIONS.CTA.primaryButton;
      ctaButtons[1].textContent = this.constants.SECTIONS.CTA.secondaryButton;
    }
  }

  updateFooterContent() {
    // Update footer company information
    const footerSections = document.querySelectorAll('.footer-section');
    footerSections.forEach(section => {
      const companyInfo = section.querySelector('.contact-info');
      if (companyInfo) {
        companyInfo.innerHTML = `
          <p><strong>Phone:</strong> <a href="tel:${this.constants.COMPANY.PHONE}">${this.constants.COMPANY.PHONE}</a></p>
          <p><strong>Email:</strong> <a href="mailto:${this.constants.COMPANY.EMAIL}">${this.constants.COMPANY.EMAIL}</a></p>
          <p><strong>Company No:</strong> ${this.constants.COMPANY.COMPANY_NUMBER}</p>
          <p><strong>Registered Office:</strong> ${this.constants.COMPANY.REGISTERED_OFFICE}</p>
        `;
      }
    });

    // Update footer bottom
    const footerBottom = document.querySelector('.footer-bottom p');
    if (footerBottom) {
      const currentYear = new Date().getFullYear();
      footerBottom.innerHTML = `&copy; ${currentYear} ${this.constants.COMPANY.NAME}. All rights reserved. | Company Registration: ${this.constants.COMPANY.COMPANY_NUMBER} | Registered in Scotland`;
    }
  }

  updateLegalContent() {
    // Update privacy policy
    const privacyContent = document.querySelector('.legal-content');
    if (privacyContent && window.location.pathname.includes('privacy')) {
      this.updatePrivacyPolicy(privacyContent);
    }

    // Update terms of service
    if (privacyContent && window.location.pathname.includes('terms')) {
      this.updateTermsOfService(privacyContent);
    }
  }

  updatePrivacyPolicy(container) {
    const legal = this.constants.LEGAL.PRIVACY_POLICY;
    
    // Update company details in privacy policy
    const companyDetails = container.querySelector('.contact-details');
    if (companyDetails) {
      companyDetails.innerHTML = `
        <p><strong>Data Protection Officer:</strong> ${this.constants.COMPANY.NAME}</p>
        <p><strong>Email:</strong> <a href="mailto:${legal.contactEmail}">${legal.contactEmail}</a></p>
        <p><strong>Phone:</strong> <a href="tel:${this.constants.COMPANY.PHONE}">${this.constants.COMPANY.PHONE}</a></p>
        <p><strong>Address:</strong> ${this.constants.COMPANY.REGISTERED_OFFICE}</p>
        <p><strong>Company Number:</strong> ${this.constants.COMPANY.COMPANY_NUMBER}</p>
      `;
    }
  }

  updateTermsOfService(container) {
    const legal = this.constants.LEGAL.TERMS_OF_SERVICE;
    
    // Update company details in terms of service
    const companyDetails = container.querySelector('.contact-details');
    if (companyDetails) {
      companyDetails.innerHTML = `
        <p><strong>${this.constants.COMPANY.NAME}</strong></p>
        <p><strong>Email:</strong> <a href="mailto:legal@${this.constants.COMPANY.EMAIL.split('@')[1]}">legal@${this.constants.COMPANY.EMAIL.split('@')[1]}</a></p>
        <p><strong>Phone:</strong> <a href="tel:${this.constants.COMPANY.PHONE}">${this.constants.COMPANY.PHONE}</a></p>
        <p><strong>Address:</strong> ${this.constants.COMPANY.REGISTERED_OFFICE}</p>
        <p><strong>Company Number:</strong> ${this.constants.COMPANY.COMPANY_NUMBER}</p>
      `;
    }
  }

  update404Content() {
    // Update 404 page content
    const errorTitle = document.querySelector('#error-title');
    const errorDescription = document.querySelector('.error-description');
    
    if (errorTitle) {
      errorTitle.textContent = 'Page Not Found';
    }
    
    if (errorDescription) {
      errorDescription.textContent = `Sorry, the page you're looking for doesn't exist or has been moved. Don't worry, we'll help you find what you need.`;
    }
  }

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

  // Public method to reload content (useful for testing)
  reload() {
    this.loadContent();
  }
}

// Initialize content manager
if (typeof window !== 'undefined') {
  window.ContentManager = ContentManager;
}
