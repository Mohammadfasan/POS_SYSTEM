import { z } from "zod";

import {
  getReceiptBySaleId,
  getReceiptByInvoiceNumber,
  generateThermalReceipt,
} from "../services/receiptService.js";


// ======================================================
// GET RECEIPT BY SALE ID
// ======================================================

export const getReceiptBySaleController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const saleId =
        z.string()
          .uuid(
            "Invalid sale ID"
          )
          .parse(
            req.params.saleId
          );


      const receipt =
        await getReceiptBySaleId({
          user:
            req.user,

          saleId,
        });


      res.status(200).json({
        success: true,

        data: {
          receipt,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET RECEIPT BY INVOICE
// ======================================================

export const getReceiptByInvoiceController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const invoiceNumber =
        z.string()
          .trim()
          .min(
            3,
            "Invoice number is required"
          )
          .max(150)
          .parse(
            req.params.invoiceNumber
          );


      const receipt =
        await getReceiptByInvoiceNumber({
          user:
            req.user,

          invoiceNumber,
        });


      res.status(200).json({
        success: true,

        data: {
          receipt,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// THERMAL RECEIPT
// ======================================================

export const getThermalReceiptController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const saleId =
        z.string()
          .uuid(
            "Invalid sale ID"
          )
          .parse(
            req.params.saleId
          );


      const receipt =
        await getReceiptBySaleId({
          user:
            req.user,

          saleId,
        });


      const thermalText =
        generateThermalReceipt(
          receipt
        );


      res
        .status(200)
        .type("text/plain")
        .send(
          thermalText
        );

    } catch (error) {

      next(error);
    }
  };