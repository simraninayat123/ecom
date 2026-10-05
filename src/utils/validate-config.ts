import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';

/** Validates env vars against a class-validator class; throws at startup if any are invalid. */
export function validateConfig<T extends object>(
  config: Record<string, unknown>,
  validatorClass: ClassConstructor<T>,
): T {
  const validated = plainToInstance(validatorClass, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) throw new Error(errors.toString());
  return validated;
}
