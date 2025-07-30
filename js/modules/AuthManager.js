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
            console.log('🔄 Auth state change:', event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in, updating UI...');
                this.currentUser = session.user;
                this.app.updateAuthUI();
                await this.app.loadUserDocuments();
                this.app.showDashboard();
                this.app.hideAuthPopups();
                console.log('🏠 Dashboard should be visible now');
            } else if (event === 'SIGNED_OUT') {
                console.log('❌ User signed out');
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
        console.log('🔐 Login attempt started...');
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        console.log('📧 Email:', email);
        console.log('🔑 Password length:', password.length);

        try {
            console.log('🚀 Calling Supabase auth...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            console.log('📊 Login response:', { data, error });

            if (error) {
                console.error('❌ Login error:', error);
                console.error('❌ Error details:', error.message, error.status);
                throw error;
            }
            
            console.log('🎯 Login response successful, proceeding with UI updates...');

            console.log('✅ Login successful, manually updating UI...');
            
            // Hide popup immediately after successful login
            console.log('🎯 Login successful - hiding popup immediately!');
            console.log('🚫 Hiding login popup...');
            this.app.hideAuthPopups();
            
            // Manually set current user and update UI (since auth state change isn't firing)
            if (data.user) {
                console.log('👤 Setting current user:', data.user.email);
                this.currentUser = data.user;
                
                try {
                    console.log('🔄 Manually calling updateAuthUI...');
                    this.app.updateAuthUI();
                    
                    console.log('🏠 Manually calling showDashboard...');
                    this.app.showDashboard();
                    
                    // Load documents in background (non-blocking)
                    console.log('📋 Loading user documents in background...');
                    this.app.loadUserDocuments().catch(docError => {
                        console.warn('⚠️ Background document loading failed:', docError.message);
                    });
                    
                    console.log('✅ All UI updates completed successfully');
                } catch (uiError) {
                    console.error('❌ Error during UI updates:', uiError);
                }
            } else {
                console.warn('⚠️ No user data in login response');
            }
            
            // Additional manual popup hiding (backup method)
            console.log('🔧 Trying direct popup hiding...');
            const allPopups = document.querySelectorAll('.auth-popup');
            allPopups.forEach(popup => {
                console.log('👁️ Found popup:', popup);
                popup.style.display = 'none';
                popup.classList.remove('active');
            });
            
            DOMUtils.showMessage('Login successful!', 'success');
        } catch (error) {
            console.error('❌ Login failed:', error);
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
        console.log('📝 Registration attempt started...');
        
        // Show loading state
        this.setButtonLoading('createAccountBtn', true);
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        console.log('📧 Email:', email);
        console.log('🔑 Password length:', password.length);
        
        // Clear any previous password error
        this.showPasswordError(false);
        
        // Basic validation
        if (!email || !password) {
            console.error('❌ Missing email or password');
            DOMUtils.showMessage('Please fill in all fields', 'error');
            this.setButtonLoading('createAccountBtn', false);
            return;
        }
        
        if (password !== confirmPassword) {
            console.error('❌ Passwords do not match');
            this.showPasswordError(true);
            this.setButtonLoading('createAccountBtn', false);
            return;
        }
        
        if (password.length < 6) {
            console.error('❌ Password too short');
            DOMUtils.showMessage('Password must be at least 6 characters', 'error');
            this.setButtonLoading('createAccountBtn', false);
            return;
        }

        try {
            console.log('🚀 Calling Supabase signup...');
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });
            
            console.log('📊 Registration response:', { data, error });

            if (error) {
                console.error('❌ Registration error:', error);
                throw error;
            }

            // Check if user was created (even if email confirmation is pending)
            if (data && (data.user || data.session)) {
                console.log('✅ Registration successful!');
                console.log('👤 User created:', data.user?.email);
                console.log('📧 Email confirmation required:', !data.session);
                
                this.app.hideAuthPopups();
                
                if (data.session) {
                    // User is immediately logged in (email confirmation disabled)
                    console.log('🎉 User logged in immediately');
                    DOMUtils.showMessage('Registration successful! You are now logged in.', 'success');
                    
                    // Set user and update UI like login
                    this.currentUser = data.user;
                    this.app.updateAuthUI();
                    
                    // Load documents in background (non-blocking like login)
                    this.app.loadUserDocuments().catch(docError => {
                        console.warn('⚠️ Background document loading failed:', docError.message);
                    });
                    
                    this.app.showDashboard();
                } else {
                    // Email confirmation required
                    console.log('📨 Email verification required');
                    this.showEmailVerificationPopup(data.user.email);
                }
            } else {
                console.warn('⚠️ Unexpected registration response format');
                this.app.hideAuthPopups();
                DOMUtils.showMessage('Registration may have succeeded, but please check your email for verification.', 'warning');
            }
            
            // Hide loading state on success
            this.setButtonLoading('createAccountBtn', false);
        } catch (error) {
            console.error('❌ Registration failed:', error);
            
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
        console.log('🚪 Simple logout - clearing everything locally...');
        
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
        console.log('✅ Logout complete!');
    }

    showLoginPopup() {
        DOMUtils.showPopup(document.getElementById('loginPopup'));
    }

    showRegisterPopup() {
        this.showPasswordError(false); // Clear any previous password error
        DOMUtils.showPopup(document.getElementById('registerPopup'));
    }

    hideAuthPopups() {
        console.log('🚫 hideAuthPopups() called');
        const loginPopup = document.getElementById('loginPopup');
        const registerPopup = document.getElementById('registerPopup');
        
        console.log('📋 Login popup element:', loginPopup);
        console.log('📋 Register popup element:', registerPopup);
        
        this.showPasswordError(false); // Clear password error
        DOMUtils.hidePopup(loginPopup);
        DOMUtils.hidePopup(registerPopup);
        
        console.log('✅ Auth popups should be hidden now');
    }

    hideLoginPopup() {
        DOMUtils.hidePopup(document.getElementById('loginPopup'));
    }

    hideRegisterPopup() {
        this.showPasswordError(false); // Clear password error when closing
        DOMUtils.hidePopup(document.getElementById('registerPopup'));
    }

    showEmailVerificationPopup(email) {
        console.log('📧 Showing email verification popup for:', email);
        
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