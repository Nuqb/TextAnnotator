import { supabase } from '../config/supabase.js';
import { DOMUtils } from '../utils/dom.js';

export class TextEditor {
    constructor(app) {
        this.app = app;
        this.isSaving = false;
        this.currentView = 'dashboard';
    }

    initializeElements() {
        // Main UI elements
        this.textEditor = document.getElementById('textEditor');
        this.documentDashboard = document.getElementById('documentDashboard');
        this.editorView = document.getElementById('editorView');
        this.documentTitle = document.getElementById('documentTitle');
        
        // Buttons
        this.saveBtn = document.getElementById('saveBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.backToDashboardBtn = document.getElementById('backToDashboardBtn');
        this.newDocumentBtn = document.getElementById('newDocumentBtn');
        this.titleBtn = document.getElementById('titleBtn');
        
        // Auth elements
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.guestControls = document.getElementById('guestControls');
        this.userControls = document.getElementById('userControls');
        this.panelUserEmail = document.getElementById('panelUserEmail');
        
        // Dark mode
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Formatting toolbar elements
        this.fontFamily = document.getElementById('fontFamily');
        this.boldBtn = document.getElementById('boldBtn');
        this.italicBtn = document.getElementById('italicBtn');
        this.underlineBtn = document.getElementById('underlineBtn');
        this.strikeBtn = document.getElementById('strikeBtn');
        this.bulletListBtn = document.getElementById('bulletListBtn');
        this.numberListBtn = document.getElementById('numberListBtn');
        this.textColorBtn = document.getElementById('textColorBtn');
        this.backgroundColorBtn = document.getElementById('backgroundColorBtn');
        
        // Alignment buttons
        this.alignLeftBtn = document.getElementById('alignLeftBtn');
        this.alignCenterBtn = document.getElementById('alignCenterBtn');
        this.alignRightBtn = document.getElementById('alignRightBtn');
        this.justifyBtn = document.getElementById('justifyBtn');
        
        // Clear formatting button
        this.clearFormatBtn = document.getElementById('clearFormatBtn');
    }

    bindEvents() {
        // Navigation events
        this.backToDashboardBtn?.addEventListener('click', () => this.app.showDashboard());
        this.newDocumentBtn?.addEventListener('click', () => this.app.documentManager.showNewDocumentPopup());
        
        // Big "Create New Document" card
        document.getElementById('newDocumentCard')?.addEventListener('click', () => this.app.documentManager.showNewDocumentPopup());
        this.titleBtn?.addEventListener('click', () => this.handleTitleClick());
        
        // Text editor events
        this.textEditor?.addEventListener('mouseup', () => this.app.annotationManager.handleTextSelection());
        this.textEditor?.addEventListener('keyup', () => this.updateFormattingState());
        this.textEditor?.addEventListener('keydown', () => this.app.annotationManager.handleTextSelection());
        this.textEditor?.addEventListener('input', () => this.app.annotationManager.handleTextSelection());
        this.textEditor?.addEventListener('selectionchange', () => this.app.annotationManager.handleTextSelection());
        
        // Save and export events
        this.saveBtn?.addEventListener('click', () => this.saveDocument());
        this.exportBtn?.addEventListener('click', () => this.exportData());
        this.importBtn?.addEventListener('change', (e) => this.importData(e));
        
        // Auth events
        this.loginBtn?.addEventListener('click', () => this.app.authManager.showLoginPopup());
        this.registerBtn?.addEventListener('click', () => this.app.authManager.showRegisterPopup());
        this.logoutBtn?.addEventListener('click', () => this.app.authManager.logout());
        
        // Account panel events
        document.getElementById('accountBtn')?.addEventListener('click', () => this.toggleAccountPanel());
        document.getElementById('closeAccountPanel')?.addEventListener('click', () => this.closeAccountPanel());
        document.getElementById('panelLogoutBtn')?.addEventListener('click', () => {
            console.log('🖱️ Logout button clicked!');
            this.app.authManager.logout();
        });
        
        // Settings panel events
        const settingsBtn = document.getElementById('settingsBtn');
        settingsBtn?.addEventListener('click', () => {
            this.showSettingsPanel();
        });
        document.getElementById('closeSettings')?.addEventListener('click', () => this.hideSettingsPanel());
        document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
        
        // Credits panel events - removed since credits are now always visible
        
        // Dark mode
        this.darkModeToggle?.addEventListener('change', () => this.toggleDarkMode());
        
        // Form events
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.app.authManager.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            console.log('📝 Register form submitted!');
            this.app.authManager.handleRegister(e);
        });
        document.getElementById('newDocumentForm')?.addEventListener('submit', (e) => this.app.documentManager.createNewDocument(e));
        
