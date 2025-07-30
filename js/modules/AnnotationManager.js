import { supabase } from '../config/supabase.js';
import { DOMUtils } from '../utils/dom.js';

export class AnnotationManager {
    constructor(app) {
        this.app = app;
        this.annotations = [];
        this.currentSelection = null;
        this.currentAnnotationId = null;
        this.annotationCounter = 1;
    }

    async loadAnnotations() {
        if (!this.app.documentManager.currentDocument) return;
        
        try {
            const { data, error } = await supabase
                .from('annotations')
                .select('*')
                .eq('document_id', this.app.documentManager.currentDocument.id)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            this.annotations = data || [];
            this.renderAnnotationsList();
            
            // Apply annotation styling to existing text
            this.annotations.forEach(annotation => {
                this.app.settingsManager.highlightTextInEditor(annotation.text, annotation.id);
            });
        } catch (error) {
            console.error('Error loading annotations:', error);
            DOMUtils.showMessage('Error loading annotations', 'error');
        }
    }

    handleTextSelection() {
        const selection = window.getSelection();
        const addContextBtn = document.getElementById('addContextBtn');
        
        const selectedText = selection.toString().trim();
        console.log('Text selection detected:', selectedText);
        
        if (!selectedText) {
            this.currentSelection = null;
            // Disable the button when no text is selected
            if (addContextBtn) {
                addContextBtn.disabled = true;
            }
            return;
        }
        
        if (!this.isSelectionInEditor(selection)) {
            console.log('Selection is outside editor');
            this.currentSelection = null;
            // Disable the button when selection is outside editor
            if (addContextBtn) {
                addContextBtn.disabled = true;
            }
            return;
        }
        
        // Just store the selection, don't show popup automatically
        this.currentSelection = selection;
        console.log('Selection stored:', selectedText);
        
        // Enable the "Add Context" button if user is authenticated
        if (addContextBtn && this.app.authManager.currentUser) {
            addContextBtn.disabled = false;
        }
    }

    isSelectionInEditor(selection) {
        if (selection.rangeCount === 0) return false;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Check if selection is within the text editor
        const textEditor = this.app.textEditor;
        if (!textEditor) return false;
        
        // If container is a text node, get its parent element
        const element = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
        
        return textEditor.contains(element);
    }

    showContextPopup() {
        if (!this.currentSelection || !this.app.authManager.currentUser) {
            console.log('Cannot show context popup: no selection or user not authenticated');
            return;
        }
        
        const selectedText = this.currentSelection.toString();
        console.log('Showing context popup for selection:', selectedText);
        
        // Store the selected text as a backup
        this.backupSelectedText = selectedText;
        
        const popup = document.getElementById('contextPopup');
        const textInput = document.getElementById('contextInput');
        
        // Add selected text display to the popup
        let selectedTextDisplay = popup.querySelector('.selected-text-display');
        if (!selectedTextDisplay) {
            selectedTextDisplay = document.createElement('div');
            selectedTextDisplay.className = 'selected-text-display';
            selectedTextDisplay.style.cssText = 'background: #f3f4f6; padding: 0.5rem; border-radius: 4px; margin-bottom: 1rem; font-style: italic; color: #374151;';
            
            // Insert at the beginning of popup-content
            const popupContent = popup.querySelector('.popup-content');
            popupContent.insertBefore(selectedTextDisplay, popupContent.firstChild);
        }
        selectedTextDisplay.textContent = `Selected: "${selectedText}"`;
        
        if (textInput) {
            textInput.value = '';
            textInput.focus();
        }
        
        DOMUtils.showPopup(popup);
    }

    hideContextPopup() {
        const popup = document.getElementById('contextPopup');
        const selectedTextDisplay = popup.querySelector('.selected-text-display');
        if (selectedTextDisplay) {
            selectedTextDisplay.remove();
        }
        DOMUtils.hidePopup(popup);
    }

