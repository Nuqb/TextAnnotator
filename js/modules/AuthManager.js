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
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }
            
            // Hide popup immediately after successful login
            this.app.hideAuthPopups();
            
            // Manually set current user and update UI (since auth state change isn't firing)
            if (data.user) {
                this.currentUser = data.user;
                
                try {
                    this.app.updateAuthUI();
                    this.app.showDashboard();
                    
                    // Load documents in background (non-blocking)
                    this.app.loadUserDocuments().catch(docError => {
                        // Continue anyway
                    });
                } catch (uiError) {
                    // Continue anyway
                }
            }
            
            // Additional manual popup hiding (backup method)
            const allPopups = document.querySelectorAll('.auth-popup');
            allPopups.forEach(popup => {
                popup.style.display = 'none';
                popup.classList.remove('active');
            });
            
            DOMUtils.showMessage('Login successful!', 'success');
        } catch (error) {
            DOMUtils.showMessage(`Login failed: ${error.message}`, 'error');
        }
    }

    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        const btnContent = button.querySelector('.btn-content');
        
        if (isLoading) {
            button.classList.add('loading');
            if (btnContent) {
                btnContent.innerHTML = '<div class="loading-spinner"></div>';
            }
        } else {
            button.classList.remove('loading');
            if (btnContent) {
                btnContent.innerHTML = 'Create Account';
            }
        }
    }

    showPasswordError(show) {
        const errorElement = document.getElementById('passwordMatchError');
        if (errorElement) {
            errorElement.style.display = show ? 'block' : 'none';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        // Show loading state
        this.setButtonLoading('createAccountBtn', true);
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Clear any previous password error
        this.showPasswordError(false);
        
        // Basic validation
        if (!email || !password) {
            DOMUtils.showMessage('Please fill in all fields', 'error');
            this.setButtonLoading('createAccountBtn', false);
            return;
        }
        
        if (password !== confirmPassword) {
            this.showPasswordError(true);
            this.setButtonLoading('createAccountBtn', false);
            return;
        }
        
        if (password.length < 6) {
            DOMUtils.showMessage('Password must be at least 6 characters', 'error');
            this.setButtonLoading('createAccountBtn', false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            // Check if user was created (even if email confirmation is pending)
            if (data && (data.user || data.session)) {
                this.app.hideAuthPopups();
                
                if (data.session) {
                    // User is immediately logged in (email confirmation disabled)
                    DOMUtils.showMessage('Registration successful! You are now logged in.', 'success');
                    
                    // Set user and update UI like login
                    this.currentUser = data.user;
                    this.app.updateAuthUI();
                    
                    // Load documents in background (non-blocking like login)
                    this.app.loadUserDocuments().catch(docError => {
                        // Continue anyway
                    });
                    
                    this.app.showDashboard();
                } else {
                    // Email confirmation required
                    this.showEmailVerificationPopup(data.user.email);
                }
            } else {
                this.app.hideAuthPopups();
                DOMUtils.showMessage('Registration may have succeeded, but please check your email for verification.', 'warning');
            }
            
            // Hide loading state on success
            this.setButtonLoading('createAccountBtn', false);
        } catch (error) {
            let userMessage = 'Registration failed';
            
            if (error.message.includes('Email address') && error.message.includes('invalid')) {
                userMessage = 'This email address cannot be used. Try a different email or this account may already exist.';
            } else if (error.message.includes('rate limit') || error.message.includes('429')) {
                userMessage = 'Too many registration attempts. Please wait a few minutes and try again.';
            } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
                userMessage = 'This email is already registered. Try logging in instead.';
            } else {
                userMessage = `Registration failed: ${error.message}`;
            }
            
            DOMUtils.showMessage(userMessage, 'error');
            
            // Hide loading state on error
            this.setButtonLoading('createAccountBtn', false);
        }
    }

    logout() {
        
        // Clear local state immediately
        this.currentUser = null;
        
        // Clear app data
        if (this.app.documentManager) {
            this.app.documentManager.documents = [];
            this.app.documentManager.currentDocument = null;
        }
        if (this.app.annotationManager) {
            this.app.annotationManager.annotations = [];
        }
        
        // Update UI
        this.app.updateAuthUI();
        this.app.showEditorWithoutAuth();
        
        // Close account panel
        const accountPanel = document.getElementById('accountPanel');
        if (accountPanel) {
            accountPanel.classList.remove('open');
        }
        
        // Clear any stored auth tokens (optional - fire and forget)
        supabase.auth.signOut().catch(() => {
            // Don't care if this fails - we're already logged out locally
        });
        
        DOMUtils.showMessage('Logged out! 👋', 'success');
    }

    showLoginPopup() {
        DOMUtils.showPopup(document.getElementById('loginPopup'));
    }

    showRegisterPopup() {
        this.showPasswordError(false); // Clear any previous password error
        DOMUtils.showPopup(document.getElementById('registerPopup'));
    }

    hideAuthPopups() {
        const loginPopup = document.getElementById('loginPopup');
        const registerPopup = document.getElementById('registerPopup');
        
        this.showPasswordError(false); // Clear password error
        DOMUtils.hidePopup(loginPopup);
        DOMUtils.hidePopup(registerPopup);
    }

    hideLoginPopup() {
        DOMUtils.hidePopup(document.getElementById('loginPopup'));
    }

    hideRegisterPopup() {
        this.showPasswordError(false); // Clear password error when closing
        DOMUtils.hidePopup(document.getElementById('registerPopup'));
    }

    showEmailVerificationPopup(email) {
        // Set the email address in the popup
        const emailElement = document.getElementById('verificationEmail');
        if (emailElement) {
            emailElement.textContent = email;
        }
        
        // Show the popup
        DOMUtils.showPopup(document.getElementById('emailVerificationPopup'));
    }

    hideEmailVerificationPopup() {
        DOMUtils.hidePopup(document.getElementById('emailVerificationPopup'));
    }
} 