// Multi-Profile Context Injector v2.0
// Handles multiple profiles, platform-specific targeting, and #tag commands

class ContextManager {
    constructor() {
        // Your actual prompt collection as profiles
        this.profiles = {
            learning: {
                name: "Learning Mode",
                context: "Visual learner who reverse-engineers concepts. Explain casually, no academic tone. Show working examples first, then break down the concepts. I learn by building and understanding how things work.",
                keywords: ["explain", "learn", "understand", "how", "why"]
            },
            
            business: {
                name: "Business Strategy", 
                context: "Construction background entrepreneur transitioning to tech. Focus on practical business applications, market opportunities, and actionable strategies. No fluff - give me concrete next steps.",
                keywords: ["business", "market", "strategy", "revenue", "growth"]
            },
            
            technical: {
                name: "Technical Development",
                context: "Building AI context management system. Need technical details but explained for someone transitioning from construction to tech. Show code examples and practical implementations.",
                keywords: ["code", "build", "technical", "implement", "architecture"]
            },
            
            construction: {
                name: "Construction Focus",
                context: "20+ years construction experience. Relate tech concepts to construction processes. Focus on automation, efficiency, and practical tools that solve real job site problems.",
                keywords: ["construction", "automation", "tools", "efficiency", "jobsite"]
            }
        };
        
        this.currentProfile = 'learning'; // default
        this.platformConfigs = this.setupPlatforms();
        this.maxRetries = 8;
        this.retryDelay = 1500;
    }
    
    setupPlatforms() {
        return {
            'claude.ai': {
                selectors: [
                    'div[contenteditable="true"]',
                    'textarea[placeholder*="message"]',
                    'div[role="textbox"]',
                    '.ProseMirror'
                ],
                waitTime: 2000,
                events: ['input', 'change', 'focus']
            },
            
            'deepseek': {
                selectors: [
                    'textarea[class*="chat-input"]',
                    'textarea[class*="input"]',
                    'textarea:not([style*="display: none"])'
                ],
                waitTime: 1500,
                events: ['input', 'change', 'keyup']
            },
            
            'perplexity.ai': {
                selectors: [
                    'textarea[placeholder*="Ask anything"]',
                    'textarea[data-testid*="search"]',
                    'div[contenteditable="true"]'
                ],
                waitTime: 2000,
                events: ['input', 'change', 'focus']
            },
            
            'chat.openai.com': {
                selectors: [
                    'textarea[data-id*="chat"]',
                    'textarea[placeholder*="Send a message"]',
                    '#prompt-textarea'
                ],
                waitTime: 2500,
                events: ['input', 'change', 'keyup']
            }
        };
    }
    
    // Detect which platform we're on
    detectPlatform() {
        const url = window.location.href.toLowerCase();
        
        for (const [platform, config] of Object.entries(this.platformConfigs)) {
            if (url.includes(platform)) {
                return { platform, config };
            }
        }
        return null;
    }
    
    // Smart profile selection based on page content or URL
    selectSmartProfile() {
        const url = window.location.href.toLowerCase();
        const pageText = document.body.innerText.toLowerCase();
        
        // Check for business-related content
        if (pageText.includes('business') || pageText.includes('strategy') || 
            pageText.includes('market') || url.includes('business')) {
            return 'business';
        }
        
        // Check for technical content
        if (pageText.includes('code') || pageText.includes('programming') || 
            pageText.includes('api') || pageText.includes('technical')) {
            return 'technical';
        }
        
        // Check for construction content
        if (pageText.includes('construction') || pageText.includes('building') || 
            pageText.includes('contractor')) {
            return 'construction';
        }
        
        // Default to learning
        return 'learning';
    }
    
