import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createYouTubeOAuthClient,
  youtubeScopes,
} from "@/lib/youtube";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const returnedState =
    requestUrl.searchParams.get("state");
  const oauthError =
    requestUrl.searchParams.get("error");

  const dashboardUrl = new URL(
    "/dashboard",
    requestUrl.origin
  );

  try {
    // ---------------------------------------------------------
    // 1. Handle OAuth cancellation / denial
    // ---------------------------------------------------------

    if (oauthError) {
      dashboardUrl.searchParams.set(
        "youtube_error",
        "oauth_denied"
      );

      const response =
        NextResponse.redirect(dashboardUrl);

      response.cookies.delete(
        "youtube_oauth_state"
      );

      return response;
    }

    // ---------------------------------------------------------
    // 2. Authorization code must exist
    // ---------------------------------------------------------

    if (!code) {
      dashboardUrl.searchParams.set(
        "youtube_error",
        "missing_code"
      );

      const response =
        NextResponse.redirect(dashboardUrl);

      response.cookies.delete(
        "youtube_oauth_state"
      );

      return response;
    }

    // ---------------------------------------------------------
    // 3. Validate OAuth state
    // ---------------------------------------------------------

    const cookieStore = await cookies();

    const storedState =
      cookieStore.get(
        "youtube_oauth_state"
      )?.value;

    if (
      !storedState ||
      !returnedState ||
      storedState !== returnedState
    ) {
      console.error(
        "YouTube OAuth state validation failed."
      );

      dashboardUrl.searchParams.set(
        "youtube_error",
        "invalid_state"
      );

      const response =
        NextResponse.redirect(dashboardUrl);

      response.cookies.delete(
        "youtube_oauth_state"
      );

      return response;
    }

    // ---------------------------------------------------------
    // 4. Verify authenticated Supabase user
    // ---------------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      dashboardUrl.searchParams.set(
        "youtube_error",
        "not_authenticated"
      );

      const response =
        NextResponse.redirect(dashboardUrl);

      response.cookies.delete(
        "youtube_oauth_state"
      );

      return response;
    }

    // ---------------------------------------------------------
    // 5. Create Google OAuth client
    // ---------------------------------------------------------

    const oauth2Client =
      createYouTubeOAuthClient();

    // ---------------------------------------------------------
    // 6. Exchange authorization code for tokens
    // ---------------------------------------------------------

    const { tokens } =
      await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error(
        "Google OAuth did not return an access token."
      );
    }

    // ---------------------------------------------------------
    // 7. Preserve previous refresh token when Google
    //    does not return a new one
    // ---------------------------------------------------------

    const {
      data: existingConnection,
      error: existingError,
    } = await supabaseAdmin
      .from("youtube_connections")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Failed to read existing YouTube connection."
      );

      throw new Error(
        "Failed to read existing YouTube connection."
      );
    }

    const refreshToken =
      tokens.refresh_token ??
      existingConnection?.refresh_token ??
      null;

    if (!refreshToken) {
      throw new Error(
        "No refresh token is available for this YouTube connection."
      );
    }

    // ---------------------------------------------------------
    // 8. Configure Google OAuth client
    // ---------------------------------------------------------

    oauth2Client.setCredentials(tokens);

    // ---------------------------------------------------------
    // 9. Verify required OAuth scopes
    // ---------------------------------------------------------

    const grantedScopes = tokens.scope
      ? tokens.scope.split(" ")
      : [];

    const missingScopes =
      youtubeScopes.filter(
        (scope) =>
          !grantedScopes.includes(scope)
      );

    if (missingScopes.length > 0) {
      console.error(
        "Required YouTube OAuth scopes were not granted."
      );

      dashboardUrl.searchParams.set(
        "youtube_error",
        "missing_permissions"
      );

      const response =
        NextResponse.redirect(dashboardUrl);

      response.cookies.delete(
        "youtube_oauth_state"
      );

      return response;
    }

    // ---------------------------------------------------------
    // 10. Load authenticated YouTube channel
    // ---------------------------------------------------------

    const { google } =
      await import("googleapis");

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const channelResponse =
      await youtube.channels.list({
        part: ["snippet", "statistics"],
        mine: true,
      });

    const channel =
      channelResponse.data.items?.[0];

    if (!channel?.id) {
      throw new Error(
        "No YouTube channel was found."
      );
    }

    const youtubeChannelId =
      channel.id;

    const youtubeChannelName =
      channel.snippet?.title?.trim() ||
      "YouTube Channel";

    // ---------------------------------------------------------
    // 11. Store / update secure YouTube connection
    // ---------------------------------------------------------

    const {
      error: connectionError,
    } = await supabaseAdmin
      .from("youtube_connections")
      .upsert(
        {
          user_id: user.id,
          youtube_channel_id:
            youtubeChannelId,
          youtube_channel_name:
            youtubeChannelName,
          access_token:
            tokens.access_token,
          refresh_token:
            refreshToken,
          token_type:
            tokens.token_type ?? "Bearer",
          expiry_date:
            tokens.expiry_date ?? null,
          scope:
            tokens.scope ??
            youtubeScopes.join(" "),
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (connectionError) {
      console.error(
        "Failed to save YouTube connection."
      );

      throw new Error(
        "Failed to save YouTube connection."
      );
    }

    // ---------------------------------------------------------
    // 12. Sync channel profile
    // ---------------------------------------------------------

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("channel_profiles")
      .upsert(
        {
          id: user.id,
          channel_name:
            youtubeChannelName,
          youtube_channel_id:
            youtubeChannelId,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error(
        "Failed to sync channel profile."
      );

      throw new Error(
        "Failed to sync channel profile."
      );
    }

    // ---------------------------------------------------------
    // 13. OAuth completed successfully
    // ---------------------------------------------------------

    dashboardUrl.searchParams.set(
      "youtube_connected",
      "true"
    );

    const response =
      NextResponse.redirect(dashboardUrl);

    // One-time OAuth state cleanup.
    response.cookies.delete(
      "youtube_oauth_state"
    );

    return response;
  } catch (error) {
    console.error(
      "YouTube OAuth callback error:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    dashboardUrl.searchParams.set(
      "youtube_error",
      "connection_failed"
    );

    const response =
      NextResponse.redirect(dashboardUrl);

    response.cookies.delete(
      "youtube_oauth_state"
    );

    return response;
  }
}