// ===== CAMPUS PROBLEM REPORTER JAVASCRIPT =====

// Global state management
const AppState = {
    theme: localStorage.getItem('theme') || 'light',
    problems: JSON.parse(localStorage.getItem('problems') || '[]'),
    currentUser: null,
    isLoading: false,
    modalStack: []
};

// Simple API client for backend
const API = {
    base: '',
    get studentToken() { return localStorage.getItem('studentToken') || ''; },
    set studentToken(t) { localStorage.setItem('studentToken', t || ''); },
    get adminToken() { return localStorage.getItem('adminToken') || ''; },
    set adminToken(t) { localStorage.setItem('adminToken', t || ''); },
    async request(path, { method = 'GET', headers = {}, body, token } = {}) {
        const opts = { method, headers: { ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...headers } };
        if (token) opts.headers.Authorization = `Bearer ${token}`;
        if (body) opts.body = body instanceof FormData ? body : JSON.stringify(body);
        const res = await fetch(`${this.base}${path}`, opts);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    },
    student: {
        register: (payload) => API.request('/api/students/register', { method: 'POST', body: payload }),
        login: async (payload) => { const data = await API.request('/api/students/login', { method: 'POST', body: payload }); API.studentToken = data.token; return data; },
        submitProblem: (formData) => API.request('/api/problems', { method: 'POST', body: formData, token: API.studentToken }),
        myProblems: () => API.request('/api/problems')
    },
    admin: {
        login: async (payload) => { const data = await API.request('/api/admin/login', { method: 'POST', body: payload }); API.adminToken = data.token; return data; },
        problems: (query = '') => API.request(`/api/admin/problems${query ? `?${query}` : ''}`, { token: API.adminToken }),
        updateStatus: (id, status) => API.request(`/api/admin/problems/${id}/status`, { method: 'PATCH', body: { status }, token: API.adminToken }),
        editProblem: (id, updates) => API.request(`/api/admin/problems/${id}`, { method: 'PUT', body: updates, token: API.adminToken }),
        deleteProblem: (id) => API.request(`/api/admin/problems/${id}`, { method: 'DELETE', token: API.adminToken })
    },
    pub: {
        problems: (query = '') => API.request(`/api/problems${query ? `?${query}` : ''}`),
        submitProblem: (payload) => API.request('/api/problems', { method: 'POST', body: payload }),
        updateProblem: (id, updates) => API.request(`/api/problems/${id}`, { method: 'PUT', body: updates }),
        deleteProblem: (id) => API.request(`/api/problems/${id}`, { method: 'DELETE' })
    }
};

// Utility functions
const Utils = {
    // Generate unique ID
    generateId: () => '_' + Math.random().toString(36).substr(2, 9),
    
    // Format date
    formatDate: (date) => {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 7) return `${days} days ago`;
        if (days < 14) return '1 week ago';
        return `${Math.floor(days / 7)} weeks ago`;
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Show notification
    showNotification: (message, type = 'success', duration = 3000) => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, duration);
    },
    
    // Validate form data
    validateForm: (formData, rules) => {
        const errors = {};
        
        for (const [field, value] of Object.entries(formData)) {
            const fieldRules = rules[field];
            if (!fieldRules) continue;
            
            if (fieldRules.required && (!value || value.toString().trim() === '')) {
                errors[field] = `${field} is required`;
                continue;
            }
            
            if (fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
                continue;
            }
            
            if (fieldRules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors[field] = `${field} must be a valid email address`;
                continue;
            }
        }
        
        return errors;
    }
};

// Theme management
const ThemeManager = {
    init() {
        this.applyTheme(AppState.theme);
        this.bindEvents();
    },
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        AppState.theme = theme;
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    },
    
    toggle() {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    },
    
    bindEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggle());
        }
    }
};

// Navigation management
const NavigationManager = {
    init() {
        this.bindEvents();
        this.handleActiveLinks();
    },
    
    bindEvents() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
            
            // Close menu when clicking on links
            navMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        }
        
        // Handle smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    },
    
    handleActiveLinks() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                (currentPage === 'index.html' && href === '#home')) {
                link.classList.add('active');
            }
        });
    }
};

// Animation manager
const AnimationManager = {
    init() {
        this.observeElements();
        this.initCounters();
    },
    
    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        // Observe elements for animation
        document.querySelectorAll('.problem-card, .team-member, .stat-card').forEach(el => {
            observer.observe(el);
        });
    },
    
    initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.getAttribute('data-target'));
            const current = parseInt(counter.textContent);
            const increment = target / 100;
            
            if (current < target) {
                counter.textContent = Math.ceil(current + increment);
                setTimeout(() => animateCounter(counter), 20);
            } else {
                counter.textContent = target + '+';
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        counters.forEach(counter => observer.observe(counter));
    }
};

