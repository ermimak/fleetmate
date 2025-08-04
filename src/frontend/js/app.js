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
                    // Only logout if we're not already on the login page
                    const currentPage = getCurrentPage();
                    if (currentPage !== 'login' && currentPage !== 'index') {
                        this.logout();
                        return;
                    }
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

    async updateCar(id, carData) {
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
    
    // Show/hide navigation items based on role (using lowercase to match backend)
    const roleBasedNavItems = {
        'approvalsNav': ['approver', 'admin', 'authority'],
        'manageRequestsNav': ['admin', 'authority'],
        'fleetManagementNav': ['admin', 'authority'],
        'userManagementNav': ['admin'],
        'reportsNav': ['admin', 'authority']
    };
    
    console.log('Updating navigation for user role:', user.role);
    Object.entries(roleBasedNavItems).forEach(([navId, allowedRoles]) => {
        const navElement = document.getElementById(navId);
        const hasAccess = allowedRoles.includes(user.role);
        console.log(`Nav element ${navId}: found=${!!navElement}, hasAccess=${hasAccess}, allowedRoles=${allowedRoles.join(', ')}`);
        if (navElement) {
            navElement.style.display = hasAccess ? 'block' : 'none';
        } else {
            console.warn(`Navigation element with ID '${navId}' not found`);
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
    
    // Navigation links - let browser handle navigation naturally
    // No need to override default link behavior
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
function hasPageAccess(page, userRole) {
    const pagePermissions = {
        'dashboard': ['admin', 'authority', 'approver', 'user'],
        'user-management': ['admin'],
        'fleet-management': ['admin', 'authority'],
        'my-requests': ['admin', 'authority', 'approver', 'user'],
        'approvals': ['approver', 'admin', 'authority'],
        'manage-requests': ['admin', 'authority'],
        'reports': ['admin', 'authority'],
        'new-request': ['admin', 'authority', 'approver', 'user']
    };
    
    const allowedRoles = pagePermissions[page];
    return allowedRoles ? allowedRoles.includes(userRole) : true;
}

function getRedirectPathForRole(role) {
    switch (role) {
        case 'admin':
        case 'authority':
            return '/dashboard.html';
        case 'approver':
            return '/approvals.html';
        case 'user':
        default:
            return '/my-requests.html';
    }
}

async function initProtectedPage(currentPage, user) {
    // This function assumes the user is already authenticated and their data is loaded.
    try {
        
        // Check if user has access to this page
                const redirectPath = getRedirectPathForRole(user.role);
        if (!hasPageAccess(currentPage, user.role)) {
            console.warn(`User with role '${user.role}' does not have access to page '${currentPage}'. Redirecting.`);
            // Safeguard: If the redirect path is the current page, send to a default safe page.
            if (window.location.pathname === redirectPath) {
                console.error("Redirect loop detected! Redirecting to /my-requests.html as a fallback.");
                window.location.replace('/my-requests.html');
            } else {
                window.location.replace(redirectPath);
            }
            return;
        }
        
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
        console.log('Token found:', token.substring(0, 20) + '...');
        console.log('Current page:', currentPage);
        try {
            const user = await api.getMe();
            console.log('User data received:', user);
            state.currentUser = user;
            localStorage.setItem(USER_KEY, JSON.stringify(user)); // Refresh user data

            // User is authenticated. Check where they are.
            if (currentPage === 'login' || currentPage === 'index') {
                // Redirect logged-in users away from the login page.
                const redirectPath = getRedirectPathForRole(user.role);
                console.log('Redirecting logged-in user to:', redirectPath);
                window.location.replace(redirectPath);
                return;
            }
            
            // Check if user has access to current page
            console.log('Checking page access for role:', user.role, 'on page:', currentPage);
            
                        // Initialize the protected page they're on.
            await initProtectedPage(currentPage, user);

        } catch (error) {
            // Token is invalid or expired. Force logout.
            console.error('Authentication check failed, forcing logout.', error);
            console.error('Error details:', error.message);
            console.error('Response status:', error.status);
            
            // Only logout if it's actually an auth error
            if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                api.logout(); // This clears tokens and redirects to login.
            } else {
                // Network or other error - try to continue with cached user data
                const cachedUser = api.getCurrentUser();
                if (cachedUser) {
                    console.log('Using cached user data:', cachedUser);
                    state.currentUser = cachedUser;
                    await initProtectedPage(currentPage, cachedUser);
                } else {
                    api.logout();
                }
            }
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
        console.log('Attempting login for:', form.email.value);
        const user = await api.login({ email: form.email.value, password: form.password.value });
        console.log('Login successful, user:', user);
        console.log('Redirecting to:', getRedirectPathForRole(user.role));
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
    try {
        showLoading('requestsTable');
        const requests = await api.getAllRequests();
        
        const stats = calculateRequestStats(requests);
        updateStatsCard('totalRequests', stats.total);
        updateStatsCard('pendingRequests', stats.pending);
        updateStatsCard('approvedRequests', stats.approved);
        updateStatsCard('activeTrips', requests.filter(r => r.status === 'active').length);

        await loadManageRequestsTable(requests);
        setupManageRequestsEvents();

    } catch (error) {
        console.error('Error initializing manage requests:', error);
        showAlert('Error loading request data', 'danger');
    } finally {
        hideLoading('requestsTable');
    }
}

async function loadManageRequestsTable(requests) {
    const container = document.getElementById('requestsTableContainer');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No requests found.</p>';
        return;
    }

    const tableHtml = `
        <table class="table table-hover" id="requestsTable">
            <thead>
                <tr>
                    <th>Purpose</th>
                    <th>User</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Passengers</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(request => `
                    <tr data-request-id="${request.id}">
                        <td>${request.purpose}</td>
                        <td>${request.user.firstName} ${request.user.lastName}</td>
                        <td>${formatDate(request.startTime)}</td>
                        <td>${formatDate(request.endTime)}</td>
                        <td>${request.passengerCount}</td>
                        <td>${getStatusBadge(request.status)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-request-btn" data-id="${request.id}">Details</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHtml;
}

function setupManageRequestsEvents() {
    console.log('Manage requests events setup - placeholder');
}

async function initReports() {
    try {
        showLoading('overdue-requests-table');
        
        const [requestStats, userStats, carStats, overdueRequests] = await Promise.all([
            api.getRequestStats().catch(() => ({})),
            api.getUserStats().catch(() => ({})),
            api.getCarStats().catch(() => ({})),
            api.getOverdueRequests().catch(() => [])
        ]);

        updateStatsCard('total-requests-stat', requestStats.total || 0);
        updateStatsCard('pending-requests-stat', requestStats.pending || 0);
        updateStatsCard('active-trips-stat', requestStats.active || 0);
        updateStatsCard('completed-trips-stat', requestStats.completed || 0);

        updateStatsCard('total-users-stat', userStats.total || 0);
        updateStatsCard('active-users-stat', userStats.active || 0);
        updateStatsCard('admins-stat', userStats.admins || 0);
        
        updateStatsCard('total-vehicles-stat', carStats.total || 0);
        updateStatsCard('available-vehicles-stat', carStats.available || 0);
        updateStatsCard('in-use-vehicles-stat', carStats.inUse || 0);
        updateStatsCard('maintenance-vehicles-stat', carStats.maintenance || 0);

        loadOverdueRequestsTable(overdueRequests);

    } catch (error) {
        console.error('Error initializing reports page:', error);
        showAlert('Failed to load reports data.', 'danger');
    } finally {
        hideLoading('overdue-requests-table');
    }
}

function loadOverdueRequestsTable(requests) {
    const tableBody = document.querySelector('#overdue-requests-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No overdue requests found.</td></tr>';
        return;
    }

    const rowsHtml = requests.map(request => `
        <tr>
            <td>${request.purpose}</td>
            <td>${request.user.firstName} ${request.user.lastName}</td>
            <td>${formatDate(request.endTime)}</td>
            <td>${getStatusBadge(request.status)}</td>
        </tr>
    `).join('');
    tableBody.innerHTML = rowsHtml;
}

async function loadUsersTable() {
    const tableBody = document.querySelector('#usersTable tbody');
    if (!tableBody) return;

    showLoading('usersTable');
    tableBody.innerHTML = ''; 

    try {
        const users = await api.getUsers();
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found.</td></tr>';
            return;
        }

        const rowsHtml = users.map(user => `
            <tr data-user-id="${user.id}">
                <td>${user.firstName} ${user.lastName || ''}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.isVerified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-warning">Pending</span>'}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-user-btn">Edit</button>
                    <button class="btn btn-sm btn-danger delete-user-btn">Delete</button>
                </td>
            </tr>
        `).join('');
        tableBody.innerHTML = rowsHtml;
    } catch (error) {
        console.error('Error loading users table:', error);
        showAlert('Failed to load users.', 'danger');
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load users.</td></tr>';
    } finally {
        hideLoading('usersTable');
    }
}

function setupUserManagementEvents() {
    const newUserBtn = document.getElementById('newUserBtn');
    const userModalElement = document.getElementById('userModal');
    if (!userModalElement) return;

    const userModal = new bootstrap.Modal(userModalElement);
    const userForm = document.getElementById('userForm');
    const usersTable = document.getElementById('usersTable');
    const modalTitle = document.getElementById('userModalLabel');
    let editingUserId = null;

    if (newUserBtn) {
        newUserBtn.addEventListener('click', () => {
            editingUserId = null;
            modalTitle.textContent = 'Add New User';
            userForm.reset();
            document.getElementById('password-group').style.display = 'block';
            userModal.show();
        });
    }

    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(userForm);
            const userData = Object.fromEntries(formData.entries());
            
            userData.isVerified = userData.isVerified === 'on';

            try {
                if (editingUserId) {
                    if (!userData.password) {
                        delete userData.password;
                    }
                    await api.updateUser(editingUserId, userData);
                    showAlert('User updated successfully.', 'success');
                } else {
                    await api.createUser(userData);
                    showAlert('User created successfully.', 'success');
                }
                userModal.hide();
                await loadUsersTable();
            } catch (error) {
                console.error('Error saving user:', error);
                showAlert(error.message || 'Failed to save user.', 'danger', 'userModalAlerts');
            }
        });
    }

    if (usersTable) {
        usersTable.addEventListener('click', async (e) => {
            const target = e.target;
            const userRow = target.closest('tr');
            if (!userRow) return;
            
            const userId = userRow.dataset.userId;

            if (target.classList.contains('edit-user-btn')) {
                editingUserId = userId;
                try {
                    const user = await api.getUserById(userId);
                    modalTitle.textContent = 'Edit User';
                    userForm.reset();
                    
                    Object.keys(user).forEach(key => {
                        const input = userForm.elements[key];
                        if (input) {
                            if (input.type === 'checkbox') {
                                input.checked = user[key];
                            } else {
                                input.value = user[key];
                            }
                        }
                    });
                    
                    document.getElementById('password-group').style.display = 'none';
                    userModal.show();
                } catch (error) {
                    showAlert('Failed to fetch user data for editing.', 'danger');
                }
            }

            if (target.classList.contains('delete-user-btn')) {
                if (confirm('Are you sure you want to delete this user?')) {
                    try {
                        await api.deleteUser(userId);
                        showAlert('User deleted successfully.', 'success');
                        await loadUsersTable();
                    } catch (error) {
                        showAlert('Failed to delete user.', 'danger');
                    }
                }
            }
        });
    }
}

function setupFleetManagementEvents() {
    const newVehicleBtn = document.getElementById('newVehicleBtn');
    const vehicleModalElement = document.getElementById('vehicleModal');
    if (!vehicleModalElement) return;

    const vehicleModal = new bootstrap.Modal(vehicleModalElement);
    const vehicleForm = document.getElementById('vehicleForm');
    const vehiclesTable = document.getElementById('vehiclesTable');
    const modalTitle = document.getElementById('vehicleModalLabel');
    let editingVehicleId = null;

    if (newVehicleBtn) {
        newVehicleBtn.addEventListener('click', () => {
            editingVehicleId = null;
            modalTitle.textContent = 'Add New Vehicle';
            vehicleForm.reset();
            vehicleModal.show();
        });
    }

    if (vehicleForm) {
        vehicleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(vehicleForm);
            const vehicleData = Object.fromEntries(formData.entries());
            vehicleData.passengerCount = parseInt(vehicleData.passengerCount, 10);

            try {
                if (editingVehicleId) {
                    await api.updateCar(editingVehicleId, vehicleData);
                    showAlert('Vehicle updated successfully.', 'success');
                } else {
                    await api.createCar(vehicleData);
                    showAlert('Vehicle created successfully.', 'success');
                }
                vehicleModal.hide();
                await loadVehiclesTable();
            } catch (error) {
                console.error('Error saving vehicle:', error);
                showAlert(error.message || 'Failed to save vehicle.', 'danger', 'vehicleModalAlerts');
            }
        });
    }

    if (vehiclesTable) {
        vehiclesTable.addEventListener('click', async (e) => {
            const target = e.target;
            const vehicleRow = target.closest('tr');
            if (!vehicleRow) return;

            const vehicleId = vehicleRow.dataset.vehicleId;

            if (target.classList.contains('edit-vehicle-btn')) {
                editingVehicleId = vehicleId;
                try {
                    const vehicle = await api.getCarById(vehicleId);
                    modalTitle.textContent = 'Edit Vehicle';
                    vehicleForm.reset();
                    Object.keys(vehicle).forEach(key => {
                        const input = vehicleForm.elements[key];
                        if (input) input.value = vehicle[key];
                    });
                    vehicleModal.show();
                } catch (error) {
                    showAlert('Failed to fetch vehicle data for editing.', 'danger');
                }
            }

            if (target.classList.contains('delete-vehicle-btn')) {
                if (confirm('Are you sure you want to delete this vehicle?')) {
                    try {
                        await api.deleteCar(vehicleId);
                        showAlert('Vehicle deleted successfully.', 'success');
                        await loadVehiclesTable();
                    } catch (error) {
                        showAlert('Failed to delete vehicle.', 'danger');
                    }
                }
            }
        });
    }
}

