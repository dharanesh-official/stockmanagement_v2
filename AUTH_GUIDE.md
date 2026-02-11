# Authentication & Authorization Implementation Guide

## ✅ IMPLEMENTED

### 1. JWT Authentication Guard
**File:** `src/auth/guards/jwt-auth.guard.ts`
- Validates JWT tokens from Authorization header
- Extracts user payload and attaches to request

### 2. Roles Guard
**File:** `src/auth/guards/roles.guard.ts`
- Checks if user has required roles
- Works in combination with @Roles decorator

### 3. Decorators
**Files:**
- `src/auth/decorators/roles.decorator.ts` - Define required roles
- `src/auth/decorators/current-user.decorator.ts` - Get current user in controller

## 🔐 How to Protect Routes

### Apply to Entire Controller
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard) // All routes require authentication
export class ProductsController {
  // ...
}
```

### Apply to Specific Routes
```typescript
@Post()
@Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN) // Only these roles can create
create(@Body() createDto: CreateDto) {
  // ...
}

@Get()
// No @Roles decorator = all authenticated users can access
findAll() {
  // ...
}
```

### Get Current User
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Get('my-profile')
getProfile(@CurrentUser() user: any) {
  return { userId: user.sub, email: user.email, role: user.role };
}
```

## 📋 Recommended Role Permissions

### SUPER_ADMIN
- Full access to everything
- Create/Delete brands
- Manage all users
- View all reports

### BRAND_ADMIN
- Manage their brand's products
- Manage their brand's warehouses
- View their brand's orders
- Manage their brand's salespersons

### WAREHOUSE_MANAGER
- Receive stock
- Transfer stock
- View warehouse inventory

### FINANCE_MANAGER
- View orders
- View financial reports
- Manage invoices

### SALES_PERSON
- Create orders
- View customers
- View products

## 🔧 Apply Guards to All Controllers

### Brands Controller ✅ (Already Applied)
```typescript
@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create() { }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN)
  update() { }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove() { }
}
```

### Products Controller (To Apply)
```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN)
  create() { }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN)
  update() { }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN)
  remove() { }
}
```

### Orders Controller (To Apply)
```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  @Post()
  @Roles(UserRole.SALES_PERSON, UserRole.BRAND_ADMIN)
  create() { }

  @Patch(':id/status')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.BRAND_ADMIN)
  updateStatus() { }
}
```

### Stock Controller (To Apply)
```typescript
@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  @Post('receive')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.BRAND_ADMIN)
  receiveStock() { }

  @Post('transfer')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.BRAND_ADMIN)
  transferStock() { }
}
```

## 🧪 Testing with Authentication

### 1. Login to Get Token
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StockPro@123"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Use Token in Requests
```bash
curl http://localhost:3001/brands \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Frontend Usage
```typescript
// Store token after login
localStorage.setItem('access_token', data.access_token);

// Use in API calls
const token = localStorage.getItem('access_token');
const response = await fetch('http://localhost:3001/brands', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## ⚠️ Important Notes

1. **JWT_SECRET**: Make sure to set a strong secret in `.env`:
   ```
   JWT_SECRET=your-very-secure-secret-key-here
   ```

2. **Token Expiration**: Currently set to 24h in auth.service.ts. Adjust as needed.

3. **Public Routes**: Auth controller (/auth/login) should NOT have guards.

4. **Error Handling**: 
   - 401 Unauthorized = No token or invalid token
   - 403 Forbidden = Valid token but insufficient permissions

## 🎯 Next Steps

1. ✅ Apply guards to Products controller
2. ✅ Apply guards to Warehouses controller
3. ✅ Apply guards to Orders controller
4. ✅ Apply guards to Stock controller
5. ✅ Apply guards to Customers controller
6. ✅ Update frontend to include Authorization header
