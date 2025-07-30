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
                // Continue with default settings
            }
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('annotationSettings', JSON.stringify(this.settings));
        } catch (error) {
            // Continue silently
        }
    }

    updateAnnotationStyles() {
        // Update existing annotations in the text editor
        const textEditor = this.app.textEditor;
        if (!textEditor) return;

        // Update existing annotation elements with new styles
        const existingAnnotations = textEditor.querySelectorAll('.annotated-text');
        existingAnnotations.forEach(element => {
            // Preserve existing text color if it exists
            const existingColor = element.style.color;
            const existingDataColor = element.getAttribute('data-text-color');
            
            // Clear all previous styling
            element.style.cssText = '';
            element.className = 'annotated-text';
            
            // Apply new annotation style
            const newStyle = this.getAnnotationStyle();
            element.style.cssText = newStyle + ' cursor: pointer; transition: all 0.2s;';
            
            // Restore text color if it existed before
            if (existingColor && existingColor !== '') {
                element.style.color = existingColor;
            }
            if (existingDataColor) {
                element.setAttribute('data-text-color', existingDataColor);
            }
            
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
                
                // Check if the text being annotated has existing color styling
                let existingColor = '';
                let existingDataColor = '';
                
                // Check if the text node is inside a colored element
                let parentElement = textNode.parentElement;
                while (parentElement && parentElement !== this.app.textEditor) {
                    if (parentElement.style.color) {
                        existingColor = parentElement.style.color;
                        break;
                    }
                    if (parentElement.getAttribute('data-text-color')) {
                        existingDataColor = parentElement.getAttribute('data-text-color');
                        break;
                    }
                    parentElement = parentElement.parentElement;
                }
                
                // Apply annotation style
                const style = this.getAnnotationStyle();
                annotationSpan.style.cssText = style + ' cursor: pointer; transition: all 0.2s;';
                
                // Preserve any existing text color
                if (existingColor) {
                    annotationSpan.style.color = existingColor;
                }
                if (existingDataColor) {
                    annotationSpan.setAttribute('data-text-color', existingDataColor);
                }
                
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
        if (element._annotationMouseDownHandler) {
            element.removeEventListener('mousedown', element._annotationMouseDownHandler);
        }
        if (element._annotationMouseUpHandler) {
            element.removeEventListener('mouseup', element._annotationMouseUpHandler);
        }
        
        // Track drag state for this element
        let isDragging = false;
        let dragStartTime = 0;
        
        // Mouse down handler to detect start of potential drag
        element._annotationMouseDownHandler = (e) => {
            isDragging = true;
            dragStartTime = Date.now();
        };
        element.addEventListener('mousedown', element._annotationMouseDownHandler);
        
        // Mouse up handler to detect end of drag
        element._annotationMouseUpHandler = (e) => {
            // Small delay to allow for quick clicks vs drags
            setTimeout(() => {
                isDragging = false;
            }, 50);
        };
        element.addEventListener('mouseup', element._annotationMouseUpHandler);
        
        if (this.settings.annotationTrigger === 'hover') {
            element._annotationHoverHandler = (e) => {
                // Don't show popup if user is dragging to select text
                if (isDragging || this.isUserSelecting()) {
                    return;
                }
                this.app.annotationManager.showAnnotationContext(annotationId);
            };
            element.addEventListener('mouseenter', element._annotationHoverHandler);
        } else {
            element._annotationClickHandler = (e) => {
                // Don't show popup if user is selecting text
                if (this.isUserSelecting()) {
                    return;
                }
                
                // Allow clicks, but prevent if it was a longer drag (> 200ms indicates dragging)
                const timeSinceMouseDown = Date.now() - dragStartTime;
                if (timeSinceMouseDown > 200) {
                    return;
                }
                
                e.preventDefault();
                this.app.annotationManager.showAnnotationContext(annotationId);
            };
            element.addEventListener('click', element._annotationClickHandler);
        }
        
        return element;
    }
    
    // Helper method to detect if user is currently selecting text
    isUserSelecting() {
        const selection = window.getSelection();
        return selection && selection.rangeCount > 0 && !selection.isCollapsed;
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