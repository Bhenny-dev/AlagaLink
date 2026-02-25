# AlagaLink Images Directory

This directory contains all local images used in the AlagaLink application for efficient loading and better performance.

## Directory Structure

```
images/
├── programs/
│   ├── assistive-devices.svg
│   ├── livelihood-hub.svg
│   └── medical-services.svg
└── lost-found/
    └── community-safety.svg
```

## Current State

All images are currently SVG placeholders with relevant icons and gradients. These are fully functional and display properly, but you may want to replace them with actual photographs.

## How to Replace with Real Photos

### 1. **Assistive Devices** (`programs/assistive-devices.svg`)
- **Current**: SVG placeholder with wheelchair, hearing aid, and mobility tool icons
- **Replacement**: Any of these free image sources:
  - Unsplash: Search for "wheelchair" or "assistive devices"
  - Pexels: Search for "medical devices" or "accessibility"
  - Pixabay: Search for "wheelchair accessibility"
- **Recommended format**: JPG or PNG
- **Dimensions**: 800x600px or wider
- **Steps to replace**:
  1. Download/use your image
  2. Rename to `assistive-devices.jpg` (or .png)
  3. Replace the .svg file with your image file
  4. Update the LandingPage.tsx image path from `.svg` to `.jpg` (or your chosen format)

### 2. **Livelihood Hub** (`programs/livelihood-hub.svg`)
- **Current**: SVG placeholder with weaving loom, hands, and digital literacy icons
- **Replacement**: Search for:
  - "traditional weaving workshop"
  - "livelihood training"
  - "community workshop"
  - "ethnic craft"
- **Recommended**: Free image sites (Unsplash, Pexels, Pixabay)
- **Format**: JPG, PNG
- **Dimensions**: 800x600px or wider

### 3. **Medical Services** (Not yet integrated but available as `programs/medical-services.svg`)
- **Current**: SVG placeholder with medical cross, stethoscope, and medicine bottle
- **Replacement**: Search for:
  - "medical healthcare"
  - "doctor consultation"
  - "health services"
  - "medicine pharmacy"
- **Format**: JPG, PNG
- **Dimensions**: 800x600px or wider

### 4. **Community Safety** (`lost-found/community-safety.svg`)
- **Current**: SVG placeholder with shield, alert bell, and community icons
- **Replacement**: Search for:
  - "community safety"
  - "alert system"
  - "public safety"
  - "community watch"
- **Format**: JPG, PNG
- **Dimensions**: 800x600px or wider

## Steps to Add Real Photos

1. **Acquire the image**
   - Download from free resources (Unsplash, Pexels, Pixabay)
   - Or use your own photographs
   - Recommended size: 800x600px minimum (larger is fine)

2. **Save to appropriate folder**
   - `/public/images/programs/` for program-related images
   - `/public/images/lost-found/` for lost & found related images

3. **Update the component**
   - Find the image path in `LandingPage.tsx`
   - Change from `"/images/programs/assistive-devices.svg"` to `"/images/programs/assistive-devices.jpg"` (or your filename)

4. **Test**
   - Run `npm run dev`
   - Check that the image displays correctly

## Best Practices for Images

- **File Size**: Keep under 500KB for web optimization
- **Format**: JPG for photos, PNG for graphics with transparency
- **Dimensions**: 800x600px minimum, aspect ratio 4:3
- **Compression**: Use tools like TinyPNG or ImageOptim to compress
- **Accessibility**: Add descriptive alt text (already present in code)

## Current SVG Images

All current SVG files are hand-crafted with appropriate colors and styling:
- **Assistive Devices**: Blue (#1F4788) theme
- **Livelihood Hub**: Teal (#009688) theme
- **Medical Services**: Red (#D32F2F) theme
- **Community Safety**: Red (#D32F2F) theme

These match your app's color scheme and are production-ready as placeholders.

## Notes

- SVGs load instantly without external requests
- They scale perfectly to any size
- They're very lightweight (few KB each)
- They provide a consistent, professional appearance
- Users can interact with all features even with placeholder images

When you're ready to add real photos, simply replace the SVG files with image files and update the file extensions in the code.