function setupMyRequestsEvents() {
    const requestsTable = document.getElementById('myRequestsTable');
    if (!requestsTable) return;

    requestsTable.addEventListener('click', e => {
        if (e.target.classList.contains('view-my-request-btn')) {
            const requestId = e.target.closest('tr').dataset.requestId;
            // In a full implementation, this would open a detailed modal.
            // For now, we can just show a simple alert or log it.
            console.log(`Viewing details for request ${requestId}`);
            showAlert(`Viewing details for request #${requestId}. Modal not yet implemented.`);
        }
    });
}

function setupApprovalsEvents() {
    const approvalsTable = document.getElementById('approvalsTable');
    const rejectionModal = new bootstrap.Modal(document.getElementById('rejectionModal'));
    const rejectionForm = document.getElementById('rejectionForm');
    let processingRequestId = null;

    if (approvalsTable) {
        approvalsTable.addEventListener('click', async (e) => {
            const target = e.target;
            const requestId = target.closest('tr')?.dataset.requestId;
            if (!requestId) return;

            if (target.classList.contains('approve-btn')) {
                if (confirm('Are you sure you want to approve this request?')) {
                    try {
                        await api.updateRequestStatus(requestId, 'approved');
                        showAlert('Request approved successfully.', 'success');
                        initApprovals(); // Refresh the list
                    } catch (error) {
                        showAlert('Failed to approve request.', 'danger');
                    }
                }
            }

            if (target.classList.contains('reject-btn')) {
                processingRequestId = requestId;
                rejectionForm.reset();
                rejectionModal.show();
            }
        });
    }

    if (rejectionForm) {
        rejectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reason = document.getElementById('rejectionReason').value;
            if (!processingRequestId || !reason) return;

            try {
                await api.updateRequestStatus(processingRequestId, 'rejected', reason);
                showAlert('Request rejected successfully.', 'success');
                rejectionModal.hide();
                initApprovals(); // Refresh the list
            } catch (error) {
                showAlert('Failed to reject request.', 'danger', 'rejectionModalAlerts');
            }
        });
    }
}

