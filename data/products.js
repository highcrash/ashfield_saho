/*
  PRODUCT CATALOGUE — Smart Home Estimator
  ----------------------------------------
  With the estimator server running, products are edited in the admin panel (/admin/ → Products).
  This file seeds an empty database and serves the static-only mode; add new products from it to the
  live database with: cd smart-home-estimator/server && npm run import-catalog (never overwrites edits).
  Keep it valid JavaScript/JSON.

  groups[]   : the tabs in the product picker  { id, label }
  products[] : one entry per product
    id       unique id (keep it stable; saved client projects refer to it)
    group    one of the group ids above
    cat      category shown on cards and in the PDF
    name     product name
    blurb    one-line description
    specs    up to 3 short highlights
    power    adapter / power supply text
    unit     {"type":"qty"}  sold per piece
             {"type":"length","step":5}  client enters metres; billed in whole
                                         rolls of <step> metres (step 1 = per metre)
    img      image path (300x300 JPG recommended) or null
    code     supplier order code     model  manufacturer model
    price    RETAIL PRICE IN BDT (number), or null = "Price on request"
    options  (optional) choices for products with variants, e.g. finish / gangs
    variants (optional) one entry per combination: opt[] in the same order as
             options, with its own code, model and price

  Prices were calculated as ((Core Distributor USD x 127) + (weight kg x 700)) x 1.5
  on 10 Oct 2026. Several weights were estimates - see the project Excel file.
*/
window.CATALOG = {
 "updated": "2026-10-10",
 "currency": "BDT",
 "groups": [
  {
   "id": "hubs",
   "label": "Hubs & Kits"
  },
  {
   "id": "panels",
   "label": "Control Panels"
  },
  {
   "id": "switches",
   "label": "Switches & Dimmers"
  },
  {
   "id": "lighting",
   "label": "Lighting"
  },
  {
   "id": "drivers",
   "label": "LED Drivers"
  },
  {
   "id": "security",
   "label": "Security"
  },
  {
   "id": "sensors",
   "label": "Sensors"
  },
  {
   "id": "climate",
   "label": "Climate & Shading"
  },
  {
   "id": "acc",
   "label": "Accessories"
  }
 ],
 "products": [
  {
   "id": "p2",
   "group": "hubs",
   "cat": "Packages",
   "name": "Smart Home Starter Set",
   "blurb": "Start a smart home from one box: Smart Station hub, door/window, motion and environment sensors, plus a scene clicker.",
   "specs": [
    "5 devices",
    "CoSS wireless",
    "App + voice"
   ],
   "power": "Smart Station DC 5V; sensors CR2450 battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p2.jpg",
   "code": "10.00205",
   "model": "LS215",
   "price": 15264
  },
  {
   "id": "p18",
   "group": "hubs",
   "cat": "Gateway",
   "name": "Smart Station (Z-Wave/EU)",
   "blurb": "The heart of the LifeSmart system. Links up to 500 sensors, switches and panels and bridges Z-Wave devices.",
   "specs": [
    "500 devices",
    "CoSS 400 m",
    "Z-Wave EU"
   ],
   "power": "DC 5V (CN/UK/US/EU/JP/AU plug)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p18.jpg",
   "code": "11.00524",
   "model": "LS082WH",
   "price": 9270
  },
  {
   "id": "p32",
   "group": "hubs",
   "cat": "Gateway",
   "name": "DEFED Smart Station",
   "blurb": "Control centre for the DEFED alarm system. Keeps arming and tamper alerts running even when the internet drops.",
   "specs": [
    "CoSS 500 m",
    "4G / Wi-Fi 5 GHz",
    "18 h backup"
   ],
   "power": "DC 12V 1A / PoE / 2 x 18650 backup battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p32.jpg",
   "code": "11.00981",
   "model": "LS205WH",
   "price": 15917
  },
  {
   "id": "p42",
   "group": "hubs",
   "cat": "Gateway",
   "name": "DEFED Smart Station PRO(WiFi+4G EU)",
   "blurb": "4G-enabled super gateway with Matter and Apple HomeKit support. 800 m range with antenna, up to 800 sub-devices.",
   "specs": [
    "Matter + HomeKit",
    "CoSS 800 m",
    "4G failover"
   ],
   "power": "DC 12V 1A / PoE / 2 x 18650 battery (sold separately)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p42.jpg",
   "code": "11.01488",
   "model": "LS205WH",
   "price": 31504
  },
  {
   "id": "p11",
   "group": "hubs",
   "cat": "Integration Module",
   "name": "General Controller",
   "blurb": "Brings third-party 12/24V dry-contact switches, sensors and loads - garage doors, pumps, lights - into the smart system.",
   "specs": [
    "5 control modes",
    "3 A load",
    "CoSS 200 m"
   ],
   "power": "DC 12V / 24V (external supply)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p11.jpg",
   "code": "11.00057",
   "model": "LS143",
   "price": 4815
  },
  {
   "id": "p39",
   "group": "panels",
   "cat": "Smart Dashboard",
   "name": "Nature (Smart Control Panel)",
   "blurb": "Flagship 10.25-inch control centre with aircraft-aluminium frame and four physical scene keys. Smart-home control, video intercom and property services in one panel.",
   "specs": [
    "10.25\" 1920x720",
    "Wi-Fi + Ethernet",
    "Wall or desk"
   ],
   "power": "AC 100-240V (hard-wired); PoE 48V optional",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p39.jpg",
   "code": "11.01193",
   "model": "LS148",
   "price": 77333
  },
  {
   "id": "n7",
   "group": "panels",
   "cat": "Smart Dashboard",
   "name": "Nature 7 PRO",
   "blurb": "7-inch in-wall panel with four scene keys. Controls lights, curtains, climate and security and works even offline.",
   "specs": [
    "7\" IPS",
    "Cortex-A55",
    "Zigbee + CoSS"
   ],
   "power": "DC 12V or PoE 48V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/n7.jpg",
   "code": "11.00950",
   "model": "LS227",
   "price": 48367,
   "options": [
    {
     "label": "Version",
     "choices": [
      "Standard (matte grey)",
      "White · 433 MHz"
     ]
    }
   ],
   "variants": [
    {
     "opt": [
      "Standard (matte grey)"
     ],
     "code": "11.00950",
     "model": "LS227",
     "price": 48367
    },
    {
     "opt": [
      "White · 433 MHz"
     ],
     "code": "11.01441",
     "model": "LS227",
     "price": 48367
    }
   ]
  },
  {
   "id": "p28",
   "group": "panels",
   "cat": "Smart Dashboard",
   "name": "Nature Mini L (White 1 way)",
   "blurb": "4-inch panel for 120-type boxes: a light switch for up to 3 circuits, scene keys, weather and thermostat in one.",
   "specs": [
    "4\" touchscreen",
    "16 A relays",
    "Wi-Fi 5 GHz"
   ],
   "power": "AC 100-240V (hard-wired)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p28.jpg",
   "code": "11.00879",
   "model": "LS218-WH1",
   "price": 19779
  },
  {
   "id": "p38",
   "group": "panels",
   "cat": "Smart Dashboard",
   "name": "Nature X PRO(EU Adapter)",
   "blurb": "Desktop hub with a crown knob: controls lights, curtains, climate and music, and monitors air quality.",
   "specs": [
    "PM2.5 / PM10 / CO2",
    "Zigbee 3.0 gateway",
    "DC 5V USB-C"
   ],
   "power": "DC 5V 2A USB-C (EU adapter)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p38.jpg",
   "code": "11.01171",
   "model": "LS280-AQ",
   "price": 31425
  },
  {
   "id": "blend",
   "group": "switches",
   "cat": "Gang Switch",
   "name": "BLEND Switch PRO (Black)",
   "blurb": "Award-winning frameless switch with a glowing gap light in 16 million colours. Live+Neutral and no-neutral versions.",
   "specs": [
    "16 A relay",
    "86-type box",
    "HomeKit / Alexa / Google"
   ],
   "power": "AC 100-240V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/blend.jpg",
   "code": "10.00692",
   "model": "LS240-BL1",
   "price": 4910,
   "options": [
    {
     "label": "Gangs",
     "choices": [
      "1-gang",
      "2-gang",
      "3-gang"
     ]
    },
    {
     "label": "Wiring",
     "choices": [
      "Live + Neutral",
      "No neutral (single-live)"
     ]
    }
   ],
   "variants": [
    {
     "opt": [
      "1-gang",
      "Live + Neutral"
     ],
     "code": "10.00692",
     "model": "LS240-BL1",
     "price": 4910,
     "cat": "1 Gang Switch",
     "power": "AC 100-240V"
    },
    {
     "opt": [
      "2-gang",
      "Live + Neutral"
     ],
     "code": "10.00693",
     "model": "LS240-BL2",
     "price": 5291,
     "cat": "2 Gang Switch",
     "power": "AC 100-240V"
    },
    {
     "opt": [
      "3-gang",
      "Live + Neutral"
     ],
     "code": "10.00694",
     "model": "LS240-BL3",
     "price": 5672,
     "cat": "3 Gang Switch",
     "power": "AC 100-240V"
    },
    {
     "opt": [
      "1-gang",
      "No neutral (single-live)"
     ],
     "code": "10.00685",
     "model": "LS240-LB1",
     "price": 4910,
     "cat": "1 Gang Switch",
     "power": "AC 90-250V (live only, no neutral)"
    },
    {
     "opt": [
      "2-gang",
      "No neutral (single-live)"
     ],
     "code": "10.00686",
     "model": "LS240-LB2",
     "price": 5291,
     "cat": "2 Gang Switch",
     "power": "AC 90-250V (live only, no neutral)"
    },
    {
     "opt": [
      "3-gang",
      "No neutral (single-live)"
     ],
     "code": "10.00687",
     "model": "LS240-LB3",
     "price": 5672,
     "cat": "3 Gang Switch",
     "power": "AC 90-250V (live only, no neutral)"
    }
   ]
  },
  {
   "id": "p17",
   "group": "switches",
   "cat": "Dimmer & Motion Sensor Switch",
   "name": "Dimmer & Motion Sensor Switch",
   "blurb": "Single-gang dimmer with built-in motion and light sensors: lights come on when you arrive or as it gets dark.",
   "specs": [
    "Triac 250 W",
    "120-type box",
    "Motion + lux"
   ],
   "power": "AC 100-240V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p17.jpg",
   "code": "11.00482",
   "model": "LS174",
   "price": 6402
  },
  {
   "id": "p26",
   "group": "switches",
   "cat": "Dimmer Controller (light)",
   "name": "Two Channel Dimmer Controller (0-10V)",
   "blurb": "Two-channel 0-10V controller that puts standard 0-10V LED drivers under smart dimming and colour-temperature control.",
   "specs": [
    "2 channels",
    "0-10V output",
    "CoSS 200 m"
   ],
   "power": "AC 100-240V",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "11.00721",
   "model": "LS255",
   "price": 4650
  },
  {
   "id": "p40",
   "group": "switches",
   "cat": "Dimmer Controller (light)",
   "name": "CV Dimming Controller",
   "blurb": "Inline constant-voltage controller for dual-white LED systems with ultra-smooth PWM dimming.",
   "specs": [
    "DC 12-48V",
    "6.25 A",
    "1/10,000 dimming"
   ],
   "power": "DC 12-48V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p40.jpg",
   "code": "11.01366",
   "model": "LS265",
   "price": 4815
  },
  {
   "id": "p12",
   "group": "switches",
   "cat": "Light Strip Controller",
   "name": "Light Strip Controller",
   "blurb": "Makes CCT or RGBW LED strips smart: on/off, brightness and colour temperature from app, panel or voice.",
   "specs": [
    "DC 12/24V",
    "2 x 2.5 A",
    "CoSS 100 m"
   ],
   "power": "DC 12V / 24V (from strip power supply)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p12.jpg",
   "code": "11.00090",
   "model": "LS012",
   "price": 3253
  },
  {
   "id": "p71",
   "group": "lighting",
   "cat": "Downlight",
   "name": "Ti Anti-dazzle Round Downlight (ZX/75/12W/CoSS/MW/25°/FS)",
   "blurb": "Full-spectrum anti-glare downlight with Ra 98 colour, tunable white and flicker-free deep dimming.",
   "specs": [
    "12 W / 75 mm",
    "2700-6000 K",
    "CRI up to 98"
   ],
   "power": "AC100-250V 50/60Hz",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p71.jpg",
   "code": "11.02033",
   "model": "HDL7512-CW",
   "price": 7068
  },
  {
   "id": "p33",
   "group": "lighting",
   "cat": "Magnetic Track Flood Linear",
   "name": "Ti 7W Flood Linear Module",
   "blurb": "Compact magnetic-track flood module for even wall-wash lighting.",
   "specs": [
    "7 W / 294 mm",
    "110 deg beam",
    "24V DC"
   ],
   "power": "24V/DC",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p33.jpg",
   "code": "11.01015",
   "model": "SMLL3007",
   "price": 5025
  },
  {
   "id": "p34",
   "group": "lighting",
   "cat": "Magnetic Track Flood Linear",
   "name": "Ti 15W Flood Linear Module",
   "blurb": "Long magnetic-track flood module for wide, even ambient light.",
   "specs": [
    "15 W / 574 mm",
    "110 deg beam",
    "48V DC"
   ],
   "power": "48V/DC",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p34.jpg",
   "code": "11.01016",
   "model": "SMLL6015",
   "price": 6759
  },
  {
   "id": "p35",
   "group": "lighting",
   "cat": "Magnetic track lighting",
   "name": "Ti 12W Accent Linear Module",
   "blurb": "Grille-style accent module for crisp, glare-controlled track lighting.",
   "specs": [
    "12 W",
    "Black",
    "24V DC"
   ],
   "power": "24V/DC",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p35.jpg",
   "code": "11.01018",
   "model": "SMLS1212",
   "price": 6602
  },
  {
   "id": "p36",
   "group": "lighting",
   "cat": "Light Strip",
   "name": "Ti Tunable White Bright Light Strip（120D/24V/IP20）",
   "blurb": "High-brightness tunable-white strip, 8 mm wide, for coves and profiles.",
   "specs": [
    "60+60 LED/m",
    "2700-6500 K",
    "Ra > 90"
   ],
   "power": "24V/DC",
   "unit": {
    "type": "length",
    "step": 5
   },
   "img": "images/products/p36.jpg",
   "code": "11.01071",
   "model": "KU-2835-120D-24V-CCT",
   "price": 2634
  },
  {
   "id": "p37",
   "group": "lighting",
   "cat": "Light Strip",
   "name": "Ti Tunable White Ultra-Bright Light Strip（240D/24V/IP20）",
   "blurb": "Ultra-bright tunable-white strip for primary linear lighting.",
   "specs": [
    "120+120 LED/m",
    "1400 lm/m",
    "Ra > 90"
   ],
   "power": "24V/DC",
   "unit": {
    "type": "length",
    "step": 5
   },
   "img": "images/products/p37.jpg",
   "code": "11.01072",
   "model": "KU-2835-240D-24V-CCT",
   "price": 3809
  },
  {
   "id": "p56",
   "group": "lighting",
   "cat": "Light Strip (RGB)",
   "name": "BLEND Light Strip RGBW (2 m)",
   "blurb": "RGB + white strip with 16 million colours and dynamic effects.",
   "specs": [
    "2 m roll",
    "60 LED/m",
    "DC 24V"
   ],
   "power": "DC 24V",
   "unit": {
    "type": "length",
    "step": 2
   },
   "img": "images/products/p56.jpg",
   "code": "81.00016",
   "model": "LS065",
   "price": 2377
  },
  {
   "id": "p63",
   "group": "lighting",
   "cat": "Light Strip (RGB)",
   "name": "YAG RGBCW 10M Bright LED Strip (ZX/60D/24V/RGBCW/IP20)",
   "blurb": "5-in-1 RGB + tunable-white strip for colour scenes and everyday white light.",
   "specs": [
    "10 m roll",
    "5050 RGBCW",
    "DC 24V"
   ],
   "power": "24V/DC",
   "unit": {
    "type": "length",
    "step": 10
   },
   "img": null,
   "code": "11.02141",
   "model": "YAG-5050-60D-24V",
   "price": 7850
  },
  {
   "id": "p44",
   "group": "drivers",
   "cat": "Dimming LED Driver",
   "name": "CV Dimming LED Driver (150W/CoSS)",
   "blurb": "Smart 24V constant-voltage driver with built-in CoSS dimming for strips and track lights.",
   "specs": [
    "150 W",
    "AC 220V in",
    "PF 0.98"
   ],
   "power": "Input AC 220V; output DC 24V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p44.jpg",
   "code": "11.01592",
   "model": "LS262A15",
   "price": 9978
  },
  {
   "id": "p45",
   "group": "drivers",
   "cat": "Dimming LED Driver",
   "name": "CV Dimming LED Driver (240W/CoSS)",
   "blurb": "High-power smart 24V driver for long strip runs and track systems.",
   "specs": [
    "240 W",
    "DC 24V out",
    "0.1 % dimming"
   ],
   "power": "AC input; output DC 24V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p45.jpg",
   "code": "11.01747",
   "model": "LS262A24",
   "price": 13236
  },
  {
   "id": "p61",
   "group": "drivers",
   "cat": "LED CV DRIVER (NON SMART)",
   "name": "150W 24V LED CV Driver",
   "blurb": "Non-smart 24V power supply for constant-voltage LED loads.",
   "specs": [
    "150 W",
    "AC 200-240V",
    "Aluminium"
   ],
   "power": "AC 200-240V",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "11.01383",
   "model": "CT150L-24",
   "price": 2463
  },
  {
   "id": "p62",
   "group": "drivers",
   "cat": "LED CV DRIVER (NON SMART)",
   "name": "Halo Wide Input Voltage LED CV Driver (200W/24V/CE)",
   "blurb": "Fully potted, wide-input 24V driver resistant to moisture and salt spray.",
   "specs": [
    "200 W",
    "PF >= 0.95",
    "3-year warranty"
   ],
   "power": "AC110-265V 50/60Hz",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "11.02076",
   "model": "HXS-HP200W-24V",
   "price": null
  },
  {
   "id": "c200",
   "group": "security",
   "cat": "Smart Lock",
   "name": "Smart Door Lock C200",
   "blurb": "Grip-to-open fingerprint lock: the sensor sits on the handle pivot. Seven ways to unlock, child lock and anti-tamper alarm.",
   "specs": [
    "Fingerprint < 0.5 s",
    "4 x AA",
    "Doors 40-120 mm"
   ],
   "power": "4 x AA batteries (Type-C emergency power)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/c200.jpg",
   "code": "10.00524",
   "model": "C200",
   "price": 23153,
   "options": [
    {
     "label": "Finish",
     "choices": [
      "Black",
      "Golden"
     ]
    },
    {
     "label": "Lock body",
     "choices": [
      "24 mm faceplate",
      "30 mm faceplate"
     ]
    },
    {
     "label": "Hook",
     "choices": [
      "No hook",
      "With hook"
     ]
    }
   ],
   "variants": [
    {
     "opt": [
      "Black",
      "24 mm faceplate",
      "No hook"
     ],
     "code": "10.00524",
     "model": "C200",
     "price": 23153
    },
    {
     "opt": [
      "Golden",
      "24 mm faceplate",
      "No hook"
     ],
     "code": "10.00525",
     "model": "C200",
     "price": 23153
    },
    {
     "opt": [
      "Black",
      "24 mm faceplate",
      "With hook"
     ],
     "code": "10.00526",
     "model": "C200",
     "price": 23153
    },
    {
     "opt": [
      "Golden",
      "24 mm faceplate",
      "With hook"
     ],
     "code": "10.00527",
     "model": "C200",
     "price": 23153
    },
    {
     "opt": [
      "Black",
      "30 mm faceplate",
      "No hook"
     ],
     "code": "10.00528",
     "model": "C200",
     "price": 23153
    },
    {
     "opt": [
      "Golden",
      "30 mm faceplate",
      "No hook"
     ],
     "code": "10.00529",
     "model": "C200",
     "price": 23153
    },
    {
     "opt": [
      "Black",
      "30 mm faceplate",
      "With hook"
     ],
     "code": "10.00530",
     "model": "C200",
     "price": 23153
    },
    {
     "opt": [
      "Golden",
      "30 mm faceplate",
      "With hook"
     ],
     "code": "10.00531",
     "model": "C200",
     "price": 23153
    }
   ]
  },
  {
   "id": "p70",
   "group": "security",
   "cat": "Smart Lock",
   "name": "Smart Door Lock X200",
   "blurb": "Next-generation biometric lock with dual-band communication and local processing for privacy.",
   "specs": [
    "Biometric",
    "Dual-band",
    "Local processing"
   ],
   "power": "Battery",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "11.02286",
   "model": "X200",
   "price": 54395
  },
  {
   "id": "p24",
   "group": "security",
   "cat": "Indoor Camera",
   "name": "Indoor Camera",
   "blurb": "1080P pan-tilt camera that sees the whole room, with two-way talk and night vision.",
   "specs": [
    "345 deg pan",
    "IR 8 m",
    "Wi-Fi"
   ],
   "power": "DC 5V (US plug)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p24.jpg",
   "code": "11.00717",
   "model": "LS258",
   "price": 6899
  },
  {
   "id": "p43",
   "group": "security",
   "cat": "Indoor Camera",
   "name": "Indoor Camera（Optional adapter）",
   "blurb": "5MP pan-tilt camera with AI human detection, abnormal-sound alerts and an active-defence siren.",
   "specs": [
    "5MP 2688x1664",
    "Human detection",
    "H.265"
   ],
   "power": "DC 5V 1A (adapter optional)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p43.jpg",
   "code": "11.01588",
   "model": "LS288",
   "price": 8589
  },
  {
   "id": "p25",
   "group": "security",
   "cat": "Outdoor Camera",
   "name": "Outdoor Camera",
   "blurb": "Weatherproof 1080P camera with sound-and-light deterrent and two-way talk.",
   "specs": [
    "IP66",
    "IR 15 m",
    "Wi-Fi / PoE"
   ],
   "power": "DC 12V (US plug) or PoE",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p25.jpg",
   "code": "11.00719",
   "model": "LS259",
   "price": 7659
  },
  {
   "id": "p22",
   "group": "security",
   "cat": "Key Fob",
   "name": "DEFED Key Fob",
   "blurb": "Four-button remote to arm, disarm and trigger scenes from your key ring.",
   "specs": [
    "800 m range",
    "10-yr battery",
    "LED feedback"
   ],
   "power": "CR2450 battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p22.jpg",
   "code": "11.00683",
   "model": "LS201WH",
   "price": 1925
  },
  {
   "id": "p23",
   "group": "security",
   "cat": "Door/Window Sensor",
   "name": "DEFED Door/Window Sensor",
   "blurb": "Slim security-grade contact with temperature sensing and tamper alarm.",
   "specs": [
    "800 m range",
    "10-yr battery",
    "Tamper alert"
   ],
   "power": "CR123A battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p23.jpg",
   "code": "11.00684",
   "model": "LS202WH",
   "price": 2618
  },
  {
   "id": "p27",
   "group": "security",
   "cat": "Human Motion Sensor",
   "name": "DEFED Motion Sensor",
   "blurb": "Professional PIR detector for the DEFED alarm, accurate even in warm rooms.",
   "specs": [
    "12 m / 90 deg",
    "7-yr battery",
    "Tamper alert"
   ],
   "power": "CR123A battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p27.jpg",
   "code": "11.00725",
   "model": "LS203WH",
   "price": 3259
  },
  {
   "id": "p13",
   "group": "sensors",
   "cat": "Door/Window Sensor",
   "name": "Cube Door/Window Sensor",
   "blurb": "Stick-on magnetic and vibration sensor that also works as a scene button.",
   "specs": [
    "CR2450",
    "CoSS 100 m",
    "Tool-free install"
   ],
   "power": "CR2450 battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p13.jpg",
   "code": "11.00246",
   "model": "LS058WH",
   "price": 2402
  },
  {
   "id": "p20",
   "group": "sensors",
   "cat": "Water Leak Sensor",
   "name": "Water Leak Sensor",
   "blurb": "Early warning for leaks and pooling water - under sinks, near heaters and washing machines.",
   "specs": [
    "Probe sensor",
    "CR2450",
    "24/7 alerts"
   ],
   "power": "CR2450 battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p20.jpg",
   "code": "11.00573",
   "model": "LS064WH",
   "price": 2890
  },
  {
   "id": "p21",
   "group": "sensors",
   "cat": "Gas Sensor",
   "name": "Gas Sensor",
   "blurb": "Detects methane, natural gas and biogas leaks with an instant app alert and loud siren.",
   "specs": [
    "300-10k ppm",
    "> 70 dB alarm",
    "DC 5V"
   ],
   "power": "DC 5V Micro-USB (CN/UK/US/EU/JP/AU plug)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p21.jpg",
   "code": "11.00575",
   "model": "LS086WH",
   "price": 4630
  },
  {
   "id": "p14",
   "group": "sensors",
   "cat": "Climate Sensor",
   "name": "Cube Environmental Sensor",
   "blurb": "Temperature, humidity and light at a glance on a crisp LCD, logged to the app.",
   "specs": [
    "LCD display",
    "3 sensors",
    "CR2450"
   ],
   "power": "CR2450 battery",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p14.jpg",
   "code": "11.00248",
   "model": "LS063WH",
   "price": 2883
  },
  {
   "id": "p15",
   "group": "sensors",
   "cat": "Climate Sensor",
   "name": "Formaldehyde Sensor",
   "blurb": "Watches indoor formaldehyde (HCHO) levels and alerts the app when they rise.",
   "specs": [
    "HCHO",
    "App alerts",
    "DC 5V"
   ],
   "power": "DC 5V Micro-USB (CN/UK/US/EU/JP/AU plug)",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "11.00321",
   "model": "LS087WH",
   "price": 10535
  },
  {
   "id": "p29",
   "group": "sensors",
   "cat": "Climate Sensor",
   "name": "In-wall Air Quality Detector(ZigBee)",
   "blurb": "In-wall air-quality monitor with live PM2.5, temperature and humidity readout.",
   "specs": [
    "PM2.5 0-999",
    "TFT screen",
    "ZigBee 3.0"
   ],
   "power": "AC 100-240V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p29.jpg",
   "code": "11.00886",
   "model": "PMT300-S-ZTN",
   "price": 17326
  },
  {
   "id": "p31",
   "group": "climate",
   "cat": "Air-conditioning Gateway VRF",
   "name": "Smart Central Air-conditioning Gateway",
   "blurb": "One device controls every indoor unit of a central VRF air-conditioning system.",
   "specs": [
    "All indoor units",
    "19-30 C",
    "DC 12V"
   ],
   "power": "DC 12V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p31.jpg",
   "code": "",
   "model": "LS175",
   "price": null
  },
  {
   "id": "p19",
   "group": "climate",
   "cat": "Universal Remote Controller",
   "name": "SPOT Universal Remote Controller (CoSS)",
   "blurb": "360-degree IR remote that makes TVs and air-conditioners smart - with a colour night light.",
   "specs": [
    "9 IR LEDs",
    "16M colours",
    "DC 5V"
   ],
   "power": "DC 5V Micro-USB (CN/UK/US/EU/JP/AU plug)",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p19.jpg",
   "code": "11.00572",
   "model": "LS136",
   "price": 4464
  },
  {
   "id": "p16",
   "group": "climate",
   "cat": "Smart Curtain",
   "name": "Smart Curtain Motor",
   "blurb": "Motorises standard curtains with precise 0-100 % positioning and schedules.",
   "specs": [
    "50 kg load",
    "8 m track",
    "AC 100-240V"
   ],
   "power": "AC 100-240V",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p16.jpg",
   "code": "11.00389",
   "model": "LS133WH",
   "price": 13176
  },
  {
   "id": "p59",
   "group": "acc",
   "cat": "Accessory",
   "name": "HD 30*240 6068 lock body (with hook)",
   "blurb": "Standard 6068 mortise lock body, 30 x 240 mm faceplate, with hook. Every smart door lock needs one lock body.",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p59.jpg",
   "code": "82.00066",
   "model": "/",
   "price": null
  },
  {
   "id": "p60",
   "group": "acc",
   "cat": "Accessory",
   "name": "HD 30*240 6068 lock body (without hook)",
   "blurb": "Standard 6068 mortise lock body, 30 x 240 mm faceplate, without hook. Every smart door lock needs one lock body.",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p60.jpg",
   "code": "82.00074",
   "model": "/",
   "price": null
  },
  {
   "id": "p47",
   "group": "acc",
   "cat": "Accessory",
   "name": "Silent Curtain Track (Straight)",
   "blurb": "Straight guide rail for the Silent Track Curtain Motor (magnetic-levitation silent track).",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p47.jpg",
   "code": "52.00243",
   "model": "/",
   "price": 91
  },
  {
   "id": "p48",
   "group": "acc",
   "cat": "Accessory",
   "name": "Smart Curtain Guide Track（1Meter）",
   "blurb": "Guide rail for Smart Curtain Motor",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "length",
    "step": 1
   },
   "img": "images/products/p48.jpg",
   "code": "52.00314",
   "model": "/",
   "price": 2811
  },
  {
   "id": "p50",
   "group": "acc",
   "cat": "Accessory",
   "name": "Three piece set of DC Tubular Motor(V2) installation",
   "blurb": "Install a three piece set, including tail plug (TP35), motor bracket set (TP35), and bracket (TP35)",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p50.jpg",
   "code": "59.00060",
   "model": "/",
   "price": 730
  },
  {
   "id": "p51",
   "group": "acc",
   "cat": "Accessory",
   "name": "DC Tubular Motor(V2)-25 Accessory",
   "blurb": "Installation accessory for the DC Tubular Motor (V2), 25 mm version.",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "59.00068",
   "model": "/",
   "price": 719
  },
  {
   "id": "p49",
   "group": "acc",
   "cat": "Accessory",
   "name": "SPOT Mini wall mount screw kit",
   "blurb": "Screw kit for wall-mounting the SPOT Mini.",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p49.jpg",
   "code": "59.00039",
   "model": "/",
   "price": 1916
  },
  {
   "id": "p54",
   "group": "acc",
   "cat": "Accessory",
   "name": "SPOT Mini wall mount bracket",
   "blurb": "Wall-mount bracket for the SPOT Mini.",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p54.jpg",
   "code": "66.00029",
   "model": "/",
   "price": 402
  },
  {
   "id": "p52",
   "group": "acc",
   "cat": "Accessory",
   "name": "YAG Spotlight Reflector (75/Matt White)",
   "blurb": "YAG-series spotlight reflector cup for 75 mm-aperture spotlights, matt white. Easy to swap; automotive-grade paint finish.",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p52.jpg",
   "code": "62.00358",
   "model": "/",
   "price": 206
  },
  {
   "id": "p53",
   "group": "acc",
   "cat": "Accessory",
   "name": "YAG Spotlight Reflector (75/Matt Black)",
   "blurb": "YAG-series spotlight reflector cup for 75 mm-aperture spotlights, matt black. Easy to swap; automotive-grade paint finish.",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": "images/products/p53.jpg",
   "code": "62.00359",
   "model": "/",
   "price": 206
  },
  {
   "id": "p46",
   "group": "acc",
   "cat": "Accessory",
   "name": "Light Strip Connection Pin",
   "blurb": "Light Strip Connection Pin",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "24.90069",
   "model": "/",
   "price": 196
  },
  {
   "id": "p55",
   "group": "acc",
   "cat": "Accessory",
   "name": "Light Strip Connect Cable",
   "blurb": "Light Strip Connect Cable",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "70.00013",
   "model": "/",
   "price": 68
  },
  {
   "id": "p58",
   "group": "acc",
   "cat": "Accessory",
   "name": "Quicklink Curtain Rail Connector (90°)",
   "blurb": "Quicklink Curtain Rail Connector (90°)",
   "specs": [],
   "power": "/",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "81.00118",
   "model": "/",
   "price": 1418
  },
  {
   "id": "p57",
   "group": "acc",
   "cat": "Accessory",
   "name": "24V 3A CN adapter",
   "blurb": "24V 3A CN adapter",
   "specs": [],
   "power": "Only CN Standard",
   "unit": {
    "type": "qty"
   },
   "img": null,
   "code": "81.00042",
   "model": "/",
   "price": 1467
  }
 ]
};
