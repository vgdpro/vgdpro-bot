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
  BaseBot: () => BaseBot2,
  CQCode: () => CQCode,
  HttpServer: () => HttpServer,
  OneBot: () => utils_exports,
  OneBotBot: () => OneBotBot,
  OneBotMessageEncoder: () => OneBotMessageEncoder,
  PRIVATE_PFX: () => PRIVATE_PFX,
  QQGuildBot: () => QQGuildBot,
  WsClient: () => WsClient,
  WsServer: () => WsServer,
  accept: () => accept,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/bot/index.ts
var import_koishi8 = require("koishi");

// src/http.ts
var import_koishi3 = require("koishi");

// src/utils.ts
var utils_exports = {};
__export(utils_exports, {
  Internal: () => Internal,
  SafetyLevel: () => SafetyLevel,
  TimeoutError: () => TimeoutError,
  adaptChannel: () => adaptChannel,
  adaptGuild: () => adaptGuild,
  adaptMessage: () => adaptMessage,
  adaptQQGuildMemberInfo: () => adaptQQGuildMemberInfo,
  adaptQQGuildMemberProfile: () => adaptQQGuildMemberProfile,
  adaptSession: () => adaptSession,
  decodeGuildMember: () => decodeGuildMember,
  decodeUser: () => decodeUser,
  dispatchSession: () => dispatchSession
});
var import_koishi2 = require("koishi");
var qface = __toESM(require("qface"));

