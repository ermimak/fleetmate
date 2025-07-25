// --- Persistent Logging --- //
const LOG_KEY = 'app_debug_logs';
const MAX_LOG_ENTRIES = 50;

function logToStorage(level, ...args) {
    try {
        // Get existing logs
        const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
        
        // Add new log entry
        logs.push({
            timestamp: new Date().toISOString(),
            level,
            message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ')
        });
        
        // Keep only the most recent logs
        while (logs.length > MAX_LOG_ENTRIES) {
            logs.shift();
        }
        
        // Save back to storage
        localStorage.setItem(LOG_KEY, JSON.stringify(logs));
        
        // Also log to console
        console[level](...args);
    } catch (e) {
        console.error('Error writing to log storage:', e);
    }
}

function clearLogs() {
    localStorage.removeItem(LOG_KEY);
}

function getLogs() {
    try {
        return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

// --- API Service --- //
class ApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                body: options.body ? JSON.stringify(options.body) : null,
            });

            if (response.status === 401) {
                this.logout();
                throw new Error('Unauthorized');
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = data.message || 'Something went wrong';
                console.error('API Error Response:', data);
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            logToStorage('log', 'Attempting login with credentials:', { email: credentials.email });
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            const responseData = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                logToStorage('error', 'Login failed with status:', response.status, 'Response:', responseData);
                throw new Error(responseData.message || 'Login failed. Please check your credentials and try again.');
            }
            
            logToStorage('log', 'Login successful, response data:', { 
                hasToken: !!responseData.access_token,
                tokenLength: responseData.access_token ? responseData.access_token.length : 0
            });
            
            if (!responseData.access_token) {
                logToStorage('error', 'No access token in response:', responseData);
                throw new Error('No access token received from server');
            }
            
            // Store the token and update the API service
            this.setToken(responseData.access_token);
            localStorage.setItem('authToken', responseData.access_token);
            
            try {
                // Fetch user profile after login
                logToStorage('log', 'Fetching user profile...');
                const user = await this.getMe();
                
                if (!user) {
                    throw new Error('Failed to load user profile');
                }
                
                logToStorage('log', 'User profile loaded successfully:', { 
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown'
                });
                
                // Store user data in localStorage
                localStorage.setItem('userData', JSON.stringify(user));
                if (user.role) {
                    localStorage.setItem('userRole', user.role);
                }
                
                return user;
            } catch (profileError) {
                logToStorage('error', 'Error fetching user profile after login:', profileError);
                // Clear the token if we couldn't fetch the profile
                this.logout();
                throw new Error('Failed to load user profile. Please try again.');
            }
        } catch (error) {
            logToStorage('error', 'Login error:', error);
            throw error;
        }
    }

    async getMe() {
        try {
            logToStorage('log', 'Fetching user profile from /api/users/me');
            const response = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                logToStorage('error', 'Failed to fetch user profile:', error);
                throw new Error(error.message || 'Failed to fetch user profile');
            }
            
            const userData = await response.json();
            logToStorage('log', 'User profile data received:', { 
                id: userData.id,
                email: userData.email,
                role: userData.role
            });
            return userData;
        } catch (error) {
            logToStorage('error', 'Error in getMe:', error);
            throw error;
        }
    }

    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        // Only check for token, as user data might be loaded after authentication
        return !!token;
    }

    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;
        return user.role === requiredRole || user.role === 'ADMIN';
    }

    logout() {
        this.setToken(null);
        window.location.href = '/login.html';
    }

    getCurrentUser() {
        return this.request('/users/me');
    }

    getMyRequests() {
        return this.request('/requests/my-requests');
    }

    createRequest(data) {
        return this.request('/requests', { method: 'POST', body: data });
    }

    getRequestById(id) {
        return this.request(`/requests/${id}`);
    }

    cancelRequest(id, reason) {
        return this.request(`/requests/${id}/cancel`, { method: 'PATCH', body: { reason } });
    }

    // --- Admin/Authority Methods ---
    getAllRequests(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/requests?${query}`);
    }

    getPendingApprovals() {
        return this.request('/requests/pending-approvals');
    }

    updateRequestStatus(id, status, reason = '') {
        return this.request(`/requests/${id}/status`, { method: 'PATCH', body: { status, reason } });
    }

    getAvailableCars(passengerCount) {
        return this.request(`/cars/available?passengerCount=${passengerCount}`);
    }

    getAvailableDrivers() {
        return this.request('/drivers/available');
    }

    assignCarToRequest(requestId, carId, driverId) {
        return this.request(`/requests/${requestId}/assign-car`, { method: 'PATCH', body: { carId, driverId } });
    }

    startTrip(requestId) {
        return this.request(`/requests/${requestId}/start-trip`, { method: 'PATCH' });
    }

    completeTrip(requestId, totalDistance, tripNotes) {
        return this.request(`/requests/${requestId}/complete-trip`, { method: 'PATCH', body: { totalDistance, tripNotes } });
    }

    getRequestStats() {
        return this.request('/requests/stats');
    }

    getOverdueRequests() {
        return this.request('/requests/overdue');
    }

    // User Management
    getUsers() {
        return this.request('/users');
    }

    getUserById(userId) {
        return this.request(`/users/${userId}`);
    }

    createUser(userData) {
        return this.request('/users', { method: 'POST', body: userData });
    }

    updateUser(userId, userData) {
        return this.request(`/users/${userId}`, { method: 'PATCH', body: userData });
    }

    deleteUser(userId) {
        return this.request(`/users/${userId}`, { method: 'DELETE' });
    }
}

// --- App State --- //
const state = {
    currentUser: null,
};

// --- Initialize API Service --- //
const api = new ApiService('/api');

// --- Rendering --- //
function renderAppLayout() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <header class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
            <a class="navbar-brand col-md-3 col-lg-2 me-0 px-3" href="#">FleetMate</a>
            <div class="navbar-nav">
                <div class="nav-item text-nowrap">
                    <a id="logoutButton" class="nav-link px-3" href="#">Sign out</a>
                </div>
            </div>
        </header>
        <div class="container-fluid">
            <div class="row">
                <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
                    <div class="position-sticky pt-3">
                        <ul class="nav flex-column">
                            <li class="nav-item">
                                <a class="nav-link" href="/dashboard.html">Dashboard</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/requests.html">My Requests</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/new-request.html">New Request</a>
                            </li>
                        </ul>

                        ${['ADMIN', 'AUTHORITY', 'APPROVER'].includes(state.currentUser.role) ? `
                        <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                          <span>Management</span>
                        </h6>
                        <ul class="nav flex-column mb-2">
                          ${state.currentUser.role === 'ADMIN' ? `
                          <li class="nav-item">
                            <a class="nav-link" href="/user-management.html">User Management</a>
                          </li>
                          ` : ''}
                          <li class="nav-item">
                            <a class="nav-link" href="/manage-requests.html">Manage Requests</a>
                          </li>
                          <li class="nav-item">
                            <a class="nav-link" href="/pending-approvals.html">Pending Approvals</a>
                          </li>
                          <li class="nav-item">
                            <a class="nav-link" href="/statistics.html">Statistics</a>
                          </li>
                          <li class="nav-item">
                            <a class="nav-link" href="/overdue-requests.html">Overdue Requests</a>
                          </li>
                        </ul>
                        ` : ''}

                    </div>
                </nav>
                <main id="main-content" class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                    <!-- Dynamic content will be loaded here -->
                </main>
            </div>
        </div>
        <div id="form-modal-container"></div>
    `;
    document.getElementById('logoutButton').addEventListener('click', (e) => {
        e.preventDefault();
        api.logout();
    });
}