    // Parse #tags from existing input content
    parseHashTags(content) {
        const tags = content.match(/#\w+/g) || [];
        return tags.map(tag => tag.substring(1).toLowerCase());
    }
    
    // Process #tag commands
    processHashTags(input, content) {
        const tags = this.parseHashTags(content);
        let newContent = content;
        let profileChanged = false;
        
        tags.forEach(tag => {
            switch(tag) {
                case 'learning':
                case 'learn':
                    this.currentProfile = 'learning';
                    profileChanged = true;
                    break;
                    
                case 'business':
                case 'biz':
                    this.currentProfile = 'business';
                    profileChanged = true;
                    break;
                    
                case 'technical':
                case 'tech':
                case 'code':
                    this.currentProfile = 'technical';
                    profileChanged = true;
                    break;
                    
                case 'construction':
                case 'build':
                    this.currentProfile = 'construction';
                    profileChanged = true;
                    break;
                    
                case 'new':
                    // Clear any existing context, start fresh
                    newContent = content.replace(/#new\b/g, '').trim();
                    console.log('🆕 New session started');
                    break;
                    
                case 'carry':
                    // Add session carry-over context
                    newContent = content.replace(/#carry\b/g, '[Continue from previous session context]').trim();
                    console.log('📋 Carrying context forward');
                    break;
            }
        });
        
        if (profileChanged) {
            console.log(`🔄 Profile switched to: ${this.profiles[this.currentProfile].name}`);
            // Remove profile tags from content since we've processed them
            newContent = newContent.replace(/#(learning|learn|business|biz|technical|tech|code|construction|build)\b/g, '').trim();
        }
        
        return newContent;
    }
    
    // Enhanced injection with platform-specific handling
    injectProfile(input, platformConfig) {
        const profile = this.profiles[this.currentProfile];
        
        // Check if input already has content (user typing)
        let existingContent = this.getInputContent(input);
        
        // Process any #tags in existing content
        if (existingContent) {
            existingContent = this.processHashTags(input, existingContent);
        }
        
        // Prepare the full context
        let fullContext = profile.context;
        
        // Add existing content if any
        if (existingContent && existingContent.trim()) {
            fullContext = `${profile.context}\n\nQuery: ${existingContent}`;
        }
        
        // Inject the content
        this.setInputContent(input, fullContext);
        
        // Fire platform-specific events
        platformConfig.events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            input.dispatchEvent(event);
        });
        
        // Focus the input
        input.focus();
        
        console.log(`✅ Injected ${profile.name} profile`);
        return true;
    }
    
    // Get content from input (handles different input types)
    getInputContent(input) {
        if (input.value !== undefined) return input.value;
        if (input.textContent !== undefined) return input.textContent;
        if (input.innerText !== undefined) return input.innerText;
        return '';
    }
    
    // Set content in input (handles different input types)
    setInputContent(input, content) {
        if (input.value !== undefined) {
            input.value = content;
        }
        if (input.contentEditable === 'true') {
            input.textContent = content;
            input.innerText = content;
        }
    }
    
    // Find the right input element for the platform
    findInput(platformConfig) {
        for (const selector of platformConfig.selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (this.isVisible(element) && this.isInteractive(element)) {
                    console.log(`Found input: ${selector}`);
                    return element;
                }
            }
        }
        return null;
    }
    
    // Visibility and interaction checks (from v1)
    isVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && 
               style.display !== 'none' && style.visibility !== 'hidden';
    }
    
    isInteractive(element) {
        return !element.disabled && !element.readOnly;
    }
    
    // Main injection process
    startInjection() {
        const platformInfo = this.detectPlatform();
        
        if (!platformInfo) {
            console.log('⚠️ No supported AI platform detected');
            return;
        }
        
        console.log(`🎯 Detected: ${platformInfo.platform}`);
        
        // Auto-select smart profile if not manually set
        if (this.currentProfile === 'learning') {
            this.currentProfile = this.selectSmartProfile();
        }
        
        let attempts = 0;
        const tryInject = () => {
            attempts++;
            console.log(`Attempt ${attempts}/${this.maxRetries} on ${platformInfo.platform}`);
            
            const input = this.findInput(platformInfo.config);
            
            if (input) {
                this.injectProfile(input, platformInfo.config);
                return;
            }
            
            if (attempts < this.maxRetries) {
                setTimeout(tryInject, this.retryDelay);
            } else {
                console.log('❌ Injection failed - debugging info:');
                this.debugPlatform(platformInfo.platform);
            }
        };
        
        // Wait for platform-specific load time, then start trying
        setTimeout(tryInject, platformInfo.config.waitTime);
    }
    
    // Debug info for troubleshooting
    debugPlatform(platform) {
        console.log(`=== DEBUG: ${platform} ===`);
        const config = this.platformConfigs[platform];
        
        config.selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            console.log(`${selector}: found ${elements.length} elements`);
            elements.forEach((el, i) => {
                console.log(`  [${i}] visible: ${this.isVisible(el)}, interactive: ${this.isInteractive(el)}`);
            });
        });
    }
    
    // Save profile data to local storage
    saveProfiles() {
        localStorage.setItem('contextProfiles', JSON.stringify(this.profiles));
        localStorage.setItem('currentProfile', this.currentProfile);
    }
    
    // Load profile data from local storage
    loadProfiles() {
        const saved = localStorage.getItem('contextProfiles');
        if (saved) {
            this.profiles = { ...this.profiles, ...JSON.parse(saved) };
        }
        
        const currentSaved = localStorage.getItem('currentProfile');
        if (currentSaved) {
            this.currentProfile = currentSaved;
        }
    }
}

// Initialize the context manager
const contextManager = new ContextManager();
contextManager.loadProfiles();

// Start injection when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        contextManager.startInjection();
    });
} else {
    contextManager.startInjection();
}

// Handle dynamic content loading
const observer = new MutationObserver(() => {
    // Try injection again if new elements are added
    setTimeout(() => contextManager.startInjection(), 1000);
});

observer.observe(document.body, { 
    childList: true, 
    subtree: true 
});

// Save profiles when page unloads
window.addEventListener('beforeunload', () => {
    contextManager.saveProfiles();
});