// src/types.ts
var import_koishi = require("koishi");
var SafetyLevel = /* @__PURE__ */ ((SafetyLevel2) => {
  SafetyLevel2[SafetyLevel2["safe"] = 0] = "safe";
  SafetyLevel2[SafetyLevel2["unknown"] = 1] = "unknown";
  SafetyLevel2[SafetyLevel2["danger"] = 2] = "danger";
  return SafetyLevel2;
})(SafetyLevel || {});
var TimeoutError = class extends Error {
  static {
    __name(this, "TimeoutError");
  }
  constructor(args, url) {
    super(`Timeout with request ${url}, args: ${JSON.stringify(args)}`);
    Object.defineProperties(this, {
      args: { value: args },
      url: { value: url }
    });
  }
};
var SenderError = class extends Error {
  static {
    __name(this, "SenderError");
  }
  constructor(args, url, retcode) {
    super(`Error with request ${url}, args: ${JSON.stringify(args)}, retcode: ${retcode}`);
    Object.defineProperties(this, {
      code: { value: retcode },
      args: { value: args },
      url: { value: url }
    });
  }
};
var Internal = class _Internal {
  constructor(bot) {
    this.bot = bot;
  }
  static {
    __name(this, "Internal");
  }
  async _get(action, params = {}) {
    this.bot.logger.debug("[request] %s %o", action, params);
    const response = await this._request(action, params);
    this.bot.logger.debug("[response] %o", response);
    const { data, retcode } = response;
    if (retcode === 0) return data;
    throw new SenderError(params, action, retcode);
  }
  async setGroupAnonymousBan(group_id, meta, duration) {
    const args = { group_id, duration };
    args[typeof meta === "string" ? "flag" : "anonymous"] = meta;
    await this._get("set_group_anonymous_ban", args);
  }
  async setGroupAnonymousBanAsync(group_id, meta, duration) {
    const args = { group_id, duration };
    args[typeof meta === "string" ? "flag" : "anonymous"] = meta;
    await this._get("set_group_anonymous_ban_async", args);
  }
  static asyncPrefixes = ["set", "send", "delete", "create", "upload"];
  static prepareMethod(name) {
    const prop = (0, import_koishi.camelize)(name.replace(/^[_.]/, ""));
    const isAsync = _Internal.asyncPrefixes.some((prefix) => prop.startsWith(prefix));
    return [prop, isAsync];
  }
  static prepareArg(name, params, args) {
    const fixedArg = Object.fromEntries(params.map((name2, index) => [name2, args[index]]));
    for (const key in fixedArg) {
      if (!name.includes("guild") && key.endsWith("_id")) {
        const value = +fixedArg[key];
        if (BigInt(Math.abs(value)) < 1n << 32n) {
          fixedArg[key] = value;
        }
      }
    }
    return fixedArg;
  }
  static define(name, ...params) {
    const [prop, isAsync] = _Internal.prepareMethod(name);
    _Internal.prototype[prop] = async function(...args) {
      const data = await this._get(name, _Internal.prepareArg(name, params, args));
      if (!isAsync) return data;
    };
    isAsync && (_Internal.prototype[prop + "Async"] = async function(...args) {
      await this._get(name + "_async", _Internal.prepareArg(name, params, args));
    });
  }
  static defineExtract(name, key, ...params) {
    const [prop, isAsync] = _Internal.prepareMethod(name);
    _Internal.prototype[prop] = async function(...args) {
      const data = await this._get(name, _Internal.prepareArg(name, params, args));
      return data[key];
    };
    isAsync && (_Internal.prototype[prop + "Async"] = async function(...args) {
      await this._get(name + "_async", _Internal.prepareArg(name, params, args));
    });
  }
};
Internal.defineExtract("send_private_msg", "message_id", "user_id", "message", "auto_escape");
Internal.defineExtract("send_group_msg", "message_id", "group_id", "message", "auto_escape");
Internal.defineExtract("send_group_forward_msg", "message_id", "group_id", "messages");
Internal.defineExtract("send_private_forward_msg", "message_id", "user_id", "messages");
Internal.define("delete_msg", "message_id");
Internal.define("mark_msg_as_read", "message_id");
Internal.define("set_essence_msg", "message_id");
Internal.define("delete_essence_msg", "message_id");
Internal.define("send_group_sign", "group_id");
Internal.define("send_like", "user_id", "times");
Internal.define("get_msg", "message_id");
Internal.define("get_essence_msg_list", "group_id");
Internal.define("ocr_image", "image");
Internal.defineExtract("get_forward_msg", "messages", "message_id");
Internal.defineExtract(".get_word_slices", "slices", "content");
Internal.define("get_group_msg_history", "group_id", "message_seq");
Internal.define("set_friend_add_request", "flag", "approve", "remark");
Internal.define("set_group_add_request", "flag", "sub_type", "approve", "reason");
Internal.defineExtract("_get_model_show", "variants", "model");
Internal.define("_set_model_show", "model", "model_show");
Internal.define("set_group_kick", "group_id", "user_id", "reject_add_request");
Internal.define("set_group_ban", "group_id", "user_id", "duration");
Internal.define("set_group_whole_ban", "group_id", "enable");
Internal.define("set_group_admin", "group_id", "user_id", "enable");
Internal.define("set_group_anonymous", "group_id", "enable");
Internal.define("set_group_card", "group_id", "user_id", "card");
Internal.define("set_group_leave", "group_id", "is_dismiss");
Internal.define("set_group_special_title", "group_id", "user_id", "special_title", "duration");
Internal.define("set_group_name", "group_id", "group_name");
Internal.define("set_group_portrait", "group_id", "file", "cache");
Internal.define("_send_group_notice", "group_id", "content", "image", "pinned", "confirm_required");
Internal.define("_get_group_notice", "group_id");
Internal.define("_del_group_notice", "group_id", "notice_id");
Internal.define("get_group_at_all_remain", "group_id");
Internal.define("get_login_info");
Internal.define("qidian_get_login_info");
Internal.define("set_qq_profile", "nickname", "company", "email", "college", "personal_note");
Internal.define("set_qq_avatar", "file");
Internal.define("set_online_status", "status", "ext_status", "battery_status");
Internal.define("get_stranger_info", "user_id", "no_cache");
Internal.define("_get_vip_info", "user_id");
Internal.define("get_friend_list");
Internal.define("get_unidirectional_friend_list");
Internal.define("delete_friend", "user_id");
Internal.define("delete_unidirectional_friend", "user_id");
Internal.define("get_group_info", "group_id", "no_cache");
Internal.define("get_group_list");
Internal.define("get_group_member_info", "group_id", "user_id", "no_cache");
Internal.define("get_group_member_list", "group_id");
Internal.define("get_group_honor_info", "group_id", "type");
Internal.define("get_group_system_msg");
Internal.define("get_group_file_system_info", "group_id");
Internal.define("get_group_root_files", "group_id");
Internal.define("get_group_files_by_folder", "group_id", "folder_id");
Internal.define("upload_private_file", "user_id", "file", "name");
Internal.define("upload_group_file", "group_id", "file", "name", "folder");
Internal.define("create_group_file_folder", "group_id", "folder_id", "name");
Internal.define("delete_group_folder", "group_id", "folder_id");
Internal.define("delete_group_file", "group_id", "folder_id", "file_id", "busid");
Internal.defineExtract("get_group_file_url", "url", "group_id", "file_id", "busid");
Internal.defineExtract("download_file", "file", "url", "headers", "thread_count");
Internal.defineExtract("get_online_clients", "clients", "no_cache");
Internal.defineExtract("check_url_safely", "level", "url");
Internal.defineExtract("get_cookies", "cookies", "domain");
Internal.defineExtract("get_csrf_token", "token");
Internal.define("get_credentials", "domain");
Internal.define("get_record", "file", "out_format", "full_path");
Internal.define("get_image", "file");
Internal.defineExtract("can_send_image", "yes");
Internal.defineExtract("can_send_record", "yes");
Internal.define("get_status");
Internal.define("get_version_info");
Internal.define("set_restart", "delay");
Internal.define("reload_event_filter");
Internal.define("get_guild_service_profile");
Internal.define("get_guild_list");
Internal.define("get_guild_meta_by_guest", "guild_id");
Internal.define("get_guild_channel_list", "guild_id", "no_cache");
Internal.define("get_guild_member_list", "guild_id", "next_token");
Internal.define("get_guild_member_profile", "guild_id", "user_id");
Internal.defineExtract("send_guild_channel_msg", "message_id", "guild_id", "channel_id", "message");

