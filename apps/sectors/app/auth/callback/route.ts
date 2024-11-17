import { createClient } from "@sectors/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data: authSession, error } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("authSession", authSession);
      // create user if appropriate

      // Fetch the authenticated user
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getUser();
    
      if (sessionError) {
        throw new Error(sessionError.message);
      }
      console.log("sessionData", sessionData);
      const authUserId = sessionData.user?.id;
      const email = sessionData.user?.email;

      if (!authUserId || !email) {
        throw new Error("User data is missing after OAuth sign-in.");
      }

      // Check if the user exists in your 'users' table
      const { data: existingUser, error: userError } = await supabase
        .from("user")
        .select("*")
        .eq("authUserId", authUserId)
        .single();

      if (userError && userError.code !== "PGRST116") {
        // Code 'PGRST116' means no record found
        throw new Error(userError.message);
      }

      // Create the user if they do not exist
      if (!existingUser) {
        const { error: insertError } = await supabase.from("users").insert({
          authUserId,
          email,
        });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }
      //forward the user to the next page
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      //   if (isLocalEnv) {
      //     // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      //     return NextResponse.redirect(`${origin}${next}`);
      //   } else if (forwardedHost) {
      //     return NextResponse.redirect(`https://${forwardedHost}${next}`);
      //   } else {
      //     return NextResponse.redirect(`${origin}${next}`);
      //   }
      revalidatePath("/authenticate", "layout");
      NextResponse.redirect("/authenticate");
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