        // Real-time password validation
        document.getElementById('confirmPassword')?.addEventListener('input', () => {
            const password = document.getElementById('registerPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            
            if (confirmPassword && password !== confirmPassword) {
                this.app.authManager.showPasswordError(true);
            } else {
                this.app.authManager.showPasswordError(false);
            }
        });
        
        document.getElementById('registerPassword')?.addEventListener('input', () => {
            const password = document.getElementById('registerPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            
            if (confirmPassword && password !== confirmPassword) {
                this.app.authManager.showPasswordError(true);
            } else {
                this.app.authManager.showPasswordError(false);
            }
        });
        
        // Auth popup close events
        document.getElementById('closeLogin')?.addEventListener('click', () => this.app.authManager.hideLoginPopup());
        document.getElementById('closeRegister')?.addEventListener('click', () => this.app.authManager.hideRegisterPopup());
        document.getElementById('cancelLogin')?.addEventListener('click', () => this.app.authManager.hideLoginPopup());
        document.getElementById('cancelRegister')?.addEventListener('click', () => this.app.authManager.hideRegisterPopup());
        
        // Email verification popup events
        document.getElementById('closeEmailVerification')?.addEventListener('click', () => this.app.authManager.hideEmailVerificationPopup());
        document.getElementById('closeEmailVerificationBtn')?.addEventListener('click', () => this.app.authManager.hideEmailVerificationPopup());
        document.getElementById('cancelNewDocument')?.addEventListener('click', () => this.app.documentManager.hideNewDocumentPopup());
        

        
        // Auth popup switch events
        document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.app.authManager.hideLoginPopup();
            this.app.authManager.showRegisterPopup();
        });
        document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.app.authManager.hideRegisterPopup();
            this.app.authManager.showLoginPopup();
        });
        
        // Popup events
        document.getElementById('closeNewDocument')?.addEventListener('click', () => this.app.documentManager.hideNewDocumentPopup());
        document.getElementById('closePopup')?.addEventListener('click', () => {
            if (this.app?.annotationManager) {
                this.app.annotationManager.hideContextPopup();
            }
        });
        document.getElementById('addContextBtn')?.addEventListener('click', () => {
            if (this.app?.annotationManager) {
                this.app.annotationManager.showContextPopup();
            }
        });
        
        document.getElementById('saveContext')?.addEventListener('click', () => {
            try {
                if (!this.app || !this.app.annotationManager) {
                    console.error('AnnotationManager not initialized');
                    DOMUtils.showMessage('Error: Annotation system not ready. Please try again.', 'error');
                    return;
                }
                
                this.app.annotationManager.saveAnnotation();
            } catch (error) {
                console.error('Error calling saveAnnotation:', error);
                DOMUtils.showMessage('Error saving annotation. Please try again.', 'error');
            }
        });
        
        document.getElementById('cancelContext')?.addEventListener('click', () => {
            if (this.app?.annotationManager) {
                this.app.annotationManager.hideContextPopup();
            }
        });
        
        document.getElementById('closeViewContext')?.addEventListener('click', () => {
            if (this.app?.annotationManager) {
                this.app.annotationManager.closeAnnotationPopup();
            }
        });

        document.getElementById('deleteContextBtn')?.addEventListener('click', () => {
            if (this.app?.annotationManager) {
                this.app.annotationManager.deleteAnnotation();
            }
        });
        
        // Overlay events
        document.getElementById('overlay')?.addEventListener('click', () => DOMUtils.hideAllPopups());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Global selection change listener
        document.addEventListener('selectionchange', () => this.app.annotationManager.handleTextSelection());
        
        // Add document health check shortcut (Ctrl+Shift+H)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                this.checkDocumentHealth();
            }
        });
        
        // Add simple save test shortcut (Ctrl+Shift+S)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.testSimpleSave();
            }
        });
        
        // Formatting toolbar events
        this.bindFormattingEvents();
    }

    handleTitleClick() {
        // Only navigate to dashboard if user is authenticated and not already there
        if (this.app.authManager.currentUser && this.currentView !== 'dashboard') {
            this.app.showDashboard();
        }
        // For guest users or when already on dashboard, do nothing
    }

    showDashboard() {
        this.currentView = 'dashboard';
        this.documentDashboard.style.display = 'block';
        this.editorView.style.display = 'none';
        
        // Hide Export and Save buttons when in dashboard
        this.exportBtn.style.display = 'none';
        this.saveBtn.style.display = 'none';
        
        this.app.documentManager.renderDocumentsList();
    }

    showEditor() {
        this.currentView = 'editor';
        this.documentDashboard.style.display = 'none';
        this.editorView.style.display = 'block';
        
        // Show Export and Save buttons when in editor
        this.exportBtn.style.display = 'inline-block';
        this.saveBtn.style.display = 'inline-block';
        
        this.app.annotationManager.loadAnnotations();
    }

    showEditorWithoutAuth() {
        this.currentView = 'editor';
        this.documentDashboard.style.display = 'none';
        this.editorView.style.display = 'block';
        
        // Show Export and Save buttons when in editor
        this.exportBtn.style.display = 'inline-block';
        this.saveBtn.style.display = 'inline-block';
        
        // Clear any existing content
        this.textEditor.innerHTML = '';
        this.documentTitle.value = 'Untitled Document';
    }

    updateAuthUI() {
        if (this.app.authManager.currentUser) {
            this.guestControls.style.display = 'none';
            this.userControls.style.display = 'flex';
            this.panelUserEmail.textContent = this.app.authManager.currentUser.email;
            this.backToDashboardBtn.style.display = 'block';
            this.documentTitle.style.display = 'block';
        } else {
            this.guestControls.style.display = 'flex';
            this.userControls.style.display = 'none';
            this.backToDashboardBtn.style.display = 'none';
            this.documentTitle.style.display = 'none';
        }
    }

    async saveDocument() {
        // Prevent multiple simultaneous saves
        if (this.isSaving) {
            return;
        }
        
        if (!this.app.authManager.currentUser || !this.app.documentManager.currentDocument) {
            if (!this.app.authManager.currentUser) {
                DOMUtils.showMessage('Please log in to save your work', 'warning');
            }
            if (!this.app.documentManager.currentDocument) {
                DOMUtils.showMessage('No document selected', 'warning');
            }
            return;
        }

        // Check content size before saving
        const rawHtmlContent = this.textEditor.innerHTML;
        const rawTextContent = this.textEditor.innerText || this.textEditor.textContent || '';
        
        // Preserve HTML content with formatting (including alignment)
        const htmlContent = this.cleanHtmlContentForSave(rawHtmlContent) || '';
        
        const htmlSize = new Blob([htmlContent]).size;
        const textSize = new Blob([rawTextContent]).size;
        const wordCount = rawTextContent.split(/\s+/).filter(word => word.length > 0).length;
        
        // Simple size check - just make sure it's reasonable
        if (htmlSize > 100 * 1024) { // 100KB
            DOMUtils.showMessage('Document is large. Save may take a moment.', 'warning');
        }

        // Set saving state
        this.isSaving = true;
        const originalText = this.saveBtn.textContent;
        this.saveBtn.textContent = 'Saving...';
        this.saveBtn.disabled = true;

        // Add a timeout to prevent getting stuck forever
        const timeoutId = setTimeout(() => {
            this.resetSaveButton(originalText);
            DOMUtils.showMessage('Save timed out. The content may be too complex. Try refreshing the page.', 'error');
        }, 15000); // 15 second timeout (shorter)

        try {
            // First, test basic connectivity
            try {
                await supabase.from('documents').select('id').limit(1);
            } catch (testError) {
                throw new Error(`Database connection failed: ${testError.message}`);
            }
            
            const saveStartTime = Date.now();
            
            const { data, error } = await supabase
                .from('documents')
                .update({ 
                    content: htmlContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.app.documentManager.currentDocument.id)
                .select();
                
            if (error) {
                throw error;
            }

            // Clear the timeout since save succeeded
            clearTimeout(timeoutId);

            // Update the current document object with the new content
            if (data && data.length > 0) {
                this.app.documentManager.currentDocument.content = data[0].content;
                this.app.documentManager.currentDocument.updated_at = data[0].updated_at;
                
                // Also update in the documents array
                const docIndex = this.app.documentManager.documents.findIndex(d => d.id === this.app.documentManager.currentDocument.id);
                if (docIndex !== -1) {
                    this.app.documentManager.documents[docIndex].content = data[0].content;
                    this.app.documentManager.documents[docIndex].updated_at = data[0].updated_at;
                }
            }

            // Show success state
            this.saveBtn.textContent = 'Saved!';
            this.saveBtn.style.background = '#10b981';
            this.saveBtn.disabled = false;
            
            // Reset after 2 seconds
            setTimeout(() => {
                this.saveBtn.textContent = originalText;
                this.saveBtn.style.background = '';
                this.isSaving = false;
            }, 2000);
            
            DOMUtils.showMessage(`Document saved successfully! (${rawTextContent.length} chars, ${wordCount} words)`, 'success');
        } catch (error) {
            // Clear the timeout since we're handling the error
            clearTimeout(timeoutId);
            
            console.error('Error saving document:', error);
            
            // Provide more specific error messages based on error type
            let errorMessage = 'Error saving document';
            if (error.message) {
                if (error.message.includes('timeout')) {
                    errorMessage = 'Save timed out - document may be too large';
                } else if (error.message.includes('network')) {
                    errorMessage = 'Network error - check your connection';
                } else if (error.message.includes('size') || error.message.includes('large')) {
                    errorMessage = 'Document is too large to save';
                } else {
                    errorMessage = `Error: ${error.message}`;
                }
            }
            
            DOMUtils.showMessage(errorMessage, 'error');
            
            // Reset button on error
            this.resetSaveButton(originalText);
        }
    }

    checkDocumentHealth() {
        if (!this.textEditor) {
            console.log('No text editor found');
            return;
        }

        const htmlContent = this.textEditor.innerHTML;
        const textContent = this.textEditor.innerText || this.textEditor.textContent || '';
        
        const htmlSize = new Blob([htmlContent]).size;
        const textSize = new Blob([textContent]).size;
        const htmlSizeKB = Math.round(htmlSize / 1024);
        const textSizeKB = Math.round(textSize / 1024);
        const htmlSizeMB = Math.round(htmlSize / (1024 * 1024) * 100) / 100;
        const textSizeMB = Math.round(textSize / (1024 * 1024) * 100) / 100;
        
        const htmlCharacterCount = htmlContent.length;
        const textCharacterCount = textContent.length;
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        const htmlTags = (htmlContent.match(/<[^>]*>/g) || []).length;
        
        console.log('=== Document Health Check ===');
        console.log(`📄 HTML Content:`);
        console.log(`   Size: ${htmlSize} bytes (${htmlSizeKB} KB, ${htmlSizeMB} MB)`);
        console.log(`   Characters: ${htmlCharacterCount.toLocaleString()}`);
        console.log(`   HTML tags: ${htmlTags}`);
        console.log(`📝 Text Content (actual text only):`);
        console.log(`   Size: ${textSize} bytes (${textSizeKB} KB, ${textSizeMB} MB)`);
        console.log(`   Characters: ${textCharacterCount.toLocaleString()}`);
        console.log(`   Words: ${wordCount.toLocaleString()}`);
        console.log(`📊 Summary:`);
        console.log(`   HTML overhead: ${htmlCharacterCount - textCharacterCount} characters (${Math.round((htmlCharacterCount - textCharacterCount) / htmlCharacterCount * 100)}%)`);
        console.log(`   Size overhead: ${htmlSize - textSize} bytes (${Math.round((htmlSize - textSize) / htmlSize * 100)}%)`);
        
        // Check for potential issues
        if (htmlSize > 5 * 1024 * 1024) {
            console.warn('⚠️ HTML content is large (>5MB) - may cause save issues');
        }
        if (textSize > 1 * 1024 * 1024) {
            console.warn('⚠️ Text content is large (>1MB) - may cause performance issues');
        }
        if (htmlCharacterCount > 1000000) {
            console.warn('⚠️ HTML has many characters (>1M) - may cause performance issues');
        }
        if (htmlContent.includes('<img') || htmlContent.includes('<video') || htmlContent.includes('<audio')) {
            console.warn('⚠️ Document contains media elements - these can be very large');
        }
        
        // Check for very long lines or paragraphs
        const lines = textContent.split('\n');
        const longLines = lines.filter(line => line.length > 1000);
        if (longLines.length > 0) {
            console.warn(`⚠️ Found ${longLines.length} very long lines (>1000 chars)`);
        }
        
        console.log('=== End Health Check ===');
        
        return {
            htmlSize: htmlSize,
            htmlSizeKB: htmlSizeKB,
            htmlSizeMB: htmlSizeMB,
            textSize: textSize,
            textSizeKB: textSizeKB,
            textSizeMB: textSizeMB,
            htmlCharacters: htmlCharacterCount,
            textCharacters: textCharacterCount,
            words: wordCount,
            htmlTags: htmlTags,
            isLarge: htmlSize > 5 * 1024 * 1024
        };
    }

    handleKeyboard(e) {
        if (e.key === 'Escape') {
            DOMUtils.hideAllPopups();
        }
        
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveDocument();
        }
        
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            if (this.app.annotationManager.currentSelection && this.app.authManager.currentUser) {
                this.app.annotationManager.showContextPopup();
            }
        }
        
        // Debug shortcut: Ctrl+Shift+H to check document health
        if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            this.checkDocumentHealth();
        }
        
        // Rich text formatting shortcuts
        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.toggleFormat('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.toggleFormat('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    this.toggleFormat('underline');
                    break;
            }
        }
    }

    // Formatting methods (simplified for brevity)
    bindFormattingEvents() {
        this.fontFamily?.addEventListener('change', () => this.applyFontFamily());
        this.boldBtn?.addEventListener('click', () => this.toggleFormat('bold'));
        this.italicBtn?.addEventListener('click', () => this.toggleFormat('italic'));
        this.underlineBtn?.addEventListener('click', () => this.toggleFormat('underline'));
        this.strikeBtn?.addEventListener('click', () => this.toggleFormat('strikeThrough'));
        this.bulletListBtn?.addEventListener('click', () => this.toggleList('unordered'));
        this.numberListBtn?.addEventListener('click', () => this.toggleList('ordered'));
        this.textColorBtn?.addEventListener('click', () => this.applyTextColor());
        this.backgroundColorBtn?.addEventListener('click', () => this.applyBackgroundColor());
        
        // Alignment button events
        this.alignLeftBtn?.addEventListener('click', () => this.applyAlignment('left'));
        this.alignCenterBtn?.addEventListener('click', () => this.applyAlignment('center'));
        this.alignRightBtn?.addEventListener('click', () => this.applyAlignment('right'));
        this.justifyBtn?.addEventListener('click', () => this.applyAlignment('justify'));
        
        // Clear formatting event
        this.clearFormatBtn?.addEventListener('click', () => this.clearFormatting());
    }

    toggleFormat(command) {
        document.execCommand(command, false, null);
        this.updateFormattingState();
    }

    applyFontFamily() {
        const font = this.fontFamily.value;
        document.execCommand('fontName', false, font);
    }

    applyTextColor() {
        const color = prompt('Enter color (e.g., #ff0000 or red):', '#000000');
        if (color) {
            document.execCommand('foreColor', false, color);
        }
    }

    applyBackgroundColor() {
        const color = prompt('Enter background color (e.g., #ffff00 or yellow):', '#ffffff');
        if (color) {
            document.execCommand('hiliteColor', false, color);
        }
    }

    toggleList(type) {
        const command = type === 'unordered' ? 'insertUnorderedList' : 'insertOrderedList';
        document.execCommand(command, false, null);
        this.updateFormattingState();
    }

    updateFormattingState() {
        try {
            this.boldBtn?.classList.toggle('active', document.queryCommandState('bold'));
            this.italicBtn?.classList.toggle('active', document.queryCommandState('italic'));
            this.underlineBtn?.classList.toggle('active', document.queryCommandState('underline'));
            this.strikeBtn?.classList.toggle('active', document.queryCommandState('strikeThrough'));
            this.bulletListBtn?.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
            this.numberListBtn?.classList.toggle('active', document.queryCommandState('insertOrderedList'));
            
            // Update alignment button states
            this.alignLeftBtn?.classList.toggle('active', document.queryCommandState('justifyLeft'));
            this.alignCenterBtn?.classList.toggle('active', document.queryCommandState('justifyCenter'));
            this.alignRightBtn?.classList.toggle('active', document.queryCommandState('justifyRight'));
            this.justifyBtn?.classList.toggle('active', document.queryCommandState('justifyFull'));
        } catch (error) {
            console.log('Could not update formatting state:', error);
        }
    }

    initializeDarkMode() {
        // Default to dark mode, but respect user's saved preference
        const savedMode = localStorage.getItem('darkMode');
        const isDark = savedMode !== null ? savedMode === 'true' : true; // Default to true if no saved preference
        
        if (isDark) {
            document.body.classList.add('dark-mode');
            this.darkModeToggle.checked = true;
        }
        
        // Save the default if no preference was saved
        if (savedMode === null) {
            localStorage.setItem('darkMode', 'true');
        }
    }

    toggleDarkMode() {
        const isDark = this.darkModeToggle.checked;
        document.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('darkMode', isDark);
    }

    toggleAccountPanel() {
        const accountPanel = document.getElementById('accountPanel');
        if (accountPanel) {
            accountPanel.classList.toggle('open');
        }
    }

    closeAccountPanel() {
        const accountPanel = document.getElementById('accountPanel');
        if (accountPanel) {
            accountPanel.classList.remove('open');
        }
    }

    showSettingsPanel() {
        // Close account panel first
        this.closeAccountPanel();
        
        // Check if settings manager exists
        if (!this.app.settingsManager) {
            console.error('Settings manager not initialized');
            DOMUtils.showMessage('Settings not available. Please refresh the page.', 'error');
            return;
        }
        
        // Load current settings into the panel
        const settings = this.app.settingsManager.getSettings();
        const styleSelect = document.getElementById('annotationStyle');
        const colorInput = document.getElementById('annotationColor');
        const triggerSelect = document.getElementById('annotationTrigger');
        const closeModeSelect = document.getElementById('popupCloseMode');
        
        if (styleSelect) styleSelect.value = settings.annotationStyle;
        if (colorInput) colorInput.value = settings.annotationColor;
        if (triggerSelect) triggerSelect.value = settings.annotationTrigger;
        if (closeModeSelect) closeModeSelect.value = settings.popupCloseMode;
        
        // Show the settings panel
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.classList.add('open');
        }
    }

    hideSettingsPanel() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.classList.remove('open');
        }
    }

    saveSettings() {
        const styleSelect = document.getElementById('annotationStyle');
        const colorInput = document.getElementById('annotationColor');
        const triggerSelect = document.getElementById('annotationTrigger');
        const closeModeSelect = document.getElementById('popupCloseMode');
        
        if (styleSelect && colorInput && triggerSelect && closeModeSelect) {
            this.app.settingsManager.settings.annotationStyle = styleSelect.value;
            this.app.settingsManager.settings.annotationColor = colorInput.value;
            this.app.settingsManager.settings.annotationTrigger = triggerSelect.value;
            this.app.settingsManager.settings.popupCloseMode = closeModeSelect.value;
            this.app.settingsManager.saveSettings();
            this.app.settingsManager.updateAnnotationStyles();
            
            this.hideSettingsPanel();
            DOMUtils.showMessage('Settings saved!', 'success');
        }
    }

    // Credits panel methods removed - credits are now always visible

    // Export and import methods (simplified)
    async exportData() {
        try {
            const documentTitle = this.app.documentManager.currentDocument?.title || 'Untitled Document';
            const textContent = this.textEditor.innerText || this.textEditor.textContent || '';
            
            // Create new jsPDF instance
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set document properties
            doc.setProperties({
                title: documentTitle,
                creator: 'Text Context App',
                author: this.app.authManager.currentUser?.email || 'Guest'
            });
            
            // Add title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text(documentTitle, 20, 30);
            
            // Add metadata
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 20, 45);
            doc.text(`Author: ${this.app.authManager.currentUser?.email || 'Guest'}`, 20, 55);
            
            // Add main content
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            
            // Split text content into lines that fit the page width
            const pageWidth = 170; // A4 page width minus margins
            const splitText = doc.splitTextToSize(textContent, pageWidth);
            doc.text(splitText, 20, 75);
            
            // Add annotations section if any exist
            if (this.app.annotationManager.annotations && this.app.annotationManager.annotations.length > 0) {
                const currentY = doc.lastAutoTable?.finalY || (75 + splitText.length * 5);
                const annotationsStartY = currentY + 20;
                
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Annotations:', 20, annotationsStartY);
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                
                let annotationY = annotationsStartY + 15;
                this.app.annotationManager.annotations.forEach((annotation, index) => {
                    // Check if we need a new page
                    if (annotationY > 280) {
                        doc.addPage();
                        annotationY = 30;
                    }
                    
                    doc.setFont(undefined, 'bold');
                    doc.text(`${index + 1}. "${annotation.text}"`, 20, annotationY);
                    annotationY += 8;
                    
                    doc.setFont(undefined, 'normal');
                    const contextLines = doc.splitTextToSize(annotation.context, pageWidth - 10);
                    doc.text(contextLines, 30, annotationY);
                    annotationY += contextLines.length * 5 + 10;
                });
            }
            
            // Save the PDF
            const fileName = `${documentTitle}-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            DOMUtils.showMessage('Document exported as PDF successfully!', 'success');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            DOMUtils.showMessage('Error exporting document as PDF', 'error');
        }
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();
            let textContent = '';
            let importedData = null;

            // Handle different file types
            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                // Handle PDF files
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const pages = pdfDoc.getPages();
                
                // Extract text from all pages (basic text extraction)
                // Note: This is a simple implementation - advanced PDF text extraction would require additional libraries
                textContent = `Imported from PDF: ${file.name}\n\n[PDF content extraction is limited - consider copying and pasting text directly for better results]`;
                
                DOMUtils.showMessage('PDF imported. Note: Text extraction from PDFs is limited. For best results, copy and paste text directly.', 'warning');
                
            } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                // Handle text files
                textContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });

            } else if (fileType === 'application/json' || fileName.endsWith('.json')) {
                // Handle JSON files (legacy export format)
                const jsonContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });

                try {
                    importedData = JSON.parse(jsonContent);
                    textContent = importedData.content || '';
                } catch (parseError) {
                    throw new Error('Invalid JSON file format');
                }

            } else {
                throw new Error('Unsupported file type. Please use .txt, .pdf, or .json files.');
            }

            // Confirm import
            if (confirm('This will replace your current content and annotations. Continue?')) {
                if (this.app.authManager.currentUser && this.app.documentManager.currentDocument) {
                    // Authenticated user mode
                    await this.clearAll();
                    
                    // Set content based on file type
                    if (importedData && importedData.content) {
                        this.textEditor.innerHTML = importedData.content;
                    } else {
                        // For txt and PDF files, set as plain text
                        this.textEditor.textContent = textContent;
                    }
                    
                    await this.saveDocument();
                    
                    // Import annotations if they exist (only for JSON files)
                    if (importedData && importedData.annotations && importedData.annotations.length > 0) {
                        for (const annotation of importedData.annotations) {
                            const { error } = await supabase
                                .from('annotations')
                                .insert([{
                                    document_id: this.app.documentManager.currentDocument.id,
                                    text: annotation.text,
                                    context: annotation.context,
                                    position: annotation.position || 0
                                }]);
                            
                            if (error) console.error('Error importing annotation:', error);
                        }
                        
                        await this.app.annotationManager.loadAnnotations();
                    }
                } else {
                    // Guest mode
                    if (importedData && importedData.content) {
                        this.textEditor.innerHTML = importedData.content;
                    } else {
                        this.textEditor.textContent = textContent;
                    }
                    this.app.annotationManager.annotations = [];
                    this.app.annotationManager.renderAnnotationsList();
                }

                DOMUtils.showMessage('File imported successfully!', 'success');
            }
        } catch (error) {
            console.error('Import error:', error);
            DOMUtils.showMessage(`Error importing file: ${error.message}`, 'error');
        }

        event.target.value = '';
    }

    async clearAll() {
        if (!this.app.authManager.currentUser || !this.app.documentManager.currentDocument) return;
        
        if (confirm('Are you sure you want to clear all text and annotations? This cannot be undone.')) {
            try {
                const { error: annotationsError } = await supabase
                    .from('annotations')
                    .delete()
                    .eq('document_id', this.app.documentManager.currentDocument.id);
                
                if (annotationsError) throw annotationsError;
                
                const { error: documentError } = await supabase
                    .from('documents')
                    .update({ content: '' })
                    .eq('id', this.app.documentManager.currentDocument.id);
                
                if (documentError) throw documentError;
                
                this.textEditor.innerHTML = '';
                this.app.annotationManager.annotations = [];
                this.app.annotationManager.renderAnnotationsList();
                DOMUtils.showMessage('All content cleared!', 'success');
            } catch (error) {
                console.error('Error clearing content:', error);
                DOMUtils.showMessage('Error clearing content', 'error');
            }
        }
    }

    resetSaveButton(originalText) {
        this.saveBtn.textContent = originalText;
        this.saveBtn.style.background = '';
        this.saveBtn.disabled = false;
        this.isSaving = false;
    }

    async testSimpleSave() {
        console.log('=== TESTING SIMPLE SAVE ===');
        
        if (!this.app.authManager.currentUser || !this.app.documentManager.currentDocument) {
            console.log('No user or document for test');
            return;
        }
        
        try {
            // Test with just a simple string
            const testContent = 'Test save at ' + new Date().toISOString();
            console.log('Testing save with content:', testContent);
            
            const { data, error } = await supabase
                .from('documents')
                .update({ content: testContent })
                .eq('id', this.app.documentManager.currentDocument.id)
                .select();
                
            if (error) {
                console.error('Test save failed:', error);
            } else {
                console.log('Test save succeeded:', data);
                DOMUtils.showMessage('Test save worked!', 'success');
            }
        } catch (error) {
            console.error('Test save threw error:', error);
        }
    }

    cleanTextContent(text) {
        if (!text) return '';
        
        // Remove excessive whitespace and normalize line breaks
        return text
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\r/g, '\n') // Normalize line endings
            .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to 2
            .replace(/[ \t]{2,}/g, ' ') // Replace multiple spaces/tabs with single space
            .replace(/[ \t]*\n[ \t]*/g, '\n') // Remove spaces around line breaks
            .trim(); // Remove leading/trailing whitespace
    }

    cleanHtmlContentForSave(html) {
        if (!html || html.trim() === '') return '';
        
        // Create a temporary div to work with the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove empty elements first
        this.removeEmptyElements(tempDiv);
        
        // Get the cleaned HTML
        let cleanedHtml = tempDiv.innerHTML;
        
        // Clean up unwanted elements and attributes while preserving alignment and intentional spacing
        cleanedHtml = cleanedHtml
            // Convert empty elements to br tags (these represent intentional blank lines)
            .replace(/<div><br><\/div>/g, '<br>') // Convert empty divs with br to just br
            .replace(/<div><\/div>/g, '<br>') // Convert empty divs to br (intentional blank lines)
            .replace(/<p><br><\/p>/g, '<br>') // Convert empty paragraphs with br to just br
            .replace(/<p><\/p>/g, '<br>') // Convert empty paragraphs to br (intentional blank lines)
            .replace(/<div>\s*<\/div>/g, '<br>') // Convert divs with only whitespace to br (intentional spacing)
            .replace(/<p>\s*<\/p>/g, '<br>') // Convert paragraphs with only whitespace to br (intentional spacing)
            // Remove only empty styled elements that are created by alignment operations (not user content)
            .replace(/<div\s*style="[^"]*">\s*<\/div>/g, '') // Remove empty styled divs (created by alignment, not user)
            .replace(/<p\s*style="[^"]*">\s*<\/p>/g, '') // Remove empty styled paragraphs (created by alignment, not user)
            .replace(/<span>\s*<\/span>/g, '') // Remove empty spans
            .replace(/<span[^>]*>\s*<\/span>/g, '') // Remove empty spans with attributes
            // Clean up br tags
            .replace(/\s*<br>\s*/g, '<br>') // Clean up br tags
            .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/>\s+</g, '><') // Remove whitespace between tags
            // Remove unwanted attributes but keep text-align styles
            .replace(/style="([^"]*)"/g, (match, styles) => {
                // Keep only text-align styles
                const alignMatch = styles.match(/text-align:\s*[^;]+/);
                if (alignMatch) {
                    return `style="${alignMatch[0]}"`;
                }
                return '';
            })
            .replace(/class="[^"]*"/g, '') // Remove all classes
            .replace(/<font[^>]*>/g, '') // Remove font tags
            .replace(/<\/font>/g, '') // Remove font end tags
            .trim();
        
        // If the content is just whitespace or empty, return empty string
        if (!cleanedHtml || cleanedHtml === '<br>' || cleanedHtml === '<div><br></div>') {
            return '';
        }
        
        return cleanedHtml;
    }

    cleanHtmlContent(html) {
        if (!html || html.trim() === '') return '';
        
        // For very simple content, just return the text content wrapped in minimal HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // If the text content is very simple, just wrap it in a single div
        if (textContent.length < 1000 && !html.includes('<img') && !html.includes('<table') && !html.includes('<ul') && !html.includes('<ol')) {
            // Convert line breaks to <br> tags and wrap in single div
            const simpleHtml = textContent
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .split('\n')
                .filter(line => line.trim() !== '')
                .join('<br>');
            
            return simpleHtml || '';
        }
        
        // For more complex content, use the original cleaning approach
        // Remove empty elements and unnecessary whitespace
        this.removeEmptyElements(tempDiv);
        
        // Get the cleaned HTML
        let cleanedHtml = tempDiv.innerHTML;
        
        // Remove common browser-added markup more aggressively
        cleanedHtml = cleanedHtml
            .replace(/<div><br><\/div>/g, '') // Remove empty divs with br
            .replace(/<div><\/div>/g, '') // Remove completely empty divs
            .replace(/<p><br><\/p>/g, '') // Remove empty paragraphs
            .replace(/<p><\/p>/g, '') // Remove completely empty paragraphs
            .replace(/<div>\s*<\/div>/g, '') // Remove divs with only whitespace
            .replace(/<p>\s*<\/p>/g, '') // Remove paragraphs with only whitespace
            .replace(/<span>\s*<\/span>/g, '') // Remove empty spans
            .replace(/<span[^>]*>\s*<\/span>/g, '') // Remove empty spans with attributes
            .replace(/<div[^>]*>\s*<\/div>/g, '') // Remove empty divs with attributes
            .replace(/\s*<br>\s*/g, '<br>') // Clean up br tags
            .replace(/<br>\s*<br>/g, '<br>') // Remove duplicate br tags
            .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/>\s+</g, '><') // Remove whitespace between tags
            .replace(/style="[^"]*"/g, '') // Remove all inline styles
            .replace(/class="[^"]*"/g, '') // Remove all classes
            .replace(/<font[^>]*>/g, '') // Remove font tags
            .replace(/<\/font>/g, '') // Remove font end tags
            .trim();
        
        // If the content is just whitespace or empty, return empty string
        if (!cleanedHtml || cleanedHtml === '<br>' || cleanedHtml === '<div><br></div>') {
            return '';
        }
        
        return cleanedHtml;
    }

    removeEmptyElements(element) {
        // Remove empty text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodesToRemove = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim() === '') {
                textNodesToRemove.push(node);
            }
        }
        
        textNodesToRemove.forEach(node => node.remove());
        
        // Remove empty elements recursively
        const children = Array.from(element.children);
        children.forEach(child => {
            this.removeEmptyElements(child);
            
            // Remove elements that are empty or only contain whitespace
            if (child.children.length === 0 && 
                (!child.textContent || child.textContent.trim() === '')) {
                child.remove();
            }
        });
    }
    
    // Alignment methods
    applyAlignment(alignment) {
        // Store the current selection/cursor position
        const selection = window.getSelection();
        const hasSelection = selection.rangeCount > 0 && !selection.isCollapsed;
        
        let command;
        switch (alignment) {
            case 'left':
                command = 'justifyLeft';
                break;
            case 'center':
                command = 'justifyCenter';
                break;
            case 'right':
                command = 'justifyRight';
                break;
            case 'justify':
                command = 'justifyFull';
                break;
            default:
                command = 'justifyLeft';
        }
        
        // Apply alignment command
        document.execCommand(command, false, null);
        
        // If there was no selection, ensure cursor stays in place and no extra content is added
        if (!hasSelection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // Clean up any empty elements that might have been created
            const currentNode = range.startContainer;
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
                // Remove any empty divs or paragraphs that might have been created
                const emptyElements = currentNode.querySelectorAll('div:empty, p:empty');
                emptyElements.forEach(el => {
                    if (el.childNodes.length === 0) {
                        el.remove();
                    }
                });
            }
        }
        
        this.updateFormattingState();
    }
    
    // Clear formatting method
    clearFormatting() {
        try {
            // Store annotation data before clearing
            const annotations = this.preserveAnnotationData();
            
            // Use the standard removeFormat command first
            document.execCommand('removeFormat', false, null);
            
            // Reset alignment to left
            document.execCommand('justifyLeft', false, null);
            
            // Reset font family to default
            document.execCommand('fontName', false, 'Inter');
            
            // Reset text color to default
            document.execCommand('foreColor', false, '#1e293b');
            
            // Remove any background color
            document.execCommand('hiliteColor', false, 'transparent');
            
            // Restore annotation styling
            this.restoreAnnotationData(annotations);
            
            // Update formatting state to reflect changes
            this.updateFormattingState();
            
            // Also reset the font family dropdown to default
            if (this.fontFamily) {
                this.fontFamily.value = 'Inter';
            }
        } catch (error) {
            console.error('Error in clearFormatting:', error);
            // Fallback to basic clear if there's an error
            document.execCommand('removeFormat', false, null);
            this.updateFormattingState();
        }
    }
    
    // Preserve annotation data before clearing formatting
    preserveAnnotationData() {
        const annotations = [];
        const annotatedElements = this.textEditor.querySelectorAll('.annotated-text');
        
        annotatedElements.forEach((element, index) => {
            const annotation = {
                id: element.dataset.annotationId,
                text: element.textContent,
                originalElement: element,
                style: element.style.cssText,
                className: element.className
            };
            
            // Add a temporary marker to find this text later
            element.setAttribute('data-temp-annotation-marker', index);
            annotations.push(annotation);
        });
        
        return annotations;
    }
    
    // Restore annotation styling after clearing formatting
    restoreAnnotationData(annotations) {
        annotations.forEach((annotation, index) => {
            // Find the element by the temporary marker
            let element = this.textEditor.querySelector(`[data-temp-annotation-marker="${index}"]`);
            
            if (!element) {
                // If marker was removed, try to find by text content and annotation ID
                const allElements = this.textEditor.querySelectorAll('*');
                for (let el of allElements) {
                    if (el.textContent === annotation.text && 
                        el.dataset.annotationId === annotation.id) {
                        element = el;
                        break;
                    }
                }
            }
            
            if (!element) {
                // Last resort: find any element with matching text content
                const walker = document.createTreeWalker(
                    this.textEditor,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let textNode;
                while (textNode = walker.nextNode()) {
                    if (textNode.textContent.includes(annotation.text)) {
                        // Wrap this text in a new annotation span
                        const span = document.createElement('span');
                        span.className = annotation.className;
                        span.style.cssText = annotation.style;
                        span.dataset.annotationId = annotation.id;
                        
                        const range = document.createRange();
                        const startIndex = textNode.textContent.indexOf(annotation.text);
                        range.setStart(textNode, startIndex);
                        range.setEnd(textNode, startIndex + annotation.text.length);
                        
                        try {
                            range.surroundContents(span);
                            // Re-add annotation event handlers
                            if (this.app.settingsManager) {
                                this.app.settingsManager.addAnnotationEvent(span, annotation.id);
                            }
                        } catch (e) {
                            console.warn('Could not restore annotation:', e);
                        }
                        break;
                    }
                }
            } else {
                // Restore the annotation properties
                element.className = annotation.className;
                element.style.cssText = annotation.style;
                element.dataset.annotationId = annotation.id;
                
                // Remove the temporary marker
                element.removeAttribute('data-temp-annotation-marker');
                
                // Re-add annotation event handlers
                if (this.app.settingsManager) {
                    this.app.settingsManager.addAnnotationEvent(element, annotation.id);
                }
            }
        });
    }
} 