function renderContent(title, content) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">${title}</h1>
            </div>
            ${content}
        `;
    }
}

// --- Page Handlers --- //
const pages = {
    '/dashboard.html': () => {
        renderContent('Dashboard', `<p>Welcome, ${state.currentUser.firstName}! Use the navigation to manage your requests.</p>`);
    },
    '/requests.html': async () => {
        renderContent('My Requests', '<p>Loading requests...</p>');
        try {
            const requests = await api.getMyRequests();
            let requestsHtml = '<ul class="list-group">';
            if (requests.length === 0) {
                requestsHtml += '<li class="list-group-item">No requests found.</li>';
            } else {
                requests.forEach(req => {
                    requestsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Destination:</strong> ${req.destination} <br>
                                <strong>Status:</strong> <span class="badge bg-info">${req.status}</span>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-primary view-details-btn" data-request-id="${req.id}">Details</button>
                                <button class="btn btn-sm btn-danger cancel-request-btn" data-request-id="${req.id}" ${req.status !== 'PENDING' ? 'disabled' : ''}>Cancel</button>
                            </div>
                        </li>`;
                });
            }
            requestsHtml += '</ul>';
            renderContent('My Requests', requestsHtml);
            addRequestActionListeners(); // Attach listeners after rendering
        } catch (error) {
            renderContent('My Requests', '<p class="text-danger">Failed to load requests.</p>');
        }
    },
    '/new-request.html': () => {
        const formHtml = `
            <form id="newRequestForm">
                <div class="mb-3">
                    <label for="purpose" class="form-label">Purpose of Trip</label>
                    <input type="text" class="form-control" id="purpose" required>
                </div>
                <div class="mb-3">
                    <label for="destination" class="form-label">Destination</label>
                    <input type="text" class="form-control" id="destination" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="departureDateTime" class="form-label">Departure Date & Time</label>
                        <input type="datetime-local" class="form-control" id="departureDateTime" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="returnDateTime" class="form-label">Return Date & Time</label>
                        <input type="datetime-local" class="form-control" id="returnDateTime">
                    </div>
                </div>
                <div class="mb-3">
                    <label for="passengerCount" class="form-label">Number of Passengers</label>
                    <input type="number" class="form-control" id="passengerCount" min="1" max="50" required>
                </div>
                <div class="mb-3">
                    <label for="additionalNotes" class="form-label">Additional Notes</label>
                    <textarea class="form-control" id="additionalNotes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Submit Request</button>
                <div id="form-error" class="mt-3 text-danger"></div>
            </form>
        `;
        renderContent('New Request', formHtml);
        
        const newRequestForm = document.getElementById('newRequestForm');
        if (newRequestForm) {
            newRequestForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorDiv = document.getElementById('form-error');
                errorDiv.textContent = '';
                
                const requestData = {
                    purpose: document.getElementById('purpose').value,
                    destination: document.getElementById('destination').value,
                    departureDateTime: document.getElementById('departureDateTime').value,
                    returnDateTime: document.getElementById('returnDateTime').value || null,
                    passengerCount: parseInt(document.getElementById('passengerCount').value, 10),
                    additionalNotes: document.getElementById('additionalNotes').value,
                };

                try {
                    await api.createRequest(requestData);
                    alert('Request created successfully!');
                    window.location.href = '/requests.html';
                } catch (error) {
                    errorDiv.textContent = `Failed to create request: ${error.message}`;
                }
            });
        }
    },
    '/404.html': () => {
        renderContent('404 Not Found', '<p>The page you are looking for does not exist.</p>');
    },
    '/request-details.html': async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const requestId = urlParams.get('id');
        if (!requestId) {
            renderContent('Error', '<p>No request ID provided.</p>');
            return;
        }

        renderContent('Request Details', '<p>Loading details...</p>');
        try {
            const request = await api.getRequestById(requestId);
            let detailsHtml = `
                <div class="card">
                    <div class="card-header">Request Details</div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"><strong>ID:</strong> ${request.id}</li>
                        <li class="list-group-item"><strong>Purpose:</strong> ${request.purpose}</li>
                        <li class="list-group-item"><strong>Destination:</strong> ${request.destination}</li>
                        <li class="list-group-item"><strong>Status:</strong> <span class="badge bg-info">${request.status}</span></li>
                        <li class="list-group-item"><strong>Departure:</strong> ${new Date(request.departureDateTime).toLocaleString()}</li>
                        <li class="list-group-item"><strong>Return:</strong> ${request.returnDateTime ? new Date(request.returnDateTime).toLocaleString() : 'N/A'}</li>
                        <li class="list-group-item"><strong>Passengers:</strong> ${request.passengerCount}</li>
                        <li class="list-group-item"><strong>Notes:</strong> ${request.additionalNotes || 'None'}</li>
                    </ul>
                </div>
            `;

            // Show assignment form for admins/authorities on approved requests
            if (request.status === 'APPROVED' && ['ADMIN', 'AUTHORITY'].includes(state.currentUser.role)) {
                const [cars, drivers] = await Promise.all([
                    api.getAvailableCars(request.passengerCount),
                    api.getAvailableDrivers()
                ]);

                detailsHtml += `
                    <div class="card mt-4">
                        <div class="card-header">Assign Vehicle</div>
                        <div class="card-body">
                            <form id="assignVehicleForm">
                                <div class="mb-3">
                                    <label for="carId" class="form-label">Select Car</label>
                                    <select id="carId" class="form-select" required>
                                        <option value="">Choose a car...</option>
                                        ${cars.map(car => `<option value="${car.id}">${car.make} ${car.model} (${car.licensePlate})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="driverId" class="form-label">Select Driver</label>
                                    <select id="driverId" class="form-select" required>
                                        <option value="">Choose a driver...</option>
                                        ${drivers.map(driver => `<option value="${driver.id}">${driver.firstName} ${driver.lastName}</option>`).join('')}
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-success">Assign</button>
                            </form>
                        </div>
                    </div>
                `;
            }

            // Show trip management for admins/authorities
            if (['ADMIN', 'AUTHORITY'].includes(state.currentUser.role)) {
                if (request.status === 'CAR_ASSIGNED') {
                    detailsHtml += `<button id="startTripBtn" class="btn btn-info mt-3">Start Trip</button>`;
                } else if (request.status === 'IN_PROGRESS') {
                    detailsHtml += `
                        <div class="card mt-4">
                            <div class="card-header">Complete Trip</div>
                            <div class="card-body">
                                <form id="completeTripForm">
                                    <div class="mb-3">
                                        <label for="totalDistance" class="form-label">Total Distance (km)</label>
                                        <input type="number" id="totalDistance" class="form-control" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="tripNotes" class="form-label">Trip Notes</label>
                                        <textarea id="tripNotes" class="form-control" rows="3"></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-warning">Complete Trip</button>
                                </form>
                            </div>
                        </div>
                    `;
                }
            }

            detailsHtml += '<a href="/requests.html" class="btn btn-primary mt-3">Back to My Requests</a>';
            renderContent(`Request #${request.id}`, detailsHtml);

            // Add event listeners
            const assignForm = document.getElementById('assignVehicleForm');
            if (assignForm) {
                assignForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const carId = document.getElementById('carId').value;
                    const driverId = document.getElementById('driverId').value;
                    try {
                        await api.assignCarToRequest(requestId, carId, driverId);
                        alert('Vehicle assigned successfully!');
                        handleRoute(); // Refresh page
                    } catch (error) {
                        alert(`Failed to assign vehicle: ${error.message}`);
                    }
                });
            }

            const startTripBtn = document.getElementById('startTripBtn');
            if (startTripBtn) {
                startTripBtn.addEventListener('click', async () => {
                    try {
                        await api.startTrip(requestId);
                        alert('Trip started successfully!');
                        handleRoute(); // Refresh
                    } catch (error) {
                        alert(`Failed to start trip: ${error.message}`);
                    }
                });
            }

            const completeTripForm = document.getElementById('completeTripForm');
            if (completeTripForm) {
                completeTripForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const totalDistance = document.getElementById('totalDistance').value;
                    const tripNotes = document.getElementById('tripNotes').value;
                    try {
                        await api.completeTrip(requestId, parseFloat(totalDistance), tripNotes);
                        alert('Trip completed successfully!');
                        handleRoute(); // Refresh
                    } catch (error) {
                        alert(`Failed to complete trip: ${error.message}`);
                    }
                });
            }

        } catch (error) {
            renderContent('Error', `<p class="text-danger">Failed to load request details: ${error.message}</p>`);
        }
    },
    '/manage-requests.html': async () => {
        renderContent('Manage All Requests', '<p>Loading requests...</p>');
        try {
            const requests = await api.getAllRequests();
            let requestsHtml = '<div class="table-responsive"><table class="table table-striped table-sm"><thead><tr><th>Requester</th><th>Destination</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            if (requests.length === 0) {
                requestsHtml += '<tr><td colspan="4">No requests found.</td></tr>';
            } else {
                requests.forEach(req => {
                    requestsHtml += `<tr>
                        <td>${req.user.firstName} ${req.user.lastName}</td>
                        <td>${req.destination}</td>
                        <td><span class="badge bg-info">${req.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-success approve-btn" data-request-id="${req.id}" ${req.status !== 'PENDING' ? 'disabled' : ''}>Approve</button>
                            <button class="btn btn-sm btn-warning reject-btn" data-request-id="${req.id}" ${req.status !== 'PENDING' ? 'disabled' : ''}>Reject</button>
                            <button class="btn btn-sm btn-primary view-details-btn" data-request-id="${req.id}">Details</button>
                        </td>
                    </tr>`;
                });
            }
            requestsHtml += '</tbody></table></div>';
            renderContent('Manage All Requests', requestsHtml);
            addManagementActionListeners();
        } catch (error) {
            renderContent('Manage All Requests', `<p class="text-danger">Failed to load requests: ${error.message}</p>`);
        }
    },
    '/statistics.html': async () => {
        renderContent('Statistics', '<p>Loading statistics...</p>');
        try {
            const stats = await api.getRequestStats();
            const statsHtml = `
                <div class="row">
                    <div class="col-md-4"><div class="card text-center"><div class="card-body"><h5>Total Requests</h5><p class="fs-2">${stats.total}</p></div></div></div>
                    <div class="col-md-4"><div class="card text-center"><div class="card-body"><h5>Pending</h5><p class="fs-2">${stats.pending}</p></div></div></div>
                    <div class="col-md-4"><div class="card text-center"><div class="card-body"><h5>Approved</h5><p class="fs-2">${stats.approved}</p></div></div></div>
                    <div class="col-md-4 mt-3"><div class="card text-center"><div class="card-body"><h5>Completed</h5><p class="fs-2">${stats.completed}</p></div></div></div>
                    <div class="col-md-4 mt-3"><div class="card text-center"><div class="card-body"><h5>Cancelled</h5><p class="fs-2">${stats.cancelled}</p></div></div></div>
                    <div class="col-md-4 mt-3"><div class="card text-center"><div class="card-body"><h5>Rejected</h5><p class="fs-2">${stats.rejected}</p></div></div></div>
                </div>
            `;
            renderContent('Request Statistics', statsHtml);
        } catch (error) {
            renderContent('Statistics', `<p class="text-danger">Failed to load statistics: ${error.message}</p>`);
        }
    },
    '/overdue-requests.html': async () => {
        renderContent('Overdue Requests', '<p>Loading overdue requests...</p>');
        try {
            const requests = await api.getOverdueRequests();
            let requestsHtml = '<div class="table-responsive"><table class="table table-striped table-sm"><thead><tr><th>Requester</th><th>Destination</th><th>Return Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            if (requests.length === 0) {
                requestsHtml += '<tr><td colspan="5">No overdue requests found.</td></tr>';
            } else {
                requests.forEach(req => {
                    requestsHtml += `<tr>
                        <td>${req.user.firstName} ${req.user.lastName}</td>
                        <td>${req.destination}</td>
                        <td>${new Date(req.returnDateTime).toLocaleString()}</td>
                        <td><span class="badge bg-danger">${req.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary view-details-btn" data-request-id="${req.id}">Details</button>
                        </td>
                    </tr>`;
                });
            }
            requestsHtml += '</tbody></table></div>';
            renderContent('Overdue Requests', requestsHtml);
            addRequestActionListeners(); // For the details button
        } catch (error) {
            renderContent('Overdue Requests', `<p class="text-danger">Failed to load overdue requests: ${error.message}</p>`);
        }
    },
    '/user-management.html': async () => {
        renderContent('User Management', '<p>Loading users...</p>');
        try {
            const users = await api.getUsers();
            let usersHtml = `
                <button class="btn btn-primary mb-3" id="create-user-btn">Create User</button>
                <div class="table-responsive">
                    <table class="table table-striped table-sm"><thead><tr>
                        <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th>
                    </tr></thead><tbody>
            `;
            if (users.length === 0) {
                usersHtml += '<tr><td colspan="6">No users found.</td></tr>';
            } else {
                users.forEach(user => {
                    usersHtml += `<tr>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.department?.name || 'N/A'}</td>
                        <td><span class="badge bg-success">${user.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-info edit-user-btn" data-user-id="${user.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">Delete</button>
                        </td>
                    </tr>`;
                });
            }
            usersHtml += '</tbody></table></div>';
            renderContent('User Management', usersHtml);
            addUserManagementListeners();
        } catch (error) {
            renderContent('User Management', `<p class="text-danger">Failed to load users: ${error.message}</p>`);
        }
    },
    '/pending-approvals.html': async () => {
        renderContent('Pending Approvals', '<p>Loading requests...</p>');
        try {
            const requests = await api.getPendingApprovals();
            let requestsHtml = '<div class="table-responsive"><table class="table table-striped table-sm"><thead><tr><th>Requester</th><th>Destination</th><th>Actions</th></tr></thead><tbody>';
            if (requests.length === 0) {
                requestsHtml += '<tr><td colspan="3">No pending approvals.</td></tr>';
            } else {
                requests.forEach(req => {
                    requestsHtml += `<tr>
                        <td>${req.user.firstName} ${req.user.lastName}</td>
                        <td>${req.destination}</td>
                        <td>
                            <button class="btn btn-sm btn-success approve-btn" data-request-id="${req.id}">Approve</button>
                            <button class="btn btn-sm btn-warning reject-btn" data-request-id="${req.id}">Reject</button>
                            <button class="btn btn-sm btn-primary view-details-btn" data-request-id="${req.id}">Details</button>
                        </td>
                    </tr>`;
                });
            }
            requestsHtml += '</tbody></table></div>';
            renderContent('Pending Approvals', requestsHtml);
            addManagementActionListeners();
        } catch (error) {
            renderContent('Pending Approvals', `<p class="text-danger">Failed to load pending approvals: ${error.message}</p>`);
        }
    },
};

