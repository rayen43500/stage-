import { Router } from "express";

// Express 4 does not forward rejected promises from async handlers to the error
// middleware: an unhandled rejection can crash the whole process. This wrapper
// makes every route handler forward its errors to next().
const METHODS = ["get", "post", "put", "patch", "delete", "all", "use"];

function wrap(handler) {
  if (typeof handler !== "function" || handler.length === 4) return handler;
  return function wrapped(req, res, next) {
    try {
      const result = handler(req, res, next);
      if (result && typeof result.catch === "function") result.catch(next);
    } catch (error) {
      next(error);
    }
  };
}

export function asyncRouter(options) {
  const router = Router(options);
  for (const method of METHODS) {
    const original = router[method].bind(router);
    router[method] = (...args) => original(...args.map((arg) => (Array.isArray(arg) ? arg.map(wrap) : wrap(arg))));
  }
  return router;
}
