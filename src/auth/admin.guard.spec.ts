import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';

describe('AdminGuard', () => {
  it('rejects non-admin users', () => {
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: { role: 'CUSTOMER' } }) }) } as unknown as ExecutionContext;
    expect(() => new AdminGuard().canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows admin users', () => {
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: { role: 'ADMIN' } }) }) } as unknown as ExecutionContext;
    expect(new AdminGuard().canActivate(context)).toBe(true);
  });
});