// --- User Management Helpers ---
function renderUserForm(user = {}) {
    const modalContainer = document.getElementById('form-modal-container');
    const isEdit = !!user.id;
    const title = isEdit ? 'Edit User' : 'Create User';

    const formHtml = `
    <div class="modal fade" id="userFormModal" tabindex="-1" aria-labelledby="userFormModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="userFormModalLabel">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="userForm">
              <input type="hidden" id="userId" value="${user.id || ''}">
              <div class="mb-3">
                <label for="firstName" class="form-label">First Name</label>
                <input type="text" class="form-control" id="firstName" value="${user.firstName || ''}" required>
              </div>
              <div class="mb-3">
                <label for="lastName" class="form-label">Last Name</label>
                <input type="text" class="form-control" id="lastName" value="${user.lastName || ''}" required>
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" value="${user.email || ''}" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" ${isEdit ? '' : 'required'}>
                ${isEdit ? '<small class="form-text text-muted">Leave blank to keep current password.</small>' : ''}
              </div>
              <div class="mb-3">
                <label for="role" class="form-label">Role</label>
                <select class="form-select" id="role" required>
                  <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>User</option>
                  <option value="APPROVER" ${user.role === 'APPROVER' ? 'selected' : ''}>Approver</option>
                  <option value="AUTHORITY" ${user.role === 'AUTHORITY' ? 'selected' : ''}>Authority</option>
                  <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                </select>
              </div>
               <div class="mb-3">
                <label for="department" class="form-label">Department</label>
                <input type="text" class="form-control" id="department" value="${user.department || ''}">
              </div>
               <div class="mb-3">
                <label for="position" class="form-label">Position</label>
                <input type="text" class="form-control" id="position" value="${user.position || ''}">
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="submit" class="btn btn-primary">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    `;
    modalContainer.innerHTML = formHtml;

    const userForm = document.getElementById('userForm');
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            role: document.getElementById('role').value,
            department: document.getElementById('department').value,
            position: document.getElementById('position').value,
        };
        const password = document.getElementById('password').value;
        if (password) {
            userData.password = password;
        }

        try {
            if (userId) {
                await api.updateUser(userId, userData);
                alert('User updated successfully!');
            } else {
                await api.createUser(userData);
                alert('User created successfully!');
            }
            const modalEl = document.getElementById('userFormModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            modalEl.addEventListener('hidden.bs.modal', () => handleRoute(), { once: true });
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });
}

