import prisma from "../config/prisma.js";

// Create Unit
export const createUnit = async ({
  code,
  name,
  symbol,
  measurementType,
  conversionFactor,
  isBase,
}) => {
  const normalizedCode = code
    .trim()
    .toUpperCase();

  const normalizedName = name.trim();

  const existingUnit =
    await prisma.unit.findFirst({
      where: {
        OR: [
          {
            code: normalizedCode,
          },
          {
            name: {
              equals: normalizedName,
              mode: "insensitive",
            },
          },
        ],
      },
    });

  if (existingUnit) {
    const error = new Error(
      "Unit code or name already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  if (conversionFactor <= 0) {
    const error = new Error(
      "Conversion factor must be greater than 0"
    );
    error.statusCode = 400;
    throw error;
  }

  // Only one base unit for each type
  if (isBase) {
    const existingBase =
      await prisma.unit.findFirst({
        where: {
          measurementType,
          isBase: true,
        },
      });

    if (existingBase) {
      const error = new Error(
        `${measurementType} already has a base unit: ${existingBase.name}`
      );

      error.statusCode = 409;
      throw error;
    }

    if (Number(conversionFactor) !== 1) {
      const error = new Error(
        "Base unit conversion factor must be 1"
      );

      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.unit.create({
    data: {
      code: normalizedCode,
      name: normalizedName,
      symbol: symbol.trim(),
      measurementType,
      conversionFactor,
      isBase: isBase || false,
    },
  });
};

// Get all
export const getAllUnits = async ({
  status,
  measurementType,
} = {}) => {
  return prisma.unit.findMany({
    where: {
      ...(status && {
        status,
      }),

      ...(measurementType && {
        measurementType,
      }),
    },

    orderBy: [
      {
        measurementType: "asc",
      },
      {
        conversionFactor: "asc",
      },
    ],
  });
};

// Get one
export const getUnitById = async (unitId) => {
  const unit = await prisma.unit.findUnique({
    where: {
      id: unitId,
    },
  });

  if (!unit) {
    const error = new Error("Unit not found");
    error.statusCode = 404;
    throw error;
  }

  return unit;
};

// Update unit
export const updateUnit = async (
  unitId,
  data
) => {
  const unit = await prisma.unit.findUnique({
    where: {
      id: unitId,
    },
  });

  if (!unit) {
    const error = new Error("Unit not found");
    error.statusCode = 404;
    throw error;
  }

  let normalizedCode;
  let normalizedName;

  if (data.code) {
    normalizedCode = data.code
      .trim()
      .toUpperCase();
  }

  if (data.name) {
    normalizedName = data.name.trim();
  }

  if (normalizedCode || normalizedName) {
    const duplicate =
      await prisma.unit.findFirst({
        where: {
          id: {
            not: unitId,
          },

          OR: [
            ...(normalizedCode
              ? [{ code: normalizedCode }]
              : []),

            ...(normalizedName
              ? [
                  {
                    name: {
                      equals: normalizedName,
                      mode: "insensitive",
                    },
                  },
                ]
              : []),
          ],
        },
      });

    if (duplicate) {
      const error = new Error(
        "Unit code or name already exists"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  if (
    data.conversionFactor !== undefined &&
    data.conversionFactor <= 0
  ) {
    const error = new Error(
      "Conversion factor must be greater than 0"
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.unit.update({
    where: {
      id: unitId,
    },

    data: {
      ...(normalizedCode && {
        code: normalizedCode,
      }),

      ...(normalizedName && {
        name: normalizedName,
      }),

      ...(data.symbol !== undefined && {
        symbol: data.symbol.trim(),
      }),

      ...(data.conversionFactor !== undefined && {
        conversionFactor:
          data.conversionFactor,
      }),
    },
  });
};

// Change status
export const changeUnitStatus = async (
  unitId,
  status
) => {
  const unit = await prisma.unit.findUnique({
    where: {
      id: unitId,
    },
  });

  if (!unit) {
    const error = new Error("Unit not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.unit.update({
    where: {
      id: unitId,
    },

    data: {
      status,
    },
  });
};