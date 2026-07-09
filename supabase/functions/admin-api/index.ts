import { createClient } from "npm:@supabase/supabase-js@2.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function getUserRole(jwt: any): string {
  return jwt?.app_metadata?.role || jwt?.user_metadata?.role || "USER";
}

function canAccess(userRole: string, required: string[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return required.includes(userRole);
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const role = getUserRole(user);
    const url = new URL(req.url);
    const path = url.pathname.replace("/admin-api", "");

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    const effectiveRole = profile?.role || role;
    const resellerId = profile?.reseller_id;

    let result: any = null;

    // ===== CONFIGS =====
    if (path === "/configs" || path === "/configs/") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("configs").select("*").order("category");
        result = { data, error };
      } else if (req.method === "POST") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const body = await req.json();
        const { data, error } = await supabase.from("configs").insert(body).select();
        result = { data, error };
      } else if (req.method === "PUT") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const body = await req.json();
        const { data, error } = await supabase.from("configs").update(body).eq("key", body.key).select();
        result = { data, error };
      } else if (req.method === "DELETE") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const key = url.searchParams.get("key");
        const { data, error } = await supabase.from("configs").delete().eq("key", key).select();
        result = { data, error };
      }
    }

    // ===== SYSTEM CONFIG =====
    else if (path === "/system-config" || path === "/system-config/") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("system_config").select("*").single();
        result = { data, error };
      } else if (req.method === "PUT") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const body = await req.json();
        const { data, error } = await supabase.from("system_config").update(body).eq("id", "00000000-0000-0000-0000-000000000001").select();
        result = { data, error };
      }
    }

    // ===== USERS =====
    else if (path === "/users" || path === "/users/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN", "RESELLER"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      if (req.method === "GET") {
        let query = supabase.from("users").select("*");
        if (effectiveRole === "RESELLER" && resellerId) {
          query = query.eq("reseller_id", resellerId);
        } else if (effectiveRole === "ADMIN") {
          query = query.in("role", ["USER", "RESELLER"]);
        }
        const { data, error } = await query.order("createdAt", { ascending: false });
        result = { data, error };
      } else if (req.method === "POST") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const body = await req.json();
        const { data, error } = await supabase.from("users").insert(body).select();
        result = { data, error };
      } else if (req.method === "PUT") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const body = await req.json();
        const { data, error } = await supabase.from("users").update(body).eq("id", body.id).select();
        result = { data, error };
      } else if (req.method === "DELETE") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const id = url.searchParams.get("id");
        const { data, error } = await supabase.from("users").delete().eq("id", id).select();
        result = { data, error };
      }
    }

    // ===== SERVERS =====
    else if (path === "/servers" || path === "/servers/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      if (req.method === "GET") {
        const { data, error } = await supabase.from("servers").select("*").order("created_at", { ascending: false });
        result = { data, error };
      } else if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("servers").insert(body).select();
        result = { data, error };
      } else if (req.method === "PUT") {
        const body = await req.json();
        const { data, error } = await supabase.from("servers").update(body).eq("id", body.id).select();
        result = { data, error };
      } else if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        const { data, error } = await supabase.from("servers").delete().eq("id", id).select();
        result = { data, error };
      }
    }

    // ===== VOUCHERS =====
    else if (path === "/vouchers" || path === "/vouchers/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN", "RESELLER"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      if (req.method === "GET") {
        let query = supabase.from("vouchers").select("*");
        if (effectiveRole === "RESELLER" && resellerId) {
          query = query.eq("resellerId", resellerId);
        }
        const { data, error } = await query.order("createdAt", { ascending: false });
        result = { data, error };
      } else if (req.method === "POST") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const body = await req.json();
        const { data, error } = await supabase.from("vouchers").insert(body).select();
        result = { data, error };
      } else if (req.method === "PUT") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const body = await req.json();
        const { data, error } = await supabase.from("vouchers").update(body).eq("id", body.id).select();
        result = { data, error };
      } else if (req.method === "DELETE") {
        if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        const id = url.searchParams.get("id");
        const { data, error } = await supabase.from("vouchers").delete().eq("id", id).select();
        result = { data, error };
      }
    }

    // ===== RESELLERS =====
    else if (path === "/resellers" || path === "/resellers/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      if (req.method === "GET") {
        const { data, error } = await supabase.from("resellers").select("*, user:users(*)").order("created_at", { ascending: false });
        result = { data, error };
      } else if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("resellers").insert(body).select();
        result = { data, error };
      } else if (req.method === "PUT") {
        const body = await req.json();
        const { data, error } = await supabase.from("resellers").update(body).eq("id", body.id).select();
        result = { data, error };
      } else if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        const { data, error } = await supabase.from("resellers").delete().eq("id", id).select();
        result = { data, error };
      }
    }

    // ===== PLANS =====
    else if (path === "/plans" || path === "/plans/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      if (req.method === "GET") {
        const { data, error } = await supabase.from("plans").select("*").order("created_at", { ascending: false });
        result = { data, error };
      } else if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("plans").insert(body).select();
        result = { data, error };
      } else if (req.method === "PUT") {
        const body = await req.json();
        const { data, error } = await supabase.from("plans").update(body).eq("id", body.id).select();
        result = { data, error };
      } else if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        const { data, error } = await supabase.from("plans").delete().eq("id", id).select();
        result = { data, error };
      }
    }

    // ===== INBOUNDS =====
    else if (path === "/inbounds" || path === "/inbounds/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      if (req.method === "GET") {
        const { data, error } = await supabase.from("inbounds").select("*").order("created_at", { ascending: false });
        result = { data, error };
      } else if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("inbounds").insert(body).select();
        result = { data, error };
      } else if (req.method === "PUT") {
        const body = await req.json();
        const { data, error } = await supabase.from("inbounds").update(body).eq("id", body.id).select();
        result = { data, error };
      } else if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        const { data, error } = await supabase.from("inbounds").delete().eq("id", id).select();
        result = { data, error };
      }
    }

    // ===== ANALYTICS =====
    else if (path === "/analytics" || path === "/analytics/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
      const { count: activeUsers } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
      const { count: totalServers } = await supabase.from("servers").select("*", { count: "exact", head: true });
      const { count: onlineServers } = await supabase.from("servers").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { count: totalVouchers } = await supabase.from("vouchers").select("*", { count: "exact", head: true });
      const { count: usedVouchers } = await supabase.from("vouchers").select("*", { count: "exact", head: true }).eq("status", "USED");
      const { data: recentUsage } = await supabase.from("usage_logs").select("*").order("created_at", { ascending: false }).limit(50);
      const { data: topResellers } = await supabase.from("resellers").select("*").order("total_sales", { ascending: false }).limit(10);
      const { data: topServers } = await supabase.from("servers").select("*").eq("is_active", true).limit(10);
      result = {
        data: {
          totalUsers: totalUsers ?? 0,
          activeUsers: activeUsers ?? 0,
          totalServers: totalServers ?? 0,
          onlineServers: onlineServers ?? 0,
          totalVouchers: totalVouchers ?? 0,
          usedVouchers: usedVouchers ?? 0,
          recentUsage: recentUsage || [],
          topResellers: topResellers || [],
          topServers: topServers || [],
        }, error: null
      };
    }

    // ===== APP LOGS (mobile) =====
    else if (path === "/logs" || path === "/logs/") {
      const { data, error } = await supabase
        .from("app_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      result = { data, error };
    }

    // ===== USER PROFILE (quota, limits) =====
    else if (path === "/profile" || path === "/profile/") {
      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
      result = { data, error };
    }

    // ===== DEVICES =====
    else if (path === "/devices" || path === "/devices/") {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      result = { data, error };
    }

    // ===== STATS =====
    else if (path === "/stats" || path === "/stats/") {
      if (!canAccess(effectiveRole, ["SUPER_ADMIN", "ADMIN", "RESELLER"])) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
      const { count: activeUsers } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
      const { count: totalServers } = await supabase.from("servers").select("*", { count: "exact", head: true });
      const { count: onlineServers } = await supabase.from("servers").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { count: totalVouchers } = await supabase.from("vouchers").select("*", { count: "exact", head: true });
      const { count: usedVouchers } = await supabase.from("vouchers").select("*", { count: "exact", head: true }).eq("status", "USED");
      const { count: totalResellers } = await supabase.from("resellers").select("*", { count: "exact", head: true });
      result = {
        data: {
          totalUsers: totalUsers ?? 0,
          activeUsers: activeUsers ?? 0,
          totalServers: totalServers ?? 0,
          onlineServers: onlineServers ?? 0,
          totalVouchers: totalVouchers ?? 0,
          usedVouchers: usedVouchers ?? 0,
          totalResellers: totalResellers ?? 0,
        }, error: null
      };
    }

    else {
      return jsonResponse({ error: "Not found" }, 404);
    }

    if (result.error) {
      return jsonResponse({ error: result.error.message }, 500);
    }

    return jsonResponse({ success: true, data: result.data });

  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
