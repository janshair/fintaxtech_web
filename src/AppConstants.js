/**
 * AppConstants.js - Central configuration for Fintaxtech Ltd website
 * Contains all strings, image paths, and design tokens
 */

const AppConstants = {
  // Company Information
  COMPANY: {
    NAME: "Fintaxtech Ltd",
    COMPANY_NUMBER: "SC807896",
    COMPANY_HOUSE_URL: "https://find-and-update.company-information.service.gov.uk/company/SC807896",
    PHONE: "+447884594929",
    WHATSAPP_URL: "https://wa.me/447884594929",
    EMAIL: "info@fintaxtech.co.uk",
    REGISTERED_OFFICE: "Dundee, Scotland, United Kingdom"
  },

  // Design Tokens - Dark Theme
  COLORS: {
    PRIMARY: "#00D400",
    PRIMARY_DARK: "#009900",
    SECONDARY: "#FF6B35",
    ACCENT: "#7B68EE",
    BACKGROUND: "#0A0A0A",
    SURFACE: "#1A1A1A",
    SURFACE_LIGHT: "#2A2A2A",
    TEXT_PRIMARY: "#FFFFFF",
    TEXT_SECONDARY: "#B0B0B0",
    TEXT_MUTED: "#808080",
    BORDER: "#333333",
    SUCCESS: "#4CAF50",
    WARNING: "#FF9800",
    ERROR: "#F44336"
  },

  // Typography
  FONTS: {
    PRIMARY: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    HEADING: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    MONO: "'JetBrains Mono', 'Fira Code', monospace"
  },

  // Spacing Scale
  SPACING: {
    XS: "0.25rem",
    SM: "0.5rem",
    MD: "1rem",
    LG: "1.5rem",
    XL: "2rem",
    XXL: "3rem",
    XXXL: "4rem"
  },

  // Breakpoints
  BREAKPOINTS: {
    MOBILE: "480px",
    TABLET: "768px",
    DESKTOP: "1024px",
    LARGE: "1200px"
  },

  // Image Paths
  IMAGES: {
    LOGO: "./src/images/logo.svg",
    HERO_BG: "./src/images/hero-bg.jpg",
    PLACEHOLDER: "./src/images/placeholder.jpg",
    // Portfolio Placeholders
    PORTFOLIO: {
      WEBSITE_1: "./src/images/placeholder.svg",
      WEBSITE_2: "./src/images/placeholder.svg",
      MOBILE_APP_1: "./src/images/placeholder.svg",
      MOBILE_APP_2: "./src/images/placeholder.svg",
      BRANDING_1: "./src/images/placeholder.svg",
      BRANDING_2: "./src/images/placeholder.svg"
    },
    // Service Icons
    SERVICES: {
      MOBILE_APPS: "./src/images/icons/mobile-apps.svg",
      WEB_DEVELOPMENT: "./src/images/icons/web-development.svg",
      BRANDING: "./src/images/icons/branding.svg"
    }
  },

  // Navigation
  NAVIGATION: {
    HOME: { label: "Home", url: "/", id: "home" },
    SERVICES: { label: "Services", url: "/services.html", id: "services" },
    PORTFOLIO: { label: "Portfolio", url: "/portfolio.html", id: "portfolio" },
    PACKAGES: { label: "Packages", url: "/packages.html", id: "packages" },
    CONTACT: { label: "Get In Touch", url: "/contact.html", id: "contact" },
    PRIVACY: { label: "Privacy Policy", url: "/privacy.html", id: "privacy" },
    TERMS: { label: "Terms of Service", url: "/terms.html", id: "terms" }
  },

  // Services
  SERVICES: {
    MOBILE_APPS: {
      title: "Mobile App Development",
      description: "Custom iOS and Android applications built with modern frameworks and best practices.",
      features: ["Native iOS & Android", "Cross-platform solutions", "UI/UX Design", "App Store optimization"]
    },
    WEB_DEVELOPMENT: {
      title: "Website Development",
      description: "Responsive, fast, and SEO-optimized websites that drive business growth.",
      features: ["Responsive Design", "SEO Optimization", "Performance", "Security"]
    },
    BRANDING: {
      title: "Company Branding",
      description: "Complete brand identity solutions including logo design, guidelines, and marketing materials.",
      features: ["Logo Design", "Brand Guidelines", "Marketing Materials", "Digital Assets"]
    }
  },

  // Portfolio Projects
  PORTFOLIO: {
    WEBSITE: {
      title: "E-commerce Platform",
      description: "Modern e-commerce solution with advanced features and seamless user experience.",
      image: "./src/images/placeholder.svg",
      category: "Website Development",
      technologies: ["React", "Node.js", "MongoDB"]
    },
    MOBILE_APP: {
      title: "Fitness Tracking App",
      description: "Comprehensive fitness tracking application with social features and analytics.",
      image: "./src/images/placeholder.svg",
      category: "Mobile App",
      technologies: ["React Native", "Firebase", "Redux"]
    },
    BRANDING: {
      title: "Tech Startup Branding",
      description: "Complete brand identity for a fintech startup including logo, guidelines, and marketing materials.",
      image: "./src/images/placeholder.svg",
      category: "Branding",
      technologies: ["Brand Strategy", "Visual Identity", "Marketing"]
    }
  },

  // Packages
  PACKAGES: {
    COMPANY_SETUP: {
      title: "Company Setup",
      subtitle: "Branding + Static Website",
      price: "£2,499",
      description: "Complete business setup package including branding and professional website.",
      features: [
        "Custom Logo Design",
        "Brand Guidelines",
        "5-Page Static Website",
        "SEO Optimization",
        "Mobile Responsive",
        "1 Year Hosting"
      ],
      popular: true
    },
    WEBSITE_DEVELOPMENT: {
      title: "Website Development",
      subtitle: "Custom Web Solutions",
      price: "£1,999",
      description: "Professional website development with modern technologies and best practices.",
      features: [
        "Custom Design",
        "Content Management",
        "E-commerce Integration",
        "Performance Optimization",
        "Security Features",
        "6 Months Support"
      ],
      popular: false
    },
    BRANDING: {
      title: "Branding Package",
      subtitle: "Complete Brand Identity",
      price: "£1,299",
      description: "Comprehensive branding solution for your business identity.",
      features: [
        "Logo Design (3 concepts)",
        "Brand Guidelines",
        "Business Cards",
        "Letterhead Design",
        "Social Media Kit",
        "Brand Strategy"
      ],
      popular: false
    }
  },

  // Meta Information
  META: {
    HOME: {
      title: "Fintaxtech Ltd - Professional Digital Solutions",
      description: "Leading provider of mobile app development, website development, and company branding services. Based in Scotland, serving clients worldwide.",
      keywords: "mobile app development, website development, branding, digital solutions, Scotland",
      ogImage: "./src/images/og-image.jpg"
    },
    SERVICES: {
      title: "Our Services - Mobile Apps, Web Development & Branding",
      description: "Comprehensive digital services including mobile app development, website development, and company branding solutions.",
      keywords: "mobile apps, web development, branding, digital services",
      ogImage: "./src/images/og-services.jpg"
    },
    PORTFOLIO: {
      title: "Our Portfolio - Recent Projects & Case Studies",
      description: "Explore our recent projects including mobile apps, websites, and branding work for clients across various industries.",
      keywords: "portfolio, projects, case studies, mobile apps, websites, branding",
      ogImage: "./src/images/og-portfolio.jpg"
    },
    PACKAGES: {
      title: "Our Packages - Affordable Digital Solutions",
      description: "Choose from our carefully crafted packages for mobile app development, website development, and branding services.",
      keywords: "packages, pricing, mobile apps, web development, branding",
      ogImage: "./src/images/og-packages.jpg"
    },
    CONTACT: {
      title: "Get In Touch - Contact Fintaxtech Ltd",
      description: "Ready to start your project? Contact us for a free consultation and quote for your digital needs.",
      keywords: "contact, consultation, quote, mobile apps, web development, branding",
      ogImage: "./src/images/og-contact.jpg"
    }
  },

  // Hero Section Content
  HERO: {
  title: "Professional Digital Solutions",
  subtitle: "Transform your business with cutting-edge mobile apps, stunning websites, and compelling brand identities. We're Fintaxtech Ltd, your trusted partner in digital innovation.",
  primaryButton: "Get Started",
  // secondaryButton: "View Our Work",
  primaryButtonLink: "/contact.html",
  // secondaryButtonLink: "/portfolio.html"
  },

  // Section Headers
  SECTIONS: {
    SERVICES: {
      title: "Our Services",
      subtitle: "Comprehensive digital solutions tailored to your business needs"
    },
    PORTFOLIO: {
      title: "Recent Work",
      subtitle: "Explore our latest projects and see how we bring ideas to life"
    },
    PACKAGES: {
      title: "Our Packages",
      subtitle: "Choose the perfect package for your digital needs"
    },
    CTA: {
      title: "Ready to Get Started?",
      subtitle: "Let's discuss your project and bring your vision to life"
    }
  },

  // Legal Content
  LEGAL: {
    PRIVACY_POLICY: {
      lastUpdated: "2025-01-01",
      controller: "Fintaxtech Ltd",
      companyNumber: "SC807896",
      registeredOffice: "Dundee, Scotland, United Kingdom",
      contactEmail: "privacy@fintaxtech.co.uk"
    },
    TERMS_OF_SERVICE: {
      lastUpdated: "2025-01-01",
      governingLaw: "Scotland, United Kingdom",
      companyNumber: "SC807896"
    }
  },

  // Cookie Categories
  COOKIES: {
    NECESSARY: {
      name: "necessary",
      label: "Necessary Cookies",
      description: "Essential cookies required for the website to function properly.",
      required: true
    },
    ANALYTICS: {
      name: "analytics",
      label: "Analytics Cookies",
      description: "Help us understand how visitors interact with our website.",
      required: false
    },
    MARKETING: {
      name: "marketing",
      label: "Marketing Cookies",
      description: "Used to track visitors across websites for advertising purposes.",
      required: false
    }
  },

  // WhatsApp Configuration
  WHATSAPP: {
    MESSAGE: "Hi! I'm interested in your digital services. Can you help me?",
    BUTTON_TEXT: "Message Us",
    FLOATING_TEXT: "Whatsapp Now"
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConstants;
} else {
  window.AppConstants = AppConstants;
}
