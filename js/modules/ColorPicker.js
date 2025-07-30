export class ColorPicker {
    constructor() {
        this.currentColor = '#000000';
        this.colorPickerPopup = null;
        this.advancedColorPickerPopup = null;
        this.colorCanvas = null;
        this.hueSlider = null;
        this.colorCanvasCursor = null;
        this.hueSliderCursor = null;
        this.colorPreview = null;
        this.currentHue = 0;
        this.currentSaturation = 100;
        this.currentLightness = 0;
        this.onColorSelected = null;
        
        this.initialize();
    }

    initialize() {
        this.colorPickerPopup = document.getElementById('colorPickerPopup');
        this.advancedColorPickerPopup = document.getElementById('advancedColorPickerPopup');
        this.colorCanvas = document.getElementById('colorCanvas');
        this.hueSlider = document.getElementById('hueSlider');
        this.colorCanvasCursor = document.getElementById('colorCanvasCursor');
        this.hueSliderCursor = document.getElementById('hueSliderCursor');
        this.colorPreview = document.getElementById('colorPreview');
        
        // Ensure all popups are completely hidden on initialization
        if (this.colorPickerPopup) {
            this.colorPickerPopup.classList.remove('active');
            this.colorPickerPopup.style.display = 'none';
            this.colorPickerPopup.style.visibility = 'hidden';
        }
        if (this.advancedColorPickerPopup) {
            this.advancedColorPickerPopup.classList.remove('active');
            this.advancedColorPickerPopup.style.display = 'none';
            this.advancedColorPickerPopup.style.visibility = 'hidden';
        }
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        this.bindEvents();
        // Don't initialize canvases until needed
    }

    bindEvents() {
        // Basic color picker events
        document.getElementById('closeColorPicker')?.addEventListener('click', () => this.hideAllPopups());
        
        // Preset color selection
        const colorItems = document.querySelectorAll('.color-item');
        colorItems.forEach(item => {
            item.addEventListener('click', () => {
                const color = item.dataset.color;
                this.selectColor(color);
            });
        });
        
        // Custom color button
        document.getElementById('customColorBtn')?.addEventListener('click', () => this.showAdvancedColorPicker());
        
        // Advanced color picker events
        document.getElementById('closeAdvancedColorPicker')?.addEventListener('click', () => this.hideAllPopups());
        document.getElementById('cancelAdvancedColor')?.addEventListener('click', () => this.hideAllPopups());
        document.getElementById('applyAdvancedColor')?.addEventListener('click', () => this.applyAdvancedColor());
        
        // Close popups when clicking overlay
        document.getElementById('overlay')?.addEventListener('click', () => this.hideAllPopups());
        
        // Canvas interactions
        if (this.colorCanvas) {
            this.colorCanvas.addEventListener('mousedown', (e) => this.startColorCanvasDrag(e));
            this.colorCanvas.addEventListener('click', (e) => this.updateColorFromCanvas(e));
        }
        
        if (this.hueSlider) {
            this.hueSlider.addEventListener('mousedown', (e) => this.startHueDrag(e));
            this.hueSlider.addEventListener('click', (e) => this.updateHueFromSlider(e));
        }
        
        // Input field events
        document.getElementById('hexInput')?.addEventListener('input', (e) => this.updateFromHexInput(e));
        document.getElementById('redInput')?.addEventListener('input', () => this.updateFromRGBInputs());
        document.getElementById('greenInput')?.addEventListener('input', () => this.updateFromRGBInputs());
        document.getElementById('blueInput')?.addEventListener('input', () => this.updateFromRGBInputs());
        
        // Eyedropper button
        document.getElementById('eyedropperBtn')?.addEventListener('click', () => this.startEyedropper());
    }

    initializeCanvases() {
        this.drawHueSlider();
        this.drawColorCanvas();
        this.updateColorPreview();
    }

    showColorPicker(onColorSelected) {
        console.log('ColorPicker: showColorPicker called');
        this.onColorSelected = onColorSelected;
        
        // Force hide ALL popups first - be very explicit
        this.hideAllPopups();
        
        // Double-check advanced popup is definitely hidden
        if (this.advancedColorPickerPopup) {
            console.log('ColorPicker: Hiding advanced popup');
            this.advancedColorPickerPopup.classList.remove('active');
            this.advancedColorPickerPopup.style.display = 'none';
            this.advancedColorPickerPopup.style.visibility = 'hidden';
        }
        
        // Show only the basic popup
        if (this.colorPickerPopup) {
            console.log('ColorPicker: Showing basic popup');
            // Clear any inline styles that might interfere
            this.colorPickerPopup.style.display = '';
            this.colorPickerPopup.style.visibility = '';
            // Add active class to show it
            this.colorPickerPopup.classList.add('active');
            document.getElementById('overlay').style.display = 'block';
        }
        
        // Log what's actually visible
        setTimeout(() => {
            const basicVisible = this.colorPickerPopup?.classList.contains('active');
            const advancedVisible = this.advancedColorPickerPopup?.classList.contains('active');
            console.log(`ColorPicker: Basic visible: ${basicVisible}, Advanced visible: ${advancedVisible}`);
        }, 100);
    }

    hideColorPicker() {
        if (this.colorPickerPopup) {
            this.colorPickerPopup.classList.remove('active');
        }
        document.getElementById('overlay').style.display = 'none';
    }

    showAdvancedColorPicker() {
        console.log('ColorPicker: showAdvancedColorPicker called - this should only happen when Custom button is clicked');
        
        // Hide basic popup first
        this.hideColorPicker();
        
        // Make sure basic popup is definitely hidden
        if (this.colorPickerPopup) {
            this.colorPickerPopup.classList.remove('active');
        }
        
        // Show advanced popup
        if (this.advancedColorPickerPopup) {
            console.log('ColorPicker: Showing advanced popup');
            // Clear any inline styles that might interfere
            this.advancedColorPickerPopup.style.display = '';
            this.advancedColorPickerPopup.style.visibility = '';
            // Add active class to show it
            this.advancedColorPickerPopup.classList.add('active');
            document.getElementById('overlay').style.display = 'block';
            this.initializeCanvases();
        }
    }

    hideAdvancedColorPicker() {
        if (this.advancedColorPickerPopup) {
            this.advancedColorPickerPopup.classList.remove('active');
        }
        document.getElementById('overlay').style.display = 'none';
    }
    
    hideAllPopups() {
        if (this.colorPickerPopup) {
            this.colorPickerPopup.classList.remove('active');
            this.colorPickerPopup.style.display = 'none';
            this.colorPickerPopup.style.visibility = 'hidden';
        }
        if (this.advancedColorPickerPopup) {
            this.advancedColorPickerPopup.classList.remove('active');
            this.advancedColorPickerPopup.style.display = 'none';
            this.advancedColorPickerPopup.style.visibility = 'hidden';
        }
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    selectColor(color) {
        this.currentColor = color;
        if (this.onColorSelected) {
            this.onColorSelected(color);
        }
        this.hideAllPopups();
    }

    applyAdvancedColor() {
        if (this.onColorSelected) {
            this.onColorSelected(this.currentColor);
        }
        this.hideAllPopups();
    }

    drawHueSlider() {
        if (!this.hueSlider) return;
        
        const ctx = this.hueSlider.getContext('2d');
        const width = this.hueSlider.width;
        const height = this.hueSlider.height;
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'hsl(0, 100%, 50%)');
        gradient.addColorStop(1/6, 'hsl(60, 100%, 50%)');
        gradient.addColorStop(2/6, 'hsl(120, 100%, 50%)');
        gradient.addColorStop(3/6, 'hsl(180, 100%, 50%)');
        gradient.addColorStop(4/6, 'hsl(240, 100%, 50%)');
        gradient.addColorStop(5/6, 'hsl(300, 100%, 50%)');
        gradient.addColorStop(1, 'hsl(360, 100%, 50%)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    drawColorCanvas() {
        if (!this.colorCanvas) return;
        
        const ctx = this.colorCanvas.getContext('2d');
        const width = this.colorCanvas.width;
        const height = this.colorCanvas.height;
        
        // Fill with current hue
        ctx.fillStyle = `hsl(${this.currentHue}, 100%, 50%)`;
        ctx.fillRect(0, 0, width, height);
        
        // Add white gradient (left to right)
        const whiteGradient = ctx.createLinearGradient(0, 0, width, 0);
        whiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        whiteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = whiteGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add black gradient (top to bottom)
        const blackGradient = ctx.createLinearGradient(0, 0, 0, height);
        blackGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        blackGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = blackGradient;
        ctx.fillRect(0, 0, width, height);
    }

    updateColorFromCanvas(e) {
        const rect = this.colorCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const saturation = (x / this.colorCanvas.width) * 100;
        const lightness = 100 - (y / this.colorCanvas.height) * 100;
        
        this.currentSaturation = Math.max(0, Math.min(100, saturation));
        this.currentLightness = Math.max(0, Math.min(100, lightness));
        
        this.updateColorPreview();
        this.updateCanvasCursor(x, y);
    }

    updateHueFromSlider(e) {
        const rect = this.hueSlider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        this.currentHue = (x / this.hueSlider.width) * 360;
        this.currentHue = Math.max(0, Math.min(360, this.currentHue));
        
        this.drawColorCanvas();
        this.updateColorPreview();
        this.updateHueCursor(x);
    }

    startColorCanvasDrag(e) {
        const handleMouseMove = (e) => this.updateColorFromCanvas(e);
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        this.updateColorFromCanvas(e);
    }

    startHueDrag(e) {
        const handleMouseMove = (e) => this.updateHueFromSlider(e);
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        this.updateHueFromSlider(e);
    }

    updateCanvasCursor(x, y) {
        if (this.colorCanvasCursor) {
            this.colorCanvasCursor.style.left = x + 'px';
            this.colorCanvasCursor.style.top = y + 'px';
        }
    }

    updateHueCursor(x) {
        if (this.hueSliderCursor) {
            this.hueSliderCursor.style.left = x + 'px';
        }
    }

    updateColorPreview() {
        // Convert HSL to RGB
        const rgb = this.hslToRgb(this.currentHue, this.currentSaturation, this.currentLightness);
        this.currentColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        
        if (this.colorPreview) {
            this.colorPreview.style.backgroundColor = this.currentColor;
        }
        
        // Update input fields
        this.updateInputFields();
    }

    updateInputFields() {
        const rgb = this.hexToRgb(this.currentColor);
        
        const hexInput = document.getElementById('hexInput');
        const redInput = document.getElementById('redInput');
        const greenInput = document.getElementById('greenInput');
        const blueInput = document.getElementById('blueInput');
        
        if (hexInput) hexInput.value = this.currentColor;
        if (redInput) redInput.value = rgb.r;
        if (greenInput) greenInput.value = rgb.g;
        if (blueInput) blueInput.value = rgb.b;
    }

    updateFromHexInput(e) {
        const hex = e.target.value;
        if (this.isValidHex(hex)) {
            this.currentColor = hex;
            const rgb = this.hexToRgb(hex);
            const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            
            this.currentHue = hsl.h;
            this.currentSaturation = hsl.s;
            this.currentLightness = hsl.l;
            
            this.drawColorCanvas();
            this.updateColorPreview();
        }
    }

    updateFromRGBInputs() {
        const redInput = document.getElementById('redInput');
        const greenInput = document.getElementById('greenInput');
        const blueInput = document.getElementById('blueInput');
        
        if (redInput && greenInput && blueInput) {
            const r = parseInt(redInput.value) || 0;
            const g = parseInt(greenInput.value) || 0;
            const b = parseInt(blueInput.value) || 0;
            
            this.currentColor = this.rgbToHex(r, g, b);
            const hsl = this.rgbToHsl(r, g, b);
            
            this.currentHue = hsl.h;
            this.currentSaturation = hsl.s;
            this.currentLightness = hsl.l;
            
            this.drawColorCanvas();
            this.updateColorPreview();
            
            const hexInput = document.getElementById('hexInput');
            if (hexInput) hexInput.value = this.currentColor;
        }
    }

    async startEyedropper() {
        try {
            if ('EyeDropper' in window) {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();
                this.currentColor = result.sRGBHex;
                
                const rgb = this.hexToRgb(this.currentColor);
                const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
                
                this.currentHue = hsl.h;
                this.currentSaturation = hsl.s;
                this.currentLightness = hsl.l;
                
                this.drawColorCanvas();
                this.updateColorPreview();
            } else {
                alert('Eyedropper tool is not supported in this browser. Please use Chrome or Edge.');
            }
        } catch (error) {
            // User cancelled eyedropper
        }
    }

    // Utility functions
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        
        if (0 <= h && h < 1/6) {
            r = c; g = x; b = 0;
        } else if (1/6 <= h && h < 2/6) {
            r = x; g = c; b = 0;
        } else if (2/6 <= h && h < 3/6) {
            r = 0; g = c; b = x;
        } else if (3/6 <= h && h < 4/6) {
            r = 0; g = x; b = c;
        } else if (4/6 <= h && h < 5/6) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        const sum = max + min;
        
        let h = 0;
        let s = 0;
        let l = sum / 2;
        
        if (diff !== 0) {
            s = l > 0.5 ? diff / (2 - sum) : diff / sum;
            
            switch (max) {
                case r:
                    h = ((g - b) / diff) + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / diff + 2;
                    break;
                case b:
                    h = (r - g) / diff + 4;
                    break;
            }
            h /= 6;
        }
        
        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }
}