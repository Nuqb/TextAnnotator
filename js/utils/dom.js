// DOM utility functions
export class DOMUtils {
    static showPopup(popup) {
        if (popup) {
            popup.style.display = 'block';
            popup.classList.add('active');
        }
    }

    static hidePopup(popup) {
        if (popup) {
            popup.style.display = 'none';
            popup.classList.remove('active');
        }
    }

    static hideAllPopups() {
        const popups = document.querySelectorAll('.popup, .modal, .context-popup, .view-context-popup');
        popups.forEach(popup => this.hidePopup(popup));
    }

    static showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;

        // Add to page
        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);

        // Add click to dismiss
        messageDiv.addEventListener('click', () => {
            messageDiv.remove();
        });
    }

    static truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    static getDocumentPreview(content) {
        if (!content) return 'Empty document';
        
        // Strip HTML and get first few words
        const text = content.replace(/<[^>]*>/g, '').trim();
        const words = text.split(' ').slice(0, 10).join(' ');
        return words.length < text.length ? words + '...' : words;
    }
} 