export const AUDIT_MODULES = {
  AUTH: "AUTH",
  USER: "USER",
  BRANCH: "BRANCH",
  TERMINAL: "TERMINAL",

  CATEGORY: "CATEGORY",
  UNIT: "UNIT",
  PRODUCT: "PRODUCT",

  INVENTORY: "INVENTORY",
  STOCK: "STOCK",

  SHIFT: "SHIFT",
  CASH_DRAWER: "CASH_DRAWER",

  SALE: "SALE",
  PAYMENT: "PAYMENT",
  RECEIPT: "RECEIPT",

  HELD_BILL: "HELD_BILL",

  RETURN: "RETURN",
  REFUND: "REFUND",

  VOID: "VOID",

  PROMOTION: "PROMOTION",
  DISCOUNT: "DISCOUNT",
};


export const AUDIT_ACTIONS = {
  // =============================================
  // AUTH
  // =============================================

  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESHED: "TOKEN_REFRESHED",


  // =============================================
  // USER
  // =============================================

  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_STATUS_CHANGED: "USER_STATUS_CHANGED",
  USER_BRANCH_ASSIGNED: "USER_BRANCH_ASSIGNED",
  USER_BRANCH_REMOVED: "USER_BRANCH_REMOVED",


  // =============================================
  // BRANCH
  // =============================================

  BRANCH_CREATED: "BRANCH_CREATED",
  BRANCH_UPDATED: "BRANCH_UPDATED",
  BRANCH_STATUS_CHANGED: "BRANCH_STATUS_CHANGED",


  // =============================================
  // TERMINAL
  // =============================================

  TERMINAL_CREATED: "TERMINAL_CREATED",
  TERMINAL_UPDATED: "TERMINAL_UPDATED",
  TERMINAL_STATUS_CHANGED: "TERMINAL_STATUS_CHANGED",


  // =============================================
  // PRODUCT
  // =============================================

  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_STATUS_CHANGED: "PRODUCT_STATUS_CHANGED",


  // =============================================
  // INVENTORY
  // =============================================

  STOCK_ADJUSTED: "STOCK_ADJUSTED",
  OPENING_STOCK_ADDED: "OPENING_STOCK_ADDED",


  // =============================================
  // SHIFT
  // =============================================

  SHIFT_OPENED: "SHIFT_OPENED",
  SHIFT_CLOSED: "SHIFT_CLOSED",


  // =============================================
  // CASH DRAWER
  // =============================================

  CASH_IN: "CASH_IN",
  CASH_OUT: "CASH_OUT",


  // =============================================
  // SALES
  // =============================================

  SALE_CREATED: "SALE_CREATED",
  SALE_CANCELLED: "SALE_CANCELLED",
  SALE_COMPLETED: "SALE_COMPLETED",


  // =============================================
  // PAYMENT
  // =============================================

  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  PAYMENT_FAILED: "PAYMENT_FAILED",


  // =============================================
  // RECEIPT
  // =============================================

  RECEIPT_VIEWED: "RECEIPT_VIEWED",
  RECEIPT_PRINTED: "RECEIPT_PRINTED",
  RECEIPT_REPRINTED: "RECEIPT_REPRINTED",


  // =============================================
  // HELD BILL
  // =============================================

  BILL_HELD: "BILL_HELD",
  HELD_BILL_RESUMED: "HELD_BILL_RESUMED",
  HELD_BILL_CANCELLED: "HELD_BILL_CANCELLED",


  // =============================================
  // RETURNS
  // =============================================

  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURN_APPROVED: "RETURN_APPROVED",
  RETURN_REJECTED: "RETURN_REJECTED",
  RETURN_CANCELLED: "RETURN_CANCELLED",
  RETURN_COMPLETED: "RETURN_COMPLETED",


  // =============================================
  // REFUND
  // =============================================

  REFUND_COMPLETED: "REFUND_COMPLETED",


  // =============================================
  // VOID
  // =============================================

  VOID_REQUESTED: "VOID_REQUESTED",
  VOID_APPROVED: "VOID_APPROVED",
  VOID_REJECTED: "VOID_REJECTED",
  VOID_CANCELLED: "VOID_CANCELLED",
  VOID_COMPLETED: "VOID_COMPLETED",


  // =============================================
  // PROMOTION
  // =============================================

  PROMOTION_CREATED: "PROMOTION_CREATED",
  PROMOTION_UPDATED: "PROMOTION_UPDATED",
  PROMOTION_STATUS_CHANGED: "PROMOTION_STATUS_CHANGED",


  // =============================================
  // MANUAL DISCOUNT
  // =============================================

  DISCOUNT_REQUESTED: "DISCOUNT_REQUESTED",
  DISCOUNT_APPLIED: "DISCOUNT_APPLIED",
  DISCOUNT_REJECTED: "DISCOUNT_REJECTED",
};