// src/utils.ts
var decodeUser = /* @__PURE__ */ __name((user) => ({
  id: user.tiny_id || user.user_id.toString(),
  name: user.nickname,
  userId: user.tiny_id || user.user_id.toString(),
  avatar: user.user_id ? `http://q.qlogo.cn/headimg_dl?dst_uin=${user.user_id}&spec=640` : void 0,
  username: user.nickname
}), "decodeUser");
var decodeGuildMember = /* @__PURE__ */ __name((user) => ({
  user: decodeUser(user),
  nick: user.card,
  roles: [user.role]
}), "decodeGuildMember");
var adaptQQGuildMemberInfo = /* @__PURE__ */ __name((user) => ({
  user: {
    id: user.tiny_id,
    name: user.nickname,
    isBot: user.role_name === "机器人"
  },
  name: user.nickname,
  roles: user.role_name ? [user.role_name] : []
}), "adaptQQGuildMemberInfo");
var adaptQQGuildMemberProfile = /* @__PURE__ */ __name((user) => ({
  user: {
    id: user.tiny_id,
    name: user.nickname,
    isBot: user.roles?.some((r) => r.role_name === "机器人")
  },
  name: user.nickname,
  roles: user.roles?.map((r) => r.role_name) || []
}), "adaptQQGuildMemberProfile");
async function adaptMessage(bot, data, message = {}, payload = message) {
  message.id = message.messageId = data.message_id.toString();
  const chain = CQCode.parse(data.message);
  if (bot.config.advanced.splitMixedContent) {
    chain.forEach((item, index) => {
      if (item.type !== "image") return;
      const left = chain[index - 1];
      if (left && left.type === "text" && left.attrs.content.trimEnd() === left.attrs.content) {
        left.attrs.content += " ";
      }
      const right = chain[index + 1];
      if (right && right.type === "text" && right.attrs.content.trimStart() === right.attrs.content) {
        right.attrs.content = " " + right.attrs.content;
      }
    });
  }
  message.elements = import_koishi2.h.transform(chain, {
    at(attrs) {
      if (attrs.qq !== "all") return import_koishi2.h.at(attrs.qq, { name: attrs.name });
      return (0, import_koishi2.h)("at", { type: "all" });
    },
    face({ id }) {
      const name = qface.get(id)?.QDes.slice(1);
      return (0, import_koishi2.h)("face", { id, name, platform: bot.platform }, [
        import_koishi2.h.image(qface.getUrl(id))
      ]);
    },
    image(attrs) {
      return (0, import_koishi2.h)("img", {
        src: attrs.url || attrs.file,
        ...(0, import_koishi2.omit)(attrs, ["url"])
      });
    },
    record(attrs) {
      return (0, import_koishi2.h)("audio", {
        src: attrs.url || attrs.file,
        ...(0, import_koishi2.omit)(attrs, ["url"])
      });
    },
    video(attrs) {
      return (0, import_koishi2.h)("video", {
        src: attrs.url || attrs.file,
        ...(0, import_koishi2.omit)(attrs, ["url"])
      });
    },
    file(attrs) {
      return (0, import_koishi2.h)("file", {
        src: attrs.url || attrs.file,
        ...(0, import_koishi2.omit)(attrs, ["url"])
      });
    }
  });
  const [guildId, channelId] = decodeGuildChannelId(data);
  if (message.elements[0]?.type === "reply") {
    const reply = message.elements.shift();
    message.quote = await bot.getMessage(channelId, reply.attrs.id).catch((error) => {
      bot.logger.warn(error);
      return void 0;
    });
  }
  message.content = message.elements.join("");
  if (!payload) return message;
  payload.user = decodeUser(data.sender);
  payload.member = decodeGuildMember(data.sender);
  payload.timestamp = data.time * 1e3;
  payload.guild = guildId && { id: guildId };
  payload.channel = channelId && { id: channelId, type: guildId ? import_koishi2.Universal.Channel.Type.TEXT : import_koishi2.Universal.Channel.Type.DIRECT };
  return message;
}
__name(adaptMessage, "adaptMessage");
var decodeGuildChannelId = /* @__PURE__ */ __name((data) => {
  if (data.guild_id) {
    return [data.guild_id, data.channel_id];
  } else if (data.group_id) {
    return [data.group_id.toString(), data.group_id.toString()];
  } else {
    return [void 0, "private:" + data.sender.user_id];
  }
}, "decodeGuildChannelId");
var adaptGuild = /* @__PURE__ */ __name((info) => {
  if (info.guild_id) {
    const guild = info;
    return {
      id: guild.guild_id,
      name: guild.guild_name
    };
  } else {
    const group = info;
    return {
      id: group.group_id.toString(),
      name: group.group_name
    };
  }
}, "adaptGuild");
var adaptChannel = /* @__PURE__ */ __name((info) => {
  if (info.channel_id) {
    const channel = info;
    return {
      id: channel.channel_id,
      name: channel.channel_name,
      type: import_koishi2.Universal.Channel.Type.TEXT
    };
  } else {
    const group = info;
    return {
      id: group.group_id.toString(),
      name: group.group_name,
      type: import_koishi2.Universal.Channel.Type.TEXT
    };
  }
}, "adaptChannel");
async function dispatchSession(bot, data) {
  if (data.self_tiny_id) {
    bot = bot["guildBot"];
    if (!bot) return;
  }
  const session = await adaptSession(bot, data);
  if (!session) return;
  session.setInternal("onebot", data);
  bot.dispatch(session);
}
__name(dispatchSession, "dispatchSession");
async function adaptSession(bot, data) {
  const session = bot.session();
  session.selfId = data.self_tiny_id ? data.self_tiny_id : "" + data.self_id;
  session.type = data.post_type;
  if (data.post_type === "message" || data.post_type === "message_sent") {
    await adaptMessage(bot, data, session.event.message = {}, session.event);
    if (data.post_type === "message_sent" && !session.guildId) {
      session.channelId = "private:" + data.target_id;
    }
    session.type = "message";
    session.subtype = data.message_type === "guild" ? "group" : data.message_type;
    session.isDirect = data.message_type === "private";
    session.subsubtype = data.message_type;
    return session;
  }
  session.subtype = data.sub_type;
  if (data.user_id) session.userId = "" + data.user_id;
  if (data.group_id) session.guildId = session.channelId = "" + data.group_id;
  if (data.guild_id) session.guildId = "" + data.guild_id;
  if (data.channel_id) session.channelId = "" + data.channel_id;
  if (data.target_id) session["targetId"] = "" + data.target_id;
  if (data.operator_id) session.operatorId = "" + data.operator_id;
  if (data.message_id) session.messageId = "" + data.message_id;
  if (data.post_type === "request") {
    session.content = data.comment;
    session.messageId = data.flag;
    if (data.request_type === "friend") {
      session.type = "friend-request";
      session.channelId = `private:${session.userId}`;
    } else if (data.sub_type === "add") {
      session.type = "guild-member-request";
    } else {
      session.type = "guild-request";
    }
  } else if (data.post_type === "notice") {
    switch (data.notice_type) {
      case "group_recall":
        session.type = "message-deleted";
        session.subtype = "group";
        break;
      case "friend_recall":
        session.type = "message-deleted";
        session.subtype = "private";
        session.channelId = `private:${session.userId}`;
        break;
      // from go-cqhttp source code, but not mentioned in official docs
      case "guild_channel_recall":
        session.type = "message-deleted";
        session.subtype = "guild";
        break;
      case "friend_add":
        session.type = "friend-added";
        break;
      case "group_admin":
        session.type = "guild-member";
        session.subtype = "role";
        break;
      case "group_ban":
        session.type = "guild-member";
        session.subtype = "ban";
        break;
      case "group_decrease":
        session.type = session.userId === session.selfId ? "guild-deleted" : "guild-member-deleted";
        session.subtype = session.userId === session.operatorId ? "active" : "passive";
        break;
      case "group_increase":
        session.type = session.userId === session.selfId ? "guild-added" : "guild-member-added";
        session.subtype = session.userId === session.operatorId ? "active" : "passive";
        break;
      case "group_card":
        session.type = "guild-member";
        session.subtype = "nickname";
        break;
      case "notify":
        session.type = "notice";
        session.subtype = (0, import_koishi2.hyphenate)(data.sub_type);
        if (session.subtype === "poke") {
          session.channelId ||= `private:${session.userId}`;
        } else if (session.subtype === "honor") {
          session.subsubtype = (0, import_koishi2.hyphenate)(data.honor_type);
        }
        break;
      case "message_reactions_updated":
        session.type = "onebot";
        session.subtype = "message-reactions-updated";
        break;
      case "channel_created":
        session.type = "onebot";
        session.subtype = "channel-created";
        break;
      case "channel_updated":
        session.type = "onebot";
        session.subtype = "channel-updated";
        break;
      case "channel_destroyed":
        session.type = "onebot";
        session.subtype = "channel-destroyed";
        break;
      // https://github.com/koishijs/koishi-plugin-adapter-onebot/issues/33
      // case 'offline_file':
      //   session.elements = [h('file', data.file)]
      //   session.type = 'message'
      //   session.subtype = 'private'
      //   session.isDirect = true
      //   session.subsubtype = 'offline-file-added'
      //   break
      // case 'group_upload':
      //   session.elements = [h('file', data.file)]
      //   session.type = 'message'
      //   session.subtype = 'group'
      //   session.subsubtype = 'guild-file-added'
      //   break
      default:
        return;
    }
  } else return;
  return session;
}
__name(adaptSession, "adaptSession");

