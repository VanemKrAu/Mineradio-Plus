import {
  cloudsearch,
  songDetail,
  songUrl,
  songUrlV1,
  lyric,
  lyricNew,
  playlistDetail,
  playlistCatlist,
  userPlaylist,
  loginStatus,
  logout,
  like,
  songLikeCheck,
  likelist,
  playlistTracks,
  playlistTrackAdd,
  vipInfo as hanaVipInfo,
  vipInfoV2 as hanaVipInfoV2
} from "hana-music-api";
import { getProviderCookie } from "../../services/auth-session";

export interface NeteaseConfig {
  cookie?: string;
}

export function getConfig(): NeteaseConfig {
  const cookie = getProviderCookie("netease");
  if (cookie) return { cookie };
  return {};
}

type NeteaseVipInfoModule = {
  vipInfo?: (params: Record<string, unknown>, config?: { cookie?: string }) => Promise<{ body: unknown }>;
  vipInfoV2?: (params: Record<string, unknown>, config?: { cookie?: string }) => Promise<{ body: unknown }>;
  vip_info?: (params: Record<string, unknown>, config?: { cookie?: string }) => Promise<{ body: unknown }>;
  vip_info_v2?: (params: Record<string, unknown>, config?: { cookie?: string }) => Promise<{ body: unknown }>;
};

type NeteaseVipInfoCall = {
  key: "vipInfoV2" | "vipInfo";
  fn: NonNullable<NeteaseVipInfoModule["vipInfo"]>;
};

let testVipInfoModule: NeteaseVipInfoModule | null = null;

function getVipInfoModule(): NeteaseVipInfoModule {
  return testVipInfoModule ?? {
    vipInfo: hanaVipInfo,
    vipInfoV2: hanaVipInfoV2
  };
}

export function __setNcmApiModuleForTest(module: NeteaseVipInfoModule | null): void {
  testVipInfoModule = module;
}

async function neteaseVipInfo(
  query: Record<string, unknown>,
  config?: { cookie?: string }
): Promise<{ body: unknown }> {
  const api = getVipInfoModule();
  const fns: NeteaseVipInfoCall[] = [];
  const vipInfoV2 = api.vipInfoV2 ?? api.vip_info_v2;
  const vipInfo = api.vipInfo ?? api.vip_info;
  if (vipInfoV2) fns.push({ key: "vipInfoV2", fn: vipInfoV2 });
  if (vipInfo) fns.push({ key: "vipInfo", fn: vipInfo });
  if (fns.length === 0) return { body: {} };
  const uid = String(query.uid ?? query.userId ?? "").trim();
  const params = {
    uid,
    cookie: config?.cookie ?? ""
  };
  if (fns.length === 1) {
    const resp = await fns[0].fn(params);
    return { body: resp.body };
  }
  const settled = await Promise.allSettled(
    fns.map(async ({ key, fn }) => [key, (await fn(params)).body] as const)
  );
  const body: Record<string, unknown> = {};
  for (const result of settled) {
    if (result.status === "fulfilled") body[result.value[0]] = result.value[1];
  }
  return { body };
}

export const hanaClient = {
  cloudsearch,
  songDetail,
  songUrl,
  songUrlV1,
  lyric,
  lyricNew,
  playlistDetail,
  playlistCatlist,
  userPlaylist,
  loginStatus,
  logout,
  like,
  songLikeCheck,
  likelist,
  playlistTracks,
  playlistTrackAdd,
  vipInfo: neteaseVipInfo
} as const;
