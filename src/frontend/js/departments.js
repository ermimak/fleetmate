// Department Management API Methods
api.getDepartments = async function() {
    return await this.request('/departments');
};

api.createDepartment = async function(departmentData) {
    return await this.request('/departments', 'POST', departmentData);
};

api.updateDepartment = async function(id, departmentData) {
    return await this.request(`/departments/${id}`, 'PATCH', departmentData);
};

api.deleteDepartment = async function(id) {
    return await this.request(`/departments/${id}`, 'DELETE');
};

api.getDepartmentUsers = async function(departmentId) {
    return await this.request(`/departments/${departmentId}/users`);
};

api.assignDepartmentAuthority = async function(departmentId, authorityId) {
    return await this.request(`/departments/${departmentId}/assign-authority`, 'POST', { authorityId });
};

api.assignUserToDepartment = async function(userId, departmentId) {
    return await this.request('/departments/assign-user', 'POST', { userId, departmentId });
};

// Department Management Functions
let currentDepartmentId = null;

function setupDepartmentManagement() {
    loadDepartmentsTable();
    loadAuthorityUsers();
    setupDepartmentEvents();
}

function setupDepartmentEvents() {
    const departmentForm = document.getElementById('departmentForm');
    if (departmentForm) {
        departmentForm.addEventListener('submit', handleDepartmentSubmit);
    }
}

async function loadDepartmentsTable() {
    const container = document.getElementById('departmentsTableContainer');
    if (!container) return;

    container.innerHTML = `<div class="text-center text-muted"><div class="loading"></div> Loading departments...</div>`;

    try {
        const departments = await api.getDepartments();
        displayDepartmentsTable(departments, container);
    } catch (error) {
        console.error('Error loading departments:', error);
        container.innerHTML = `<div class="alert alert-danger">Error loading departments: ${error.message}</div>`;
    }
}