// src/http.ts
var import_crypto = require("crypto");
var HttpServer = class extends import_koishi3.Adapter {
  static {
    __name(this, "HttpServer");
  }
  static inject = ["server"];
  async fork(ctx, bot) {
    super.fork(ctx, bot);
    const config = bot.config;
    const { endpoint, token } = config;
    if (!endpoint) return;
    const http = ctx.http.extend(config).extend({
      headers: {
        "Authorization": `Token ${token}`
      }
    });
    bot.internal._request = async (action, params) => {
      return http.post("/" + action, params);
    };
    return bot.initialize();
  }
  async connect(bot) {
    const { secret, path = "/onebot" } = bot.config;
    this.ctx.server.post(path, (ctx) => {
      if (secret) {
        const signature = ctx.headers["x-signature"];
        if (!signature) return ctx.status = 401;
        const sig = (0, import_crypto.createHmac)("sha1", secret).update(ctx.request.body[Symbol.for("unparsedBody")]).digest("hex");
        if (signature !== `sha1=${sig}`) return ctx.status = 403;
      }
      const selfId = ctx.headers["x-self-id"].toString();
      const bot2 = this.bots.find((bot3) => bot3.selfId === selfId);
      if (!bot2) return ctx.status = 403;
      bot2.logger.debug("[receive] %o", ctx.request.body);
      dispatchSession(bot2, ctx.request.body);
    });
  }
};
((HttpServer2) => {
  HttpServer2.Options = import_koishi3.Schema.intersect([
    import_koishi3.Schema.object({
      protocol: import_koishi3.Schema.const("http").required(),
      path: import_koishi3.Schema.string().description("服务器监听的路径。").default("/onebot"),
      secret: import_koishi3.Schema.string().description("接收事件推送时用于验证的字段，应该与 OneBot 的 secret 配置保持一致。").role("secret")
    }).description("连接设置"),
    import_koishi3.HTTP.createConfig(true)
  ]);
})(HttpServer || (HttpServer = {}));

