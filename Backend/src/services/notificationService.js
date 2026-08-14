import prisma from "../config/prisma.js";

import {
  sanitizeAuditData,
} from "../utils/auditUtils.js";


// ======================================================
// CREATE ONE NOTIFICATION
//
// Internal service only.
//
// Do not let frontend decide arbitrary recipients for
// system notifications.
// ======================================================

export const createNotification = async ({
  recipientUserId,

  branchId = null,

  type,

  priority = "NORMAL",

  title,
  message,

  entityType = null,
  entityId = null,

  data = undefined,

  createdById = null,

  expiresAt = null,

  dedupeKey = null,
}) => {

  if (!recipientUserId) {

    const error =
      new Error(
        "Notification recipient is required"
      );

    error.statusCode = 400;

    throw error;
  }


  if (!type) {

    const error =
      new Error(
        "Notification type is required"
      );

    error.statusCode = 400;

    throw error;
  }


  if (!title?.trim()) {

    const error =
      new Error(
        "Notification title is required"
      );

    error.statusCode = 400;

    throw error;
  }


  if (!message?.trim()) {

    const error =
      new Error(
        "Notification message is required"
      );

    error.statusCode = 400;

    throw error;
  }


  // ==================================================
  // IDEMPOTENCY / DUPLICATE PROTECTION
  // ==================================================

  if (dedupeKey) {

    const existing =
      await prisma.notification.findUnique({

        where: {
          dedupeKey,
        },
      });


    if (existing) {

      return existing;
    }
  }


  // ==================================================
  // RECIPIENT
  // ==================================================

  const recipient =
    await prisma.user.findUnique({

      where: {
        id:
          recipientUserId,
      },

      select: {

        id: true,

        branchId:
          true,

        status:
          true,
      },
    });


  if (!recipient) {

    const error =
      new Error(
        "Notification recipient not found"
      );

    error.statusCode = 404;

    throw error;
  }


  if (
    recipient.status !==
    "ACTIVE"
  ) {

    return null;
  }


  const safeData =
    sanitizeAuditData(
      data
    );


  try {

    return await prisma.notification.create({

      data: {

        recipientUserId:
          recipient.id,


        branchId:
          branchId ||
          recipient.branchId ||
          null,


        type,

        priority,


        title:
          title.trim(),


        message:
          message.trim(),


        entityType,

        entityId,


        ...(safeData !== undefined
          ? {
              data:
                safeData,
            }
          : {}),


        createdById,

        expiresAt,

        dedupeKey,
      },
    });

  } catch (error) {

    // ================================================
    // Another request may have created same notification
    // concurrently.
    // ================================================

    if (
      error.code === "P2002" &&
      dedupeKey
    ) {

      return prisma.notification.findUnique({

        where: {
          dedupeKey,
        },
      });
    }


    throw error;
  }
};


// ======================================================
// SAFE CREATE
//
// Notification should normally NOT cause a successful
// financial transaction to fail.
//
// Use this AFTER business transaction succeeds.
// ======================================================

export const createNotificationSafe =
  async (payload) => {

    try {

      return await createNotification(
        payload
      );

    } catch (error) {

      console.error(
        "Notification creation failed:",
        error
      );

      return null;
    }
  };


// ======================================================
// NOTIFY USERS BY ROLE
//
// Example:
//
// notifyRoles({
//   branchId,
//   roles: ["MANAGER", "ADMIN"],
//   ...
// })
//
// One Notification row is created PER USER,
// because read/unread state must be individual.
// ======================================================

export const notifyRoles = async ({
  branchId = null,

  roles,

  type,

  priority = "NORMAL",

  title,
  message,

  entityType = null,
  entityId = null,

  data = undefined,

  createdById = null,

  expiresAt = null,

  dedupeKey = null,
}) => {

  if (
    !Array.isArray(roles) ||
    roles.length === 0
  ) {

    return {
      recipientCount: 0,
    };
  }


  const roleFilters =
    roles.map(
      (role) => {

        // ADMIN is normally global.
        if (
          role === "ADMIN"
        ) {

          return {
            role:
              "ADMIN",
          };
        }


        if (branchId) {

          return {

            role,

            branchId,
          };
        }


        return {
          role,
        };
      }
    );


  const recipients =
    await prisma.user.findMany({

      where: {

        status:
          "ACTIVE",

        OR:
          roleFilters,
      },

      select: {

        id: true,

        branchId:
          true,
      },
    });


  if (
    recipients.length === 0
  ) {

    return {
      recipientCount: 0,
    };
  }


  const safeData =
    sanitizeAuditData(
      data
    );


  const notificationRows =
    recipients.map(
      (recipient) => ({

        recipientUserId:
          recipient.id,


        branchId:
          branchId ||
          recipient.branchId ||
          null,


        type,

        priority,


        title:
          title.trim(),


        message:
          message.trim(),


        entityType,

        entityId,


        ...(safeData !== undefined
          ? {
              data:
                safeData,
            }
          : {}),


        createdById,

        expiresAt,


        // Each user needs a different unique key.
        dedupeKey:
          dedupeKey
            ? `${dedupeKey}:${recipient.id}`
            : null,
      })
    );


  const result =
    await prisma.notification.createMany({

      data:
        notificationRows,

      skipDuplicates:
        true,
    });


  return {

    recipientCount:
      result.count,
  };
};


