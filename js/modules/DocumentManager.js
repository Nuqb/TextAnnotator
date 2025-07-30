import { supabase } from '../config/supabase.js';
import { DOMUtils } from '../utils/dom.js';

export class DocumentManager {
    constructor(app) {
        this.app = app;
        this.documents = [];
        this.currentDocument = null;
    }

    async loadUserDocuments() {
        if (!this.app.authManager.currentUser) return;
        
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', this.app.authManager.currentUser.id)
                .order('updated_at', { ascending: false });
            
            if (error) throw error;
            
            this.documents = data || [];
        } catch (error) {
            console.error('Error loading documents:', error);
            DOMUtils.showMessage('Error loading your documents', 'error');
        }
    }

    renderDocumentsList() {
        const grid = document.getElementById('documentsGrid');
        if (!grid) return;

        // Clear existing documents (keep the "new document" card)
        const newDocCard = grid.querySelector('.new-document');
        grid.innerHTML = '';
        if (newDocCard) {
            grid.appendChild(newDocCard);
        }

        // Add document cards
        this.documents.forEach(doc => {
            const card = this.createDocumentCard(doc);
            grid.appendChild(card);
        });
    }

    createDocumentCard(doc) {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.dataset.documentId = doc.id;
        
        const preview = DOMUtils.getDocumentPreview(doc.content);
        const lastModified = new Date(doc.updated_at).toLocaleDateString();
        
        card.innerHTML = `
            <div class="document-content">
                <div class="document-icon">${doc.title.charAt(0).toUpperCase()}</div>
                <h3>${doc.title}</h3>
                <p>${preview}</p>
                <div class="document-meta">
                    <span>Modified ${lastModified}</span>
                    <span>${this.app.getAnnotationCount(doc.id)} annotations</span>
                </div>
                <div class="document-actions">
                    <button class="btn btn-secondary btn-sm edit-doc" onclick="event.stopPropagation();">Rename</button>
                    <button class="btn btn-danger btn-sm delete-doc" onclick="event.stopPropagation();">Delete</button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.openDocument(doc));
        
        // Add action listeners
        const editBtn = card.querySelector('.edit-doc');
        const deleteBtn = card.querySelector('.delete-doc');
        
        editBtn.addEventListener('click', () => this.renameDocument(doc));
        deleteBtn.addEventListener('click', () => this.deleteDocument(doc));
        
        return card;
    }

    async openDocument(doc) {
        this.currentDocument = doc;
        await this.app.loadDocumentContent();
        this.app.showEditor();
    }

    async loadDocumentContent() {
        if (!this.currentDocument) return;
        
        this.app.textEditor.innerHTML = this.currentDocument.content || '';
        this.app.documentTitle.value = this.currentDocument.title || 'Untitled Document';
    }

    async createNewDocument(e) {
        e.preventDefault();
        const title = document.getElementById('newDocumentTitle').value.trim();
        
        if (!title) {
            DOMUtils.showMessage('Please enter a document title', 'warning');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('documents')
                .insert([{
                    user_id: this.app.authManager.currentUser.id,
                    title: title,
                    content: ''
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            this.documents.unshift(data);
            this.app.hideNewDocumentPopup();
            this.openDocument(data);
            DOMUtils.showMessage('New document created!', 'success');
            
            // Clear form
            document.getElementById('newDocumentTitle').value = '';
        } catch (error) {
            console.error('Error creating document:', error);
            DOMUtils.showMessage('Error creating document', 'error');
        }
    }

    async updateDocumentTitle() {
        if (!this.currentDocument || !this.app.authManager.currentUser) return;
        
        const newTitle = this.app.documentTitle.value.trim();
        if (!newTitle || newTitle === this.currentDocument.title) return;
        
        try {
            const { error } = await supabase
                .from('documents')
                .update({ title: newTitle })
                .eq('id', this.currentDocument.id);
            
            if (error) throw error;
            
            this.currentDocument.title = newTitle;
            
            // Update in documents array
            const docIndex = this.documents.findIndex(d => d.id === this.currentDocument.id);
            if (docIndex !== -1) {
                this.documents[docIndex].title = newTitle;
            }
            
            DOMUtils.showMessage('Document title updated!', 'success');
        } catch (error) {
            console.error('Error updating document title:', error);
            DOMUtils.showMessage('Error updating title', 'error');
            // Revert title
            this.app.documentTitle.value = this.currentDocument.title;
        }
    }

    async renameDocument(doc) {
        const newTitle = prompt('Enter new title:', doc.title);
        if (!newTitle || newTitle.trim() === '') return;
        
        try {
            const { error } = await supabase
                .from('documents')
                .update({ title: newTitle.trim() })
                .eq('id', doc.id);
            
            if (error) throw error;
            
            doc.title = newTitle.trim();
            this.renderDocumentsList();
            DOMUtils.showMessage('Document renamed!', 'success');
        } catch (error) {
            console.error('Error renaming document:', error);
            DOMUtils.showMessage('Error renaming document', 'error');
        }
    }

    async deleteDocument(doc) {
        if (!confirm(`Are you sure you want to delete "${doc.title}"? This cannot be undone.`)) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', doc.id);
            
            if (error) throw error;
            
            // Remove from local array
            this.documents = this.documents.filter(d => d.id !== doc.id);
            
            // If this was the current document, clear it
            if (this.currentDocument && this.currentDocument.id === doc.id) {
                this.currentDocument = null;
                this.app.textEditor.innerHTML = '';
                this.app.showDashboard();
            }
            
            this.renderDocumentsList();
            DOMUtils.showMessage('Document deleted!', 'success');
        } catch (error) {
            console.error('Error deleting document:', error);
            DOMUtils.showMessage('Error deleting document', 'error');
        }
    }

    showNewDocumentPopup() {
        DOMUtils.showPopup(document.getElementById('newDocumentPopup'));
    }

    hideNewDocumentPopup() {
        DOMUtils.hidePopup(document.getElementById('newDocumentPopup'));
    }
} 