// src/ws.ts
var import_koishi4 = require("koishi");
var WsClient = class extends import_koishi4.Adapter.WsClient {
  static {
    __name(this, "WsClient");
  }
  accept(socket) {
    accept(socket, this.bot);
  }
  prepare() {
    const { token, endpoint } = this.bot.config;
    const http = this.ctx.http.extend(this.bot.config);
    if (token) http.config.headers.Authorization = `Bearer ${token}`;
    return http.ws(endpoint);
  }
};
((WsClient2) => {
  WsClient2.Options = import_koishi4.Schema.intersect([
    import_koishi4.Schema.object({
      protocol: import_koishi4.Schema.const("ws").required(process.env.KOISHI_ENV !== "browser"),
      responseTimeout: import_koishi4.Schema.natural().role("time").default(import_koishi4.Time.minute).description("等待响应的时间 (单位为毫秒)。")
    }).description("连接设置"),
    import_koishi4.HTTP.createConfig(true),
    import_koishi4.Adapter.WsClientConfig
  ]);
})(WsClient || (WsClient = {}));
var kSocket = Symbol("socket");
var WsServer = class extends import_koishi4.Adapter {
  static {
    __name(this, "WsServer");
  }
  static inject = ["server"];
  logger;
  wsServer;
  constructor(ctx, bot) {
    super(ctx);
    this.logger = ctx.logger("onebot");
    const { path = "/onebot" } = bot.config;
    this.wsServer = ctx.server.ws(path, (socket, { headers }) => {
      this.logger.debug("connected with", headers);
      if (headers["x-client-role"] !== "Universal") {
        return socket.close(1008, "invalid x-client-role");
      }
      const selfId = headers["x-self-id"].toString();
      const bot2 = this.bots.find((bot3) => bot3.selfId === selfId);
      if (!bot2) return socket.close(1008, "invalid x-self-id");
      bot2[kSocket] = socket;
      accept(socket, bot2);
    });
    ctx.on("dispose", () => {
      this.logger.debug("ws server closing");
      this.wsServer.close();
    });
  }
  async disconnect(bot) {
    bot[kSocket]?.close();
    bot[kSocket] = null;
  }
};
((WsServer2) => {
  WsServer2.Options = import_koishi4.Schema.object({
    protocol: import_koishi4.Schema.const("ws-reverse").required(process.env.KOISHI_ENV === "browser"),
    path: import_koishi4.Schema.string().description("服务器监听的路径。").default("/onebot"),
    responseTimeout: import_koishi4.Schema.natural().role("time").default(import_koishi4.Time.minute).description("等待响应的时间 (单位为毫秒)。")
  }).description("连接设置");
})(WsServer || (WsServer = {}));
var counter = 0;
var listeners = {};
function accept(socket, bot) {
  socket.addEventListener("message", ({ data }) => {
    let parsed;
    data = data.toString();
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      return bot.logger.warn("cannot parse message", data);
    }
    if ("post_type" in parsed) {
      bot.logger.debug("[receive] %o", parsed);
      dispatchSession(bot, parsed);
    } else if (parsed.echo in listeners) {
      listeners[parsed.echo](parsed);
      delete listeners[parsed.echo];
    }
  });
  socket.addEventListener("close", () => {
    delete bot.internal._request;
  });
  bot.internal._request = (action, params) => {
    const data = { action, params, echo: ++counter };
    data.echo = ++counter;
    return new Promise((resolve, reject) => {
      listeners[data.echo] = resolve;
      setTimeout(() => {
        delete listeners[data.echo];
        reject(new TimeoutError(params, action));
      }, bot.config.responseTimeout);
      socket.send(JSON.stringify(data));
    });
  };
  bot.initialize();
}
__name(accept, "accept");

// src/bot/base.ts
var import_koishi6 = require("koishi");

