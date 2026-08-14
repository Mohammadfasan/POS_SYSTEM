import crypto from "crypto";


export const requestContextMiddleware = (
  req,
  res,
  next
) => {

  // Client may already send one.
  // Otherwise create a new request ID.

  const requestId =
    req.get("X-Request-Id") ||
    crypto.randomUUID();


  req.requestId =
    requestId;


  res.setHeader(
    "X-Request-Id",
    requestId
  );


  next();
};