function addUserManagementListeners() {
    document.getElementById('create-user-btn')?.addEventListener('click', () => {
        renderUserForm();
        const modal = new bootstrap.Modal(document.getElementById('userFormModal'));
        modal.show();
    });

    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.currentTarget.dataset.userId;
            try {
                const user = await api.getUserById(userId);
                renderUserForm(user);
                const modal = new bootstrap.Modal(document.getElementById('userFormModal'));
                modal.show();
            } catch (error) {
                alert(`Failed to fetch user details: ${error.message}`);
            }
        });
    });

    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.currentTarget.dataset.userId;
            if (confirm('Are you sure you want to delete this user?')) {
                try {
                    await api.deleteUser(userId);
                    alert('User deleted successfully.');
                    handleRoute(); // Refresh list
                } catch (error) {
                    alert(`Failed to delete user: ${error.message}`);
                }
            }
        });
    });
}

// --- Authentication and Routing --- //
const protectedRoutes = {
    'dashboard.html': ['ADMIN', 'AUTHORITY', 'USER', 'APPROVER'],
    'my-requests.html': ['USER', 'ADMIN', 'AUTHORITY', 'APPROVER'],
    'request-form.html': ['USER', 'ADMIN', 'AUTHORITY', 'APPROVER'],
    'user-management.html': ['ADMIN'],
    'statistics.html': ['ADMIN', 'AUTHORITY'],
    'overdue-requests.html': ['ADMIN', 'AUTHORITY'],
    'manage-requests.html': ['ADMIN', 'AUTHORITY'],
    'request-details.html': ['ADMIN', 'AUTHORITY', 'USER', 'APPROVER']
};

