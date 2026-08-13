import {
  getStockMovements,
} from "../services/stockMovementService.js";


export const getStockMovementsController =
  async (req, res, next) => {
    try {
      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(req.query.limit) || 20,
            1
          ),
          100
        );

      const result =
        await getStockMovements({
          user: req.user,

          branchId:
            req.query.branchId,

          productId:
            req.query.productId,

          movementType:
            req.query.movementType,

          page,
          limit,
        });

      res.status(200).json({
        success: true,

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };