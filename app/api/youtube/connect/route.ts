import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { createClient } from "@/lib/supabase/server";
import {
  createYouTubeOAuthClient,
  youtubeScopes,
} from "@/lib/youtube";

export async function GET(request: Request) {
  try {
    // ---------------------------------------------------------
    // 1. Verify authenticated Supabase user
    // ---------------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Supabase auth check failed for YouTube connect."
      );

      return NextResponse.json(
        {
          error: "Authentication check failed.",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login", request.url)
      );
    }

    // ---------------------------------------------------------
    // 2. Validate Google OAuth environment variables
    // ---------------------------------------------------------

    const requiredEnv = [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REDIRECT_URI",
    ] as const;

    const missingEnv = requiredEnv.filter(
      (name) => !process.env[name]
    );

    if (missingEnv.length > 0) {
      console.error(
        "Missing Google OAuth environment variables."
      );

      return NextResponse.json(
        {
          error:
            "YouTube OAuth configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 3. Generate cryptographically secure OAuth state
    // ---------------------------------------------------------

    const state = randomBytes(32).toString("hex");

    // ---------------------------------------------------------
    // 4. Create Google OAuth client
    // ---------------------------------------------------------

    const oauth2Client = createYouTubeOAuthClient();

    // ---------------------------------------------------------
    // 5. Generate Google authorization URL
    // ---------------------------------------------------------

    const authorizationUrl =
      oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: youtubeScopes,
        include_granted_scopes: true,
        prompt: "consent",
        state,
      });

    // ---------------------------------------------------------
    // 6. Redirect user to Google
    // ---------------------------------------------------------

    const response =
      NextResponse.redirect(authorizationUrl);

    response.cookies.set(
      "youtube_oauth_state",
      state,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "YouTube connect route error:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return NextResponse.json(
      {
        error:
          "Failed to start YouTube connection.",
      },
      { status: 500 }
    );
  }
}