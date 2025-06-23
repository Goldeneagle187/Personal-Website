/**
 * ===============================================================================
 * THEME MANAGEMENT
 * Manages the website's theme (light, dark, system) and persists the user's
 * choice in localStorage.
 * ===============================================================================
 */
class ThemeManager {
    constructor() {
      this.toggle = document.getElementById('themeToggle');
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.initialize();
    }

    /**
     * Sets up the initial theme based on localStorage or system preference,
     * and adds necessary event listeners.
     */
    initialize() {
      const savedTheme = localStorage.getItem('theme') || 'system';
      this.setTheme(savedTheme);
      this.toggle.addEventListener('click', () => this.cycleTheme());
      this.mediaQuery.addEventListener('change', () => this.handleSystemThemeChange());
    }

    /**
     * Applies a given theme to the document and saves it to localStorage.
     * @param {string} theme - The theme to set ('light', 'dark', or 'system').
     */
    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      this.updateToggleIcon(theme);
    }

    /**
     * Handles changes in the system's color scheme preference.
     */
    handleSystemThemeChange() {
      const currentTheme = localStorage.getItem('theme') || 'system';
      if (currentTheme === 'system') {
        this.updateToggleIcon('system');
      }
    }

    /**
     * Updates the theme toggle button's icon to reflect the current theme.
     * @param {string} theme - The current theme.
     */
    updateToggleIcon(theme) {
      const isDark = theme === 'dark' || (theme === 'system' && this.mediaQuery.matches);
      const icon = isDark 
        ? '<img src="assets/an-icons/lightbulb-emoji-am.webp" alt="light_mode" width="24" height="24">' 
        : '<img src="assets/an-icons/moon-emoji-am.webp" alt="dark_mode" width="24" height="24">';
      this.toggle.innerHTML = icon;
    }

    /**
     * Cycles through the available themes ('light', 'dark').
     */
    cycleTheme() {
      const themes = ['light', 'dark'];
      const current = document.documentElement.getAttribute('data-theme');
      const next = themes[(themes.indexOf(current) + 1) % themes.length];
      this.setTheme(next);
    }
}


/**
 * ===============================================================================
 * SCROLL & ANIMATION MANAGEMENT
 * Handles scroll-based animations and intersection observer-based fade-in effects.
 * ===============================================================================
 */
class AnimationManager {
    constructor() {
        this.observeElements();
    }

    /**
     * Uses IntersectionObserver to add a 'fade-in' class to elements
     * when they become visible in the viewport.
     */
    observeElements() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section);
        });
    }
}


/**
 * ===============================================================================
 * SCROLL TO TOP MANAGEMENT
 * Manages the visibility and functionality of the "scroll to top" button.
 * ===============================================================================
 */
class ScrollTopManager {
    constructor() {
        this.button = document.querySelector('.scroll-top');
        this.scrollThreshold = 400; // Pixels to scroll before the button appears
        this.initialize();
    }

    initialize() {
        window.addEventListener('scroll', () => this.toggleButtonVisibility());
        this.button.addEventListener('click', () => this.scrollToTop());
        this.toggleButtonVisibility(); // Initial check
    }

    /**
     * Shows or hides the button based on the scroll position.
     */
    toggleButtonVisibility() {
        requestAnimationFrame(() => {
            if (window.scrollY > this.scrollThreshold) {
                this.button.classList.add('visible');
            } else {
                this.button.classList.remove('visible');
            }
        });
    }

    /**
     * Smoothly scrolls the window to the top.
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}


/**
 * ===============================================================================
 * PROFILE IMAGE BORDER ANIMATION
 * Fetches an SVG and animates its path to create a "racing line" effect.
 * ===============================================================================
 */
function initializeAnimation() {
    fetch('assets/img.svg')
        .then(response => response.text())
        .then(svgContent => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            const originalPath = svgDoc.querySelector('path');
            
            if (!originalPath) return;
            
            const animationSvg = document.querySelector('.border-line');
            const viewBox = svgDoc.querySelector('svg').getAttribute('viewBox');
            
            if (viewBox) {
                animationSvg.setAttribute('viewBox', viewBox);
            }
 
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', originalPath.getAttribute('d'));
            animationSvg.appendChild(path);
            
            const pathLength = path.getTotalLength();
            let trailLength = pathLength * 0.01;
            let isComplete = false;
            
            function resetAnimation() {
                trailLength = pathLength * 0.01;
                path.style.strokeDasharray = `${trailLength} ${pathLength - trailLength}`;
                path.style.strokeDashoffset = 0;
                path.style.stroke = 'var(--racing)';
                path.style.strokeWidth = '5';
                isComplete = false;
                startTime = performance.now();
            }
            
            let startTime = performance.now();
            
            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                
                if (!isComplete) {
                    trailLength = Math.min(pathLength * (0.01 + elapsed/20000), pathLength);
                    path.style.strokeDasharray = `${trailLength} ${pathLength - trailLength}`;
                    
                    if (trailLength >= pathLength) {
                        isComplete = true;
                        path.style.stroke = 'var(--racing)';
                        path.style.strokeWidth = '8';
                        setTimeout(resetAnimation, 60000);
                    }
                }
                
                const currentOffset = parseFloat(path.style.strokeDashoffset || 0);
                const newOffset = currentOffset - 1;
                
                if (Math.abs(newOffset) >= pathLength) {
                    path.style.strokeDashoffset = 0;
                } else {
                    path.style.strokeDashoffset = newOffset;
                }
                
                requestAnimationFrame(animate);
            }
            
            requestAnimationFrame(animate);
        })
        .catch(error => console.error('Error loading SVG:', error));
 }


/**
 * ===============================================================================
 * INITIALIZATION & EVENT LISTENERS
 * Code that runs after the DOM is fully loaded.
 * ===============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // Instantiate all manager classes to activate their functionality
    new ThemeManager();
    new AnimationManager();
    new ScrollTopManager(); 
    initializeAnimation();

    // Initialize Pull-to-refresh functionality
    PullToRefresh.init({
        mainElement: "body",
        instructionsPullToRefresh: "<span style='color: var(--on-primary-container)'>Pull down to refresh</span>",
        instructionsReleaseToRefresh: "<span style='color: var(--on-primary-container)'>Release to refresh</span>",
        instructionsRefreshing: "<span style='color: var(--on-primary-container)'>Refreshing...</span>",
        iconArrow: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--on-primary-container)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7-7 7 7"/></svg>',
        iconRefreshing: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--on-primary-container)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
        onRefresh: () => location.reload()
    });

    // Observe the body for the pull-to-refresh container to style it dynamically
    const observer = new MutationObserver(() => {
        const ptrContainer = document.querySelector(".ptr--ptr");
        if (ptrContainer) {
            ptrContainer.style.backgroundColor = "var(--surface)";
            ptrContainer.style.color = "var(--on-surface)";
            ptrContainer.style.boxShadow = "none";
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Initialize lazy loading for images
    yall();

    /**
     * SERVICE WORKER REGISTRATION FOR CACHING
     * This registers a service worker to cache assets for offline access
     * and faster subsequent visits. The caching logic itself is in sw.js.
     */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});