// ======================================================
// SAFE ROLE NOTIFICATION
// ======================================================

export const notifyRolesSafe =
  async (payload) => {

    try {

      return await notifyRoles(
        payload
      );

    } catch (error) {

      console.error(
        "Role notification failed:",
        error
      );


      return {
        recipientCount: 0,
      };
    }
  };


// ======================================================
// GET CURRENT USER NOTIFICATIONS
// ======================================================

export const getNotifications = async ({
  user,

  unreadOnly = false,

  type,
  priority,

  page = 1,
  limit = 20,
}) => {

  const skip =
    (page - 1) *
    limit;


  const now =
    new Date();


  const where = {

    recipientUserId:
      user.id,


    OR: [

      {
        expiresAt:
          null,
      },

      {
        expiresAt: {
          gt:
            now,
        },
      },
    ],
  };


  if (
    unreadOnly
  ) {

    where.isRead =
      false;
  }


  if (type) {

    where.type =
      type;
  }


  if (priority) {

    where.priority =
      priority;
  }


  const [
    notifications,
    total,
  ] =
    await prisma.$transaction([

      prisma.notification.findMany({

        where,

        skip,

        take:
          limit,


        include: {

          createdBy: {

            select: {

              id: true,

              employeeId:
                true,

              firstName:
                true,

              lastName:
                true,

              role:
                true,
            },
          },


          branch: {

            select: {

              id: true,

              code:
                true,

              name:
                true,
            },
          },
        },


        orderBy: {
          createdAt:
            "desc",
        },
      }),


      prisma.notification.count({
        where,
      }),
    ]);


  return {

    notifications,


    pagination: {

      page,

      limit,

      total,

      totalPages:
        Math.ceil(
          total /
          limit
        ),
    },
  };
};


// ======================================================
// UNREAD COUNT
// ======================================================

export const getUnreadNotificationCount =
  async ({
    user,
  }) => {

    const now =
      new Date();


    const count =
      await prisma.notification.count({

        where: {

          recipientUserId:
            user.id,

          isRead:
            false,


          OR: [

            {
              expiresAt:
                null,
            },

            {
              expiresAt: {
                gt:
                  now,
              },
            },
          ],
        },
      });


    return {
      count,
    };
  };


// ======================================================
// GET ONE
// ======================================================

export const getNotificationById =
  async ({
    user,
    notificationId,
  }) => {

    const notification =
      await prisma.notification.findUnique({

        where: {
          id:
            notificationId,
        },


        include: {

          createdBy: {

            select: {

              id: true,

              employeeId:
                true,

              firstName:
                true,

              lastName:
                true,

              role:
                true,
            },
          },


          branch: {

            select: {

              id: true,

              code:
                true,

              name:
                true,
            },
          },
        },
      });


    if (!notification) {

      const error =
        new Error(
          "Notification not found"
        );

      error.statusCode = 404;

      throw error;
    }


    if (
      notification
        .recipientUserId !==
      user.id
    ) {

      const error =
        new Error(
          "You cannot access another user's notification"
        );

      error.statusCode = 403;

      throw error;
    }


    return notification;
  };


// ======================================================
// MARK ONE READ
// ======================================================

export const markNotificationRead =
  async ({
    user,
    notificationId,
  }) => {

    const notification =
      await prisma.notification.findUnique({

        where: {
          id:
            notificationId,
        },
      });


    if (!notification) {

      const error =
        new Error(
          "Notification not found"
        );

      error.statusCode = 404;

      throw error;
    }


    if (
      notification
        .recipientUserId !==
      user.id
    ) {

      const error =
        new Error(
          "You cannot modify another user's notification"
        );

      error.statusCode = 403;

      throw error;
    }


    if (
      notification.isRead
    ) {

      return notification;
    }


    return prisma.notification.update({

      where: {
        id:
          notification.id,
      },

      data: {

        isRead:
          true,

        readAt:
          new Date(),
      },
    });
  };


// ======================================================
// MARK ALL READ
// ======================================================

export const markAllNotificationsRead =
  async ({
    user,
  }) => {

    const readAt =
      new Date();


    const result =
      await prisma.notification.updateMany({

        where: {

          recipientUserId:
            user.id,

          isRead:
            false,
        },

        data: {

          isRead:
            true,

          readAt,
        },
      });


    return {

      updatedCount:
        result.count,

      readAt,
    };
  };