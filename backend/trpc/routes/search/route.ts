import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../create-context";
import { SearchMatchingService } from "@/backend/services/search-matching";

export const searchRouter = createTRPCRouter({
  saveIntent: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        criteria: z.object({
          query: z.string().optional(),
          type: z.string().optional(),
          location: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          bedrooms: z.union([z.number(), z.string()]).optional(),
          bathrooms: z.union([z.number(), z.string()]).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return await SearchMatchingService.saveIntent(input);
    }),

  checkMatches: publicProcedure
    .input(z.object({
      title: z.string().max(300).optional(),
      type: z.string().max(50).optional(),
      location: z.object({
        city: z.string().max(100).optional(),
        district: z.string().max(100).optional(),
      }).optional(),
      price: z.number().positive().optional(),
    }))
    .mutation(async ({ input }) => {
      return await SearchMatchingService.checkMatches(input);
    }),

  pollMatches: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await SearchMatchingService.getNotifications(input.userId);
    }),

  markAsRead: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      await SearchMatchingService.markAsRead(input.notificationId);
      return { success: true };
    }),
});
