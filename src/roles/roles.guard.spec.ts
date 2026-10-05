import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

// `this: void` tells the linter these methods are only passed around as references
// (like Nest's getHandler()), never called with a `this`.
@Roles(Role.ADMIN)
class AdminOnlyController {
  handler(this: void) {}
}

class PublicController {
  handler(this: void) {}
}

function contextFor(
  controller: typeof AdminOnlyController | typeof PublicController,
  user?: { role: Role },
) {
  return {
    getHandler: () => controller.prototype.handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows admin users on an admin-only controller', () => {
    expect(
      guard.canActivate(contextFor(AdminOnlyController, { role: Role.ADMIN })),
    ).toBe(true);
  });

  it('rejects customers on an admin-only controller', () => {
    expect(() =>
      guard.canActivate(
        contextFor(AdminOnlyController, { role: Role.CUSTOMER }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects requests without a user on an admin-only controller', () => {
    expect(() => guard.canActivate(contextFor(AdminOnlyController))).toThrow(
      ForbiddenException,
    );
  });

  it('allows everyone when no @Roles() is set', () => {
    expect(
      guard.canActivate(contextFor(PublicController, { role: Role.CUSTOMER })),
    ).toBe(true);
  });
});