// src/bot/message.ts
var import_koishi5 = require("koishi");
var import_node_url = require("node:url");
var State = class {
  constructor(type) {
    this.type = type;
  }
  static {
    __name(this, "State");
  }
  author = {};
  children = [];
};
var PRIVATE_PFX = "private:";
var OneBotMessageEncoder = class extends import_koishi5.MessageEncoder {
  static {
    __name(this, "OneBotMessageEncoder");
  }
  stack = [new State("message")];
  children = [];
  async prepare() {
    super.prepare();
    const { event: { channel } } = this.session;
    if (!channel.type) {
      channel.type = channel.id.startsWith(PRIVATE_PFX) ? import_koishi5.Universal.Channel.Type.DIRECT : import_koishi5.Universal.Channel.Type.TEXT;
    }
    if (!this.guildId && !this.session.isDirect) this.guildId = this.channelId;
  }
  async forward() {
    if (!this.stack[0].children.length) return;
    const session = this.bot.session();
    session.messageId = this.session.event.channel.type === import_koishi5.Universal.Channel.Type.DIRECT ? "" + await this.bot.internal.sendPrivateForwardMsg(this.channelId.slice(PRIVATE_PFX.length), this.stack[0].children) : "" + await this.bot.internal.sendGroupForwardMsg(this.channelId, this.stack[0].children);
    session.userId = this.bot.selfId;
    session.channelId = this.session.channelId;
    session.guildId = this.session.guildId;
    session.isDirect = this.session.isDirect;
    session.app.emit(session, "send", session);
    this.results.push(session.event.message);
  }
  async flush() {
    while (true) {
      const first = this.children[0];
      if (first?.type !== "text") break;
      first.data.text = first.data.text.trimStart();
      if (first.data.text) break;
      this.children.shift();
    }
    while (true) {
      const last = this.children[this.children.length - 1];
      if (last?.type !== "text") break;
      last.data.text = last.data.text.trimEnd();
      if (last.data.text) break;
      this.children.pop();
    }
    const { type, author } = this.stack[0];
    if (!this.children.length && !author.messageId) return;
    if (type === "forward") {
      if (author.messageId) {
        this.stack[1].children.push({
          type: "node",
          data: {
            id: author.messageId
          }
        });
      } else {
        this.stack[1].children.push({
          type: "node",
          data: {
            name: author.name || this.bot.user.name,
            uin: author.id || this.bot.userId,
            content: this.children,
            time: `${Math.floor((+author.time || Date.now()) / 1e3)}`
          }
        });
      }
      this.children = [];
      return;
    }
    const session = this.bot.session();
    session.messageId = this.bot.parent ? "" + await this.bot.internal.sendGuildChannelMsg(this.guildId, this.channelId, this.children) : this.session.event.channel.type === import_koishi5.Universal.Channel.Type.DIRECT ? "" + await this.bot.internal.sendPrivateMsg(this.channelId.slice(PRIVATE_PFX.length), this.children) : "" + await this.bot.internal.sendGroupMsg(this.channelId, this.children);
    session.userId = this.bot.selfId;
    session.channelId = this.session.channelId;
    session.guildId = this.session.guildId;
    session.isDirect = this.session.isDirect;
    session.app.emit(session, "send", session);
    this.results.push(session.event.message);
    this.children = [];
  }
  async sendFile(attrs) {
    const src = attrs.src || attrs.url;
    const name = attrs.title || (await this.bot.ctx.http.file(src)).filename;
    const file = src.startsWith("file:") ? (0, import_node_url.fileURLToPath)(src) : await this.bot.internal.downloadFile(src);
    if (this.session.event.channel.type === import_koishi5.Universal.Channel.Type.DIRECT) {
      await this.bot.internal.uploadPrivateFile(
        this.channelId.slice(PRIVATE_PFX.length),
        file,
        name
      );
    } else {
      await this.bot.internal.uploadGroupFile(
        this.channelId,
        file,
        name
      );
    }
    const session = this.bot.session();
    session.messageId = "";
    session.userId = this.bot.selfId;
    session.channelId = this.session.channelId;
    session.guildId = this.session.guildId;
    session.isDirect = this.session.isDirect;
    session.app.emit(session, "send", session);
    this.results.push(session.event.message);
  }
  text(text) {
    this.children.push({ type: "text", data: { text } });
  }
  async visit(element) {
    let { type, attrs, children } = element;
    if (type === "text") {
      this.text(attrs.content);
    } else if (type === "br") {
      this.text("\n");
    } else if (type === "p") {
      const prev = this.children[this.children.length - 1];
      if (prev?.type === "text") {
        if (!prev.data.text.endsWith("\n")) {
          prev.data.text += "\n";
        }
      } else {
        this.text("\n");
      }
      await this.render(children);
      this.text("\n");
    } else if (type === "at") {
      if (attrs.type === "all") {
        this.children.push({ type: "at", data: { qq: "all" } });
      } else {
        this.children.push({ type: "at", data: { qq: attrs.id, name: attrs.name } });
      }
    } else if (type === "sharp") {
      if (attrs.id) this.text(attrs.id);
    } else if (type === "face") {
      if (attrs.platform && attrs.platform !== this.bot.platform) {
        await this.render(children);
      } else {
        this.children.push({ type: "face", data: { id: attrs.id } });
      }
    } else if (type === "a") {
      await this.render(children);
      if (attrs.href) this.text(`（${attrs.href}）`);
    } else if (["video", "audio", "image", "img"].includes(type)) {
      if (type === "video" || type === "audio") await this.flush();
      if (type === "audio") type = "record";
      if (type === "img") type = "image";
      attrs = { ...attrs };
      attrs.file = attrs.src || attrs.url;
      delete attrs.src;
      delete attrs.url;
      if (attrs.cache) {
        attrs.cache = 1;
      } else {
        attrs.cache = 0;
      }
      const cap = /^data:([\w/.+-]+);base64,/.exec(attrs.file);
      if (cap) attrs.file = "base64://" + attrs.file.slice(cap[0].length);
      this.children.push({ type, data: attrs });
    } else if (type === "file") {
      await this.flush();
      await this.sendFile(attrs);
    } else if (type === "onebot:music") {
      await this.flush();
      this.children.push({ type: "music", data: attrs });
    } else if (type === "onebot:tts") {
      await this.flush();
      this.children.push({ type: "tts", data: attrs });
    } else if (type === "onebot:poke") {
      await this.flush();
      this.children.push({ type: "poke", data: attrs });
    } else if (type === "onebot:gift") {
      await this.flush();
      this.children.push({ type: "gift", data: attrs });
    } else if (type === "onebot:share") {
      await this.flush();
      this.children.push({ type: "share", data: attrs });
    } else if (type === "onebot:json") {
      await this.flush();
      this.children.push({ type: "json", data: attrs });
    } else if (type === "onebot:xml") {
      await this.flush();
      this.children.push({ type: "xml", data: attrs });
    } else if (type === "onebot:cardimage") {
      await this.flush();
      this.children.push({ type: "cardimage", data: attrs });
    } else if (type === "author") {
      Object.assign(this.stack[0].author, attrs);
    } else if (type === "figure" && !this.bot.parent) {
      await this.flush();
      this.stack.unshift(new State("forward"));
      await this.render(children);
      await this.flush();
      this.stack.shift();
      await this.forward();
    } else if (type === "figure") {
      await this.render(children);
      await this.flush();
    } else if (type === "quote") {
      await this.flush();
      this.children.push({ type: "reply", data: attrs });
    } else if (type === "message") {
      await this.flush();
      if ("forward" in attrs && !this.bot.parent) {
        this.stack.unshift(new State("forward"));
        await this.render(children);
        await this.flush();
        this.stack.shift();
        await this.forward();
      } else if ("id" in attrs) {
        this.stack[0].author.messageId = attrs.id.toString();
      } else {
        Object.assign(this.stack[0].author, (0, import_koishi5.pick)(attrs, ["userId", "username", "nickname", "time"]));
        await this.render(children);
        await this.flush();
      }
    } else {
      await this.render(children);
    }
  }
};

