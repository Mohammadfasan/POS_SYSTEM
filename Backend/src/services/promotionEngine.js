import { Prisma } from "@prisma/client";


const money = (value) => {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(2);
};


const zero = () => {
  return new Prisma.Decimal(0);
};


// ======================================================
// CALCULATE ONE PROMOTION
// ======================================================

const calculateDiscount = (
  promotion,
  amount
) => {

  amount =
    new Prisma.Decimal(amount);


  if (amount.lte(0)) {
    return zero();
  }


  let discount;


  if (
    promotion.discountType ===
    "PERCENTAGE"
  ) {

    discount =
      amount
        .mul(promotion.value)
        .div(100);

  } else {

    discount =
      new Prisma.Decimal(
        promotion.value
      );
  }


  if (
    promotion.maxDiscountAmount &&
    discount.gt(
      promotion.maxDiscountAmount
    )
  ) {

    discount =
      promotion.maxDiscountAmount;
  }


  if (
    discount.gt(amount)
  ) {

    discount =
      amount;
  }


  return money(discount);
};


// ======================================================
// PICK BEST PROMOTION
// ======================================================

const getBestPromotion = (
  promotions,
  amount
) => {

  let best = null;


  for (
    const promotion of promotions
  ) {

    if (
      new Prisma.Decimal(
        amount
      ).lt(
        promotion.minPurchaseAmount
      )
    ) {
      continue;
    }


    const discount =
      calculateDiscount(
        promotion,
        amount
      );


    if (
      discount.lte(0)
    ) {
      continue;
    }


    if (!best) {

      best = {
        promotion,
        discount,
      };

      continue;
    }


    if (
      discount.gt(
        best.discount
      )
    ) {

      best = {
        promotion,
        discount,
      };

      continue;
    }


    // Same discount:
    // higher priority wins

    if (
      discount.eq(
        best.discount
      ) &&
      promotion.priority >
        best.promotion.priority
    ) {

      best = {
        promotion,
        discount,
      };
    }
  }


  return best;
};


// ======================================================
// CALCULATE SALE PROMOTIONS
// ======================================================

