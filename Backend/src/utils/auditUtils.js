import { Prisma } from "@prisma/client";


// ======================================================
// SENSITIVE KEYS
//
// Never store these values inside AuditLog JSON.
// ======================================================

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",

  "token",
  "accesstoken",
  "access_token",

  "refreshtoken",
  "refresh_token",

  "authorization",
  "cookie",

  "secret",
  "clientsecret",
  "client_secret",

  "apikey",
  "api_key",

  "cardnumber",
  "card_number",

  "cvv",
  "cvc",

  "pin",
]);


// ======================================================
// CHECK SENSITIVE FIELD
// ======================================================

const isSensitiveKey = (
  key
) => {

  return SENSITIVE_KEYS.has(
    String(key)
      .toLowerCase()
  );
};


// ======================================================
// NORMALIZE VALUE
//
// Prisma JSON cannot directly store things such as:
// Decimal
// BigInt
// Date
//
// We convert them to strings.
// ======================================================

const normalizeValue = (
  value
) => {

  if (
    value === undefined
  ) {
    return undefined;
  }


  if (
    value === null
  ) {
    return null;
  }


  // Prisma Decimal
  if (
    value instanceof
    Prisma.Decimal
  ) {
    return value.toString();
  }


  // Date
  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }


  // BigInt
  if (
    typeof value === "bigint"
  ) {
    return value.toString();
  }


  // Array
  if (
    Array.isArray(value)
  ) {

    return value.map(
      (item) =>
        normalizeValue(item)
    );
  }


  // Object
  if (
    typeof value === "object"
  ) {

    const result = {};


    for (
      const [
        key,
        itemValue,
      ] of Object.entries(
        value
      )
    ) {

      if (
        isSensitiveKey(key)
      ) {

        result[key] =
          "[REDACTED]";

        continue;
      }


      const normalized =
        normalizeValue(
          itemValue
        );


      if (
        normalized !==
        undefined
      ) {

        result[key] =
          normalized;
      }
    }


    return result;
  }


  return value;
};


// ======================================================
// SANITIZE AUDIT DATA
// ======================================================

export const sanitizeAuditData = (
  value
) => {

  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }


  return normalizeValue(
    value
  );
};


// ======================================================
// REQUEST CONTEXT
// ======================================================

export const buildAuditRequestContext = (
  req
) => {

  return {

    requestId:
      req.requestId ||
      null,

    ipAddress:
      req.ip ||
      req.socket
        ?.remoteAddress ||
      null,

    userAgent:
      req.get(
        "user-agent"
      ) ||
      null,

    httpMethod:
      req.method ||
      null,

    path:
      req.originalUrl ||
      req.url ||
      null,
  };
};