    async saveAnnotation() {
        console.log('Save annotation called');
        console.log('Current selection:', this.currentSelection);
        console.log('Current user:', this.app.authManager.currentUser);
        console.log('Current document:', this.app.documentManager.currentDocument);
        
        if (!this.currentSelection) {
            console.log('Save annotation failed: missing selection');
            if (this.backupSelectedText) {
                console.log('Using backup selected text:', this.backupSelectedText);
                // Create a mock selection object for saving
                this.currentSelection = {
                    toString: () => this.backupSelectedText
                };
            } else {
                DOMUtils.showMessage('No text selected. Please select text first.', 'warning');
                return;
            }
        }
        
        if (!this.app.authManager.currentUser) {
            console.log('Save annotation failed: user not authenticated');
            DOMUtils.showMessage('Please log in to save annotations.', 'warning');
            return;
        }
        
        if (!this.app.documentManager.currentDocument) {
            console.log('Save annotation failed: no current document');
            DOMUtils.showMessage('No document is currently open.', 'warning');
            return;
        }
        
        const contextTextElement = document.getElementById('contextInput');
        if (!contextTextElement) {
            DOMUtils.showMessage('Context input not found', 'error');
            return;
        }
        const contextText = contextTextElement.value.trim();
        if (!contextText) {
            DOMUtils.showMessage('Please enter some context', 'warning');
            return;
        }
        
        const selectedText = this.currentSelection.toString();
        console.log('Selected text:', selectedText);
        console.log('Selected text length:', selectedText.length);
        
        if (!selectedText.trim()) {
            DOMUtils.showMessage('No text selected for annotation', 'warning');
            return;
        }
        
        const position = this.getSelectionPosition();
        
        try {
            const { data, error } = await supabase
                .from('annotations')
                .insert([{
                    document_id: this.app.documentManager.currentDocument.id,
                    text: selectedText,
                    context: contextText,
                    position: position
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('Saved annotation data:', data);
            
            this.annotations.push(data);
            this.renderAnnotationsList();
            
            // Apply annotation styling to the text
            this.app.settingsManager.highlightTextInEditor(selectedText, data.id);
            
            // Clear selection and hide popup
            if (this.currentSelection && this.currentSelection.removeAllRanges) {
                this.currentSelection.removeAllRanges();
            }
            this.currentSelection = null;
            this.backupSelectedText = null; // Clear backup text
            this.hideContextPopup();
            
            DOMUtils.showMessage('Annotation saved!', 'success');
        } catch (error) {
            console.error('Error saving annotation:', error);
            DOMUtils.showMessage('Error saving annotation', 'error');
        }
    }

    getSelectionPosition() {
        if (!this.currentSelection) return 0;
        
        // If we're using backup text (mock selection object), return 0 for position
        if (this.currentSelection.toString && !this.currentSelection.getRangeAt) {
            return 0;
        }
        
        if (this.currentSelection.rangeCount === 0) return 0;
        
        const range = this.currentSelection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.app.textEditor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
    }

    handleAnnotationClick(e) {
        const annotationId = e.currentTarget.dataset.annotationId;
        this.showAnnotationContext(annotationId);
    }

    showAnnotationContext(annotationId) {
        const annotation = this.annotations.find(a => a.id == annotationId);
        if (!annotation) return;
        
        const popup = document.getElementById('viewContextPopup');
        const textElement = document.getElementById('viewSelectedText');
        const contextElement = document.getElementById('viewContextText');
        
        if (textElement) {
            textElement.textContent = annotation.text;
        }
        if (contextElement) {
            contextElement.value = annotation.context;
            
            // Add auto-save functionality
            this.setupAutoSave(contextElement, annotationId);
        }
        
        // Reset popup position to center before showing
        this.resetPopupPosition(popup);
        
        // Setup drag functionality
        this.setupPopupDrag(popup);
        
        // Setup close behavior based on settings
        this.setupPopupCloseBehavior(popup);
        
        this.currentAnnotationId = annotationId;
        DOMUtils.showPopup(popup);
    }

    setupAutoSave(textarea, annotationId) {
        // Remove existing event listeners
        textarea.removeEventListener('input', textarea._autoSaveHandler);
        textarea.removeEventListener('blur', textarea._autoSaveHandler);
        
        // Create debounced save function
        let saveTimeout;
        textarea._autoSaveHandler = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.saveAnnotationEdit(annotationId, textarea.value);
            }, 1000); // Auto-save after 1 second of no typing
        };
        
        // Save on input and when losing focus
        textarea.addEventListener('input', textarea._autoSaveHandler);
        textarea.addEventListener('blur', () => {
            clearTimeout(saveTimeout);
            this.saveAnnotationEdit(annotationId, textarea.value);
        });
    }

