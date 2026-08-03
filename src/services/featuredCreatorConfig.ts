import starkPfp from "../assets/stark-pfp.jpg";

/**
 * Single source of truth for every hardcoded / fallback value used by the
 * featured-creator banner. Everything here is used whenever a live API
 * fetch isn't possible (no key configured) or fails at runtime, so the
 * banner never shows broken/empty content.
 */

// Real photo — used exactly once, in the permanent identity bar.
export const FEATURED_AVATAR = starkPfp;

// Main identity bar name (next to the pfp). Independent of the
// platform-specific names below — edit any of these separately.
export const FEATURED_CHANNEL_NAME = "Stark [GD]";

export const YOUTUBE_CONFIG = {
  handle: "Stark-GD",
  name: "Stark [GD]",
  fallbackSubscriberCount: 21,
  fallbackViewCount: 67,
  fallbackVideo: {
    videoId: "KXjEscmAALQ",
    title: "Astral Divinity 100% // New Hardest Extreme Demon // TOP 433",
    description: "",
  },
};

export const TWITCH_CONFIG = {
  name: "Starkgd",
  url: "https://www.twitch.tv/starkgd",
  schedule: "9 PM EST, daily",
};

// TODO: replace `extremes` with his real extreme-completion count (AREDL's
// live count undercounts him since not all of his submissions are approved
// yet).
export const GD_ACCOUNT = {
  ign: "STARKILLER33",
  extremes: 34,
  inGameRank: 8547,
};

export const AREDL_ACCOUNT = {
  name: "starkbtw",
  userId: "75db4fde-e2cb-449c-a878-f1a5f4004616",
  searchName: "STARK",
  profileUrl: "https://aredl.net/profile/user/starkbtw",
};