function displayDepartmentsTable(departments, container) {
    if (departments.length === 0) {
        container.innerHTML = `<div class="text-center text-muted">No departments found.</div>`;
        return;
    }

    const tableHtml = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Authority</th>
                    <th>Users</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${departments.map(dept => `
                    <tr>
                        <td>
                            <strong>${escapeHTML(dept.name)}</strong>
                            ${dept.description ? `<br><small class="text-muted">${escapeHTML(dept.description)}</small>` : ''}
                        </td>
                        <td>${dept.code || '-'}</td>
                        <td>${dept.authority ? `${dept.authority.firstName} ${dept.authority.lastName}` : '<span class="text-muted">Not assigned</span>'}</td>
                        <td>${dept.users ? dept.users.length : 0} users</td>
                        <td>
                            <span class="badge ${dept.isActive ? 'bg-success' : 'bg-secondary'}">
                                ${dept.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="editDepartment('${dept.id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-info" onclick="manageDepartmentUsers('${dept.id}')">
                                    <i class="bi bi-people"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteDepartment('${dept.id}', '${escapeHTML(dept.name)}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = tableHtml;
}

async function loadAuthorityUsers() {
    const select = document.getElementById('departmentAuthority');
    if (!select) return;

    try {
        const users = await api.getUsers();
        const authorities = users.filter(user => user.role === 'authority' || user.role === 'admin');
        
        select.innerHTML = '<option value="">Select Authority (Optional)</option>';
        authorities.forEach(user => {
            select.innerHTML += `<option value="${user.id}">${user.firstName} ${user.lastName} (${user.role})</option>`;
        });
    } catch (error) {
        console.error('Error loading authority users:', error);
    }
}

function openDepartmentModal(departmentId = null) {
    currentDepartmentId = departmentId;
    const modal = document.getElementById('departmentModal');
    const title = document.getElementById('departmentModalTitle');
    const submitText = document.getElementById('departmentSubmitText');
    const form = document.getElementById('departmentForm');
    const errorDiv = document.getElementById('departmentError');

    errorDiv.classList.add('d-none');
    form.reset();

    if (departmentId) {
        title.textContent = 'Edit Department';
        submitText.textContent = 'Update Department';
        loadDepartmentData(departmentId);
    } else {
        title.textContent = 'Add Department';
        submitText.textContent = 'Create Department';
        document.getElementById('departmentActive').checked = true;
    }
}

async function loadDepartmentData(departmentId) {
    try {
        const departments = await api.getDepartments();
        const department = departments.find(d => d.id === departmentId);
        
        if (department) {
            document.getElementById('departmentName').value = department.name;
            document.getElementById('departmentCode').value = department.code || '';
            document.getElementById('departmentDescription').value = department.description || '';
            document.getElementById('departmentAuthority').value = department.authorityId || '';
            document.getElementById('departmentActive').checked = department.isActive;
        }
    } catch (error) {
        console.error('Error loading department data:', error);
    }
}

async function handleDepartmentSubmit(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('departmentError');
    errorDiv.classList.add('d-none');

    const departmentData = {
        name: document.getElementById('departmentName').value,
        code: document.getElementById('departmentCode').value || null,
        description: document.getElementById('departmentDescription').value || null,
        authorityId: document.getElementById('departmentAuthority').value || null,
        isActive: document.getElementById('departmentActive').checked
    };

    try {
        if (currentDepartmentId) {
            await api.updateDepartment(currentDepartmentId, departmentData);
        } else {
            await api.createDepartment(departmentData);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('departmentModal'));
        modal.hide();
        loadDepartmentsTable();
        
        showAlert('success', `Department ${currentDepartmentId ? 'updated' : 'created'} successfully!`);
    } catch (error) {
        console.error('Error saving department:', error);
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
    }
}

function editDepartment(departmentId) {
    openDepartmentModal(departmentId);
    const modal = new bootstrap.Modal(document.getElementById('departmentModal'));
    modal.show();
}

async function deleteDepartment(departmentId, departmentName) {
    if (!confirm(`Are you sure you want to delete the department "${departmentName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        await api.deleteDepartment(departmentId);
        loadDepartmentsTable();
        showAlert('success', 'Department deleted successfully!');
    } catch (error) {
        console.error('Error deleting department:', error);
        showAlert('danger', `Error deleting department: ${error.message}`);
    }
}

async function manageDepartmentUsers(departmentId) {
    try {
        const [allUsers, departmentUsers] = await Promise.all([
            api.getUsers(),
            api.getDepartmentUsers(departmentId)
        ]);

        const departmentUserIds = departmentUsers.map(u => u.id);
        const availableUsers = allUsers.filter(u => !departmentUserIds.includes(u.id));

        displayUserAssignmentModal(availableUsers, departmentUsers, departmentId);
        
        const modal = new bootstrap.Modal(document.getElementById('userAssignmentModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('danger', `Error loading users: ${error.message}`);
    }
}

function displayUserAssignmentModal(availableUsers, departmentUsers, departmentId) {
    const availableContainer = document.getElementById('availableUsers');
    const departmentContainer = document.getElementById('departmentUsers');

    availableContainer.innerHTML = availableUsers.map(user => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
            <span>${user.firstName} ${user.lastName} (${user.role})</span>
            <button class="btn btn-sm btn-primary" onclick="assignUserToDept('${user.id}', '${departmentId}')">
                <i class="bi bi-arrow-right"></i>
            </button>
        </div>
    `).join('') || '<div class="text-muted">No available users</div>';

    departmentContainer.innerHTML = departmentUsers.map(user => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
            <span>${user.firstName} ${user.lastName} (${user.role})</span>
            <button class="btn btn-sm btn-outline-danger" onclick="removeUserFromDept('${user.id}', '${departmentId}')">
                <i class="bi bi-arrow-left"></i>
            </button>
        </div>
    `).join('') || '<div class="text-muted">No users assigned</div>';
}

async function assignUserToDept(userId, departmentId) {
    try {
        await api.assignUserToDepartment(userId, departmentId);
        manageDepartmentUsers(departmentId);
        loadDepartmentsTable();
        showAlert('success', 'User assigned successfully!');
    } catch (error) {
        console.error('Error assigning user:', error);
        showAlert('danger', `Error assigning user: ${error.message}`);
    }
}

async function removeUserFromDept(userId, departmentId) {
    try {
        await api.assignUserToDepartment(userId, '');
        manageDepartmentUsers(departmentId);
        loadDepartmentsTable();
        showAlert('success', 'User removed from department!');
    } catch (error) {
        console.error('Error removing user:', error);
        showAlert('danger', `Error removing user: ${error.message}`);
    }
}
