import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
// import { chatRouter } from "./routes/chat/route";
import { notificationsRouter } from "./routes/notifications/route";
import { activitiesRouter } from "./routes/activities/route";
import { propertiesRouter } from "./routes/properties/route";
import { usersRouter } from "./routes/users/route";
import { searchRouter } from "./routes/search/route";
import { aiRouter } from "./routes/ai/route";
import { agentsRouter } from "./routes/agents/route";
import { analyticsRouter } from "./routes/analytics/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  // chat: chatRouter,
  notifications: notificationsRouter,
  activities: activitiesRouter,
  properties: propertiesRouter,
  users: usersRouter,
  search: searchRouter,
  ai: aiRouter,
  agents: agentsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
