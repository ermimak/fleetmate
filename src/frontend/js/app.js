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
            case 'new-request': await initNewRequestPage(); break;
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
    const container = document.getElementById('requestsTableContainer');
    if (!container) return;

    // --- Modal Elements ---
    const requestModal = document.getElementById('requestModal');
    const statusModal = document.getElementById('statusModal');
    const assignModal = document.getElementById('assignModal');
    const tripModal = document.getElementById('tripModal');

    if (!requestModal || !statusModal || !assignModal || !tripModal) {
        console.error('One or more modals for Manage Requests page are missing!');
        return;
    }

    // --- Modal Instances ---
    const bsRequestModal = new bootstrap.Modal(requestModal);
    const bsStatusModal = new bootstrap.Modal(statusModal);
    const bsAssignModal = new bootstrap.Modal(assignModal);
    const bsTripModal = new bootstrap.Modal(tripModal);

    let currentRequestId = null;

    // --- Event Listeners for table actions ---
    container.addEventListener('click', async (e) => {
        const target = e.target.closest('.view-request-btn, .update-status-btn, .assign-vehicle-btn, .manage-trip-btn');
        if (!target) return;

        const requestId = target.closest('tr')?.dataset.requestId;
        if (!requestId) return;
        currentRequestId = requestId;

        if (target.classList.contains('view-request-btn')) {
            const detailsContainer = document.getElementById('requestDetails');
            detailsContainer.innerHTML = '<div class="text-center"><div class="loading"></div></div>';
            bsRequestModal.show();
            try {
                const request = await api.getRequestById(requestId);
                detailsContainer.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Requester:</strong> ${request.user.firstName} ${request.user.lastName}</p>
                            <p><strong>Destination:</strong> ${request.destination}</p>
                            <p><strong>Purpose:</strong> ${request.purpose}</p>
                            <p><strong>Passengers:</strong> ${request.passengerCount}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Start Time:</strong> ${formatDate(request.startTime)}</p>
                            <p><strong>End Time:</strong> ${formatDate(request.endTime)}</p>
                            <p><strong>Status:</strong> ${getStatusBadge(request.status)}</p>
                            <p><strong>Priority:</strong> ${request.priority || 'N/A'}</p>
                        </div>
                    </div>
                    <hr>
                    <p><strong>Assigned Vehicle:</strong> ${request.car ? `${request.car.make} ${request.car.model}` : 'Not Assigned'}</p>
                    <p><strong>Assigned Driver:</strong> ${request.driver ? `${request.driver.firstName} ${request.driver.lastName}` : 'Not Assigned'}</p>
                    <hr>
                    <p><strong>Additional Info:</strong></p>
                    <p>${request.additionalInfo || 'None'}</p>
                `;
            } catch (error) {
                detailsContainer.innerHTML = '<p class="text-danger">Failed to load request details.</p>';
            }
        } else if (target.classList.contains('update-status-btn')) {
            document.getElementById('statusForm').reset();
            bsStatusModal.show();
        } else if (target.classList.contains('assign-vehicle-btn')) {
            // TODO: Load vehicles and drivers into selects
            bsAssignModal.show();
        } else if (target.classList.contains('manage-trip-btn')) {
            // TODO: Logic to show start or complete trip section
            bsTripModal.show();
        }
    });

    // --- Event listener for status update form ---
    document.getElementById('statusForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newStatus = document.getElementById('newStatus').value;
        const reason = document.getElementById('statusReason').value;
        if (!newStatus || !currentRequestId) return;

        try {
            await api.updateRequestStatus(currentRequestId, newStatus, reason);
            showAlert('Status updated successfully!', 'success');
            bsStatusModal.hide();
            loadManageRequestsTable(); // Refresh table
        } catch (error) {
            showAlert(error.message || 'Failed to update status.', 'danger', 'statusError');
        }
    });
    
    // --- Filter and Refresh Listeners ---
    document.getElementById('refreshRequestsBtn')?.addEventListener('click', loadManageRequestsTable);
    document.getElementById('statusFilter')?.addEventListener('change', loadManageRequestsTable);
    document.getElementById('priorityFilter')?.addEventListener('change', loadManageRequestsTable);
    document.getElementById('searchRequests')?.addEventListener('input', (e) => {
        // Basic debouncing
        setTimeout(() => {
            if(document.getElementById('searchRequests').value === e.target.value) {
                loadManageRequestsTable();
            }
        }, 500);
    });
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        document.getElementById('statusFilter').value = '';
        document.getElementById('priorityFilter').value = '';
        document.getElementById('searchRequests').value = '';
        loadManageRequestsTable();
    });
}

async function initNewRequestPage() {
    const form = document.getElementById('requestForm');
    if (!form) return;

    const departureDateEl = document.getElementById('departureDate');
    const returnDateEl = document.getElementById('returnDate');

    // Set minimum date/time to now
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);

    departureDateEl.min = localISOTime;
    returnDateEl.min = localISOTime;
    departureDateEl.value = localISOTime;

    departureDateEl.addEventListener('change', (e) => {
        returnDateEl.min = e.target.value;
        if (returnDateEl.value < e.target.value) {
            returnDateEl.value = e.target.value;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const requestData = {
            destination: document.getElementById('destination').value,
            purpose: document.getElementById('purpose').value,
            startTime: document.getElementById('departureDate').value,
            endTime: document.getElementById('returnDate').value,
            passengerCount: parseInt(document.getElementById('passengers').value, 10) || 1,
            additionalInfo: document.getElementById('comments').value,
        };

        if (new Date(requestData.endTime) <= new Date(requestData.startTime)) {
            showAlert('Return date must be after departure date.', 'danger');
            return;
        }

        try {
            await api.createRequest(requestData);
            window.location.href = '/my-requests.html';
        } catch (error) {
            console.error('Error creating request:', error);
            showAlert(error.message || 'Failed to create request. Please try again.', 'danger');
        }
    });
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
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    container.innerHTML = `<div class="text-center text-muted"><div class="loading"></div> Loading users...</div>`;

    try {
        const users = await api.getUsers();
        
        // Update stats
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('adminUsers').textContent = users.filter(u => u.role === 'admin').length;

        if (users.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No users found.</p>';
            return;
        }

        const tableHtml = `
            <table class="table" id="usersTable">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr data-user-id="${user.id}">
                            <td>${user.firstName} ${user.lastName}</td>
                            <td>${user.email}</td>
                            <td><span class="badge badge-role-${user.role}">${user.role}</span></td>
                            <td>${user.department || 'N/A'}</td>
                            <td><span class="badge badge-status-${user.status || 'active'}">${user.status || 'Active'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary edit-user-btn">Edit</button>
                                <button class="btn btn-sm btn-outline-danger delete-user-btn">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = tableHtml;
    } catch (error) {
        console.error('Failed to load users:', error);
        container.innerHTML = `<p class="text-center text-danger">Error loading users. Please try again.</p>`;
    }
}

function setupUserManagementEvents() {
    const userModalEl = document.getElementById('userModal');
    const deleteModalEl = document.getElementById('deleteModal');
    if (!userModalEl || !deleteModalEl) {
        console.error('User management modals not found!');
        return;
    }

    const userModal = new bootstrap.Modal(userModalEl);
    const deleteModal = new bootstrap.Modal(deleteModalEl);
    const userForm = document.getElementById('userForm');
    let currentUserId = null;

    document.getElementById('createUserBtn').addEventListener('click', () => {
        currentUserId = null;
        userForm.reset();
        document.getElementById('userModalTitle').textContent = 'Create User';
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('password').required = true;
        document.getElementById('formError').classList.add('d-none');
        userModal.show();
    });

    document.getElementById('usersTableContainer').addEventListener('click', async (e) => {
        const target = e.target.closest('.edit-user-btn, .delete-user-btn');
        if (!target) return;
        
        const userId = target.closest('tr')?.dataset.userId;
        if (!userId) return;

        currentUserId = userId;

        if (target.classList.contains('edit-user-btn')) {
            try {
                const user = await api.getUserById(userId);
                
                document.getElementById('userModalTitle').textContent = 'Edit User';
                document.getElementById('firstName').value = user.firstName;
                document.getElementById('lastName').value = user.lastName;
                document.getElementById('email').value = user.email;
                document.getElementById('role').value = user.role;
                document.getElementById('department').value = user.department || '';
                document.getElementById('position').value = user.position || '';
                document.getElementById('phoneNumber').value = user.phoneNumber || '';
                document.getElementById('status').value = user.status || 'active';

                document.getElementById('passwordGroup').style.display = 'none';
                document.getElementById('password').required = false;
                document.getElementById('formError').classList.add('d-none');
                userModal.show();
            } catch (error) {
                console.error(`Failed to fetch user ${userId} for editing:`, error);
                showAlert('Could not load user data. Please try again.', 'danger');
            }
        } else if (target.classList.contains('delete-user-btn')) {
            deleteModal.show();
        }
    });

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveUserBtn');
        const loadingSpan = saveBtn.querySelector('.loading');
        
        saveBtn.disabled = true;
        loadingSpan.classList.remove('d-none');

        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            role: document.getElementById('role').value,
            department: document.getElementById('department').value,
            position: document.getElementById('position').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            status: document.getElementById('status').value,
        };

        try {
            if (currentUserId) { // Editing user
                await api.updateUser(currentUserId, userData);
                showAlert('User updated successfully!', 'success');
            } else { // Creating user
                userData.password = document.getElementById('password').value;
                await api.createUser(userData);
                showAlert('User created successfully!', 'success');
            }
            userModal.hide();
            loadUsersTable();
        } catch (error) {
            showAlert(error.message || 'Failed to save user.', 'danger', 'formError');
        } finally {
            saveBtn.disabled = false;
            loadingSpan.classList.add('d-none');
        }
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (!currentUserId) return;
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        const loadingSpan = deleteBtn.querySelector('.loading');

        deleteBtn.disabled = true;
        loadingSpan.classList.remove('d-none');

        try {
            await api.deleteUser(currentUserId);
            showAlert('User deleted successfully.', 'success');
            deleteModal.hide();
            loadUsersTable();
        } catch (error) {
            showAlert('Failed to delete user.', 'danger');
        } finally {
            deleteBtn.disabled = false;
            loadingSpan.classList.add('d-none');
        }
    });

    document.getElementById('refreshUsersBtn')?.addEventListener('click', loadUsersTable);
}

