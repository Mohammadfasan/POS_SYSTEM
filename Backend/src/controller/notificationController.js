import { z } from "zod";

import {
  getNotifications,
  getUnreadNotificationCount,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService.js";


// ======================================================
// LIST
// ======================================================

export const getNotificationsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        z.object({

          unreadOnly:
            z.enum([
              "true",
              "false",
            ])
            .optional(),


          type:
            z.string()
              .trim()
              .max(100)
              .optional(),


          priority:
            z.enum([
              "LOW",
              "NORMAL",
              "HIGH",
              "CRITICAL",
            ])
            .optional(),


          page:
            z.coerce
              .number()
              .int()
              .positive()
              .default(1),


          limit:
            z.coerce
              .number()
              .int()
              .min(1)
              .max(100)
              .default(20),
        })
        .parse(
          req.query
        );


      const result =
        await getNotifications({

          user:
            req.user,


          unreadOnly:
            query.unreadOnly ===
            "true",


          type:
            query.type,


          priority:
            query.priority,


          page:
            query.page,


          limit:
            query.limit,
        });


      res.status(200).json({

        success:
          true,

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// UNREAD COUNT
// ======================================================

export const getUnreadCountController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await getUnreadNotificationCount({

          user:
            req.user,
        });


      res.status(200).json({

        success:
          true,

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET ONE
// ======================================================

export const getNotificationController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const notificationId =
        z.string()
          .uuid(
            "Invalid notification ID"
          )
          .parse(
            req.params.id
          );


      const notification =
        await getNotificationById({

          user:
            req.user,

          notificationId,
        });


      res.status(200).json({

        success:
          true,

        data: {
          notification,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// MARK READ
// ======================================================

export const markNotificationReadController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const notificationId =
        z.string()
          .uuid(
            "Invalid notification ID"
          )
          .parse(
            req.params.id
          );


      const notification =
        await markNotificationRead({

          user:
            req.user,

          notificationId,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Notification marked as read",

        data: {
          notification,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// MARK ALL READ
// ======================================================

export const markAllNotificationsReadController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await markAllNotificationsRead({

          user:
            req.user,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Notifications marked as read",

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };