/*
  SITE SETTINGS — Smart Home Estimator
  With the server running, edit these in the admin panel (/admin/ → Settings) instead: this file is only
  copied into the database on first start and used when the site runs without the server.
  Leave a value as "" to hide it.
*/
window.APP_CONFIG = {
  // Name shown in the top bar and the browser tab
  appName: "Smart Home Estimator",

  // Your company details. They appear on the summary page ("Talk to us")
  // and on every PDF estimate. Leave name empty to hide the company block.
  company: {
    name: "",            // e.g. "Your Company Ltd."
    tagline: "",         // e.g. "Smart home design & installation"
    phone: "",           // e.g. "+880 1XXX-XXXXXX"
    whatsapp: "",        // digits with country code, e.g. "8801XXXXXXXXX"
    email: "",           // e.g. "hello@yourcompany.com"
    website: "",         // e.g. "www.yourcompany.com"
    address: "",         // e.g. "House 00, Road 00, Gulshan 2, Dhaka"
    logo: ""             // path to a PNG or JPG, e.g. "images/logo.png" (square or wide, light background)
  },

  currency: "BDT",

  // Shown at the end of every PDF. Clients can edit their own copy in step 1.
  defaultNotes: "Prices are retail estimates in Bangladeshi Taka (BDT). Items marked \"Price on request\" are not included in the total. Final quotation may change after a site survey.",

  // Printed on the PDF as "Valid for N days from the estimate date". 0 hides it.
  estimateValidityDays: 30,

  // Show the "Ashfield Residence" example project to first-time visitors
  showExampleProject: true
};
