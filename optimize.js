import fs from 'fs';
import path from 'path';
import { minify as minifyJS } from 'terser';
import { minify as minifyHTML } from 'html-minifier-terser';
import CleanCSS from 'clean-css';

const distDir = 'dist';

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}


// Function to safely read a file
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return null;
  }
}

// Function to safely write a file
function safeWriteFile(filePath, content) {
  try {
    const distPath = path.join(distDir, path.basename(filePath));
    fs.writeFileSync(distPath, content);
    return true;
  } catch (err) {
    console.error(`Error writing file ${distPath}:`, err);
    return false;
  }
}

// Function to get all files of specific extensions from root directory
function getFilesInRoot(extensions) {
  return fs.readdirSync(process.cwd())
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return extensions.includes(ext) && file !== 'optimize.js' && file !== 'transform-amp.js';
    });
}

// Function to minify JavaScript
async function minifyJavaScript() {
  try {
    const jsFiles = getFilesInRoot(['.js']);
    console.log('Found JS files:', jsFiles);

    for (const file of jsFiles) {
      const filePath = path.join(process.cwd(), file);
      const code = safeReadFile(filePath);
      if (!code) continue;

      const result = await minifyJS(code, {
        compress: true,
        mangle: true
      });

      if (safeWriteFile(file, result.code)) {
        console.log(`Minified JavaScript: ${file}`);
      }
    }
  } catch (err) {
    console.error('Error in JavaScript minification:', err);
  }
}

// Function to minify CSS
async function minifyCSS() {
  try {
    const cssFiles = getFilesInRoot(['.css']);
    console.log('Found CSS files:', cssFiles);

    for (const file of cssFiles) {
      const filePath = path.join(process.cwd(), file);
      const css = safeReadFile(filePath);
      if (!css) continue;

      const output = new CleanCSS({
        level: 2 // Advanced optimization level
      }).minify(css);

      if (output.errors.length > 0) {
        console.error(`CSS minification errors for ${file}:`, output.errors);
        continue;
      }

      if (safeWriteFile(file, output.styles)) {
        console.log(`Minified CSS: ${file}`);
      }
    }
  } catch (err) {
    console.error('Error in CSS minification:', err);
  }
}

// Function to optimize AMP HTML
async function optimizeAMP(html) {
  if (!html) return null;

  try {
    // Basic minification
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

    // Ensure AMP runtime
    if (!html.includes('https://cdn.ampproject.org/v0.js')) {
      html = html.replace('<head>', '<head><script async src="https://cdn.ampproject.org/v0.js"></script>');
    }

    // Add AMP attribute if missing
    if (!html.includes('<html amp') && !html.includes('<html ⚡')) {
      html = html.replace('<html', '<html ⚡');
    }

    return html;
  } catch (err) {
    console.error('Error in AMP optimization:', err);
    return null;
  }
}

// Function to minify and optimize HTML files
async function processHTMLFiles() {
  try {
    const htmlFiles = getFilesInRoot(['.html']);
    console.log('Found HTML files:', htmlFiles);
    
    for (const file of htmlFiles) {
      const filePath = path.join(process.cwd(), file);
      const html = safeReadFile(filePath);
      if (!html) continue;

      let processedHtml;
      if (file === 'amp.html') {
        // Apply AMP-specific optimizations
        processedHtml = await optimizeAMP(html);
        if (processedHtml) {
          console.log('Optimized AMP HTML: amp.html');
        }
      } else {
        // Apply regular HTML minification
        try {
          processedHtml = await minifyHTML(html, {
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: true,
            minifyCSS: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            processConditionalComments: true,
            removeEmptyAttributes: true,
            removeOptionalTags: true,
            removeTagWhitespace: true
          });
          console.log(`Minified HTML: ${file}`);
        } catch (err) {
          console.error(`Error minifying ${file}:`, err);
          continue;
        }
      }

      if (processedHtml) {
        safeWriteFile(file, processedHtml);
      }
    }
  } catch (err) {
    console.error('Error in HTML processing:', err);
  }
}

// Function to create Netlify Edge Function
function createEdgeFunction() {
  try {
    const edgeCode = `
export default async function handler(request, context) {
  // Only process requests for amp.html
  if (!request.url.includes('/amp.html')) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("text/html")) {
    return response;
  }

  const html = await response.text();
  const optimizedHtml = ${optimizeAMP.toString()}(html);

  return new Response(optimizedHtml, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}`;

    if (safeWriteFile('transform-amp.js', edgeCode)) {
      console.log('Created Edge Function: transform-amp.js');
    }
  } catch (err) {
    console.error('Error creating Edge Function:', err);
  }
}

// Run all optimization tasks
async function runOptimization() {
  console.log('Starting optimization process...');
  
  await minifyJavaScript();
  await minifyCSS();
  await processHTMLFiles();
  createEdgeFunction();

    // Copy other assets from root to dist
    const otherAssets = fs.readdirSync(process.cwd()).filter(file => {
        return !['.js', '.css', '.html', '.toml', '.json'].includes(path.extname(file)) &&
               !['dist', 'node_modules'].includes(file);
    });

    for (const asset of otherAssets) {
        const sourcePath = path.join(process.cwd(), asset);
        const destPath = path.join(distDir, asset);

        // if asset is a directory, copy it recursively
        if (fs.lstatSync(sourcePath).isDirectory()) {
            fs.cpSync(sourcePath, destPath, { recursive: true });
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    }
  
  console.log('Optimization complete!');
}

// Call the function to start the optimization process
runOptimization().catch(console.error);