// src/bot/base.ts
var BaseBot2 = class extends import_koishi6.Bot {
  static {
    __name(this, "BaseBot");
  }
  static MessageEncoder = OneBotMessageEncoder;
  static inject = ["http"];
  parent;
  internal;
  async createDirectChannel(userId) {
    return { id: `${PRIVATE_PFX}${userId}`, type: import_koishi6.Universal.Channel.Type.DIRECT };
  }
  async getMessage(channelId, messageId) {
    const data = await this.internal.getMsg(messageId);
    return await adaptMessage(this, data);
  }
  async deleteMessage(channelId, messageId) {
    await this.internal.deleteMsg(messageId);
  }
  async getLogin() {
    const data = await this.internal.getLoginInfo();
    this.user = decodeUser(data);
    return this.toJSON();
  }
  async getUser(userId) {
    const data = await this.internal.getStrangerInfo(userId);
    return decodeUser(data);
  }
  async getFriendList() {
    const data = await this.internal.getFriendList();
    return { data: data.map(decodeUser) };
  }
  async handleFriendRequest(messageId, approve, comment) {
    await this.internal.setFriendAddRequest(messageId, approve, comment);
  }
  async handleGuildRequest(messageId, approve, comment) {
    await this.internal.setGroupAddRequest(messageId, "invite", approve, comment);
  }
  async handleGuildMemberRequest(messageId, approve, comment) {
    await this.internal.setGroupAddRequest(messageId, "add", approve, comment);
  }
  async deleteFriend(userId) {
    await this.internal.deleteFriend(userId);
  }
  async getMessageList(channelId, before, direction = "before") {
    if (direction !== "before") throw new Error("Unsupported direction.");
    let list;
    if (before) {
      const msg = await this.internal.getMsg(before);
      if (msg?.message_seq) {
        list = (await this.internal.getGroupMsgHistory(Number(channelId), msg.message_seq)).messages;
      }
    } else {
      list = (await this.internal.getGroupMsgHistory(Number(channelId))).messages;
    }
    return { data: await Promise.all(list.map((item) => adaptMessage(this, item))) };
  }
};
((BaseBot3) => {
  BaseBot3.AdvancedConfig = import_koishi6.Schema.object({
    splitMixedContent: import_koishi6.Schema.boolean().description("是否自动在混合内容间插入空格。").default(true)
  }).description("高级设置");
})(BaseBot2 || (BaseBot2 = {}));

// src/bot/qqguild.ts
var QQGuildBot = class extends BaseBot2 {
  static {
    __name(this, "QQGuildBot");
  }
  hidden = true;
  constructor(ctx, config) {
    super(ctx, config, "qqguild");
    this.platform = "qqguild";
    this.selfId = config.profile.tiny_id;
    this.parent = config.parent;
    this.internal = config.parent.internal;
    this.user.name = config.profile.nickname;
    this.user.avatar = config.profile.avatar_url;
    this.parent.guildBot = this;
  }
  get status() {
    return this.parent.status;
  }
  set status(status) {
    this.parent.status = status;
  }
  async start() {
    await this.context.parallel("bot-connect", this);
  }
  async stop() {
    if (!this.parent) return;
    this.parent = void 0;
    await this.context.parallel("bot-disconnect", this);
  }
  async getChannel(channelId, guildId) {
    const { data } = await this.getChannelList(guildId);
    return data.find((channel) => channel.id === channelId);
  }
  async getChannelList(guildId) {
    const data = await this.internal.getGuildChannelList(guildId, false);
    return { data: (data || []).map(adaptChannel) };
  }
  async getGuild(guildId) {
    const data = await this.internal.getGuildMetaByGuest(guildId);
    return adaptGuild(data);
  }
  async getGuildList() {
    const data = await this.internal.getGuildList();
    return { data: data.map(adaptGuild) };
  }
  async getGuildMember(guildId, userId) {
    const profile = await this.internal.getGuildMemberProfile(guildId, userId);
    return adaptQQGuildMemberProfile(profile);
  }
  async getGuildMemberList(guildId) {
    let nextToken;
    let list = [];
    while (true) {
      const data = await this.internal.getGuildMemberList(guildId, nextToken);
      if (!data.members?.length) break;
      list = list.concat(data.members.map(adaptQQGuildMemberInfo));
      if (data.finished) break;
      nextToken = data.next_token;
    }
    return { data: list };
  }
};

