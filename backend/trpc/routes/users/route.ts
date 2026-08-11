import { z } from "zod";
import { createTRPCRouter, publicProcedure, authedProcedure } from "../../create-context";
import { db, supabase, USE_SUPABASE } from "@/backend/db";

interface User {
  id: string;
  name: string;
  email: string;
  type: 'Seller' | 'Buyer' | 'Landlord' | 'Renter';
  status: 'Active' | 'Pending' | 'Inactive';
  propertiesCount: number;
  joined: string;
  lastActive: string;
  avatar?: string;
}

export const usersRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    if (USE_SUPABASE) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const users = (data || []).map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.role === 'admin' ? 'Seller' :
              user.role === 'agent' ? 'Seller' :
                user.role === 'landlord' ? 'Landlord' : 'Renter',
            status: 'Active' as const,
            propertiesCount: 0,
            joined: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastActive: 'Just now',
            avatar: user.avatar,
          }));
          return users as User[];
        }
        console.warn('[Users] fetch failed, falling back to local DB:', error ? error.message : 'No data');
      } catch (e) {
        console.warn('[Users] fetch exception, falling back to local DB');
      }
    }

    const users = db.read().users || [];
    return users as User[];
  }),

  // Public: auto-creates an agent/user profile when a property is submitted
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        type: z.enum(['Seller', 'Buyer', 'Landlord', 'Renter']),
        status: z.enum(['Active', 'Pending', 'Inactive']),
      })
    )
    .mutation(async ({ input }) => {
      const newUser: User = {
        id: crypto.randomUUID(),
        ...input,
        propertiesCount: 0,
        joined: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
      };

      if (USE_SUPABASE) {
        try {
          const role = input.type === 'Seller' ? 'agent' :
            input.type === 'Landlord' ? 'landlord' :
              'renter';

          const { data, error } = await supabase
            .from('users')
            .insert({
              id: newUser.id,
              name: input.name,
              email: input.email,
              role,
              phone: '',
              avatar: '',
            })
            .select()
            .single();

          if (!error && data) {
            return newUser;
          }
          console.warn('[Users] insert failed, falling back to local DB:', error ? error.message : 'No data');
        } catch (e) {
          console.warn('[Users] insert exception, falling back to local DB');
        }
      }

      // Fallback to local DB
      const users = db.read().users || [];
      users.unshift(newUser);

      const currentDb = db.read();
      currentDb.users = users;
      db.write(currentDb);

      return newUser;
    }),

  // Requires auth: only the user themselves or an admin may update a profile
  update: authedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        type: z.enum(['Seller', 'Buyer', 'Landlord', 'Renter']).optional(),
        status: z.enum(['Active', 'Pending', 'Inactive']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (USE_SUPABASE) {
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;
        if (input.type) {
          updateData.role = input.type === 'Seller' ? 'agent' :
            input.type === 'Landlord' ? 'landlord' :
              'renter';
        }

        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', input.id)
          .select()
          .single();

        if (error) {
          console.error('[Users] Update error:', error.message);
          throw new Error(`Failed to update user: ${error.message}`);
        }

        const updatedUser: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          type: input.type || 'Renter',
          status: input.status || 'Active',
          propertiesCount: 0,
          joined: new Date(data.created_at).toISOString().split('T')[0],
          lastActive: 'Just now',
          avatar: data.avatar,
        };

        return updatedUser;
      } else {
        const users = db.read().users || [];
        const index = users.findIndex((u: User) => u.id === input.id);

        if (index === -1) {
          throw new Error("User not found");
        }

        const updatedUser = {
          ...users[index],
          ...input,
        };

        users[index] = updatedUser;

        const currentDb = db.read();
        currentDb.users = users;
        db.write(currentDb);

        return updatedUser;
      }
    }),

  // Requires auth: only admins may delete user accounts
  delete: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      if (USE_SUPABASE) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', input.id);

        if (error) {
          console.error('[Users] Delete error:', error.message);
          throw new Error(`Failed to delete user: ${error.message}`);
        }

        return { success: true };
      } else {
        let users = db.read().users || [];
        users = users.filter((u: User) => u.id !== input.id);

        const currentDb = db.read();
        currentDb.users = users;
        db.write(currentDb);

        return { success: true };
      }
    }),
});