export const calculateSalePromotions =
  async ({
    tx,
    branchId,
    items,
    promotionCodes = [],
  }) => {

    const now =
      new Date();


    const normalizedCodes =
      promotionCodes.map(
        (code) =>
          code
            .trim()
            .toUpperCase()
      );


    // ==================================================
    // GET ACTIVE PROMOTIONS
    // ==================================================

    const promotions =
      await tx.promotion.findMany({

        where: {

          status:
            "ACTIVE",

          startAt: {
            lte:
              now,
          },

          endAt: {
            gte:
              now,
          },

          OR: [

            {
              branchId:
                null,
            },

            {
              branchId,
            },
          ],
        },

        orderBy: [
          {
            priority:
              "desc",
          },

          {
            createdAt:
              "asc",
          },
        ],
      });


    // ==================================================
    // VALIDATE PROMOTION CODES
    // ==================================================

    for (
      const code of
        normalizedCodes
    ) {

      const found =
        promotions.find(
          (promotion) =>
            promotion.code ===
              code
        );


      if (!found) {

        const error =
          new Error(
            `Promotion code ${code} is invalid or expired`
          );

        error.statusCode = 400;

        throw error;
      }
    }


    // ==================================================
    // ONLY AUTO OR REQUESTED PROMOTIONS
    // ==================================================

    const eligiblePromotions =
      promotions.filter(
        (promotion) => {

          if (
            promotion.autoApply
          ) {
            return true;
          }


          return normalizedCodes.includes(
            promotion.code
          );
        }
      );


    // ==================================================
    // RAW SUBTOTAL
    // ==================================================

    const subtotal =
      items.reduce(
        (total, item) =>
          total.plus(
            item.lineSubtotal
          ),

        zero()
      );


    const resultItems =
      items.map(
        (item) => ({
          ...item,

          promotionDiscount:
            zero(),

          cartDiscount:
            zero(),
        })
      );


    const applicationMap =
      new Map();


    const addApplication = (
      promotion,
      amount
    ) => {

      if (
        amount.lte(0)
      ) {
        return;
      }


      const existing =
        applicationMap.get(
          promotion.id
        );


      if (existing) {

        existing.discountAmount =
          existing.discountAmount.plus(
            amount
          );

        return;
      }


      applicationMap.set(
        promotion.id,
        {

          promotionId:
            promotion.id,

          promotionCode:
            promotion.code,

          promotionName:
            promotion.name,

          scope:
            promotion.scope,

          discountType:
            promotion.discountType,

          discountValue:
            promotion.value,

          discountAmount:
            amount,
        }
      );
    };


    // ==================================================
    // PRODUCT + CATEGORY PROMOTIONS
    //
    // One best promotion per line.
    // ==================================================

    for (
      const item of
        resultItems
    ) {

      const linePromotions =
        eligiblePromotions.filter(
          (promotion) => {

            if (
              promotion.scope ===
                "PRODUCT"
            ) {

              return (
                promotion.productId ===
                item.productId
              );
            }


            if (
              promotion.scope ===
                "CATEGORY"
            ) {

              return (
                promotion.categoryId ===
                item.categoryId
              );
            }


            return false;
          }
        );


      const best =
        getBestPromotion(
          linePromotions,
          item.lineSubtotal
        );


      if (best) {

        item.promotionDiscount =
          best.discount;


        addApplication(
          best.promotion,
          best.discount
        );
      }
    }


    // ==================================================
    // TOTAL AFTER ITEM PROMOTIONS
    // ==================================================

    const netAfterLinePromotions =
      resultItems.reduce(
        (
          total,
          item
        ) => {

          return total.plus(
            item.lineSubtotal.minus(
              item.promotionDiscount
            )
          );
        },

        zero()
      );


    // ==================================================
    // CART PROMOTION
    // ==================================================

    const cartPromotions =
      eligiblePromotions.filter(
        (promotion) =>
          promotion.scope ===
          "CART"
      );


    const bestCartPromotion =
      getBestPromotion(
        cartPromotions.filter(
          (promotion) =>
            subtotal.gte(
              promotion
                .minPurchaseAmount
            )
        ),

        netAfterLinePromotions
      );


    // ==================================================
    // ALLOCATE CART DISCOUNT ACROSS ITEMS
    // ==================================================

    if (
      bestCartPromotion &&
      netAfterLinePromotions.gt(0)
    ) {

      const cartDiscount =
        bestCartPromotion
          .discount;


      let allocated =
        zero();


      const eligibleItems =
        resultItems.filter(
          (item) =>
            item.lineSubtotal
              .minus(
                item.promotionDiscount
              )
              .gt(0)
        );


      eligibleItems.forEach(
        (
          item,
          index
        ) => {

          const lineNet =
            item.lineSubtotal.minus(
              item.promotionDiscount
            );


          let allocation;


          if (
            index ===
            eligibleItems.length - 1
          ) {

            allocation =
              cartDiscount.minus(
                allocated
              );

          } else {

            allocation =
              money(
                cartDiscount
                  .mul(lineNet)
                  .div(
                    netAfterLinePromotions
                  )
              );


            allocated =
              allocated.plus(
                allocation
              );
          }


          item.cartDiscount =
            allocation;
        }
      );


      addApplication(
        bestCartPromotion.promotion,
        cartDiscount
      );
    }


    // ==================================================
    // FINAL ITEM VALUES
    // ==================================================

    let totalDiscount =
      zero();

    let totalTax =
      zero();

    let grandTotal =
      zero();


    const finalItems =
      resultItems.map(
        (item) => {

          const discountAmount =
            money(
              item
                .promotionDiscount
                .plus(
                  item.cartDiscount
                )
            );


          const taxableAmount =
            item.lineSubtotal.minus(
              discountAmount
            );


          const taxAmount =
            money(
              taxableAmount
                .mul(
                  item.taxRate
                )
                .div(100)
            );


          const lineTotal =
            money(
              taxableAmount.plus(
                taxAmount
              )
            );


          totalDiscount =
            totalDiscount.plus(
              discountAmount
            );


          totalTax =
            totalTax.plus(
              taxAmount
            );


          grandTotal =
            grandTotal.plus(
              lineTotal
            );


          const {
            promotionDiscount,
            cartDiscount,
            categoryId,
            ...databaseItem
          } = item;


          return {

            ...databaseItem,

            discountAmount,

            taxAmount,

            lineTotal,
          };
        }
      );


    return {

      items:
        finalItems,

      subtotal:
        money(subtotal),

      discountAmount:
        money(
          totalDiscount
        ),

      taxAmount:
        money(totalTax),

      grandTotal:
        money(grandTotal),

      appliedPromotions:
        Array.from(
          applicationMap.values()
        ).map(
          (application) => ({

            ...application,

            discountAmount:
              money(
                application
                  .discountAmount
              ),
          })
        ),
    };
  };