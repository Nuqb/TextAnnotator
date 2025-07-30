export class SettingsManager {
    constructor(app) {
        this.app = app;
        this.settings = {
            annotationStyle: 'highlight', // 'highlight' or 'underline'
            annotationColor: '#fbbf24',
            annotationTrigger: 'click', // 'click' or 'hover'
            popupCloseMode: 'click-outside' // 'x-only' or 'click-outside'
        };
        this.loadSettings();
    }

    initialize() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Events are now handled through the popup in TextEditor.js
        // This method is kept for potential future use
    }

    updateUI() {
        const styleSelect = document.getElementById('annotationStyle');
        const colorInput = document.getElementById('annotationColor');
        const triggerSelect = document.getElementById('annotationTrigger');
        const closeModeSelect = document.getElementById('popupCloseMode');

        if (styleSelect) {
            styleSelect.value = this.settings.annotationStyle;
        }
        if (colorInput) {
            colorInput.value = this.settings.annotationColor;
        }
        if (triggerSelect) {
            triggerSelect.value = this.settings.annotationTrigger;
        }
        if (closeModeSelect) {
            closeModeSelect.value = this.settings.popupCloseMode;
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('annotationSettings');
        if (savedSettings) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            } catch (error) {
                console.error('Error loading annotation settings:', error);
            }
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('annotationSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving annotation settings:', error);
        }
    }

    updateAnnotationStyles() {
        // Update existing annotations in the text editor
        const textEditor = this.app.textEditor;
        if (!textEditor) return;

        // Update existing annotation elements with new styles
        const existingAnnotations = textEditor.querySelectorAll('.annotated-text');
        existingAnnotations.forEach(element => {
            // Clear all previous styling
            element.style.cssText = '';
            element.className = 'annotated-text';
            
            // Apply new style
            const newStyle = this.getAnnotationStyle();
            element.style.cssText = newStyle + ' cursor: pointer; transition: all 0.2s;';
            
            // Update event listeners
            const annotationId = element.dataset.annotationId;
            if (annotationId) {
                this.addAnnotationEvent(element, annotationId);
            }
        });
    }

    highlightTextInEditor(text, annotationId) {
        const textEditor = this.app.textEditor;
        if (!textEditor || !text) return;

        const walker = document.createTreeWalker(
            textEditor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const content = textNode.textContent;
            const index = content.indexOf(text);
            
            if (index !== -1) {
                const before = content.substring(0, index);
                const after = content.substring(index + text.length);
                
                const fragment = document.createDocumentFragment();
                
                if (before) {
                    fragment.appendChild(document.createTextNode(before));
                }
                
                const annotationSpan = document.createElement('span');
                annotationSpan.className = 'annotated-text';
                annotationSpan.dataset.annotationId = annotationId;
                annotationSpan.textContent = text;
                
                // Apply annotation style
                const style = this.getAnnotationStyle();
                annotationSpan.style.cssText = style + ' cursor: pointer; transition: all 0.2s;';
                
                // Add event to view annotation based on trigger setting
                this.addAnnotationEvent(annotationSpan, annotationId);
                
                fragment.appendChild(annotationSpan);
                
                if (after) {
                    fragment.appendChild(document.createTextNode(after));
                }
                
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    }

    getAnnotationStyle() {
        const color = this.settings.annotationColor;
        
        if (this.settings.annotationStyle === 'underline') {
            return `
                text-decoration: underline;
                text-decoration-color: ${color};
                text-decoration-thickness: 3px;
                text-underline-offset: 3px;
                text-decoration-skip-ink: none;
                background: transparent;
                padding: 2px 0;
            `;
        } else {
            // Highlight style - make it more visible with solid background
            const rgbaColor = this.hexToRgba(color, 0.3);
            return `
                background-color: ${rgbaColor};
                padding: 2px 4px;
                border-radius: 3px;
                text-decoration: none;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
            `;
        }
    }
    
    hexToRgba(hex, alpha) {
        // Convert hex color to rgba with specified alpha
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    addAnnotationEvent(element, annotationId) {
        // Store the event handler functions on the element to allow removal
        if (element._annotationClickHandler) {
            element.removeEventListener('click', element._annotationClickHandler);
        }
        if (element._annotationHoverHandler) {
            element.removeEventListener('mouseenter', element._annotationHoverHandler);
        }
        
        if (this.settings.annotationTrigger === 'hover') {
            element._annotationHoverHandler = (e) => {
                this.app.annotationManager.showAnnotationContext(annotationId);
            };
            element.addEventListener('mouseenter', element._annotationHoverHandler);
        } else {
            element._annotationClickHandler = (e) => {
                e.preventDefault();
                this.app.annotationManager.showAnnotationContext(annotationId);
            };
            element.addEventListener('click', element._annotationClickHandler);
        }
        
        return element;
    }

    updateAnnotationEvents() {
        // Update event listeners for all existing annotations
        const textEditor = this.app.textEditor;
        if (!textEditor) return;

        const existingAnnotations = textEditor.querySelectorAll('.annotated-text');
        existingAnnotations.forEach(element => {
            const annotationId = element.dataset.annotationId;
            if (annotationId) {
                this.addAnnotationEvent(element, annotationId);
            }
        });
    }

    getSettings() {
        return this.settings;
    }
} 