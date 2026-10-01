import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function throwNotFoundOrConflict(
  error: unknown,
  notFoundMessage: string,
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  )
    throw new NotFoundException(notFoundMessage);
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
    throw new ConflictException(
      'A record with that unique value already exists',
    );
  throw error;
}
