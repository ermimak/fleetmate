// FleetMate Frontend Application
// Comprehensive fleet management system

// --- Configuration --- //
const API_BASE_URL = '/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

// --- Utility Functions --- //
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const loading = element.querySelector('.loading');
        if (loading) loading.classList.remove('d-none');
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const loading = element.querySelector('.loading');
        if (loading) loading.classList.add('d-none');
    }
}

function showAlert(message, type = 'info', containerId = null) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const container = containerId ? document.getElementById(containerId) : document.querySelector('.main-content');
    if (container) {
        container.insertAdjacentHTML('afterbegin', alertHtml);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) alert.remove();
        }, 5000);
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': 'badge-warning',
        'approved': 'badge-success',
        'rejected': 'badge-danger',
        'cancelled': 'badge-secondary',
        'car_assigned': 'badge-info',
        'in_progress': 'badge-info',
        'completed': 'badge-success',
        'active': 'badge-success',
        'inactive': 'badge-secondary',
        'suspended': 'badge-danger',
        'available': 'badge-success',
        'in_use': 'badge-warning',
        'maintenance': 'badge-danger',
        'out_of_service': 'badge-secondary'
    };
    
    const badgeClass = statusMap[status.toLowerCase()] || 'badge-secondary';
    return `<span class="badge ${badgeClass}">${status.replace('_', ' ').toUpperCase()}</span>`;
}