// Form management
const FormManager = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        // Problem report form
        const problemForm = document.getElementById('problemForm');
        if (problemForm) {
            problemForm.addEventListener('submit', (e) => this.handleProblemSubmission(e));
        }
        
        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmission(e));
        }
        
        // File upload handling (multiple + drag-and-drop)
        const fileInput = document.getElementById('imageUpload');
        const uploadArea = document.getElementById('uploadArea') || document.querySelector('.file-upload-group');
        this._selectedFiles = [];
        if (fileInput) {
            fileInput.setAttribute('multiple', 'multiple');
            fileInput.setAttribute('accept', 'image/jpeg,image/png');
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        }
        if (uploadArea) {
            ['dragenter','dragover'].forEach(evt => uploadArea.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.classList.add('dragover'); }));
            ;['dragleave','drop'].forEach(evt => uploadArea.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.classList.remove('dragover'); }));
            uploadArea.addEventListener('drop', (e) => {
                const files = Array.from(e.dataTransfer.files || []);
                this.handleFileUpload(files);
            });
        }
        
        // Form validation on input
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    },
    
    async handleProblemSubmission(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const problemData = Object.fromEntries(formData.entries());
        
        // Validate form (keep existing UI fields)
        const validationRules = {
            category: { required: true },
            problemDescription: { required: true, minLength: 10 }
        };
        const errors = Utils.validateForm(problemData, validationRules);
        if (Object.keys(errors).length > 0) {
            this.showFormErrors(form, errors);
            Utils.showNotification('Please fix the form errors', 'error');
            return;
        }

        // Backend first if logged-in student
        try {
            const backendTitle = problemData.title || `${problemData.category || 'Issue'}${problemData.location ? ' - ' + problemData.location : ''}`.trim();
            const payload = {
                title: backendTitle,
                description: problemData.problemDescription || problemData.description || '',
                category: problemData.category || 'General'
            };
            await API.pub.submitProblem(payload);
            Utils.showNotification('Problem submitted!', 'success');
            this.showSuccessModal({ id: Utils.generateId() });
        } catch (err) {
                // Local fallback
                problemData.id = Utils.generateId();
                problemData.timestamp = new Date().toISOString();
                problemData.status = 'pending';
                const fileInput = document.getElementById('imageUpload');
                if (fileInput && fileInput.files.length > 0) {
                    problemData.images = await this.processUploadedImages(fileInput.files);
                }
                delete problemData.imageUpload;
                AppState.problems.push(problemData);
                localStorage.setItem('problems', JSON.stringify(AppState.problems));
                this.showSuccessModal(problemData);
            }
        } catch (err) {
            Utils.showNotification(err.message || 'Submit failed', 'error');
            return;
        }

        // Reset form and preview
        form.reset();
        this._selectedFiles = [];
        this.clearAllErrors(form);
        this.clearFilePreview();
        
        // Refresh recent problems section
        if (typeof RecentProblemsManager !== 'undefined') {
            RecentProblemsManager.loadRecentProblems();
        }
    },
    
    handleContactSubmission(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const contactData = Object.fromEntries(formData.entries());
        
        // Validate form
        const validationRules = {
            contactName: { required: true, minLength: 2 },
            contactEmail: { required: true, email: true },
            contactMessage: { required: true, minLength: 10 }
        };
        
        const errors = Utils.validateForm(contactData, validationRules);
        
        if (Object.keys(errors).length > 0) {
            this.showFormErrors(form, errors);
            Utils.showNotification('Please fix the form errors', 'error');
            return;
        }
        
        // Simulate sending message
        Utils.showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        form.reset();
        this.clearAllErrors(form);
    },
    
    handleFileUpload(fileList) {
        const files = Array.isArray(fileList) ? fileList : Array.from(fileList || []);
        const preview = document.getElementById('filePreview');
        if (!preview || files.length === 0) return;

        // Merge into selected files (max 5)
        const existing = this._selectedFiles || [];
        const incoming = [];
        for (const f of files) {
            if (!['image/jpeg','image/png'].includes(f.type)) { Utils.showNotification('Only JPG/PNG allowed', 'error'); continue; }
            if (f.size > 5*1024*1024) { Utils.showNotification(`Image ${f.name} exceeds 5MB`, 'error'); continue; }
            incoming.push(f);
        }
        this._selectedFiles = existing.concat(incoming).slice(0,5);

        preview.innerHTML = '';
        this._selectedFiles.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                // Check file size (max 5MB per image)
                if (file.size > 5 * 1024 * 1024) {
                    Utils.showNotification(`Image ${file.name} is too large. Max size is 5MB`, 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'file-preview-item';
                    previewItem.setAttribute('data-index', index);
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <div class="upload-progress"><div class="progress-bar" style="width:0%"></div></div>
                        <button type="button" class="remove-image-btn" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="image-overlay">
                            <i class="fas fa-eye"></i>
                        </div>
                    `;
                    
                    // Add click event for image preview
                    previewItem.querySelector('img').addEventListener('click', () => {
                        this.showImageModal(e.target.result);
                    });

                    // Remove image
                    previewItem.querySelector('.remove-image-btn').addEventListener('click', (btnEvt) => {
                        const idx = Number(btnEvt.currentTarget.getAttribute('data-index'));
                        this._selectedFiles.splice(idx,1);
                        this.handleFileUpload([]); // re-render
                    });
                    
                    preview.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            } else {
                Utils.showNotification(`File ${file.name} is not a valid image`, 'error');
            }
        });
    },
    
    async processUploadedImages(files) {
        const images = [];
        
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    const compressedDataUrl = await this.compressImage(file);
                    images.push({
                        id: Utils.generateId(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        dataUrl: compressedDataUrl,
                        uploadDate: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Error processing image:', error);
                    Utils.showNotification(`Error processing image ${file.name}`, 'error');
                }
            }
        }
        
        return images;
    },
    
    compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL(file.type, quality);
                resolve(compressedDataUrl);
            };
            
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    },
    
    clearFilePreview() {
        const preview = document.getElementById('filePreview');
        if (preview) {
            preview.innerHTML = '';
        }
    },

    // XHR submit to show upload progress per file (approx by size proportion)
    xhrSubmit(url, formData, token) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            const files = this._selectedFiles || [];
            const totalSize = files.reduce((sum, f) => sum + f.size, 0) || 1;
            const preview = document.getElementById('filePreview');

            xhr.upload.onprogress = (e) => {
                if (!e.lengthComputable) return;
                const loaded = e.loaded;
                let remaining = loaded;
                files.forEach((f, idx) => {
                    const weight = f.size / totalSize;
                    const fileLoaded = Math.min(1, remaining / (totalSize * weight));
                    const percent = Math.floor(fileLoaded * 100);
                    const bar = preview?.querySelector(`.file-preview-item[data-index="${idx}"] .progress-bar`);
                    if (bar) bar.style.width = `${Math.min(100, percent)}%`;
                    remaining -= totalSize * weight * fileLoaded;
                });
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText || '{}'));
                    else reject(new Error(JSON.parse(xhr.responseText || '{}').error || 'Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    },
    
    showImageModal(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'modal image-modal active';
        modal.innerHTML = `
            <div class="modal-content image-modal-content">
                <div class="modal-header">
                    <h3>Image Preview</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <img src="${imageSrc}" alt="Image preview" class="modal-image">
                </div>
            </div>
        `;
        
        // Close modal events
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.modal-close')) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    },
    
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let error = null;
        
        if (field.required && !value) {
            error = `${this.getFieldLabel(field)} is required`;
        } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = 'Please enter a valid email address';
        } else if (field.minLength && value.length < field.minLength) {
            error = `${this.getFieldLabel(field)} must be at least ${field.minLength} characters`;
        }
        
        if (error) {
            this.showFieldError(field, error);
        } else {
            this.clearFieldError(field);
        }
        
        return !error;
    },
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentElement.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentElement.appendChild(errorElement);
        }
        
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    },
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    },
    
    showFormErrors(form, errors) {
        Object.entries(errors).forEach(([fieldName, message]) => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.showFieldError(field, message);
            }
        });
    },
    
    clearAllErrors(form) {
        form.querySelectorAll('.error').forEach(field => {
            this.clearFieldError(field);
        });
    },
    
    getFieldLabel(field) {
        const label = field.parentElement.querySelector('label');
        return label ? label.textContent : field.name;
    },
    
    showSuccessModal(problemData) {
        const modal = document.getElementById('successModal');
        if (!modal) return;
        
        const reportId = document.getElementById('reportId');
        if (reportId) {
            reportId.textContent = problemData.id;
        }
        
        modal.classList.add('active');
        AppState.modalStack.push(modal);
    }
};

// Modal management
const ModalManager = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeTopModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => this.closeTopModal());
        });
    },
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            AppState.modalStack.push(modal);
        }
    },
    
    closeTopModal() {
        if (AppState.modalStack.length > 0) {
            const modal = AppState.modalStack.pop();
            modal.classList.remove('active');
        }
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            const index = AppState.modalStack.indexOf(modal);
            if (index > -1) {
                AppState.modalStack.splice(index, 1);
            }
        }
    }
};

// Admin Dashboard functionality
const AdminDashboard = {
    init() {
        this.bindEvents();
        this.loadProblems();
        this.initFilters();
    },
    
    bindEvents() {
        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // View toggle
        const viewToggle = document.getElementById('viewToggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', () => this.toggleView());
        }
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterProblems({ search: e.target.value });
            }, 300));
        }
        
        // Filter selects
        document.querySelectorAll('#departmentFilter, #categoryFilter, #statusFilter, #priorityFilter').forEach(select => {
            select.addEventListener('change', () => this.handleFilterChange());
        });
        
        // Clear filters
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
        }
        
        // Status change handlers
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('status-select')) {
                this.updateProblemStatus(e.target.dataset.problemId, e.target.value);
            }
        });
        
        // View details buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-details')) {
                const problemId = e.target.closest('.view-details').dataset.problemId;
                this.showProblemDetails(problemId);
            }
            if (e.target.closest('.edit-problem')) {
                const id = e.target.closest('.edit-problem').dataset.problemId;
                const action = window.prompt('Type "delete" to remove, or enter new title to edit (leave blank to cancel):');
                if (!action) return;
                if (action.toLowerCase() === 'delete') {
                    API.pub.deleteProblem(id)
                      .then(() => { Utils.showNotification('Problem deleted', 'success'); this.loadProblems(); })
                      .catch(err => Utils.showNotification(err.message, 'error'));
                } else {
                    API.pub.updateProblem(id, { title: action })
                      .then(() => { Utils.showNotification('Problem updated', 'success'); this.loadProblems(); })
                      .catch(err => Utils.showNotification(err.message, 'error'));
                }
            }
        });
    },
    
    async loadProblems() {
        try {
            // Prefer backend
            const { problems } = await API.pub.problems();
            this._problems = problems;
            this.renderProblemsTable(problems);
            this.updateStats(problems);
        } catch (err) {
            // Fallback to local storage
            const problems = AppState.problems;
            this._problems = problems;
            this.renderProblemsTable(problems);
            this.updateStats(problems);
            Utils.showNotification(err.message || 'Showing local data', 'info');
        }
    },
    
    renderProblemsTable(problems) {
        const table = document.getElementById('problemsTable');
        if (!table) return;
        
        if (problems.length === 0) {
            table.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No problems found</h3>
                    <p>No problems match your current filters.</p>
                </div>
            `;
            return;
        }
        
        table.innerHTML = problems.map(problem => this.renderProblemRow(problem)).join('');
    },
    
    renderProblemRow(problem) {
        const status = (problem.status || 'pending').toLowerCase();
        const statusClass = status.replace(/\s+/g, '-');
        const categoryClass = (problem.category || 'General').toLowerCase().replace(/\s+/g, '-');
        const title = problem.title || problem.problemDescription?.substring(0,50) || 'Problem';
        const desc = problem.description || problem.problemDescription || '';
        const id = problem._id || problem.id;
        const reporter = problem.reporter && (problem.reporter.name || problem.reporter.email);
        const createdAt = new Date(problem.createdAt || problem.timestamp || Date.now());
        const imageSrc = problem.imageUrl || `https://via.placeholder.com/80x80?text=${encodeURIComponent(problem.category || 'Issue')}`;
        
        return `
            <div class="problem-row" data-id="${id}" data-status="${statusClass}" data-category="${categoryClass}">
                <div class="problem-thumbnail">
                    <img src="${imageSrc}" alt="Problem">
                </div>
                <div class="problem-info">
                    <h4>${title}</h4>
                    ${reporter ? `<p><strong>Reporter:</strong> ${reporter}</p>` : ''}
                    <p class="problem-description">${desc}</p>
                </div>
                <div class="problem-meta">
                    <span class="category-tag category-${categoryClass}">${problem.category || 'General'}</span>
                    <span class="status-badge status-${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g,' ')}</span>
                    <p class="report-date">Reported: ${Utils.formatDate(createdAt)}</p>
                </div>
                <div class="problem-actions">
                    <select class="status-select" data-problem-id="${id}">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                    <button class="btn btn-sm btn-primary view-details" data-problem-id="${problem.id}">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn btn-sm btn-secondary edit-problem" data-problem-id="${problem.id}">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                </div>
            </div>
        `;
    },
    
    updateStats(problems) {
        const stats = {
            total: problems.length,
            pending: problems.filter(p => p.status === 'pending').length,
            inProgress: problems.filter(p => p.status === 'in-progress').length,
            resolved: problems.filter(p => p.status === 'resolved').length
        };
        
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('h3').textContent = stats.total;
            statCards[1].querySelector('h3').textContent = stats.pending;
            statCards[2].querySelector('h3').textContent = stats.inProgress;
            statCards[3].querySelector('h3').textContent = stats.resolved;
        }
    },
    
    initFilters() {
        this.currentFilters = {
            department: 'all',
            category: 'all',
            status: 'all',
            priority: 'all',
            search: ''
        };
    },
    
    handleFilterChange() {
        this.currentFilters.department = document.getElementById('departmentFilter')?.value || 'all';
        this.currentFilters.category = document.getElementById('categoryFilter')?.value || 'all';
        this.currentFilters.status = document.getElementById('statusFilter')?.value || 'all';
        this.currentFilters.priority = document.getElementById('priorityFilter')?.value || 'all';
        
        this.filterProblems(this.currentFilters);
    },
    
    filterProblems(filters) {
        let filteredProblems = [...AppState.problems];
        
        // Apply filters
        if (filters.department && filters.department !== 'all') {
            filteredProblems = filteredProblems.filter(p => p.department === filters.department);
        }
        
        if (filters.category && filters.category !== 'all') {
            filteredProblems = filteredProblems.filter(p => p.category === filters.category);
        }
        
        if (filters.status && filters.status !== 'all') {
            filteredProblems = filteredProblems.filter(p => p.status === filters.status);
        }
        
        if (filters.priority && filters.priority !== 'all') {
            filteredProblems = filteredProblems.filter(p => p.priority === filters.priority);
        }
        
        if (filters.search && filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase();
            filteredProblems = filteredProblems.filter(p => 
                p.problemDescription.toLowerCase().includes(searchTerm) ||
                p.studentName.toLowerCase().includes(searchTerm) ||
                p.location.toLowerCase().includes(searchTerm) ||
                p.rollNumber.toLowerCase().includes(searchTerm)
            );
        }
        
        this.renderProblemsTable(filteredProblems);
        this.updateStats(filteredProblems);
    },
    
    clearFilters() {
        document.getElementById('departmentFilter').value = 'all';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('priorityFilter').value = 'all';
        document.getElementById('searchInput').value = '';
        
        this.initFilters();
        this.loadProblems();
    },
    
    async updateProblemStatus(problemId, newStatus) {
        try {
            await API.pub.updateProblem(problemId, { status: newStatus });
            Utils.showNotification(`Status updated to ${newStatus}`, 'success');
            this.loadProblems();
        } catch (err) {
            Utils.showNotification(err.message || 'Failed to update status', 'error');
        }
    },
    
    showProblemDetails(problemId) {
        const problem = (this._problems || AppState.problems).find(p => (p._id||p.id) === problemId);
        if (!problem) return;
        
        const modalBody = document.querySelector('#problemModal .modal-body');
        if (!modalBody) return;
        
        const status = (problem.status||'pending');
        modalBody.innerHTML = `
            <div class="problem-details-content">
                <div class="detail-header">
                    <h3>${problem.title || problem.problemDescription || 'Problem Details'}</h3>
                    <span class="status-badge status-${status.replace(/\s+/g, '-').toLowerCase()}">${status}</span>
                </div>
                
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Reporter:</label>
                        <span>${problem.reporter?.name || problem.reporter?.email || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Category:</label>
                        <span class="category-tag category-${(problem.category||'General').toLowerCase()}">${problem.category || 'General'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-${status.toLowerCase()}">${status.replace(/-/g,' ')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Reported:</label>
                        <span>${Utils.formatDate(new Date(problem.createdAt || problem.timestamp || Date.now()))}</span>
                    </div>
                </div>
                
                <div class="detail-description">
                    <label>Description:</label>
                    <p>${problem.description || problem.problemDescription || ''}</p>
                </div>
            </div>
        `;
        
        ModalManager.openModal('problemModal');
    },
    
    exportData() {
        const data = {
            problems: AppState.problems,
            exportDate: new Date().toISOString(),
            totalCount: AppState.problems.length
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus-problems-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('Data exported successfully!', 'success');
    },
    
    refreshData() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }
        
        // Simulate refresh delay
        setTimeout(() => {
            this.loadProblems();
            
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
                refreshBtn.disabled = false;
            }
            
            Utils.showNotification('Data refreshed!', 'success');
        }, 1000);
    },
    
    toggleView() {
        const table = document.getElementById('problemsTable');
        const toggleBtn = document.getElementById('viewToggle');
        
        if (table && toggleBtn) {
            table.classList.toggle('grid-view');
            
            const icon = toggleBtn.querySelector('i');
            const text = toggleBtn.querySelector('span') || toggleBtn.childNodes[2];
            
            if (table.classList.contains('grid-view')) {
                icon.className = 'fas fa-list';
                if (text) text.textContent = ' List View';
            } else {
                icon.className = 'fas fa-th-large';
                if (text) text.textContent = ' Grid View';
            }
        }
    }
};

