import { AuthManager } from './modules/AuthManager.js';
import { DocumentManager } from './modules/DocumentManager.js';
import { AnnotationManager } from './modules/AnnotationManager.js';
import { TextEditor } from './modules/TextEditor.js';
import { SettingsManager } from './modules/SettingsManager.js';
import { supabase } from './config/supabase.js';
import { DOMUtils } from './utils/dom.js';

export class TextAnnotatorApp {
    constructor() {
        // Initialize managers
        this.authManager = new AuthManager(this);
        this.documentManager = new DocumentManager(this);
        this.annotationManager = new AnnotationManager(this);
        this.textEditorManager = new TextEditor(this);
        this.settingsManager = new SettingsManager(this);
        
        // Initialize the application
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 Starting app initialization...');
            
            // LOCAL DEVELOPMENT DEBUGGING - Remove this in production
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                await this.quickLocalTest();
            }
            
            // Initialize DOM elements
            this.textEditorManager.initializeElements();
            console.log('✅ DOM elements initialized');
            
            // Initialize settings first (before binding events)
            this.settingsManager.initialize();
            console.log('✅ Settings manager initialized');
            
            // Bind events (now settings manager is available)
            this.textEditorManager.bindEvents();
            console.log('✅ Events bound');
            
            // Initialize authentication
            await this.authManager.initialize();
            console.log('✅ Auth manager initialized');
            
            // Initialize dark mode
            this.textEditorManager.initializeDarkMode();
            console.log('✅ Dark mode initialized');
            
            // Ensure database tables exist (comment out if causing issues)
            try {
                await this.ensureTablesExist();
                console.log('✅ Database tables verified');
            } catch (dbError) {
                console.warn('⚠️ Database table check failed (continuing anyway):', dbError);
            }
            
            console.log('🎉 App initialization complete!');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            // Continue anyway for basic functionality
        }
    }

    // LOCAL DEVELOPMENT DEBUGGING - Remove this in production
    async quickLocalTest() {
        console.log('🧪 Quick Local Test Starting...');
        console.log('📍 Running on:', window.location.href);
        
        // Test 1: Environment variables
        console.log('1. Supabase URL:', window.SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
        console.log('2. Supabase Key:', window.SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');
        
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
            console.error('❌ ENVIRONMENT VARIABLES MISSING!');
            console.error('💡 Make sure you uncommented the env.local.js script in index.html');
            alert('Environment variables not loaded! Check console and LOCAL_SETUP_COMPLETE.md');
            return;
        }
        
        // Test 2: Supabase connection
        try {
            console.log('🔌 Testing Supabase connection...');
            const { data, error } = await supabase.from('documents').select('count');
            
            if (error) {
                console.error('❌ Database Error:', error.message);
                if (error.message.includes('relation "documents" does not exist')) {
                    console.error('💡 TABLES DON\'T EXIST! Run the SQL in LOCAL_SETUP_COMPLETE.md');
                    alert('Database tables don\'t exist! Check LOCAL_SETUP_COMPLETE.md Step 3');
                } else if (error.message.includes('JWT')) {
                    console.error('💡 AUTH CONFIG ISSUE! Check Supabase auth settings for localhost');
                    alert('Supabase auth config issue! Check LOCAL_SETUP_COMPLETE.md Step 2');
                }
            } else {
                console.log('3. Database: ✅ Connected and tables exist');
            }
        } catch (e) {
            console.error('❌ Database connection failed:', e.message);
            alert('Database connection failed! Check Supabase settings.');
        }
        
        // Test 3: Auth system
        try {
            const { data: session } = await supabase.auth.getSession();
            console.log('4. Auth system: ✅ Working');
            console.log('5. Current session:', session.session ? '✅ Logged in' : '⚪ Not logged in');
        } catch (e) {
            console.error('❌ Auth system error:', e.message);
        }
        
        console.log('🧪 Local test complete! Check above for any ❌ errors');
    }

    async ensureTablesExist() {
        try {
            await supabase.from('documents').select('id').limit(1);
            await supabase.from('annotations').select('id').limit(1);
        } catch (error) {
            console.log('Tables may not exist yet. Please create them in Supabase dashboard.');
            DOMUtils.showMessage('Please set up database tables. Check console for details.', 'warning');
        }
    }

    // Delegate methods to appropriate managers
    get currentUser() {
        return this.authManager.currentUser;
    }

    get currentDocument() {
        return this.documentManager.currentDocument;
    }

    get documents() {
        return this.documentManager.documents;
    }

    get annotations() {
        return this.annotationManager.annotations;
    }

    get textEditor() {
        return this.textEditorManager.textEditor;
    }

    get documentTitle() {
        return this.textEditorManager.documentTitle;
    }

    get currentView() {
        return this.textEditorManager.currentView;
    }

    // View management
    showDashboard() {
        this.textEditorManager.showDashboard();
    }

    showEditor() {
        this.textEditorManager.showEditor();
    }

    showEditorWithoutAuth() {
        this.textEditorManager.showEditorWithoutAuth();
    }

    // Document management
    async loadUserDocuments() {
        await this.documentManager.loadUserDocuments();
    }

    async loadDocumentContent() {
        await this.documentManager.loadDocumentContent();
    }

    showNewDocumentPopup() {
        this.documentManager.showNewDocumentPopup();
    }

    hideNewDocumentPopup() {
        this.documentManager.hideNewDocumentPopup();
    }

    // Annotation management
    getAnnotationCount(documentId) {
        return this.annotationManager.getAnnotationCount(documentId);
    }

    // Auth management
    updateAuthUI() {
        this.textEditorManager.updateAuthUI();
    }

    hideAuthPopups() {
        this.authManager.hideAuthPopups();
    }

    // Utility methods
    showMessage(message, type = 'info') {
        DOMUtils.showMessage(message, type);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.textAnnotator = new TextAnnotatorApp();
}); 