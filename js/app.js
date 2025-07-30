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
        // Initialize DOM elements
        this.textEditorManager.initializeElements();
        
        // Initialize settings first (before binding events)
        this.settingsManager.initialize();
        
        // Bind events (now settings manager is available)
        this.textEditorManager.bindEvents();
        
        // Initialize authentication
        await this.authManager.initialize();
        
        // Initialize dark mode
        this.textEditorManager.initializeDarkMode();
        
        // Ensure database tables exist
        await this.ensureTablesExist();
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