    async saveAnnotationEdit(annotationId, newContext) {
        try {
            const annotation = this.annotations.find(a => a.id == annotationId);
            if (!annotation || annotation.context === newContext) return;

            // Update local annotation
            annotation.context = newContext;

            // Update in database
            const { error } = await supabase
                .from('annotations')
                .update({ context: newContext })
                .eq('id', annotationId);

            if (error) {
                console.error('Error updating annotation:', error);
                DOMUtils.showMessage('Failed to save changes', 'error');
                return;
            }

            // Update the annotations list display
            this.renderAnnotationsList();
            
            // Show brief success indication
            this.showSaveIndicator();

        } catch (error) {
            console.error('Error saving annotation edit:', error);
            DOMUtils.showMessage('Failed to save changes', 'error');
        }
    }

    showSaveIndicator() {
        // Show a subtle save indicator
        const textarea = document.getElementById('viewContextText');
        if (textarea) {
            textarea.style.borderLeftColor = '#10b981';
            setTimeout(() => {
                textarea.style.borderLeftColor = '';
            }, 1000);
        }
    }

    resetPopupPosition(popup) {
        // Reset to center position
        popup.style.left = '';
        popup.style.top = '';
        popup.style.transform = 'translate(-50%, -50%)';
        popup._isDragging = false;
    }

    setupPopupDrag(popup) {
        const header = popup.querySelector('.popup-header');
        if (!header || header._dragSetup) return; // Avoid duplicate setup
        
        header._dragSetup = true;
        let isDragging = false;
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let xOffset = 0;
        let yOffset = 0;

        // Mouse events
        header.addEventListener('mousedown', (e) => this.dragStart(e, popup));
        document.addEventListener('mousemove', (e) => this.dragMove(e, popup));
        document.addEventListener('mouseup', () => this.dragEnd(popup));

        // Touch events for mobile
        header.addEventListener('touchstart', (e) => this.dragStart(e, popup), { passive: true });
        document.addEventListener('touchmove', (e) => this.dragMove(e, popup), { passive: true });
        document.addEventListener('touchend', () => this.dragEnd(popup));
    }

    dragStart(e, popup) {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        popup._isDragging = true;
        
        // Get current position
        const rect = popup.getBoundingClientRect();
        
        // Store the offset from mouse to popup's top-left corner
        popup._dragOffsetX = clientX - rect.left;
        popup._dragOffsetY = clientY - rect.top;
        
        popup.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }

    dragMove(e, popup) {
        if (!popup._isDragging) return;
        
        e.preventDefault();
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        // Calculate new position based on mouse position minus the drag offset
        let newX = clientX - popup._dragOffsetX;
        let newY = clientY - popup._dragOffsetY;
        
        // Constrain to viewport
        const maxX = window.innerWidth - popup.offsetWidth;
        const maxY = window.innerHeight - popup.offsetHeight;
        
        newX = Math.max(0, Math.min(maxX, newX));
        newY = Math.max(0, Math.min(maxY, newY));
        
        // Set position using top/left instead of transform to avoid conflicts
        popup.style.left = newX + 'px';
        popup.style.top = newY + 'px';
        popup.style.transform = 'none'; // Remove the centering transform
    }