function setupFleetManagementEvents() {
    const vehicleModalEl = document.getElementById('vehicleModal');
    const deleteModalEl = document.getElementById('deleteModal');
    if (!vehicleModalEl || !deleteModalEl) {
        console.error('Fleet management modals not found!');
        return;
    }

    const vehicleModal = new bootstrap.Modal(vehicleModalEl);
    const deleteModal = new bootstrap.Modal(deleteModalEl);
    const vehicleForm = document.getElementById('vehicleForm');
    let currentVehicleId = null;

    document.getElementById('addVehicleBtn')?.addEventListener('click', () => {
        currentVehicleId = null;
        vehicleForm.reset();
        document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
        document.getElementById('formError').classList.add('d-none');
        vehicleModal.show();
    });

    document.getElementById('vehiclesTableContainer')?.addEventListener('click', async (e) => {
        const target = e.target.closest('.edit-vehicle-btn, .delete-vehicle-btn');
        if (!target) return;

        const vehicleId = target.closest('tr')?.dataset.vehicleId;
        if (!vehicleId) return;
        currentVehicleId = vehicleId;

        if (target.classList.contains('edit-vehicle-btn')) {
            try {
                const vehicle = await api.getCarById(vehicleId);
                document.getElementById('vehicleModalTitle').textContent = 'Edit Vehicle';
                // Populate form
                document.getElementById('make').value = vehicle.make;
                document.getElementById('model').value = vehicle.model;
                document.getElementById('year').value = vehicle.year;
                document.getElementById('licensePlate').value = vehicle.licensePlate;
                document.getElementById('type').value = vehicle.type;
                document.getElementById('capacity').value = vehicle.capacity;
                document.getElementById('fuelType').value = vehicle.fuelType;
                document.getElementById('mileage').value = vehicle.mileage || '';
                document.getElementById('vehicleStatus').value = vehicle.status;
                document.getElementById('notes').value = vehicle.notes || '';
                vehicleModal.show();
            } catch (error) {
                showAlert('Failed to load vehicle data for editing.', 'danger');
            }
        } else if (target.classList.contains('delete-vehicle-btn')) {
            deleteModal.show();
        }
    });

    vehicleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vehicleData = {
            make: document.getElementById('make').value,
            model: document.getElementById('model').value,
            year: parseInt(document.getElementById('year').value, 10),
            licensePlate: document.getElementById('licensePlate').value,
            type: document.getElementById('type').value,
            capacity: parseInt(document.getElementById('capacity').value, 10),
            fuelType: document.getElementById('fuelType').value,
            mileage: parseInt(document.getElementById('mileage').value, 10) || 0,
            status: document.getElementById('vehicleStatus').value,
            notes: document.getElementById('notes').value,
        };

        try {
            if (currentVehicleId) {
                await api.updateCar(currentVehicleId, vehicleData);
                showAlert('Vehicle updated successfully!', 'success');
            } else {
                await api.createCar(vehicleData);
                showAlert('Vehicle added successfully!', 'success');
            }
            vehicleModal.hide();
            await loadVehiclesTable();
        } catch (error) {
            showAlert(error.message || 'Failed to save vehicle.', 'danger', 'formError');
        }
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        if (!currentVehicleId) return;
        try {
            await api.deleteCar(currentVehicleId);
            showAlert('Vehicle deleted successfully.', 'success');
            deleteModal.hide();
            await loadVehiclesTable();
        } catch (error) {
            showAlert('Failed to delete vehicle.', 'danger');
        }
    });

    // --- Filter and Refresh Listeners ---
    document.getElementById('refreshFleetBtn')?.addEventListener('click', loadVehiclesTable);
    document.getElementById('statusFilter')?.addEventListener('change', loadVehiclesTable);
    document.getElementById('typeFilter')?.addEventListener('change', loadVehiclesTable);
    document.getElementById('searchVehicles')?.addEventListener('input', (e) => {
        setTimeout(() => {
            if (document.getElementById('searchVehicles').value === e.target.value) {
                loadVehiclesTable();
            }
        }, 500);
    });
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        document.getElementById('statusFilter').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('searchVehicles').value = '';
        loadVehiclesTable();
    });
}
function setupMyRequestsEvents() {
    const container = document.getElementById('requestsTableContainer');
    if (!container) return;

    const modal = document.getElementById('requestModal');
    const modalDetails = document.getElementById('requestDetails');
    const closeModalBtn = document.getElementById('closeRequestModal');

    if (!modal || !modalDetails || !closeModalBtn) {
        console.error('Request details modal elements not found!');
        return;
    }

    const showModal = () => modal.classList.remove('d-none');
    const hideModal = () => modal.classList.add('d-none');

    closeModalBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { 
            hideModal();
        }
    });

    container.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-my-request-btn')) {
            const requestId = e.target.closest('tr').dataset.requestId;
            if (!requestId) return;

            modalDetails.innerHTML = `<div class="text-center text-muted"><div class="loading"></div> Loading request details...</div>`;
            showModal();

            try {
                const request = await api.getRequestById(requestId);
                modalDetails.innerHTML = renderRequestDetails(request);
            } catch (error) {
                console.error(`Error fetching details for request ${requestId}:`, error);
                modalDetails.innerHTML = `<p class="text-danger">Failed to load request details. Please try again.</p>`;
            }
        }
    });
}

