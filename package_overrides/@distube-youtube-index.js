"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  SearchResultType: () => SearchResultType,
  YouTubePlaylist: () => YouTubePlaylist,
  YouTubePlugin: () => YouTubePlugin,
  YouTubeRelatedSong: () => YouTubeRelatedSong,
  YouTubeSearchResultPlaylist: () => YouTubeSearchResultPlaylist,
  YouTubeSearchResultSong: () => YouTubeSearchResultSong,
  YouTubeSong: () => YouTubeSong
});
module.exports = __toCommonJS(src_exports);
var import_ytpl = __toESM(require("@distube/ytpl"));
var import_ytsr = __toESM(require("@distube/ytsr"));
var import_ytdl_core = __toESM(require("@distube/ytdl-core"));

// src/util.ts
var clone = /* @__PURE__ */ __name((obj) => {
  const result = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    result[key] = typeof obj[key] === "object" ? clone(obj[key]) : obj[key];
  }
  return result;
}, "clone");
function toSecond(input) {
  if (!input) return 0;
  if (typeof input !== "string") return Number(input) || 0;
  if (input.includes(":")) {
    const time = input.split(":").reverse();
    let seconds = 0;
    for (let i = 0; i < 3; i++) if (time[i]) seconds += Number(time[i].replace(/[^\d.]+/g, "")) * Math.pow(60, i);
    if (time.length > 3) seconds += Number(time[3].replace(/[^\d.]+/g, "")) * 24 * 60 * 60;
    return seconds;
  } else {
    return Number(input.replace(/[^\d.]+/g, "")) || 0;
  }
}
__name(toSecond, "toSecond");
function parseNumber(input) {
  if (typeof input === "string") return Number(input.replace(/[^\d.]+/g, "")) || 0;
  return Number(input) || 0;
}
__name(parseNumber, "parseNumber");