    dragEnd(popup) {
        if (!popup._isDragging) return;
        
        popup._isDragging = false;
        popup.style.cursor = '';
        document.body.style.userSelect = '';
    }

    setupPopupCloseBehavior(popup) {
        // Remove existing outside click listener if it exists
        if (popup._outsideClickHandler) {
            document.removeEventListener('click', popup._outsideClickHandler);
            popup._outsideClickHandler = null;
        }

        const closeMode = this.app.settingsManager.settings.popupCloseMode;
        
        if (closeMode === 'click-outside') {
            // Add outside click listener
            popup._outsideClickHandler = (e) => {
                // Don't close if clicking inside the popup or if dragging
                if (popup.contains(e.target) || popup._isDragging) return;
                
                // Don't close if clicking on an annotation (which might trigger this popup)
                if (e.target.closest('.annotated-text')) return;
                
                this.closeAnnotationPopup();
            };
            
            // Add listener with a small delay to prevent immediate closing
            setTimeout(() => {
                document.addEventListener('click', popup._outsideClickHandler);
            }, 100);
        }
    }

    closeAnnotationPopup() {
        const popup = document.getElementById('viewContextPopup');
        DOMUtils.hidePopup(popup);
        
        // Clean up outside click listener
        if (popup._outsideClickHandler) {
            document.removeEventListener('click', popup._outsideClickHandler);
            popup._outsideClickHandler = null;
        }
    }



    async deleteAnnotation() {
        if (!this.currentAnnotationId) return;
        
        if (!confirm('Are you sure you want to delete this annotation?')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('annotations')
                .delete()
                .eq('id', this.currentAnnotationId);
            
            if (error) throw error;
            
            // Get the annotation before removing it
            const deletedAnnotation = this.annotations.find(a => a.id == this.currentAnnotationId);
            
            // Remove from local array
            this.annotations = this.annotations.filter(a => a.id != this.currentAnnotationId);
            
            // Remove annotation styling from text
            if (deletedAnnotation) {
                const textEditor = this.app.textEditor;
                const annotationElements = textEditor.querySelectorAll(`[data-annotation-id="${this.currentAnnotationId}"]`);
                annotationElements.forEach(element => {
                    const text = element.textContent;
                    const parent = element.parentNode;
                    parent.replaceChild(document.createTextNode(text), element);
                    parent.normalize();
                });
            }
            
            this.renderAnnotationsList();
            DOMUtils.hidePopup(document.getElementById('viewContextPopup'));
            DOMUtils.showMessage('Annotation deleted!', 'success');
        } catch (error) {
            console.error('Error deleting annotation:', error);
            DOMUtils.showMessage('Error deleting annotation', 'error');
        }
    }

    renderAnnotationsList() {
        const container = document.getElementById('annotationsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.annotations.length === 0) {
            container.innerHTML = '<p class="no-annotations">No annotations yet. Select text to add context.</p>';
            return;
        }
        
        this.annotations.forEach(annotation => {
            const item = document.createElement('div');
            item.className = 'annotation-item';
            item.dataset.annotationId = annotation.id;
            
            const truncatedText = DOMUtils.truncateText(annotation.text, 100);
            const truncatedContext = DOMUtils.truncateText(annotation.context, 150);
            
            item.innerHTML = `
                <div class="annotation-text">
                    <strong>Selected:</strong> "${truncatedText}"
                </div>
                <div class="annotation-context">
                    <strong>Context:</strong> ${truncatedContext}
                </div>
            `;
            
            item.addEventListener('click', (e) => this.handleAnnotationClick(e));
            container.appendChild(item);
        });
    }

    getAnnotationCount(documentId) {
        return this.annotations.filter(a => a.document_id === documentId).length;
    }
} 