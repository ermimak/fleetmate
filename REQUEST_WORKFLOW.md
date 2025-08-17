# FleetMate Request Workflow Documentation

## Complete Request Approval Process

### 1. **User Submits Request**
- User fills out new request form with:
  - Purpose, destination, departure/return dates
  - `passengerCount` (1-50 passengers)
  - `priority` (low, medium, high, urgent)
  - `additionalNotes`
- Request status: `SUBMITTED` → `PENDING_ELIGIBILITY`

### 2. **Authority Reviews Eligibility** 
- **Authority** sees requests from their department in "Manage Requests"
- Authority can:
  - **Process Eligibility**: Mark as eligible/ineligible with comments
  - Only sees requests with status `PENDING_ELIGIBILITY`
- After eligibility decision:
  - If **Eligible**: Status → `PENDING_APPROVAL`
  - If **Ineligible**: Status → `INELIGIBLE` (workflow ends)

### 3. **Admin Final Approval**
- **Admin** sees requests with status `PENDING_APPROVAL` in "Manage Requests"
- Admin can:
  - **Approve**: Status → `APPROVED`
  - **Reject**: Status → `REJECTED` (workflow ends)

### 4. **Vehicle Assignment (Admin)**
- **Admin** sees approved requests with "Assign Vehicle" button
- Admin can:
  - Select from available vehicles based on capacity
  - Assign vehicle to request
  - Status → `CAR_ASSIGNED`

## Role-Based Access

### **User Role**
- Submit new requests
- View "My Requests" status
- Access: New Request, My Requests

### **Authority Role**
- Process eligibility for department requests
- View department-specific pending requests
- Access: Manage Requests (eligibility), Approvals, Fleet Management

### **Admin Role**
- Final approval/rejection of eligible requests
- Vehicle assignment to approved requests
- Full system access
- Access: All pages including User Management

### **Approver Role**
- View and process assigned approvals
- Access: Approvals, My Requests

## API Endpoints Used

### Request Management
- `POST /api/requests` - Create new request
- `GET /api/requests/pending-eligibility` - Authority view
- `GET /api/requests/pending-final-approval` - Admin view
- `PATCH /api/approvals/:id/eligibility` - Authority eligibility decision
- `PATCH /api/requests/:id/status` - Admin approve/reject
- `PATCH /api/requests/:id/assign-car` - Admin vehicle assignment

### Vehicle Management
- `GET /api/cars/available` - Get available vehicles for assignment
- `GET /api/cars` - List all vehicles
- `POST /api/cars` - Create vehicle
- `PATCH /api/cars/:id` - Update vehicle

## Fixed Issues

### ✅ **Request Form Validation**
- Changed `passengers` → `passengerCount`
- Changed `additionalInfo` → `additionalNotes`  
- Changed `priority: 'routine'` → `priority: 'medium'`
- Added proper validation for 1-50 passengers

### ✅ **Admin Access Fixed**
- Admin now uses proper API endpoints
- Role-based request filtering implemented
- 403 Forbidden errors resolved

### ✅ **Clear Workflow Implementation**
- **User** → submits request
- **Authority** → checks eligibility (department-specific)
- **Admin** → final approval + vehicle assignment
- Status progression clearly defined

### ✅ **Vehicle Assignment**
- Modal interface for vehicle selection
- Shows request details and available vehicles
- Filters vehicles by capacity and availability
- Updates request status to `CAR_ASSIGNED`

## Request Status Flow

```
SUBMITTED → PENDING_ELIGIBILITY → PENDING_APPROVAL → APPROVED → CAR_ASSIGNED → IN_PROGRESS → COMPLETED
                ↓                        ↓
            INELIGIBLE              REJECTED
```

## Frontend Components

- **New Request Form**: Fixed field validation and API payload
- **Manage Requests Table**: Role-based filtering and actions
- **Eligibility Modal**: Authority decision interface
- **Vehicle Assignment Modal**: Admin vehicle selection
- **Approval Buttons**: Admin approve/reject functionality

All functionality is now working end-to-end with proper role-based access control and clear workflow progression.