// --- API Service --- //
class ApiService {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem(TOKEN_KEY);
    }

    setToken(token) {
        if (token) {
            this.token = token;
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            this.token = null;
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(credentials) {
        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: credentials
            });
            
            if (response.access_token) {
                this.setToken(response.access_token);
                const user = await this.getMe();
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                return user;
            }
            throw new Error('No access token received');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async getMe() {
        return await this.request('/users/me');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    logout() {
        this.setToken(null);
        window.location.replace('/login.html');
    }

    // Users API
    async getUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/users?${params}`);
    }

    async getUserById(id) {
        return await this.request(`/users/${id}`);
    }

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: userData
        });
    }

    async updateUser(id, userData) {
        return await this.request(`/users/${id}`, {
            method: 'PATCH',
            body: userData
        });
    }

    async deleteUser(id) {
        return await this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    async getUserStats() {
        return await this.request('/users/stats');
    }

    // Requests API
    async getMyRequests() {
        return await this.request('/requests/my-requests');
    }

    async getAllRequests(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/requests?${params}`);
    }

    async getRequestById(id) {
        return await this.request(`/requests/${id}`);
    }

    async createRequest(requestData) {
        return await this.request('/requests', {
            method: 'POST',
            body: requestData
        });
    }

    async updateRequestStatus(id, status, reason = '') {
        return await this.request(`/requests/${id}/status`, {
            method: 'PATCH',
            body: { status, reason }
        });
    }

    async assignCar(requestId, carId, driverId) {
        return await this.request(`/requests/${requestId}/assign-car`, {
            method: 'PATCH',
            body: { carId, driverId }
        });
    }

    async startTrip(requestId) {
        return await this.request(`/requests/${requestId}/start-trip`, {
            method: 'PATCH'
        });
    }

    async completeTrip(requestId, totalDistance, tripNotes) {
        return await this.request(`/requests/${requestId}/complete-trip`, {
            method: 'PATCH',
            body: { totalDistance, tripNotes }
        });
    }

    async getPendingApprovals() {
        return await this.request('/requests/pending-approvals');
    }

    async getRequestStats() {
        return await this.request('/requests/stats');
    }

    async getOverdueRequests() {
        return await this.request('/requests/overdue');
    }

    // Cars API
    async getCars(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/cars?${params}`);
    }

    async getAvailableCars(passengerCount, type) {
        const params = new URLSearchParams({ passengerCount, type });
        return await this.request(`/cars/available?${params}`);
    }

    async getCarById(id) {
        return await this.request(`/cars/${id}`);
    }

    async createCar(carData) {
        return await this.request('/cars', {
            method: 'POST',
            body: carData
        });
    }

    async updateUser(id, carData) {
        return await this.request(`/cars/${id}`, {
            method: 'PATCH',
            body: carData
        });
    }

    async deleteCar(id) {
        return await this.request(`/cars/${id}`, {
            method: 'DELETE'
        });
    }

    async getCarStats() {
        return await this.request('/cars/stats');
    }

    async assignDriver(carId, driverId) {
        return await this.request(`/cars/${carId}/assign-driver/${driverId}`, {
            method: 'PATCH'
        });
    }

    async unassignDriver(carId) {
        return await this.request(`/cars/${carId}/unassign-driver`, {
            method: 'PATCH'
        });
    }
}

// --- Application State --- //
const state = {
    currentUser: null,
    currentPage: null,
    isLoading: false
};

// --- Initialize API Service --- //
const api = new ApiService();

// --- Page Management --- //
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page.replace('.html', '');
}

function updateNavigation() {
    const currentPage = getCurrentPage();
    const user = api.getCurrentUser();
    
    if (!user) return;
    
    // Update user info in header
    const userWelcome = document.getElementById('userWelcome');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userWelcome) {
        userWelcome.textContent = `Welcome, ${user.firstName || user.email}`;
    }
    
    if (userAvatar) {
        const initials = user.firstName ? 
            (user.firstName.charAt(0) + (user.lastName?.charAt(0) || '')).toUpperCase() :
            user.email.charAt(0).toUpperCase();
        userAvatar.textContent = initials;
    }
    
    // Show/hide navigation items based on role
    const roleBasedNavItems = {
        'approvalsNav': ['APPROVER', 'ADMIN', 'AUTHORITY'],
        'manageRequestsNav': ['ADMIN', 'AUTHORITY'],
        'fleetManagementNav': ['ADMIN', 'AUTHORITY'],
        'userManagementNav': ['ADMIN'],
        'reportsNav': ['ADMIN', 'AUTHORITY']
    };
    
    Object.entries(roleBasedNavItems).forEach(([navId, allowedRoles]) => {
        const navElement = document.getElementById(navId);
        if (navElement) {
            navElement.style.display = allowedRoles.includes(user.role) ? 'block' : 'none';
        }
    });
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('data-page');
        if (linkPage === currentPage || 
            (currentPage === 'index' && linkPage === 'dashboard')) {
            link.classList.add('active');
        }
    });
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            api.logout();
        });
    }
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
                e.preventDefault();
                window.location.href = href;
            }
        });
    });
}

// --- Page Initialization Functions --- //
async function initDashboard() {
    try {
        // Load dashboard stats
        const [requestStats, userStats, carStats] = await Promise.all([
            api.getRequestStats().catch(() => ({})),
            api.getUserStats().catch(() => ({})),
            api.getCarStats().catch(() => ({}))
        ]);
        
        // Update stats cards
        updateStatsCard('totalRequests', requestStats.total || 0);
        updateStatsCard('pendingRequests', requestStats.pending || 0);
        updateStatsCard('approvedRequests', requestStats.approved || 0);
        updateStatsCard('activeTrips', requestStats.active || 0);
        
        // Load recent activity
        loadRecentActivity();
        
        // Setup quick actions
        setupQuickActions();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showAlert('Error loading dashboard data', 'danger');
    }
}

async function initUserManagement() {
    try {
        // Load user stats
        const userStats = await api.getUserStats().catch(() => ({}));
        updateStatsCard('totalUsers', userStats.total || 0);
        updateStatsCard('activeUsers', userStats.active || 0);
        updateStatsCard('adminUsers', userStats.admins || 0);
        updateStatsCard('pendingUsers', userStats.pending || 0);
        
        // Load users table
        await loadUsersTable();
        
        // Setup user management event listeners
        setupUserManagementEvents();
        
    } catch (error) {
        console.error('Error initializing user management:', error);
        showAlert('Error loading user management data', 'danger');
    }
}

async function initFleetManagement() {
    try {
        // Load fleet stats
        const carStats = await api.getCarStats().catch(() => ({}));
        updateStatsCard('totalVehicles', carStats.total || 0);
        updateStatsCard('availableVehicles', carStats.available || 0);
        updateStatsCard('inUseVehicles', carStats.inUse || 0);
        updateStatsCard('maintenanceVehicles', carStats.maintenance || 0);
        
        // Load vehicles table
        await loadVehiclesTable();
        
        // Setup fleet management event listeners
        setupFleetManagementEvents();
        
    } catch (error) {
        console.error('Error initializing fleet management:', error);
        showAlert('Error loading fleet management data', 'danger');
    }
}

async function initMyRequests() {
    try {
        // Load my requests
        const requests = await api.getMyRequests();
        
        // Update stats
        const stats = calculateRequestStats(requests);
        updateStatsCard('totalMyRequests', stats.total);
        updateStatsCard('pendingMyRequests', stats.pending);
        updateStatsCard('approvedMyRequests', stats.approved);
        updateStatsCard('completedMyRequests', stats.completed);
        
        // Load requests table
        loadMyRequestsTable(requests);
        
        // Setup event listeners
        setupMyRequestsEvents();
        
    } catch (error) {
        console.error('Error initializing my requests:', error);
        showAlert('Error loading your requests', 'danger');
    }
}

async function initApprovals() {
    try {
        // Load pending approvals
        const approvals = await api.getPendingApprovals();
        
        // Update stats
        updateStatsCard('totalPendingApprovals', approvals.length);
        updateStatsCard('approvedToday', 0); // This would need additional API endpoint
        updateStatsCard('rejectedToday', 0); // This would need additional API endpoint
        updateStatsCard('urgentApprovals', approvals.filter(r => r.priority === 'urgent').length);
        
        // Load approvals table
        loadApprovalsTable(approvals);
        
        // Setup event listeners
        setupApprovalsEvents();
        
    } catch (error) {
        console.error('Error initializing approvals:', error);
        showAlert('Error loading pending approvals', 'danger');
    }
}

// --- Utility Functions for Page Initialization --- //
function updateStatsCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function calculateRequestStats(requests) {
    return {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        completed: requests.filter(r => r.status === 'completed').length
    };
}

async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    try {
        const requests = await api.getMyRequests();
        const recentRequests = requests.slice(0, 5);
        
        if (recentRequests.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No recent activity</p>';
            return;
        }
        
        const activityHtml = recentRequests.map(request => `
            <div class="d-flex justify-between align-center py-2 border-bottom">
                <div>
                    <strong>${request.purpose}</strong><br>
                    <small class="text-muted">${formatDate(request.createdAt)}</small>
                </div>
                <div>${getStatusBadge(request.status)}</div>
            </div>
        `).join('');
        
        container.innerHTML = activityHtml;
        
    } catch (error) {
        container.innerHTML = '<p class="text-danger text-center">Error loading recent activity</p>';
    }
}

function setupQuickActions() {
    const quickNewRequest = document.getElementById('quickNewRequest');
    const quickViewRequests = document.getElementById('quickViewRequests');
    const quickViewFleet = document.getElementById('quickViewFleet');
    
    if (quickNewRequest) {
        quickNewRequest.addEventListener('click', () => { window.location.href = '/new-request.html'; });
    }
    if (quickViewRequests) {
        quickViewRequests.addEventListener('click', () => { window.location.href = '/my-requests.html'; });
    }
    if (quickViewFleet) {
        quickViewFleet.addEventListener('click', () => { window.location.href = '/fleet-management.html'; });
    }
}

// --- Initialization Helpers ---
function getRedirectPathForRole(role) {
    switch (role) {
        case 'ADMIN':
        case 'AUTHORITY':
            return '/dashboard.html';
        case 'APPROVER':
            return '/approvals.html';
        case 'USER':
        default:
            return '/my-requests.html';
    }
}

async function initProtectedPage(currentPage) {
    // This function assumes the user is already authenticated and their data is loaded.
    try {
        updateNavigation();
        setupEventListeners();

        // Call the specific initialization function for the current page
        switch (currentPage) {
            case 'dashboard': await initDashboard(); break;
            case 'user-management': await initUserManagement(); break;
            case 'fleet-management': await initFleetManagement(); break;
            case 'my-requests': await initMyRequests(); break;
            case 'approvals': await initApprovals(); break;
            case 'manage-requests': await initManageRequests(); break;
            case 'reports': await initReports(); break;
            // No default case needed, non-matching pages will just have nav/events setup.
        }
    } catch (error) {
        console.error(`Failed to initialize content for page ${currentPage}:`, error);
        showAlert('There was an error loading page content.', 'danger');
    }
}

// --- Main Application Initialization --- //
async function initializeApp() {
    const currentPage = getCurrentPage();
    const token = api.token;

    if (token) {
        // A token exists. Validate it by fetching user data.
        try {
            const user = await api.getMe();
            state.currentUser = user;
            localStorage.setItem(USER_KEY, JSON.stringify(user)); // Refresh user data

            // User is authenticated. Check where they are.
            if (currentPage === 'login' || currentPage === 'index') {
                // Redirect logged-in users away from the login page.
                window.location.replace(getRedirectPathForRole(user.role));
                return;
            }
            
            // Initialize the protected page they're on.
            await initProtectedPage(currentPage);

        } catch (error) {
            // Token is invalid or expired. Force logout.
            console.error('Authentication check failed, forcing logout.', error);
            api.logout(); // This clears tokens and redirects to login.
        }
    } else {
        // No token. User is not logged in.
        if (currentPage !== 'login' && currentPage !== 'index') {
            // If on a protected page, redirect to login.
            window.location.replace('/login.html');
            return;
        }
        // Otherwise, we're on the login page. Set up the form.
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    }
}

// --- Login Page Handling --- //
async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = '';
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing In...';

    try {
        const user = await api.login({ email: form.email.value, password: form.password.value });
        window.location.replace(getRedirectPathForRole(user.role));
    } catch (error) {
        console.error('Login failed:', error);
        errorMessage.textContent = error.message || 'An unknown error occurred.';
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
    }
}

// --- Initialize Application on DOM Load --- //
document.addEventListener('DOMContentLoaded', initializeApp);

// Placeholder functions for pages not yet implemented
async function initManageRequests() {
    console.log('Manage requests page initialization - placeholder');
}

async function initReports() {
    console.log('Reports page initialization - placeholder');
}

function setupUserManagementEvents() {
    console.log('User management events setup - placeholder');
}

function setupFleetManagementEvents() {
    console.log('Fleet management events setup - placeholder');
}

function setupMyRequestsEvents() {
    console.log('My requests events setup - placeholder');
}

function setupApprovalsEvents() {
    console.log('Approvals events setup - placeholder');
}

async function loadUsersTable() {
    console.log('Load users table - placeholder');
}

async function loadVehiclesTable() {
    console.log('Load vehicles table - placeholder');
}

function loadMyRequestsTable(requests) {
    console.log('Load my requests table - placeholder', requests);
}

function loadApprovalsTable(approvals) {
    console.log('Load approvals table - placeholder', approvals);
}