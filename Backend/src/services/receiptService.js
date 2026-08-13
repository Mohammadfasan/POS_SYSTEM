import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";


// ======================================================
// HELPERS
// ======================================================

const money = (value) => {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(2)
    .toFixed(2);
};


const quantityText = (value) => {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(3)
    .toString();
};


// ======================================================
// RECEIPT ACCESS
// ======================================================

const validateReceiptAccess = (user, sale) => {
  // ADMIN → all branches
  if (user.role === "ADMIN") {
    return;
  }

  // MANAGER → own branch only
  if (user.role === "MANAGER") {
    if (!user.branchId) {
      const error = new Error(
        "Manager is not assigned to a branch"
      );

      error.statusCode = 403;
      throw error;
    }

    if (sale.branchId !== user.branchId) {
      const error = new Error(
        "You cannot access receipts from another branch"
      );

      error.statusCode = 403;
      throw error;
    }

    return;
  }

  // CASHIER → own sales only
  if (
    user.role === "CASHIER" &&
    sale.cashierId !== user.id
  ) {
    const error = new Error(
      "You cannot access another cashier's receipt"
    );

    error.statusCode = 403;
    throw error;
  }
};


// ======================================================
// RECEIPT STATUS VALIDATION
// ======================================================

const validateReceiptStatus = (sale) => {
  const allowedStatuses = [
    "COMPLETED",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
    "VOIDED",
  ];

  if (!allowedStatuses.includes(sale.status)) {
    const error = new Error(
      "Receipt is available only after sale completion"
    );

    error.statusCode = 400;
    throw error;
  }

  if (!sale.invoiceNumber) {
    const error = new Error(
      "Invoice number has not been generated"
    );

    error.statusCode = 400;
    throw error;
  }
};


// ======================================================
// SALE INCLUDE FOR RECEIPT
// ======================================================

const receiptInclude = {
  branch: {
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      city: true,
    },
  },

  terminal: {
    select: {
      id: true,
      code: true,
      name: true,
      location: true,
    },
  },

  cashier: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
  },

  shift: {
    select: {
      id: true,
      shiftNumber: true,
      openedAt: true,
      closedAt: true,
    },
  },

  items: {
    orderBy: {
      createdAt: "asc",
    },
  },

  payments: {
    where: {
      status: "COMPLETED",
    },

    orderBy: {
      createdAt: "asc",
    },

    select: {
      id: true,
      paymentNumber: true,
      method: true,
      status: true,
      amount: true,
      tenderedAmount: true,
      changeAmount: true,
      transactionReference: true,
      note: true,
      createdAt: true,
    },
  },
};


// ======================================================
// BUILD RECEIPT
// ======================================================

