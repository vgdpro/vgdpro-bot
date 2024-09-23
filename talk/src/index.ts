import { Context, Schema } from 'koishi'

export const name = 'talk'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const koishi = require("koishi");

export function apply(ctx: Context) {
  ctx.command("vgpro")
  .action(({session})=>{
      session.send((0, koishi.h)('message', message[0]));
  })
  ctx.command("关于")
  .action(({session})=>{
      session.send((0, koishi.h)('message', message[1]));
  })
}

const message = [
  'VGPro是一款由VGPro制作组自主研发的一款全新开放世界打牌游戏，游戏发生在一个被称作「卡片战斗先导者」的幻想牌桌，在这里，被命运选中的人将被授予「命运者卡片」，获得挑战命运的机会。你将扮演被「命运者卡片」选中的其中一人，以先导者对战，争夺改变命运的力量——同时，逐步发掘「命运大战」的真相。',
  '你好，我是VGProject官方机器人，你可以使用/sc命令搜索卡片，或使用/rc命令随机抽出卡池中的一张卡。'
]