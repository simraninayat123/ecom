import {
  BadRequestException,
  type ValidationError,
  type ValidationPipeOptions,
} from '@nestjs/common';

function toMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...toMessages(error.children ?? []),
  ]);
}

export const validationOptions: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
  exceptionFactory: (errors) =>
    new BadRequestException({
      message: 'Validation failed',
      errors: toMessages(errors),
    }),
};
