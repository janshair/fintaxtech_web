# 🎯 Client Content Management Guide

## Easy Website Content Updates

This guide will help you easily update your website content without any technical knowledge. All you need to do is edit the `src/AppConstants.js` file.

## 📁 How to Edit Content

### Step 1: Open the AppConstants.js File
1. Navigate to the `src` folder
2. Open `AppConstants.js` in any text editor (Notepad, TextEdit, VS Code, etc.)

### Step 2: Find the Section You Want to Edit
The file is organized into clear sections with comments like:
- `// Company Information`
- `// Services`
- `// Meta Information`
- `// Hero Section Content`

### Step 3: Make Your Changes
Simply edit the text between the quotes. For example:
```javascript
// Change this:
title: "Professional Digital Solutions",

// To this:
title: "Your New Title Here",
```

### Step 4: Save the File
Save the file and refresh your website to see the changes.

## 📝 Content Sections You Can Edit

### 🏢 Company Information
```javascript
COMPANY: {
  NAME: "Fintaxtech Ltd",                    // Your company name
  PHONE: "+447884594929",                    // Your phone number
  EMAIL: "info@fintaxtech.co.uk",              // Your email address
  REGISTERED_OFFICE: "Dundee, Scotland, UK"  // Your business address
}
```

### 🎯 Hero Section (Homepage)
```javascript
HERO: {
  title: "Professional Digital Solutions",   // Main headline
  subtitle: "Transform your business...",    // Subtitle text
  primaryButton: "Get Started",              // Button text
  secondaryButton: "View Our Work"           // Second button text
}
```

### 🛠️ Services
```javascript
SERVICES: {
  MOBILE_APPS: {
    title: "Mobile App Development",         // Service title
    description: "Custom iOS and Android...", // Service description
    features: [                              // List of features
      "Native iOS & Android",
      "Cross-platform solutions",
      "UI/UX Design",
      "App Store optimization"
    ]
  }
}
```

### 💰 Packages & Pricing
```javascript
PACKAGES: {
  COMPANY_SETUP: {
    title: "Company Setup",                  // Package name
    subtitle: "Branding + Static Website",   // Package subtitle
    price: "£2,499",                        // Package price
    description: "Complete business setup...", // Package description
    features: [                             // Package features
      "Custom Logo Design",
      "Brand Guidelines",
      "5-Page Static Website"
    ]
  }
}
```

### 📱 Contact Information
```javascript
WHATSAPP: {
  MESSAGE: "Hi! I'm interested in your digital services. Can you help me?",
  BUTTON_TEXT: "Message Us",
  FLOATING_TEXT: "Contact Now"
}
```

## ⚠️ Important Rules

### ✅ DO:
- Only edit text between quotes
- Keep the same structure (commas, brackets, etc.)
- Test your changes by refreshing the website
- Make a backup copy before making major changes

### ❌ DON'T:
- Delete commas, brackets, or quotes
- Change the structure of the file
- Edit anything outside the quotes
- Remove entire sections

## 🔧 Common Edits

### Change Company Name
Find: `NAME: "Fintaxtech Ltd"`
Change to: `NAME: "Your New Company Name"`

### Update Phone Number
Find: `PHONE: "+447884594929"`
Change to: `PHONE: "+44 YOUR NEW NUMBER"`

### Update Email Address
Find: `EMAIL: "info@fintaxtech.co.uk"`
Change to: `EMAIL: "your-new-email@domain.com"`

### Change Service Descriptions
Find the service you want to edit and change the `description` text:
```javascript
description: "Your new service description here",
```

### Update Package Prices
Find the package and change the `price`:
```javascript
price: "£1,999",  // Your new price
```

## 🆘 Need Help?

If you need assistance with content updates, contact your web developer with:
1. The specific text you want to change
2. Where you want it to appear on the website
3. Any questions about the editing process

## 📋 Quick Reference

| What to Change | Where to Find It | Example |
|----------------|------------------|---------|
| Company Name | `COMPANY.NAME` | `"Your Company Ltd"` |
| Phone Number | `COMPANY.PHONE` | `"+44 1234 567890"` |
| Email Address | `COMPANY.EMAIL` | `"info@yourcompany.com"` |
| Main Headline | `HERO.title` | `"Your Main Message"` |
| Service Descriptions | `SERVICES.SERVICE_NAME.description` | `"Your service description"` |
| Package Prices | `PACKAGES.PACKAGE_NAME.price` | `"£999"` |
| WhatsApp Message | `WHATSAPP.MESSAGE` | `"Your custom message"` |

---

**Remember**: Always save the file after making changes and refresh your website to see the updates!
