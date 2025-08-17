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

function showToast(message, type = 'success') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(element, message) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (!element) return;
    
    element.textContent = message;
    element.classList.remove('d-none');
}

function hideError(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (!element) return;
    
    element.classList.add('d-none');
}

function escapeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    return str.toString().replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
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

    async getAllRequests(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/requests?${params}`);
    }

    async getPendingEligibilityRequests() {
        return await this.request('/requests/pending-eligibility');
    }

    async getPendingFinalApprovalRequests() {
        return await this.request('/requests/pending-final-approval');
    }

    async assignCarToRequest(requestId, carId, driverId = null) {
        return await this.request(`/requests/${requestId}/assign-car`, {
            method: 'PATCH',
            body: { carId, driverId }
        });
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
    const user = api.getCurrentUser();

    try {
        let approvals;

        if (user.role === 'admin') {
            // Admins see all requests pending final approval
            approvals = await api.request('/requests/pending-final-approval');
        } else if (user.role === 'authority') {
            // Authorities see requests pending eligibility from their department
            approvals = await api.request('/requests/pending-eligibility');
        } else {
            // Approvers see their assigned pending approvals
            approvals = await api.request('/approvals/my-pending-approvals');
        }
        
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
        if (!hasPageAccess(currentPage, user.role)) {
            console.warn(`User with role '${user.role}' does not have access to page '${currentPage}'. Redirecting.`);
            window.location.replace(getRedirectPathForRole(user.role));
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
            case 'manage-requests': await setupManageRequestsEvents(); break;
            case 'reports': await initReports(); break;
            case 'new-request': await initNewRequestPage(); break;
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
        try {
            const user = await api.getMe();
            state.currentUser = user;
            localStorage.setItem(USER_KEY, JSON.stringify(user));

            if (currentPage === 'login' || currentPage === 'index') {
                const redirectPath = getRedirectPathForRole(user.role);
                window.location.replace(redirectPath);
                return;
            }
            
            await initProtectedPage(currentPage, user);

        } catch (error) {
            if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                api.logout();
            } else {
                const cachedUser = api.getCurrentUser();
                if (cachedUser) {
                    state.currentUser = cachedUser;
                    await initProtectedPage(currentPage, cachedUser);
                } else {
                    api.logout();
                }
            }
        }
    } else {
        if (currentPage !== 'login' && currentPage !== 'index') {
            window.location.replace('/login.html');
            return;
        }
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
        errorMessage.textContent = error.message || 'An unknown error occurred.';
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
    }
}

// --- Initialize Application on DOM Load --- //
document.addEventListener('DOMContentLoaded', initializeApp);

async function initNewRequestPage() {
    const newRequestForm = document.getElementById('requestForm');
    if (!newRequestForm) return;

    newRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = newRequestForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Submitting...';

        try {
            const departureValue = document.getElementById('departureDate').value;
            const returnValue = document.getElementById('returnDate').value;

            const requestData = {
                purpose: document.getElementById('purpose').value,
                destination: document.getElementById('destination').value,
                departureDateTime: new Date(departureValue).toISOString(),
                returnDateTime: new Date(returnValue).toISOString(),
                passengerCount: parseInt(document.getElementById('passengers').value, 10),
                additionalNotes: document.getElementById('comments').value,
                priority: 'medium', // Default priority
            };

            await api.createRequest(requestData);

            showAlert('Request submitted successfully!', 'success');
            setTimeout(() => window.location.href = '/my-requests.html', 1500);

        } catch (error) {
            console.error('Failed to submit request:', error);
            showAlert(error.message || 'Failed to submit request. Please check the form and try again.', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Request';
        }
    });
}

function setupManageRequestsEvents() {
    const requestsTableContainer = document.getElementById('requestsTableContainer');
    const eligibilityModal = document.getElementById('eligibilityModal');
    const closeEligibilityModalBtn = document.getElementById('closeEligibilityModal');
    const cancelEligibilityBtn = document.getElementById('cancelEligibilityBtn');
    const eligibilityForm = document.getElementById('eligibilityForm');
    const eligibilityError = document.getElementById('eligibilityError');
    let currentApprovalId = null;

    if (!requestsTableContainer || !eligibilityModal) {
        console.error('Required elements for Manage Requests page are missing.');
        return;
    }

    const loadManageRequestsTable = async () => {
        requestsTableContainer.innerHTML = `<div class="text-center text-muted"><div class="loading"></div> Loading requests...</div>`;
        try {
            const currentUser = api.getCurrentUser();
            console.log('Current user in manage requests:', currentUser);
            
            let requests;
            if (currentUser.role === 'admin') {
                // Admin sees requests pending final approval (after authority eligibility check)
                console.log('Loading pending final approval requests for admin');
                requests = await api.getPendingFinalApprovalRequests();
            } else if (currentUser.role === 'authority') {
                // Authority sees requests pending eligibility check from their department
                console.log('Loading pending eligibility requests for authority');
                requests = await api.getPendingEligibilityRequests();
            } else {
                // Other roles see their pending approvals
                console.log('Loading pending approvals for other roles');
                requests = await api.getPendingApprovals();
            }
            
            console.log('Loaded requests:', requests);
            if (requests.length === 0) {
                const message = currentUser.role === 'admin' ? 'No requests pending final approval.' : 
                               currentUser.role === 'authority' ? 'No requests pending eligibility review.' : 
                               'No pending approvals.';
                requestsTableContainer.innerHTML = `<div class="text-center text-muted">${message}</div>`;
                return;
            }

            const table = document.createElement('table');
            table.className = 'table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Requester</th>
                        <th>Purpose</th>
                        <th>Destination</th>
                        <th>Departure</th>
                        <th>Passengers</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(req => {
                        const actions = [];
                        if (currentUser.role === 'authority' && req.status === 'PENDING_ELIGIBILITY') {
                            actions.push(`<button class="btn btn-primary btn-sm process-btn" data-approval-id="${req.approvals?.[0]?.id || req.id}">Process Eligibility</button>`);
                        } else if (currentUser.role === 'admin' && req.status === 'PENDING_APPROVAL') {
                            actions.push(`<button class="btn btn-success btn-sm approve-btn" data-request-id="${req.id}">Approve</button>`);
                            actions.push(`<button class="btn btn-danger btn-sm reject-btn" data-request-id="${req.id}">Reject</button>`);
                        } else if (currentUser.role === 'admin' && req.status === 'approved') {
                            actions.push(`<button class="btn btn-info btn-sm assign-car-btn" data-request-id="${req.id}">Assign Vehicle</button>`);
                        }
                        return `
                        <tr>
                            <td>${req.user?.firstName || 'N/A'} ${req.user?.lastName || ''}</td>
                            <td>${escapeHTML(req.purpose)}</td>
                            <td>${escapeHTML(req.destination)}</td>
                            <td>${new Date(req.departureDateTime).toLocaleString()}</td>
                            <td>${req.passengerCount || req.passengers || 'N/A'}</td>
                            <td><span class="badge bg-secondary">${req.priority}</span></td>
                            <td><span class="badge bg-warning text-dark">${req.status.replace(/_/g, ' ')}</span></td>
                            <td>${actions.join(' ')}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            `;
            requestsTableContainer.innerHTML = '';
            requestsTableContainer.appendChild(table);
        } catch (error) {
            console.error('Failed to load requests for management:', error);
            requestsTableContainer.innerHTML = `<div class="alert alert-danger">Failed to load requests. Please try again.</div>`;
        }
    };

    requestsTableContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('process-btn')) {
            currentApprovalId = e.target.dataset.approvalId;
            eligibilityModal.classList.remove('d-none');
        }
    });

    // Close modal handlers
    closeEligibilityModalBtn.addEventListener('click', () => {
        eligibilityModal.classList.add('d-none');
    });
    
    cancelEligibilityBtn.addEventListener('click', () => {
        eligibilityModal.classList.add('d-none');
    });
    
    // Close modal when clicking outside
    eligibilityModal.addEventListener('click', (e) => {
        if (e.target === eligibilityModal) {
            eligibilityModal.classList.add('d-none');
        }
    });

    eligibilityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const decision = document.getElementById('eligibilityDecision').value;
        const comments = document.getElementById('eligibilityComments').value;

        if (decision === 'false' && !comments.trim()) {
            showError(eligibilityError, 'Comments are required when marking a request as ineligible.');
            return;
        }

        const submitBtn = document.getElementById('submitEligibilityBtn');
        showLoading('submitEligibilityBtn');
        if(eligibilityError) hideError(eligibilityError);

        try {
            await api.request(`/approvals/${currentApprovalId}/eligibility`, {
                method: 'PATCH',
                body: {
                    isEligible: decision === 'true',
                    comments
                }
            });
            eligibilityModal.classList.add('d-none');
            await loadManageRequestsTable();
            showToast('Decision submitted successfully.');
        } catch (error) {
            console.error('Failed to submit eligibility decision:', error);
            if (eligibilityError) {
                showError(eligibilityError, error.message || 'Failed to submit decision. Please try again.');
            }
        } finally {
            hideLoading('submitEligibilityBtn');
        }
    });

    // Add event handlers for new buttons
    requestsTableContainer.addEventListener('click', async (e) => {
        const target = e.target;
        
        if (target.classList.contains('approve-btn')) {
            const requestId = target.dataset.requestId;
            if (confirm('Are you sure you want to approve this request?')) {
                try {
                    await api.updateRequestStatus(requestId, 'approved');
                    showToast('Request approved successfully!', 'success');
                    loadManageRequestsTable();
                } catch (error) {
                    showAlert('Failed to approve request: ' + error.message, 'danger');
                }
            }
        } else if (target.classList.contains('reject-btn')) {
            const requestId = target.dataset.requestId;
            const reason = prompt('Please provide a reason for rejection:');
            if (reason) {
                try {
                    await api.updateRequestStatus(requestId, 'rejected', reason);
                    showToast('Request rejected successfully!', 'success');
                    loadManageRequestsTable();
                } catch (error) {
                    showAlert('Failed to reject request: ' + error.message, 'danger');
                }
            }
        } else if (target.classList.contains('assign-car-btn')) {
            const requestId = target.dataset.requestId;
            await showVehicleAssignmentModal(requestId);
        }
    });

    loadManageRequestsTable();
}

// Vehicle Assignment Modal Function
async function showVehicleAssignmentModal(requestId) {
    try {
        const [request, availableCars] = await Promise.all([
            api.getRequestById(requestId),
            api.getAvailableCars()
        ]);

        const modalHtml = `
            <div id="vehicleAssignmentModal" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">Assign Vehicle</h2>
                        <button class="modal-close" onclick="document.getElementById('vehicleAssignmentModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <strong>Request Details:</strong><br>
                            Purpose: ${request.purpose}<br>
                            Destination: ${request.destination}<br>
                            Passengers: ${request.passengerCount}<br>
                            Departure: ${new Date(request.departureDateTime).toLocaleString()}
                        </div>
                        <div class="form-group">
                            <label for="assignCarSelect">Select Vehicle:</label>
                            <select id="assignCarSelect" class="form-control" required>
                                <option value="">Choose a vehicle...</option>
                                ${availableCars.map(car => `
                                    <option value="${car.id}">
                                        ${car.make} ${car.model} (${car.plateNumber}) - Capacity: ${car.capacity}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="document.getElementById('vehicleAssignmentModal').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="assignVehicleToRequest('${requestId}')">Assign Vehicle</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        showAlert('Failed to load vehicle assignment modal: ' + error.message, 'danger');
    }
}

// Assign vehicle function
async function assignVehicleToRequest(requestId) {
    const carId = document.getElementById('assignCarSelect').value;
    if (!carId) {
        showAlert('Please select a vehicle', 'warning');
        return;
    }

    try {
        await api.assignCarToRequest(requestId, carId);
        showToast('Vehicle assigned successfully!', 'success');
        document.getElementById('vehicleAssignmentModal').remove();
        // Reload the manage requests table if it exists
        if (typeof loadManageRequestsTable === 'function') {
            loadManageRequestsTable();
        }
    } catch (error) {
        showAlert('Failed to assign vehicle: ' + error.message, 'danger');
    }
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

    const userForm = document.getElementById('userForm');
    let currentUserId = null;

    // Custom modal functions
    function showUserModal() {
        userModalEl.classList.remove('d-none');
    }
    
    function hideUserModal() {
        userModalEl.classList.add('d-none');
    }
    
    function showDeleteModal() {
        deleteModalEl.classList.remove('d-none');
    }
    
    function hideDeleteModal() {
        deleteModalEl.classList.add('d-none');
    }

    document.getElementById('createUserBtn').addEventListener('click', () => {
        currentUserId = null;
        userForm.reset();
        document.getElementById('userModalTitle').textContent = 'Create User';
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('password').required = true;
        document.getElementById('formError').classList.add('d-none');
        showUserModal();
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
                document.getElementById('telegramId').value = user.telegramId || '';
                document.getElementById('telegramUsername').value = user.telegramUsername || '';
                document.getElementById('status').value = user.status || 'active';

                document.getElementById('passwordGroup').style.display = 'none';
                document.getElementById('password').required = false;
                document.getElementById('formError').classList.add('d-none');
                showUserModal();
            } catch (error) {
                console.error(`Failed to fetch user ${userId} for editing:`, error);
                showAlert('Could not load user data. Please try again.', 'danger');
            }
        } else if (target.classList.contains('delete-user-btn')) {
            showDeleteModal();
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
            telegramId: document.getElementById('telegramId').value,
            telegramUsername: document.getElementById('telegramUsername').value,
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
            hideUserModal();
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
            hideDeleteModal();
            loadUsersTable();
        } catch (error) {
            showAlert('Failed to delete user.', 'danger');
        } finally {
            deleteBtn.disabled = false;
            loadingSpan.classList.add('d-none');
        }
    });

    document.getElementById('refreshUsersBtn')?.addEventListener('click', loadUsersTable);

    // Modal close handlers
    document.getElementById('closeUserModal')?.addEventListener('click', hideUserModal);
    document.getElementById('cancelUserBtn')?.addEventListener('click', hideUserModal);
    document.getElementById('closeDeleteModal')?.addEventListener('click', hideDeleteModal);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', hideDeleteModal);

    // Close modals when clicking outside
    userModalEl.addEventListener('click', (e) => {
        if (e.target === userModalEl) {
            hideUserModal();
        }
    });

    deleteModalEl.addEventListener('click', (e) => {
        if (e.target === deleteModalEl) {
            hideDeleteModal();
        }
    });
}

function setupFleetManagementEvents() {
    const vehicleModalEl = document.getElementById('vehicleModal');
    const deleteModalEl = document.getElementById('deleteModal');
    if (!vehicleModalEl || !deleteModalEl) {
        console.error('Fleet management modals not found!');
        return;
    }

    const vehicleForm = document.getElementById('vehicleForm');
    let currentVehicleId = null;

    // Custom modal functions
    function showVehicleModal() {
        vehicleModalEl.classList.remove('d-none');
    }
    
    function hideVehicleModal() {
        vehicleModalEl.classList.add('d-none');
    }
    
    function showDeleteModal() {
        deleteModalEl.classList.remove('d-none');
    }
    
    function hideDeleteModal() {
        deleteModalEl.classList.add('d-none');
    }

    document.getElementById('addVehicleBtn')?.addEventListener('click', () => {
        currentVehicleId = null;
        vehicleForm.reset();
        document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
        document.getElementById('formError').classList.add('d-none');
        showVehicleModal();
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
                document.getElementById('plateNumber').value = vehicle.plateNumber;
                document.getElementById('color').value = vehicle.color;
                document.getElementById('type').value = vehicle.type;
                document.getElementById('capacity').value = vehicle.capacity;
                document.getElementById('mileage').value = vehicle.mileage || '';
                document.getElementById('vehicleStatus').value = vehicle.status;
                document.getElementById('notes').value = vehicle.notes || '';
                showVehicleModal();
            } catch (error) {
                showAlert('Failed to load vehicle data for editing.', 'danger');
            }
        } else if (target.classList.contains('delete-vehicle-btn')) {
            showDeleteModal();
        }
    });

    vehicleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vehicleData = {
            make: document.getElementById('make').value,
            model: document.getElementById('model').value,
            year: parseInt(document.getElementById('year').value, 10),
            plateNumber: document.getElementById('plateNumber').value,
            color: document.getElementById('color').value,
            type: document.getElementById('type').value,
            capacity: parseInt(document.getElementById('capacity').value, 10),
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
            hideVehicleModal();
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
            hideDeleteModal();
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
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('statusFilter').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('searchVehicles').value = '';
        loadVehiclesTable();
    });

    // Modal close handlers
    document.getElementById('closeVehicleModal')?.addEventListener('click', hideVehicleModal);
    document.getElementById('cancelVehicleBtn')?.addEventListener('click', hideVehicleModal);
    document.getElementById('closeDeleteModal')?.addEventListener('click', hideDeleteModal);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', hideDeleteModal);

    // Close modals when clicking outside
    vehicleModalEl.addEventListener('click', (e) => {
        if (e.target === vehicleModalEl) {
            hideVehicleModal();
        }
    });

    deleteModalEl.addEventListener('click', (e) => {
        if (e.target === deleteModalEl) {
            hideDeleteModal();
        }
    });
}

function setupMyRequestsEvents() {
    const container = document.getElementById('requestsTableContainer');
    if (!container) return;

// ... (rest of the code remains the same)
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
    
    let currentRequestId = null;
    let currentAction = null;

    // Custom modal functions
    function showApprovalModal() {
        modalElement.classList.remove('d-none');
    }
    
    function hideApprovalModal() {
        modalElement.classList.add('d-none');
    }

    container.addEventListener('click', async (e) => {
        const target = e.target.closest('.approve-btn, .reject-btn');
        if (!target) return;

        currentRequestId = target.closest('tr').dataset.requestId;
        currentAction = target.classList.contains('approve-btn') ? 'approved' : 'rejected';

        const modalTitle = modalElement.querySelector('.modal-title');
        const reasonTextarea = modalElement.querySelector('#approvalReason');
        const decisionSelect = modalElement.querySelector('#decision');
        
        modalTitle.textContent = currentAction === 'approved' ? 'Approve Request' : 'Reject Request';
        decisionSelect.value = currentAction;
        reasonTextarea.required = currentAction === 'rejected';

        showApprovalModal();
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
                hideApprovalModal();
                initApprovals(); // Refresh the approvals list
            } catch (error) {
                console.error(`Failed to ${decision} request:`, error);
                showAlert(`Failed to ${decision} request.`, 'danger');
            }
        });
    }

    // Modal close handlers
    document.getElementById('closeApprovalModal')?.addEventListener('click', hideApprovalModal);
    document.getElementById('cancelApprovalBtn')?.addEventListener('click', hideApprovalModal);

    // Close modal when clicking outside
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
            hideApprovalModal();
        }
    });
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
                        <th>Color</th>
                        <th>Plate Number</th>
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
                            <td>${vehicle.color}</td>
                            <td>${vehicle.plateNumber}</td>
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