const buildReceipt = (sale) => {
  // ==================================================
  // TOTAL PAID
  // ==================================================

  const totalPaid = sale.payments.reduce(
    (total, payment) => {
      return total.plus(payment.amount);
    },
    new Prisma.Decimal(0)
  );


  // ==================================================
  // ITEMS
  // ==================================================

  const items = sale.items.map((item) => {
    /*
      Example:

      Sugar selling price = Rs.320 / kg

      Customer chooses grams.

      selectedUnitFactor = 1
      sellingUnitFactor = 1000

      320 × 1 / 1000
      = Rs.0.32 per gram
    */

    const selectedUnitPrice =
      new Prisma.Decimal(
        item.sellingUnitPrice
      )
        .mul(
          item.selectedUnitFactor
        )
        .div(
          item.sellingUnitFactor
        );

    return {
      id: item.id,

      productId: item.productId,

      sku: item.sku,

      barcode: item.barcode,

      name: item.productName,

      quantity: quantityText(
        item.quantity
      ),

      unit: {
        id: item.selectedUnitId,

        code:
          item.selectedUnitCode,

        symbol:
          item.selectedUnitSymbol,
      },

      baseQuantity: quantityText(
        item.baseQuantity
      ),

      unitPrice: money(
        selectedUnitPrice
      ),

      lineSubtotal: money(
        item.lineSubtotal
      ),

      discountAmount: money(
        item.discountAmount
      ),

      taxRate: quantityText(
        item.taxRate
      ),

      taxAmount: money(
        item.taxAmount
      ),

      lineTotal: money(
        item.lineTotal
      ),
    };
  });


  // ==================================================
  // PAYMENTS
  // ==================================================

  const payments = sale.payments.map(
    (payment) => {
      return {
        id: payment.id,

        paymentNumber:
          payment.paymentNumber,

        method:
          payment.method,

        amount:
          money(
            payment.amount
          ),

        tenderedAmount:
          payment.tenderedAmount !== null
            ? money(
                payment.tenderedAmount
              )
            : null,

        changeAmount:
          payment.changeAmount !== null
            ? money(
                payment.changeAmount
              )
            : null,

        transactionReference:
          payment.transactionReference,

        note:
          payment.note,

        paidAt:
          payment.createdAt,
      };
    }
  );


  // ==================================================
  // FINAL RECEIPT OBJECT
  // ==================================================

  return {
    business: {
      name:
        process.env.BUSINESS_NAME ||
        "SmartPOS",

      phone:
        process.env.BUSINESS_PHONE ||
        null,

      email:
        process.env.BUSINESS_EMAIL ||
        null,

      taxNumber:
        process.env
          .BUSINESS_TAX_NUMBER ||
        null,

      currency:
        process.env.CURRENCY ||
        "LKR",
    },


    branch: {
      id:
        sale.branch.id,

      code:
        sale.branch.code,

      name:
        sale.branch.name,

      phone:
        sale.branch.phone,

      email:
        sale.branch.email,

      address:
        sale.branch.address,

      city:
        sale.branch.city,
    },


    invoice: {
      invoiceNumber:
        sale.invoiceNumber,

      saleNumber:
        sale.saleNumber,

      status:
        sale.status,

      createdAt:
        sale.createdAt,

      completedAt:
        sale.completedAt,
    },


    cashier: {
      id:
        sale.cashier.id,

      employeeId:
        sale.cashier.employeeId,

      firstName:
        sale.cashier.firstName,

      lastName:
        sale.cashier.lastName,

      name:
        `${sale.cashier.firstName} ${sale.cashier.lastName}`,
    },


    terminal: {
      id:
        sale.terminal.id,

      code:
        sale.terminal.code,

      name:
        sale.terminal.name,

      location:
        sale.terminal.location,
    },


    shift: {
      id:
        sale.shift.id,

      shiftNumber:
        sale.shift.shiftNumber,
    },


    items,


    totals: {
      subtotal:
        money(
          sale.subtotal
        ),

      discount:
        money(
          sale.discountAmount
        ),

      tax:
        money(
          sale.taxAmount
        ),

      grandTotal:
        money(
          sale.grandTotal
        ),

      totalPaid:
        money(
          totalPaid
        ),
    },


    payments,


    footer:
      process.env.RECEIPT_FOOTER ||
      "Thank you!",
  };
};


// ======================================================
// GET RECEIPT BY SALE ID
// ======================================================

export const getReceiptBySaleId = async ({
  user,
  saleId,
}) => {
  const sale =
    await prisma.sale.findUnique({
      where: {
        id: saleId,
      },

      include: receiptInclude,
    });


  if (!sale) {
    const error = new Error(
      "Sale not found"
    );

    error.statusCode = 404;
    throw error;
  }


  validateReceiptAccess(
    user,
    sale
  );


  validateReceiptStatus(
    sale
  );


  return buildReceipt(
    sale
  );
};


// ======================================================
// GET RECEIPT BY INVOICE NUMBER
// ======================================================

export const getReceiptByInvoiceNumber =
  async ({
    user,
    invoiceNumber,
  }) => {

    const sale =
      await prisma.sale.findUnique({
        where: {
          invoiceNumber,
        },

        include:
          receiptInclude,
      });


    if (!sale) {
      const error = new Error(
        "Invoice not found"
      );

      error.statusCode = 404;
      throw error;
    }


    validateReceiptAccess(
      user,
      sale
    );


    validateReceiptStatus(
      sale
    );


    return buildReceipt(
      sale
    );
  };


// ======================================================
// THERMAL RECEIPT TEXT
// ======================================================

