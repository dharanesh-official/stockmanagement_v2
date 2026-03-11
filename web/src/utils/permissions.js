/**
 * Central Permission Enforcement Utility
 * Handles role-based access and custom granular permissions.
 */

export const hasPermission = (user, module, action) => {
    if (!user) return false;

    // Super Admin has absolute access
    if (user.role === 'super_admin') return true;

    // Admin has access to everything except what is explicitly restricted
    if (user.role === 'admin') {
        const modulePerms = user.permissions?.[module];
        // If no permissions defined for module, admin gets all.
        // If defined, block only if explicitly set to false.
        if (!modulePerms) return true;
        return modulePerms[action] !== false;
    }

    // Role-based defaults would be handled by the permissions object being correctly populated
    // in the database. For 'manager', 'salesman', and 'custom', we strictly check the boolean.
    return !!user.permissions?.[module]?.[action];
};

export const canViewModule = (user, module) => {
    return hasPermission(user, module, 'view');
};
