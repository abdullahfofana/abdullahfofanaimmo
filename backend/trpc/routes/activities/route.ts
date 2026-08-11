
import { publicProcedure, createTRPCRouter } from "../../create-context";
import { db, supabase, USE_SUPABASE } from "@/backend/db";

export interface Activity {
  id: string;
  type: string;
  message: string;
  user: string;
  timestamp: string;
}

let activities: Activity[] = [];
let activitiesInitialized = false;

const initializeActivities = () => {
  if (activitiesInitialized) return;
  activitiesInitialized = true;

  if (USE_SUPABASE) {
    activities = [];
    return;
  }

  const storedActivities = db.read().activities;
  if (storedActivities && storedActivities.length > 0) {
    activities = storedActivities;
  } else {
    activities = [
      {
        id: "1",
        type: "property_listed",
        message: "New property listed",
        user: "John Doe",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: "2",
        type: "user_registered",
        message: "User registered",
        user: "Jane Smith",
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
    ];
    const currentDb = db.read();
    currentDb.activities = activities;
    db.write(currentDb);
  }
};

export const addActivity = async (activity: Omit<Activity, "id" | "timestamp">) => {
  const newActivity = {
    ...activity,
    id: Date.now().toString() + Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
  };

  if (USE_SUPABASE) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(newActivity)
        .select()
        .single();

      if (!error && data) {
        return data as Activity;
      }
      console.warn('[Activities] insert failed, falling back to local DB:', error ? error.message : 'No data');
    } catch (e) {
      console.warn('[Activities] insert exception, falling back to local DB');
    }
  }

  // Fallback to local
  if (activities.length > 50) {
    activities.pop();
  }

  const currentDb = db.read();
  currentDb.activities = activities;
  db.write(currentDb);

  return newActivity;
}


export const activitiesRouter = createTRPCRouter({
  getRecent: publicProcedure.query(async () => {
    if (USE_SUPABASE) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (!error && data) {
          return data as Activity[];
        }

        console.warn('[Activities] fetch failed, falling back to local DB:', error ? error.message : 'No data');
      } catch (e) {
        console.warn('[Activities] fetch exception, falling back to local DB');
      }
    }

    initializeActivities();
    return activities;
  }),
});