export const generateThermalReceipt =
  (receipt) => {

    const WIDTH = 42;

    const line =
      "-".repeat(WIDTH);


    // ========================================
    // CENTER TEXT
    // ========================================

    const center = (value = "") => {
      const text =
        String(value);

      if (
        text.length >= WIDTH
      ) {
        return text;
      }

      const spaces =
        Math.floor(
          (
            WIDTH -
            text.length
          ) / 2
        );

      return (
        " ".repeat(spaces) +
        text
      );
    };


    // ========================================
    // LEFT + RIGHT
    // ========================================

    const leftRight = (
      left,
      right
    ) => {
      left = String(left);
      right = String(right);

      const spaces =
        Math.max(
          WIDTH -
            left.length -
            right.length,
          1
        );

      return (
        left +
        " ".repeat(spaces) +
        right
      );
    };


    const output = [];


    // ========================================
    // HEADER
    // ========================================

    output.push(
      center(
        receipt.business.name
      )
    );

    output.push(
      center(
        receipt.branch.name
      )
    );


    if (
      receipt.branch.address
    ) {
      output.push(
        center(
          receipt.branch.address
        )
      );
    }


    if (
      receipt.branch.city
    ) {
      output.push(
        center(
          receipt.branch.city
        )
      );
    }


    if (
      receipt.branch.phone
    ) {
      output.push(
        center(
          `Tel: ${receipt.branch.phone}`
        )
      );
    }


    if (
      receipt.business.taxNumber
    ) {
      output.push(
        center(
          `TIN: ${receipt.business.taxNumber}`
        )
      );
    }


    output.push(line);


    // ========================================
    // INVOICE DETAILS
    // ========================================

    output.push(
      `Invoice: ${receipt.invoice.invoiceNumber}`
    );

    output.push(
      `Sale: ${receipt.invoice.saleNumber}`
    );

    output.push(
      `Cashier: ${receipt.cashier.employeeId}`
    );

    output.push(
      `Terminal: ${receipt.terminal.code}`
    );


    if (
      receipt.invoice.completedAt
    ) {
      output.push(
        `Date: ${new Date(
          receipt.invoice.completedAt
        ).toLocaleString()}`
      );
    }


    output.push(line);


    // ========================================
    // ITEMS
    // ========================================

    receipt.items.forEach(
      (item) => {

        output.push(
          item.name
        );

        const qty =
          `${item.quantity} ${item.unit.symbol}`;

        output.push(
          leftRight(
            `${qty} x ${item.unitPrice}`,
            item.lineTotal
          )
        );


        if (
          Number(
            item.discountAmount
          ) > 0
        ) {

          output.push(
            leftRight(
              " Discount",
              `-${item.discountAmount}`
            )
          );
        }


        if (
          Number(
            item.taxAmount
          ) > 0
        ) {

          output.push(
            leftRight(
              ` Tax ${item.taxRate}%`,
              item.taxAmount
            )
          );
        }
      }
    );


    output.push(line);


    // ========================================
    // TOTALS
    // ========================================

    output.push(
      leftRight(
        "Subtotal",
        receipt.totals.subtotal
      )
    );


    if (
      Number(
        receipt.totals.discount
      ) > 0
    ) {

      output.push(
        leftRight(
          "Discount",
          `-${receipt.totals.discount}`
        )
      );
    }


    if (
      Number(
        receipt.totals.tax
      ) > 0
    ) {

      output.push(
        leftRight(
          "Tax",
          receipt.totals.tax
        )
      );
    }


    output.push(line);


    output.push(
      leftRight(
        "TOTAL",
        `${receipt.business.currency} ${receipt.totals.grandTotal}`
      )
    );


    output.push(line);


    // ========================================
    // PAYMENTS
    // ========================================

    output.push(
      "PAYMENT"
    );


    receipt.payments.forEach(
      (payment) => {

        output.push(
          leftRight(
            payment.method,
            payment.amount
          )
        );


        // CASH
        if (
          payment.method === "CASH"
        ) {

          if (
            payment.tenderedAmount !==
            null
          ) {

            output.push(
              leftRight(
                "Received",
                payment.tenderedAmount
              )
            );
          }


          if (
            payment.changeAmount !==
            null
          ) {

            output.push(
              leftRight(
                "Change",
                payment.changeAmount
              )
            );
          }
        }


        // CARD / QR
        if (
          payment.transactionReference
        ) {

          output.push(
            `Ref: ${payment.transactionReference}`
          );
        }
      }
    );


    output.push(line);


    output.push(
      center(
        receipt.footer
      )
    );


    return output.join(
      "\n"
    );
  };