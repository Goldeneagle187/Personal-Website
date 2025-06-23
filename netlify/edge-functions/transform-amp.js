export default async function handler(request, context) {
    const response = await context.next();
    const contentType = response.headers.get("content-type");
  
    // Only process HTML files
    if (!contentType || !contentType.includes("text/html")) {
      return response;
    }
  
    let html = await response.text();
  
    // Basic minification using native JavaScript
    html = html
      .replace(/>\s+</g, '><')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s{2,}/g, ' ');
  
    // Ensure required AMP tags
    if (!html.includes('<style amp-boilerplate>')) {
      html = html.replace('</head>',
        `<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript></head>`
      );
    }
  
    // Ensure AMP runtime is loaded
    if (!html.includes('https://cdn.ampproject.org/v0.js')) {
      html = html.replace('<head>', '<head><script async src="https://cdn.ampproject.org/v0.js"></script>');
    }
  
    // Add AMP attribute if missing
    if (!html.includes('<html amp') && !html.includes('<html ⚡')) {
      html = html.replace('<html', '<html ⚡');
    }
  
    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=0, must-revalidate',
      },
    });
  }