// Global functions for inline event handlers
window.closeModal = () => ModalManager.closeTopModal();
window.closeProblemModal = () => ModalManager.closeModal('problemModal');
window.submitAnother = () => {
    ModalManager.closeTopModal();
    // Optional: scroll to form
    const form = document.getElementById('problemForm');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
};

// Recent problems management
const RecentProblemsManager = {
    init() {
        this.loadRecentProblems();
    },
    
    async loadRecentProblems() {
        const recentProblemsContainer = document.querySelector('.problems-list');
        if (!recentProblemsContainer) return;
        
        let recentProblems = [];
        try {
            const { problems } = await API.pub.problems('limit=3');
            recentProblems = problems;
            this._recent = problems;
        } catch (_) {
            // fallback to local
            recentProblems = AppState.problems
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 3);
            this._recent = recentProblems;
        }
        
        if (recentProblems.length === 0) {
            recentProblemsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No problems reported yet. Be the first to report an issue!</p>
                </div>
            `;
            return;
        }
        
        recentProblemsContainer.innerHTML = recentProblems.map(problem => this.renderProblemItem(problem)).join('');
        
        // Add click handlers for image viewing
        this.bindImageEvents();
    },
    
    renderProblemItem(problem) {
        const status = (problem.status || 'pending');
        const statusClass = status.replace(/\s+/g, '-').toLowerCase();
        const statusText = status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
        const timeAgo = Utils.formatDate(new Date(problem.createdAt || problem.timestamp || Date.now()));
        
        let imageUrl = problem.imageUrl || this.getProblemImage(problem.category || 'General');
        let hasUploadedImage = Boolean(problem.imageUrl || (problem.images && problem.images.length));
        
        return `
            <div class="problem-item" data-has-images="${hasUploadedImage}" data-problem-id="${problem._id || problem.id}">
                <div class="problem-image-container">
                    <div class="problem-image">
                        <img src="${imageUrl}" alt="${problem.category} at ${problem.location}" loading="lazy" onerror="this.src='https://via.placeholder.com/80x80?text=${encodeURIComponent(problem.category)}'">
                        ${hasUploadedImage && problem.images.length > 1 ? `<div class=\"image-count\"><i class=\"fas fa-images\"></i> ${problem.images.length}</div>` : ''}
                        ${hasUploadedImage ? '<div class=\"image-indicator\"><i class=\"fas fa-camera\"></i></div>' : ''}
                    </div>
                </div>
                <div class="problem-details">
                    <h4>${problem.title || problem.category || 'Problem'}</h4>
                    <p class="problem-excerpt">${(problem.description || problem.problemDescription || '').substring(0, 120)}${(problem.description || problem.problemDescription || '').length > 120 ? '...' : ''}</p>
                    ${problem.reporter ? `<p>Reporter: ${problem.reporter.name || problem.reporter.email} • ${timeAgo}</p>` : `<p>${timeAgo}</p>`}
                    <span class="status-badge status-${statusClass}">${statusText}</span>
                    ${hasUploadedImage ? '<p class="has-images-text"><i class=\"fas fa-image\"></i> Contains images</p>' : ''}
                </div>
            </div>
        `;
    },
    
    getProblemImage(category) {
        const categoryImages = {
            'Furniture': 'images/broken-chairs.jpg',
            'Infrastructure': 'images/water-leakage.jpg',
            'Electronics': 'images/wifi-issues.jpg',
            'Cleanliness': 'images/cleanliness-issues.jpg',
            'Security': 'images/security-issues.jpg',
            'Others': 'images/other-issues.jpg'
        };
        
        return categoryImages[category] || 'images/general-issue.jpg';
    },
    
    bindImageEvents() {
        document.querySelectorAll('.problem-item[data-has-images="true"]').forEach(item => {
            const problemId = item.dataset.problemId;
            const imageContainer = item.querySelector('.problem-image');
            
            if (imageContainer) {
                imageContainer.style.cursor = 'pointer';
                imageContainer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showProblemImages(problemId);
                });
            }
        });
    },
    
    showProblemImages(problemId) {
        const source = this._recent || AppState.problems;
        const problem = source.find(p => (p._id||p.id) === problemId);
        if (!problem || !problem.images || problem.images.length === 0) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal problem-images-modal active';
        
        const imagesHTML = problem.images.map((image, index) => `
            <div class="image-slide ${index === 0 ? 'active' : ''}">
                <img src="${image.dataUrl}" alt="Problem image ${index + 1}" class="modal-image">
                <div class="image-info">
                    <span class="image-name">${image.name}</span>
                    <span class="image-date">${Utils.formatDate(new Date(image.uploadDate))}</span>
                </div>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content image-gallery-modal">
                <div class="modal-header">
                    <h3>Problem Images</h3>
                    <div class="image-counter">
                        <span class="current-image">1</span> / ${problem.images.length}
                    </div>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body image-gallery">
                    <div class="images-container">
                        ${imagesHTML}
                    </div>
                    ${problem.images.length > 1 ? `
                        <button class="nav-btn prev-btn">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="nav-btn next-btn">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="image-dots">
                            ${problem.images.map((_, index) => `
                                <button class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <div class="problem-info">
                        <h4>${problem.problemDescription}</h4>
                        <p>Reported by ${problem.studentName} • ${Utils.formatDate(new Date(problem.timestamp))}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add navigation functionality
        let currentIndex = 0;
        const slides = modal.querySelectorAll('.image-slide');
        const dots = modal.querySelectorAll('.dot');
        const counter = modal.querySelector('.current-image');
        
        const showSlide = (index) => {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            if (slides[index]) {
                slides[index].classList.add('active');
                if (dots[index]) dots[index].classList.add('active');
                counter.textContent = index + 1;
                currentIndex = index;
            }
        };
        
        // Navigation buttons
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
                showSlide(newIndex);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
                showSlide(newIndex);
            });
        }
        
        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showSlide(index));
        });
        
        // Keyboard navigation
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') {
                prevBtn?.click();
            } else if (e.key === 'ArrowRight') {
                nextBtn?.click();
            } else if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        
        document.addEventListener('keydown', handleKeyPress);
        
        // Close modal events
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.modal-close')) {
                modal.remove();
                document.removeEventListener('keydown', handleKeyPress);
            }
        });
        
        document.body.appendChild(modal);
    }
};

