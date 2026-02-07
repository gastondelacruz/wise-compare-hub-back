import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } }>();
    const authHeader = request.headers.authorization;

    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  },
);
