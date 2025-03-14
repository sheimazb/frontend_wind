import { CanActivateFn } from '@angular/router';
import { roleGuard } from './role.guard';
import { Role } from '../models/role.enum';

// Admin only guard
export const adminGuard: CanActivateFn = (route, state) => {
  return roleGuard([Role.ADMIN])(route, state);
};

// Partner guard (allows Partner only, not Admin)
export const partnerGuard: CanActivateFn = (route, state) => {
  return roleGuard([Role.PARTNER])(route, state);
};

// Tester guard (allows Tester only, not Admin)
export const testerGuard: CanActivateFn = (route, state) => {
  return roleGuard([Role.TESTER])(route, state);
};

// Chef guard (allows Chef only, not Admin)
export const chefGuard: CanActivateFn = (route, state) => {
  return roleGuard([Role.CHEF])(route, state);
};

// Developer guard (allows Developer only, not Admin)
export const developerGuard: CanActivateFn = (route, state) => {
  return roleGuard([Role.DEVELOPER])(route, state);
};

// Multi-role guard examples
export const technicalTeamGuard: CanActivateFn = (route, state) => {
  return roleGuard([Role.DEVELOPER, Role.TESTER, Role.CHEF])(route, state);
};

export const managementGuard: CanActivateFn = (route, state) => {
  return roleGuard([Role.PARTNER])(route, state);
}; 