// Sample data initialization
const SampleDataManager = {
    init() {
        if (AppState.problems.length === 0) {
            this.loadSampleData();
        }
    },
    
    loadSampleData() {
        const sampleProblems = [
            {
                id: 'sample_1',
                studentName: 'Anisha Arora',
                rollNumber: 'CS2021001',
                department: 'Computer Science',
                category: 'Furniture',
                location: 'Main Library',
                problemDescription: 'Multiple chairs in the main library reading hall are broken and uncomfortable for students.',
                priority: 'High',
                status: 'pending',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample_2',
                studentName: 'Rahul Kumar',
                rollNumber: 'ME2020045',
                department: 'Mechanical',
                category: 'Infrastructure',
                location: 'Main Canteen',
                problemDescription: 'Water tap near the canteen entrance is continuously leaking, causing water wastage.',
                priority: 'Medium',
                status: 'resolved',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample_3',
                studentName: 'Priya Singh',
                rollNumber: 'EC2021078',
                department: 'Electronics',
                category: 'Electronics',
                location: 'Classroom 204',
                problemDescription: 'The projector is not displaying properly, affecting lecture presentations.',
                priority: 'Critical',
                status: 'in-progress',
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample_4',
                studentName: 'Anonymous',
                rollNumber: 'N/A',
                department: 'General',
                category: 'Cleanliness',
                location: 'Block B, 2nd Floor',
                problemDescription: 'Poor maintenance and cleanliness in the washroom facilities.',
                priority: 'Medium',
                status: 'pending',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        AppState.problems = sampleProblems;
        localStorage.setItem('problems', JSON.stringify(sampleProblems));
    }
};

// Performance optimization
const PerformanceManager = {
    init() {
        this.setupLazyLoading();
        this.debounceScrollEvents();
    },
    
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },
    
    debounceScrollEvents() {
        let scrollTimer;
        window.addEventListener('scroll', () => {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                document.body.classList.remove('scrolling');
            }, 150);
            document.body.classList.add('scrolling');
        });
    }
};

