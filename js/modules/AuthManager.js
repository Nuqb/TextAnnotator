import { supabase } from '../config/supabase.js';
import { DOMUtils } from '../utils/dom.js';

export class AuthManager {
    constructor(app) {
        this.app = app;
        this.currentUser = null;
    }

    async initialize() {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this.app.updateAuthUI();
            await this.app.loadUserDocuments();
            this.app.showDashboard();
        } else {
            // Show guest state - they can still use the app but without cloud features
            this.app.showEditorWithoutAuth();
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.app.updateAuthUI();
                await this.app.loadUserDocuments();
                this.app.showDashboard();
                this.app.hideAuthPopups();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.app.currentDocument = null;
                this.app.documents = [];
                this.app.annotations = [];
                this.app.updateAuthUI();
                this.app.showEditorWithoutAuth();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            this.app.hideAuthPopups();
            DOMUtils.showMessage('Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            DOMUtils.showMessage(`Login failed: ${error.message}`, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const { error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;

            this.app.hideAuthPopups();
            DOMUtils.showMessage('Registration successful! Please check your email to verify your account.', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            DOMUtils.showMessage(`Registration failed: ${error.message}`, 'error');
        }
    }

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            DOMUtils.showMessage('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            DOMUtils.showMessage('Error logging out', 'error');
        }
    }

    showLoginPopup() {
        DOMUtils.showPopup(document.getElementById('loginPopup'));
    }

    showRegisterPopup() {
        DOMUtils.showPopup(document.getElementById('registerPopup'));
    }

    hideAuthPopups() {
        DOMUtils.hidePopup(document.getElementById('loginPopup'));
        DOMUtils.hidePopup(document.getElementById('registerPopup'));
    }

    hideLoginPopup() {
        DOMUtils.hidePopup(document.getElementById('loginPopup'));
    }

    hideRegisterPopup() {
        DOMUtils.hidePopup(document.getElementById('registerPopup'));
    }
} 