function renderRequestDetails(request) {
    const assignedCar = request.car;
    const approver = request.approvedBy;

    return `
        <div class="row">
            <div class="col-md-6">
                <h5>Trip Information</h5>
                <p><strong>Purpose:</strong> ${request.purpose}</p>
                <p><strong>Destination:</strong> ${request.destination}</p>
                <p><strong>Departure:</strong> ${formatDate(request.startTime)}</p>
                <p><strong>Return:</strong> ${formatDate(request.endTime)}</p>
                <p><strong>Passengers:</strong> ${request.passengerCount}</p>
            </div>
            <div class="col-md-6">
                <h5>Status & Approval</h5>
                <p><strong>Status:</strong> ${getStatusBadge(request.status)}</p>
                ${approver ? `
                    <p><strong>Approver:</strong> ${approver.firstName} ${approver.lastName}</p>
                    <p><strong>Approval Date:</strong> ${formatDate(request.approvalDate)}</p>
                ` : ''}
                ${request.status === 'rejected' && request.rejectionReason ? `
                    <p><strong>Rejection Reason:</strong> ${request.rejectionReason}</p>
                ` : ''}
            </div>
        </div>
        <hr>
        ${assignedCar ? `
            <h5>Assigned Vehicle</h5>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Vehicle:</strong> ${assignedCar.make} ${assignedCar.model} (${assignedCar.year})</p>
                    <p><strong>License Plate:</strong> ${assignedCar.licensePlate}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Color:</strong> ${assignedCar.color}</p>
                    <p><strong>Type:</strong> ${assignedCar.type}</p>
                </div>
            </div>
            <hr>
        ` : ''}
        <h5>Requester Information</h5>
        <p><strong>Name:</strong> ${request.user.firstName} ${request.user.lastName}</p>
        <p><strong>Email:</strong> ${request.user.email}</p>
        ${request.additionalInfo ? `
            <hr>
            <h5>Additional Comments</h5>
            <p>${request.additionalInfo}</p>
        ` : ''}
    `;
}