// Auth forms wiring
const AuthUI = {
    init() {
        const sReg = document.getElementById('studentRegisterForm');
        if (sReg) sReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(sReg);
            try {
                await API.student.register({ name: fd.get('name'), email: fd.get('email'), password: fd.get('password') });
                const login = await API.student.login({ email: fd.get('email'), password: fd.get('password') });
                Utils.showNotification(`Welcome ${login.student.name}!`, 'success');
            } catch (err) { Utils.showNotification(err.message, 'error'); }
        });
        const sLogin = document.getElementById('studentLoginForm');
        if (sLogin) sLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(sLogin);
            try {
                const data = await API.student.login({ email: fd.get('email'), password: fd.get('password') });
                Utils.showNotification(`Logged in as ${data.student.email}`, 'success');
            } catch (err) { Utils.showNotification(err.message, 'error'); }
        });
        const aLogin = document.getElementById('adminLoginForm');
        if (aLogin) aLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(aLogin);
            try {
                const data = await API.admin.login({ email: fd.get('email'), password: fd.get('password') });
                Utils.showNotification(`Admin: ${data.admin.email}`, 'success');
                if (window.location.pathname.includes('admin')) AdminDashboard.loadProblems();
            } catch (err) { Utils.showNotification(err.message, 'error'); }
        });
    }
};