async function loadVehiclesTable() {
    const container = document.getElementById('vehiclesTableContainer');
    if (!container) return;

    showLoading('vehiclesTableContainer');
    container.innerHTML = '';

    try {
        const vehicles = await api.getCars();
        if (vehicles.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No vehicles found.</p>';
            return;
        }

        const tableHtml = `
            <table class="table table-hover" id="vehiclesTable">
                <thead>
                    <tr>
                        <th>Vehicle</th>
                        <th>Year</th>
                        <th>VIN</th>
                        <th>License Plate</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${vehicles.map(vehicle => `
                        <tr data-vehicle-id="${vehicle.id}">
                            <td>${vehicle.make} ${vehicle.model}</td>
                            <td>${vehicle.year}</td>
                            <td>${vehicle.vin}</td>
                            <td>${vehicle.licensePlate}</td>
                            <td>${vehicle.type}</td>
                            <td><span class="badge bg-${vehicle.status === 'available' ? 'success' : 'secondary'}">${vehicle.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-info edit-vehicle-btn" data-id="${vehicle.id}">Edit</button>
                                <button class="btn btn-sm btn-danger delete-vehicle-btn" data-id="${vehicle.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = tableHtml;
    } catch (error) {
        console.error('Error loading vehicles table:', error);
        showAlert('Failed to load vehicles.', 'danger');
        container.innerHTML = '<p class="text-center text-danger">Failed to load vehicles.</p>';
    } finally {
        hideLoading('vehiclesTableContainer');
    }
}

function loadMyRequestsTable(requests) {
    const container = document.getElementById('requestsTableContainer');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">You have not made any requests.</p>';
        return;
    }

    const tableHtml = `
        <table class="table table-hover" id="myRequestsTable">
            <thead>
                <tr>
                    <th>Purpose</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(request => `
                    <tr data-request-id="${request.id}">
                        <td>${request.purpose}</td>
                        <td>${formatDate(request.startTime)}</td>
                        <td>${formatDate(request.endTime)}</td>
                        <td>${getStatusBadge(request.status)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-my-request-btn">View Details</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = tableHtml;
}

function loadApprovalsTable(approvals) {
    const container = document.getElementById('approvalsTableContainer');
    if (!container) return;

    if (approvals.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No pending approvals.</p>';
        return;
    }

    const tableHtml = `
        <table class="table table-hover" id="approvalsTable">
            <thead>
                <tr>
                    <th>Purpose</th>
                    <th>Requested By</th>
                    <th>Start Time</th>
                    <th>Passengers</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${approvals.map(request => `
                    <tr data-request-id="${request.id}">
                        <td>${request.purpose}</td>
                        <td>${request.user.firstName} ${request.user.lastName}</td>
                        <td>${formatDate(request.startTime)}</td>
                        <td>${request.passengerCount}</td>
                        <td>${getStatusBadge(request.status)}</td>
                        <td>
                            <button class="btn btn-sm btn-success approve-btn" data-id="${request.id}">Approve</button>
                            <button class="btn btn-sm btn-danger reject-btn" data-id="${request.id}">Reject</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = tableHtml;
}