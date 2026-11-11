/**
 * RBAC: require at least one of the given roles.
 * Use after authenticate() so req.user exists.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (allowedRoles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

export const superAdminOnly = requireRole('super_admin');
export const adminOrSuperAdmin = requireRole('admin', 'super_admin');
