import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../create-context";

// Simple in-memory store for the last notification
// In a real app with multiple server instances, this should be in Redis or a DB
let lastNotification: {
  id: string;
  ownerName: string;
  timestamp: number;
} | null = null;

export const notificationsRouter = createTRPCRouter({
  triggerNewProperty: publicProcedure
    .input(z.object({ ownerName: z.string() }))
    .mutation(({ input }) => {
      lastNotification = {
        id: Date.now().toString(), // Unique ID for each notification
        ownerName: input.ownerName,
        timestamp: Date.now(),
      };
      return { success: true };
    }),

  poll: publicProcedure.query(() => {
    return lastNotification;
  }),
});
