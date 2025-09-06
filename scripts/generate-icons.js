const fs = require('fs');
const path = require('path');

// Simple SVG to create icon
const svgContent = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="60" fill="url(#grad)"/>
  <text x="256" y="320" font-family="Arial" font-size="256" text-anchor="middle" fill="white">💰</text>
</svg>
`;

// Save SVG files with different sizes
const sizes = [192, 512];

sizes.forEach(size => {
  const scaledSvg = svgContent.replace('width="512"', `width="${size}"`).replace('height="512"', `height="${size}"`);
  const filename = path.join(__dirname, '..', 'public', `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, scaledSvg);
  console.log(`Generated ${filename}`);
});

// Also create a simple favicon
const faviconSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#667eea"/>
  <text x="16" y="24" font-family="Arial" font-size="20" text-anchor="middle" fill="white">W</text>
</svg>
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log('Generated favicon.svg');