// Public routes - accessible without authentication
const publicRoutes = ['login.html', 'index.html', ''];

// Static assets that don't need authentication
const staticAssets = ['styles.css', 'js/app.js', 'favicon.ico'];

function checkAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function handleRoute() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const page = pages[path];
    
    // Check if route is protected
    if (protectedRoutes[path]) {
        if (!checkAuth()) return; // Redirects to login if not authenticated
        
        // Check if user has required role
        const user = api.getCurrentUser();
        if (!user || !protectedRoutes[path].includes(user.role)) {
            // Redirect to dashboard if user doesn't have required role
            window.location.href = '/dashboard.html';
            return;
        }
    }
    
    if (page) {
        page();
    } else if (!publicRoutes.includes(path)) {
        // If page not found and not a public route, redirect to dashboard
        window.location.href = '/dashboard.html';
    }
}

// --- App Initialization --- //
async function initProtectedPage() {
    console.group('=== initProtectedPage ===');
    
    // Check if we have a token
    const token = localStorage.getItem('authToken');
    console.log('1. Token exists:', !!token);
    
    if (!token) {
        console.log('No auth token found, logging out');
        api.logout();
        console.groupEnd();
        return;
    }
    
    try {
        console.log('2. Fetching current user data...');
        const user = await api.getCurrentUser();
        
        if (!user || !user.id) {
            throw new Error('Invalid user data received');
        }
        
        console.log('3. User data loaded:', { id: user.id, email: user.email, role: user.role });
        
        // Update state and localStorage
        state.currentUser = user;
        localStorage.setItem('userData', JSON.stringify(user));
        
        console.log('4. Rendering app layout...');
        renderAppLayout();
        
        console.log('5. Handling route...');
        handleRoute();
        
        console.log('6. Page initialization complete');
        console.groupEnd();
        
    } catch (error) {
        console.error('Initialization failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Clear any potentially corrupted auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        console.log('Redirecting to login due to initialization error');
        console.groupEnd();
        
        // Redirect to login with an error message
        window.location.href = '/login.html?error=session_expired';
    }
}

// Check if current path is a static asset
function isStaticAsset(path) {
    return staticAssets.some(asset => path.endsWith(asset));
}

// Main application initialization
async function initializeApp() {
    console.log('--- initializeApp started ---');
    const path = window.location.pathname;
    const currentPath = path.split('/').pop() || 'index.html';
    
    console.log('Current URL:', window.location.href);
    console.log('Current path:', path, 'Extracted path:', currentPath);
    
    // Skip authentication check for static assets
    if (isStaticAsset(currentPath)) {
        console.log('Skipping authentication for static asset:', currentPath);
        return;
    }

    const isLoggedIn = api.isAuthenticated();
    console.log('Is user authenticated?', isLoggedIn);
    console.log('Auth token exists:', !!localStorage.getItem('authToken'));
    console.log('User data exists:', !!localStorage.getItem('userData'));
    
    if (isLoggedIn) {
        console.log('Current user data from localStorage:', localStorage.getItem('userData'));
        console.log('Current user data from api:', api.getCurrentUser());
    }

    const loginForm = document.getElementById('loginForm');
    console.log('Login form found:', !!loginForm);

    // Handle login page
    if (currentPath === 'login.html' || currentPath === 'index.html') {
        console.log('On login page');
        
        if (isLoggedIn) {
            const user = api.getCurrentUser();
            console.log('User is already logged in, redirecting based on role:', user?.role);
            
            // Redirect based on role
            let redirectPath = '/dashboard.html';
            if (user?.role === 'USER') {
                redirectPath = '/my-requests.html';
            } else if (user?.role === 'APPROVER') {
                redirectPath = '/approvals.html';
            }
            
            console.log('Redirecting to:', redirectPath);
            window.location.replace(redirectPath);
            return;
        }
        
        // Initialize login form if it exists
        if (loginForm) {
            console.log('Initializing login form');
            loginForm.addEventListener('submit', handleLogin);
        } else {
            console.warn('Login form not found on login page');
        }
        return;
    }

    console.log('Checking protected route:', currentPath);
    
    // Handle protected routes
    if (!isLoggedIn) {
        console.log('User not logged in, redirecting to login');
        // If not logged in, redirect to login
        window.location.replace('/login.html');
        return;
    }

    // If we got here, user is authenticated, initialize the protected page
    try {
        console.log('Initializing protected page:', currentPath);
        initProtectedPage();
    } catch (error) {
        console.error('Error initializing protected page:', error);
        // If there's an error, log out and redirect to login
        console.error('Logging out due to error');
        api.logout();
        window.location.replace('/login.html');
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    console.group('=== Login Process ===');
    console.log('Login form submitted');
    
    const errorMessage = document.getElementById('errorMessage');
    const loginForm = e.target;
    const submitButton = loginForm.querySelector('button[type="submit"]');
    
    errorMessage.textContent = '';
    errorMessage.className = 'error-message';
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';
    
    const credentials = {
        email: loginForm.email.value,
        password: loginForm.password.value
    };
    
    console.log('Attempting login with credentials (email only shown for debugging):', { email: credentials.email });
    
    try {
        console.log('1. Calling api.login()');
        const user = await api.login(credentials);
        
        if (!user) {
            throw new Error('No user data returned from login');
        }
        
        console.log('2. Login successful, user data received:', {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown'
        });
        
        // Verify the token was properly set
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication token was not set properly');
        }
        
        console.log('3. Auth token verified in localStorage');
        
        // Store the current user in the app state and localStorage
        state.currentUser = user;
        localStorage.setItem('userData', JSON.stringify(user));
        
        console.log('4. User data stored in state and localStorage');
        
        // Determine the redirect URL based on user role
        let redirectUrl = '/dashboard.html';
        if (user.role === 'USER') {
            redirectUrl = '/my-requests.html';
        } else if (user.role === 'APPROVER') {
            redirectUrl = '/approvals.html';
        }
        
        console.log('5. Preparing to redirect to:', redirectUrl);
        
        // Add a small delay to ensure all state is saved
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('6. Performing hard redirect');
        console.groupEnd();
        
        // Force a hard redirect to ensure the page loads fresh
        window.location.href = redirectUrl;
        
    } catch (error) {
        console.error('Login failed:', error);
        
        // Show user-friendly error message
        let errorMsg = 'Login failed. Please try again.';
        
        if (error.message.includes('401') || error.message.includes('credentials') || error.message.includes('invalid')) {
            errorMsg = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('network')) {
            errorMsg = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        errorMessage.textContent = errorMsg;
        
        // Clear the password field for security
        loginForm.password.value = '';
        
    } finally {
        console.log('Resetting login button state');
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle browser back/forward buttons
window.addEventListener('popstate', initializeApp);