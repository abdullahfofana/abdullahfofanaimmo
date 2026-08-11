import { z } from "zod";
import { createTRPCRouter, publicProcedure, authedProcedure } from "../../create-context";
import { addActivity } from "../activities/route";
import { PropertySubmission } from "@/types/property";
import { db, supabase, USE_SUPABASE } from "@/backend/db";

let submissions: PropertySubmission[] = USE_SUPABASE ? [] : db.read().properties;

export const propertiesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      if (USE_SUPABASE) {
        try {
          const { data, error, count } = await supabase
            .from('properties')
            .select('*', { count: 'exact' })
            .order('submittedAt', { ascending: false })
            .range(offset, offset + limit - 1);

          if (!error && data) {
            return { data: data as PropertySubmission[], total: count ?? 0, offset, limit };
          }
          console.warn('[Properties] fetch failed, falling back to local DB:', error ? error.message : 'No data');
        } catch (e) {
          console.warn('[Properties] fetch exception, falling back to local DB');
        }
      }

      const all = db.read().properties;
      const paginated = all.slice(offset, offset + limit);
      return { data: paginated, total: all.length, offset, limit };
    }),

  // Public: any user (logged-in or guest) may submit a property listing
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        price: z.number(),
        type: z.enum(['apartment', 'house', 'villa', 'land', 'commercial']),
        status: z.enum(['sale', 'rent']),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        area: z.number(),
        location: z.object({
          address: z.string(),
          city: z.string(),
          district: z.string(),
          coordinates: z.object({
            latitude: z.number(),
            longitude: z.number(),
          }).optional(),
        }),
        photos: z.array(z.string()),
        video: z.string().optional(),
        document: z.string().optional(),
        features: z.array(z.string()),
        agent: z.object({
          name: z.string(),
          phone: z.string(),
        }),
        payment: z.object({
          method: z.enum(['orange_money', 'mtn_money', 'moov', 'wave']),
          transactionId: z.string(),
          amount: z.number(),
        }),
        is_test: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const newSubmission: PropertySubmission = {
          ...input,
          id: crypto.randomUUID(),
          submittedAt: new Date().toISOString(),
          submissionStatus: 'pending',
          document: input.document || '',
        };

        if (USE_SUPABASE) {
          try {
            const { data, error } = await supabase
              .from('properties')
              .insert(newSubmission)
              .select()
              .single();

            if (!error && data) {
              await addActivity({
                type: 'property_listed',
                message: `New property submitted: ${input.title}`,
                user: input.agent.name,
              });
              return data as PropertySubmission;
            }
            console.warn('[Properties] insert failed, falling back to local DB:', error ? error.message : 'No data');
          } catch (e) {
            console.warn('[Properties] insert exception, falling back to local DB');
          }
        }

        // Fallback to local DB
        submissions.unshift(newSubmission);

        const currentDb = db.read();
        currentDb.properties = submissions;
        db.write(currentDb);

        await addActivity({
          type: 'property_listed',
          message: `New property submitted: ${input.title}`,
          user: input.agent.name,
        });

        return newSubmission;
      } catch (error) {
        console.error('[Properties] Create error:', error instanceof Error ? error.message : error);
        throw error;
      }
    }),

  // Requires auth: only admins may approve or reject listings
  updateStatus: authedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['pending', 'approved', 'rejected']),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (USE_SUPABASE) {
        const { data: submission, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', input.id)
          .single();

        if (fetchError || !submission) {
          throw new Error('Submission not found');
        }

        const updatedData = {
          submissionStatus: input.status,
          reviewedAt: new Date().toISOString(),
          rejectionReason: input.rejectionReason,
        };

        const { data, error } = await supabase
          .from('properties')
          .update(updatedData)
          .eq('id', input.id)
          .select()
          .single();

        if (error) {
          console.error('[Properties] Update error:', error.message);
          throw new Error(`Failed to update property: ${error.message}`);
        }

        await addActivity({
          type: 'property_verified',
          message: `Property ${input.status}: ${submission.title}`,
          user: 'Admin',
        });

        return data as PropertySubmission;
      } else {
        const submissionIndex = submissions.findIndex((s) => s.id === input.id);
        if (submissionIndex === -1) {
          throw new Error("Submission not found");
        }

        const submission = submissions[submissionIndex];
        const updatedSubmission = {
          ...submission,
          submissionStatus: input.status,
          reviewedAt: new Date().toISOString(),
          rejectionReason: input.rejectionReason,
        };

        submissions[submissionIndex] = updatedSubmission;

        const currentDb = db.read();
        currentDb.properties = submissions;
        db.write(currentDb);

        await addActivity({
          type: 'property_verified',
          message: `Property ${input.status}: ${submission.title}`,
          user: 'Admin',
        });

        return updatedSubmission;
      }
    }),
});