// src/bot/cqcode.ts
var import_koishi7 = require("koishi");
function CQCode(type, attrs) {
  if (type === "text") return attrs.content;
  let output = "[CQ:" + type;
  for (const key in attrs) {
    if (attrs[key]) output += `,${key}=${import_koishi7.h.escape(attrs[key], true)}`;
  }
  return output + "]";
}
__name(CQCode, "CQCode");
((CQCode2) => {
  function escape(source, inline = false) {
    const result = String(source).replace(/&/g, "&amp;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;");
    return inline ? result.replace(/,/g, "&#44;").replace(/(\ud83c[\udf00-\udfff])|(\ud83d[\udc00-\ude4f\ude80-\udeff])|[\u2600-\u2B55]/g, " ") : result;
  }
  CQCode2.escape = escape;
  __name(escape, "escape");
  function unescape(source) {
    return String(source).replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&#44;/g, ",").replace(/&amp;/g, "&");
  }
  CQCode2.unescape = unescape;
  __name(unescape, "unescape");
  const pattern = /\[CQ:(\w+)((,\w+=[^,\]]*)*)\]/;
  function from(source) {
    const capture = pattern.exec(source);
    if (!capture) return null;
    const [, type, attrs] = capture;
    const data = {};
    attrs && attrs.slice(1).split(",").forEach((str) => {
      const index = str.indexOf("=");
      data[str.slice(0, index)] = unescape(str.slice(index + 1));
    });
    return { type, data, capture };
  }
  CQCode2.from = from;
  __name(from, "from");
  function parse(source) {
    if (typeof source !== "string") {
      return source.map(({ type, data }) => {
        if (type === "text") {
          return (0, import_koishi7.h)("text", { content: data.text });
        } else {
          return (0, import_koishi7.h)(type, data);
        }
      });
    }
    const elements = [];
    let result;
    while (result = from(source)) {
      const { type, data, capture } = result;
      if (capture.index) {
        elements.push((0, import_koishi7.h)("text", { content: unescape(source.slice(0, capture.index)) }));
      }
      elements.push((0, import_koishi7.h)(type, data));
      source = source.slice(capture.index + capture[0].length);
    }
    if (source) elements.push((0, import_koishi7.h)("text", { content: unescape(source) }));
    return elements;
  }
  CQCode2.parse = parse;
  __name(parse, "parse");
})(CQCode || (CQCode = {}));

// src/bot/index.ts
var OneBotBot = class extends BaseBot2 {
  static {
    __name(this, "OneBotBot");
  }
  guildBot;
  constructor(ctx, config) {
    super(ctx, config, "onebot");
    this.selfId = config.selfId;
    this.internal = new Internal(this);
    this.user.avatar = `http://q.qlogo.cn/headimg_dl?dst_uin=${config.selfId}&spec=640`;
    if (config.protocol === "http") {
      ctx.plugin(HttpServer, this);
    } else if (config.protocol === "ws") {
      ctx.plugin(WsClient, this);
    } else if (config.protocol === "ws-reverse") {
      ctx.plugin(WsServer, this);
    }
  }
  async stop() {
    if (this.guildBot) {
      delete this.ctx.bots[this.guildBot.sid];
    }
    await super.stop();
  }
  async initialize() {
    await Promise.all([
      this.getLogin(),
      this.setupGuildService().catch(import_koishi8.noop)
    ]).then(() => this.online(), (error) => this.offline(error));
  }
  async setupGuildService() {
    const profile = await this.internal.getGuildServiceProfile();
    if (!profile?.tiny_id || profile.tiny_id === "0") return;
    this.ctx.plugin(QQGuildBot, {
      profile,
      parent: this,
      advanced: this.config.advanced
    });
  }
  async getChannel(channelId) {
    const data = await this.internal.getGroupInfo(channelId);
    return adaptChannel(data);
  }
  async getGuild(guildId) {
    const data = await this.internal.getGroupInfo(guildId);
    return adaptGuild(data);
  }
  async getGuildList() {
    const data = await this.internal.getGroupList();
    return { data: data.map(adaptGuild) };
  }
  async getChannelList(guildId) {
    return { data: [await this.getChannel(guildId)] };
  }
  async getGuildMember(guildId, userId) {
    const data = await this.internal.getGroupMemberInfo(guildId, userId);
    return decodeGuildMember(data);
  }
  async getGuildMemberList(guildId) {
    const data = await this.internal.getGroupMemberList(guildId);
    return { data: data.map(decodeGuildMember) };
  }
  async kickGuildMember(guildId, userId, permanent) {
    return this.internal.setGroupKick(guildId, userId, permanent);
  }
  async muteGuildMember(guildId, userId, duration) {
    return this.internal.setGroupBan(guildId, userId, Math.round(duration / 1e3));
  }
  async muteChannel(channelId, guildId, enable) {
    return this.internal.setGroupWholeBan(channelId, enable);
  }
  async checkPermission(name, session) {
    if (name === "onebot.group.admin") {
      return session.author?.roles?.[0] === "admin";
    } else if (name === "onebot.group.owner") {
      return session.author?.roles?.[0] === "owner";
    }
    return super.checkPermission(name, session);
  }
};
((OneBotBot2) => {
  OneBotBot2.BaseConfig = import_koishi8.Schema.object({
    selfId: import_koishi8.Schema.string().description("机器人的账号。").required(),
    token: import_koishi8.Schema.string().role("secret").description("发送信息时用于验证的字段，应与 OneBot 配置文件中的 `access_token` 保持一致。"),
    protocol: process.env.KOISHI_ENV === "browser" ? import_koishi8.Schema.const("ws").default("ws") : import_koishi8.Schema.union(["http", "ws", "ws-reverse"]).description("选择要使用的协议。").default("ws-reverse")
  });
  OneBotBot2.Config = import_koishi8.Schema.intersect([
    OneBotBot2.BaseConfig,
    import_koishi8.Schema.union([
      HttpServer.Options,
      WsClient.Options,
      WsServer.Options
    ]),
    import_koishi8.Schema.object({
      advanced: BaseBot2.AdvancedConfig
    })
  ]);
})(OneBotBot || (OneBotBot = {}));

// src/index.ts
var src_default = OneBotBot;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseBot,
  CQCode,
  HttpServer,
  OneBot,
  OneBotBot,
  OneBotMessageEncoder,
  PRIVATE_PFX,
  QQGuildBot,
  WsClient,
  WsServer,
  accept
});
