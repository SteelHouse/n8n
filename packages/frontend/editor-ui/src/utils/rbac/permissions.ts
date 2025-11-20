import {
	hasRole,
	hasScope,
	isAuthenticated,
	isDefaultUser,
	isInstanceOwner,
	isEnterpriseFeatureEnabled,
	isGuest,
	isValid,
} from '@/utils/rbac/checks';
import type { PermissionType, PermissionTypeOptions, RBACPermissionCheck } from '@/types/rbac';

type Permissions = {
	[key in PermissionType]: RBACPermissionCheck<PermissionTypeOptions[key]>;
};

export const permissions: Permissions = {
	authenticated: isAuthenticated,
	custom: isValid,
	defaultUser: isDefaultUser,
	instanceOwner: isInstanceOwner,
	enterprise: isEnterpriseFeatureEnabled,
	guest: isGuest,
	rbac: hasScope,
	role: hasRole,
};

export function hasPermission(
	permissionNames: PermissionType[],
	options?: Partial<PermissionTypeOptions>,
) {
	return true;
}