function setupApprovalsEvents() {
    const container = document.getElementById('approvalsTableContainer');
    if (!container) return;

    const modalElement = document.getElementById('approvalModal');
    if (!modalElement) {
        console.error('Approval modal not found!');
        return;
    }
    
    let approvalModal = null; // To be initialized on first click
    let currentRequestId = null;
    let currentAction = null;

    container.addEventListener('click', async (e) => {
        const target = e.target.closest('.approve-btn, .reject-btn');
        if (!target) return;

        currentRequestId = target.closest('tr').dataset.requestId;
        currentAction = target.classList.contains('approve-btn') ? 'approved' : 'rejected';

        if (!approvalModal) {
            approvalModal = new bootstrap.Modal(modalElement);
        }

        const modalTitle = modalElement.querySelector('.modal-title');
        const reasonTextarea = modalElement.querySelector('#approvalReason');
        const decisionSelect = modalElement.querySelector('#decision');
        
        modalTitle.textContent = currentAction === 'approved' ? 'Approve Request' : 'Reject Request';
        decisionSelect.value = currentAction;
        reasonTextarea.required = currentAction === 'rejected';

        approvalModal.show();
    });

    const submitButton = document.getElementById('submitApprovalBtn');
    if (submitButton) {
        submitButton.addEventListener('click', async () => {
            const reason = document.getElementById('approvalReason').value;
            const decision = document.getElementById('decision').value;

            if (decision === 'rejected' && !reason) {
                showAlert('A reason is required to reject a request.', 'warning');
                return;
            }

            try {
                await api.updateRequestStatus(currentRequestId, decision, reason);
                showAlert(`Request ${decision} successfully.`, 'success');
                if (approvalModal) {
                    approvalModal.hide();
                }
                initApprovals(); // Refresh the approvals list
            } catch (error) {
                console.error(`Failed to ${decision} request:`, error);
                showAlert(`Failed to ${decision} request.`, 'danger');
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