// Team Members rendering
const TeamMembers = {
    members: [
        { name: 'Anisha Arora', role: 'Core Team Member', tagline: 'Driving a better campus experience.' },
        { name: 'Anushka Srivastav', role: 'Core Team Member', tagline: 'APIs, data, and reliability.' },
        { name: 'Anushka Bhatnagar', role: 'Core Team Member', tagline: 'Responsive UI and delightful UX.' },
    ],
    initials(name) {
        return name.split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');
    },
    render() {
        const grid = document.querySelector('.team-grid');
        if (!grid) return;
        const cards = this.members.map((m, idx) => `
            <div class="team-member">
                <div class="member-avatar" data-variant="${(idx % 3) + 1}">
                    <span class="initials">${this.initials(m.name)}</span>
                </div>
                <div class="member-info">
                    <h3>${m.name}</h3>
                    <p class="member-role">${m.role}</p>
                    <p class="member-tagline">${m.tagline}</p>
                </div>
            </div>
        `).join('');
        grid.innerHTML = cards;
    }
};

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all managers
    ThemeManager.init();
    NavigationManager.init();
    AnimationManager.init();
    FormManager.init();
    ModalManager.init();
    AuthUI.init();
    SampleDataManager.init();
    TeamMembers.render();
    RecentProblemsManager.init();
    PerformanceManager.init();
    
    // Initialize admin dashboard if on admin page
    if (window.location.pathname.includes('admin.html')) {
        AdminDashboard.init();
    }
    
    console.log('Campus Problem Reporter initialized successfully!');
});

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        max-width: 400px;
        border-left: 4px solid #10b981;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left-color: #10b981;
    }
    
    .notification-error {
        border-left-color: #ef4444;
    }
    
    .notification-info {
        border-left-color: #3b82f6;
    }
    
    .notification i {
        color: #10b981;
    }
    
    .notification-error i {
        color: #ef4444;
    }
    
    .notification-info i {
        color: #3b82f6;
    }
    
    .file-preview-item {
        position: relative;
        display: inline-block;
        margin: 5px;
    }
    
    .file-preview-item img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .file-preview-item button {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 10px;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin: 20px 0;
    }
    
    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .detail-item label {
        font-weight: 600;
        color: var(--gray-700);
        font-size: 14px;
    }
    
    .detail-description {
        margin-top: 20px;
    }
    
    .detail-description label {
        font-weight: 600;
        color: var(--gray-700);
        margin-bottom: 8px;
        display: block;
    }
    
    .detail-description p {
        background: var(--gray-50);
        padding: 16px;
        border-radius: 8px;
        line-height: 1.6;
        margin: 0;
    }
    
    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--gray-500);
    }
    
    .empty-state i {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
    }
    
    .empty-state h3 {
        margin-bottom: 8px;
        color: var(--gray-600);
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-100px);
        }
        
        .notification.show {
            transform: translateY(0);
        }
        
        .detail-grid {
            grid-template-columns: 1fr;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
// Generate initials if image not found
document.querySelectorAll('.member-photo').forEach(photo => {
  const img = photo.querySelector('img');
  const name = photo.getAttribute('data-name');

  // If image fails or doesn't exist, create initials
  img.addEventListener('error', () => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');

    // Create initials circle
    const initialsDiv = document.createElement('div');
    initialsDiv.textContent = initials;
    initialsDiv.style.width = '120px';
    initialsDiv.style.height = '120px';
    initialsDiv.style.borderRadius = '50%';
    initialsDiv.style.display = 'flex';
    initialsDiv.style.alignItems = 'center';
    initialsDiv.style.justifyContent = 'center';
    initialsDiv.style.background = 'linear-gradient(135deg, #007bff, #ff6b6b)';
    initialsDiv.style.color = 'white';
    initialsDiv.style.fontSize = '32px';
    initialsDiv.style.fontWeight = 'bold';
    initialsDiv.style.margin = '0 auto';
    initialsDiv.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';

    // Replace image with initials
    photo.appendChild(initialsDiv);
  });
});
// 🌙 DARK MODE TOGGLE FUNCTIONALITY
const themeToggle = document.getElementById("theme-toggle");
const htmlTag = document.documentElement;

// Load saved theme from localStorage
if (localStorage.getItem("theme") === "dark") {
  htmlTag.setAttribute("data-theme", "dark");
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
  htmlTag.setAttribute("data-theme", "light");
  themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

// Add toggle event listener
themeToggle.addEventListener("click", () => {
  const currentTheme = htmlTag.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  
  htmlTag.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  if (newTheme === "dark") {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
});

