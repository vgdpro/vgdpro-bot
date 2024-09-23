import { Context, Schema } from 'koishi'

export const name = 'random'

export interface Config {
  illegalWords:string[]
}

export const Config: Schema<Config> = Schema.object({
  illegalWords:Schema.array(Schema.string())
})
//export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.command("random <min:integer> <max:integer>")
  .action(({session},min,max)=>{
    let a=check_value(min, max)[0];
    let b=check_value(min, max)[1];
    return random(a, b);
  })
}

function random(min, max) {
  let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}

function check_value(min, max) {
  if (!min) { min = 0;}
  if (!max) { max = 100;}
  if (min > max) { return [min, max] } else { return [max, min] }
}