// src/index.ts
var import_distube = require("distube");
var YouTubePlugin = class extends import_distube.ExtractorPlugin {
  static {
    __name(this, "YouTubePlugin");
  }
  #cookies;
  cookies;
  #ytdlOptions;
  constructor(options = {}) {
    super();
    (0, import_distube.checkInvalidKey)(options, ["cookies", "ytdlOptions"], "YouTubePlugin");
    this.cookies = this.#cookies = options.cookies ? clone(options.cookies) : void 0;
    this.#ytdlOptions = options?.ytdlOptions ? clone(options.ytdlOptions) : {};
    this.#ytdlOptions.agent = import_ytdl_core.default.createAgent(this.cookies);
  }
  get ytdlOptions() {
    if (this.cookies !== this.#cookies) this.#ytdlOptions.agent = import_ytdl_core.default.createAgent(this.#cookies = this.cookies);
    return this.#ytdlOptions;
  }
  get ytCookie() {
    const agent = this.#ytdlOptions.agent;
    if (!agent) return "";
    const { jar } = agent;
    return jar.getCookieStringSync("https://www.youtube.com");
  }
  validate(url) {
    if (import_ytdl_core.default.validateURL(url) || import_ytpl.default.validateID(url)) return true;
    return false;
  }
  async resolve(url, options) {
    if (import_ytpl.default.validateID(url)) {
      const info = await (0, import_ytpl.default)(url, { limit: Infinity, requestOptions: { headers: { cookie: this.ytCookie } } });
      return new YouTubePlaylist(this, info, options);
    }
    if (import_ytdl_core.default.validateURL(url)) {
      const info = await import_ytdl_core.default.getBasicInfo(url, this.ytdlOptions);
      return new YouTubeSong(this, info, options);
    }
    throw new import_distube.DisTubeError("CANNOT_RESOLVE_SONG", url);
  }
  async getStreamURL(song) {
    if (!song.url || !import_ytdl_core.default.validateURL(song.url)) throw new DisTubeError("CANNOT_RESOLVE_SONG", song);

    try {
      const info = await import_ytdl_core.default.getInfo(song.url, this.ytdlOptions);

      if (!info.formats?.length) throw new DisTubeError("UNAVAILABLE_VIDEO");

      const newSong = new YouTubeSong(this, info, {});
      song.ageRestricted = newSong.ageRestricted;
      song.views = newSong.views;
      song.likes = newSong.likes;
      song.thumbnail = newSong.thumbnail;
      song.related = newSong.related;
      song.chapters = newSong.chapters;
      song.storyboards = newSong.storyboards;

      if (info.bestFormat && info.bestFormat.url) {
        return info.bestFormat.url;
      }

      const playableFormats = info.formats.filter(format => 
        format && 
        format.url && 
        format.hasAudio && 
        (!newSong.isLive || format.isHLS)
      );

      if (!playableFormats.length) throw new DisTubeError("UNPLAYABLE_FORMATS");

      playableFormats.sort((a, b) => 
        Number(b.audioBitrate || 0) - Number(a.audioBitrate || 0) || 
        Number(b.bitrate || 0) - Number(a.bitrate || 0)
      );

      const bestFormat = playableFormats[0];

      return info.videoUrl || bestFormat.url;
    } catch (error) {
      console.error(`Error getting stream URL for ${song.url}:`, error);
      throw new DisTubeError("STREAM_ERROR", error.message);
    }
  }
  async getRelatedSongs(song) {
    return (song.related ? song.related : (await import_ytdl_core.default.getBasicInfo(song.url, this.ytdlOptions)).related_videos).filter((r) => r.id).map((r) => new YouTubeRelatedSong(this, r));
  }
  async searchSong(query, options) {
    const result = await this.search(query, { type: "video" /* VIDEO */, limit: 1 });
    if (!result?.[0]) return null;
    const info = result[0];
    return new import_distube.Song(
      {
        plugin: this,
        source: "youtube",
        playFromSource: true,
        id: info.id,
        name: info.name,
        url: info.url,
        thumbnail: info.thumbnail,
        duration: info.duration,
        views: info.views,
        uploader: info.uploader
      },
      options
    );
  }
  /**
   * Search for a song.
   *
   * @param query              - The string search for
   * @param options            - Search options
   * @param options.limit      - Limit the results
   * @param options.type       - Type of results (`video` or `playlist`).
   * @param options.safeSearch - Whether or not use safe search (YouTube restricted mode)
   *
   * @returns Array of results
   */
  async search(query, options = {}) {
    const { items } = await (0, import_ytsr.default)(query, {
      type: "video" /* VIDEO */,
      limit: 10,
      safeSearch: false,
      ...options,
      requestOptions: { headers: { cookie: this.ytCookie } }
    });
    return items.map((i) => {
      if (i.type === "video") return new YouTubeSearchResultSong(this, i);
      return new YouTubeSearchResultPlaylist(i);
    });
  }
};
var YouTubeSong = class extends import_distube.Song {
  static {
    __name(this, "YouTubeSong");
  }
  chapters;
  storyboards;
  related;
  constructor(plugin, info, options) {
    const i = info.videoDetails;
    super(
      {
        plugin,
        source: "youtube",
        playFromSource: true,
        id: i.videoId,
        name: i.title,
        isLive: Boolean(i.isLive),
        duration: i.isLive ? 0 : toSecond(i.lengthSeconds),
        url: i.video_url || `https://youtu.be/${i.videoId}`,
        thumbnail: i.thumbnails?.sort((a, b) => b.width - a.width)?.[0]?.url,
        views: parseNumber(i.viewCount || i.view_count || i.views),
        likes: parseNumber(i.likes),
        uploader: {
          name: i.author?.name || i.author?.user,
          url: i.author?.channel_url || i.author?.external_channel_url || i.author?.user_url || i.author?.id ? `https://www.youtube.com/channel/${i.author.id}` : i.author?.user ? `https://www.youtube.com/${i.author.user}` : void 0
        },
        ageRestricted: Boolean(i.age_restricted)
      },
      options
    );
    this.chapters = i.chapters || [];
    this.storyboards = i.storyboards || [];
    this.related = info.related_videos || [];
  }
};
var YouTubePlaylist = class extends import_distube.Playlist {
  static {
    __name(this, "YouTubePlaylist");
  }
  constructor(plugin, info, options) {
    const songs = info.items.map(
      (i) => new import_distube.Song({
        plugin,
        playFromSource: true,
        source: "youtube",
        id: i.id,
        name: i.title,
        url: i.url,
        thumbnail: i.thumbnail,
        duration: toSecond(i.duration),
        isLive: Boolean(i.isLive),
        uploader: {
          name: i.author?.name,
          url: i.author?.url || i.author?.channelID ? `https://www.youtube.com/channel/${i.author.channelID}` : void 0
        }
      })
    );
    super(
      {
        source: "youtube",
        id: info.id,
        name: info.title,
        url: info.url,
        thumbnail: info.thumbnail?.url,
        songs
      },
      options
    );
  }
};
var YouTubeRelatedSong = class extends import_distube.Song {
  static {
    __name(this, "YouTubeRelatedSong");
  }
  constructor(plugin, info) {
    if (!info.id) throw new import_distube.DisTubeError("CANNOT_RESOLVE_SONG", info);
    super({
      plugin,
      source: "youtube",
      playFromSource: true,
      id: info.id,
      name: info.title,
      url: `https://youtu.be/${info.id}`,
      thumbnail: info.thumbnails?.sort((a, b) => b.width - a.width)?.[0]?.url,
      isLive: Boolean(info.isLive),
      duration: info.isLive ? 0 : toSecond(info.length_seconds),
      views: parseNumber(info.view_count),
      uploader: typeof info.author === "string" ? {
        name: info.author
      } : {
        name: info.author?.name || info.author?.user,
        url: info.author?.channel_url || info.author?.external_channel_url || info.author?.user_url || info.author?.id ? `https://www.youtube.com/channel/${info.author.id}` : info.author?.user ? `https://www.youtube.com/${info.author.user}` : void 0
      }
    });
  }
};
var SearchResultType = /* @__PURE__ */ ((SearchResultType2) => {
  SearchResultType2["VIDEO"] = "video";
  SearchResultType2["PLAYLIST"] = "playlist";
  return SearchResultType2;
})(SearchResultType || {});
var YouTubeSearchResultSong = class extends import_distube.Song {
  static {
    __name(this, "YouTubeSearchResultSong");
  }
  constructor(plugin, info) {
    super({
      plugin,
      source: "youtube",
      playFromSource: true,
      id: info.id,
      name: info.name,
      url: `https://youtu.be/${info.id}`,
      thumbnail: info.thumbnail,
      isLive: info.isLive,
      duration: toSecond(info.duration),
      views: parseNumber(info.views),
      uploader: {
        name: info.author?.name,
        url: info.author?.url
      }
    });
  }
};
var YouTubeSearchResultPlaylist = class {
  static {
    __name(this, "YouTubeSearchResultPlaylist");
  }
  /**
   * YouTube  playlist id
   */
  id;
  /**
   * Playlist title.
   */
  name;
  /**
   * Playlist URL.
   */
  url;
  /**
   * Playlist owner
   */
  uploader;
  /**
   * Number of videos in the playlist
   */
  length;
  constructor(info) {
    this.id = info.id;
    this.name = info.name;
    this.url = `https://www.youtube.com/playlist?list=${info.id}`;
    this.uploader = {
      name: info.owner?.name,
      url: info.owner?.url
    };
    this.length = info.length;
    this.uploader = {
      name: info.owner?.name,
      url: info.owner?.url
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SearchResultType,
  YouTubePlaylist,
  YouTubePlugin,
  YouTubeRelatedSong,
  YouTubeSearchResultPlaylist,
  YouTubeSearchResultSong,
  YouTubeSong
});
//# sourceMappingURL=index.js.map