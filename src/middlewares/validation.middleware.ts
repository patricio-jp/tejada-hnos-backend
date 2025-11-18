import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validateData(type: any, skipMissingProperties = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // If there's no body or it's empty, return a structured errors array
      const bodyIsEmpty = req.body === undefined || req.body === null || (typeof req.body === 'object' && Object.keys(req.body).length === 0);
      if (bodyIsEmpty) {
        return res.status(400).json({ errors: [{ message: 'Request body is required' }] });
      }

      // 1. Transform plain body to DTO instance
      const dtoInstance = plainToInstance(type, req.body);

      // 2. Validate the instance
      validate(dtoInstance, { skipMissingProperties })
        .then((errors) => {
          if (errors.length > 0) {
            // Usamos una función helper para extraer errores anidados (children)
            const formatted = formatValidationErrors(errors);
            return res.status(400).json({ errors: formatted });
          } else {
            // Replace req.body with the typed DTO instance and continue
            req.body = dtoInstance;
            next();
          }
        })
        .catch((err) => {
          // Unexpected errors during validation should be forwarded to the error handler
          next(err);
        });
    } catch (err) {
      // Synchronous errors (e.g. unexpected runtime errors)
      return res.status(400).json({ errors: [{ message: 'Invalid request body' }] });
    }
  };
}

/**
 * Función auxiliar recursiva para aplanar los errores de class-validator.
 * Si un error tiene 'children' (DTOs anidados), busca dentro de ellos.
 */
function formatValidationErrors(errors: ValidationError[]): { field: string, message: string }[] {
  let result: { field: string, message: string }[] = [];

  errors.forEach((error) => {
    // 1. Si tiene restricciones directas (errores en este campo), las agregamos
    if (error.constraints) {
      const messages = Object.values(error.constraints);
      // Usamos el nombre de la propiedad como field
      result.push({
        field: error.property,
        message: messages.join(', ')
      });
    }

    // 2. Si tiene hijos (errores anidados, ej: array de detalles), recursamos
    if (error.children && error.children.length > 0) {
      const childErrors = formatValidationErrors(error.children);
      result = result.concat(childErrors);
    }
  });

  return result;
}