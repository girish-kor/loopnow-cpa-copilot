export class AppError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) {
    super(message);
  }
}

export const Errors = {
  NotFound: (what: string) => new AppError('NOT_FOUND', `${what} not found`, 404),
  BadRequest: (msg: string) => new AppError('BAD_REQUEST', msg, 400),
  Unauthorized: () => new AppError('UNAUTHORIZED', 'Unauthorized', 401),
  RateLimited: () => new AppError('RATE_LIMITED', 'Too many requests', 429),
  ToolFailure: (msg: string) => new AppError('TOOL_FAILURE', msg, 502),
};
