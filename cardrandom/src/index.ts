import { Context, Schema } from 'koishi'

export const name = 'cardrandom'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const koishi = require("koishi");

const { readFileSync, writeFileSync } = require('fs');

const numbers_string = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export function apply(ctx: Context) {
  ctx.command("rc")
  .action(({session})=>{
    let random_code = random();
    let text = result_message(random_code);
    let url = result_message(random_code, true);
    session.send((0, koishi.h)('message', text, (0, koishi.h)('image', { url: url })));
  })
}

function random() {
  const json = JSON.parse(readFileSync('./external/cards.json', 'utf8'));
  let min = 0;
  let max = json.cards.length;
  max--;
  let randomNumber = Math.floor(Math.random() * (max - min)) + min;
  return randomNumber;
}

function result_message(i: number, url: boolean = false) {
  const json = JSON.parse(readFileSync('./external/cards.json', 'utf8'));
  let table=[
    json.cards[i].card_name,
    json.cards[i].card_id,
    json.cards[i].card_country,
    json.cards[i].card_bloc,
    json.cards[i].card_type,
    json.cards[i].card_setcard,
    json.cards[i].card_level,
    json.cards[i].card_skill,
    json.cards[i].card_trigger,
    json.cards[i].card_atk,
    json.cards[i].card_def,
    json.cards[i].card_critical_strike,
    json.cards[i].card_text
  ];
  if (url) { return 'https://gitee.com/jwyxym/vgdpro-pics/raw/main/' + table[1] + '.jpg'; }
  let example=[
    json.head.card_name,
    json.head.card_id,
    json.head.card_country,
    json.head.card_bloc,
    json.head.card_type,
    json.head.card_setcard,
    json.head.card_level,
    json.head.card_skill,
    json.head.card_trigger,
    json.head.card_atk,
    json.head.card_def,
    json.head.card_critical_strike,
    json.head.card_text
  ]
  let str = '找到卡片';
  for (let ct = 0; ct < table.length; ct++) {
    if (ct == 5) {
      if (table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('1') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('3f')).length > 0) {
        let race = table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('1') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('3f'));
        str += '\n';
        str += json.head.card_setcard[0];
        str += '\u00A0';
        str += '\u00A0';
        let a = 0;
        race.forEach(element => {
          if (a > 0) {
            str += '|';
          }
          str += setcard(element.replace(/^0+/g, ''));
          a++;
        });
      }
      if (table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal(change_hex_string('3040')) && hex_to_decimal(change_hex_string(a)) < hex_to_decimal(change_hex_string('c06f'))).length > 0) {
        let spell_type = table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal(change_hex_string('3040')) && hex_to_decimal(change_hex_string(a)) < hex_to_decimal(change_hex_string('c06f')));
        str += '\n';
        str += json.head.card_setcard[1];
        str += '\u00A0';
        str += '\u00A0';
        let a = 0;
        spell_type.forEach(element => {
          if (a > 0) {
            str += '|';
          }
          str += setcard(element.replace(/^0+/g, ''));
          a++;
        });
      }
      if (table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('70') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('1ff')).length > 0) {
        let name = table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('70') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('1ff'));
        str += '\n';
        str += json.head.card_setcard[2];
        str += '\u00A0';
        str += '\u00A0';
        let a = 0;
        name.forEach(element => {
          if (a > 0) {
            str += '|';
          }
          str += setcard(element.replace(/^0+/g, ''));
          a++;
        });
      }
      if (table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('200') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('21f')).length > 0) {
        let skill = table[ct].filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('200') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('21f'));
        str += '\n';
        str += json.head.card_setcard[3];
        str += '\u00A0';
        str += '\u00A0';
        let a = 0;
        skill.forEach(element => {
          if (a > 0) {
            str += '|';
          }
          str += setcard(element.replace(/^0+/g, ''));
          a++;
        });
      }
    } else {
      if (table[ct] === '-') { continue; }
      str += '\n';
      str += example[ct];
      str += '\u00A0';
      str += '\u00A0';
      str += table[ct];
    }
  }
  return str;
}

function hex_to_decimal(str: string) {
  let num = 0;
  let a = Array.from(str).length;
  a--;
  for (let value of Array.from(str)) {
    for (let number = 1; number< numbers.length; number++) {
      if (value === numbers_string[number]) {
        num += (numbers[number] * Math.pow(16, a));
        break;
      }
    }
    a--;
  }
  return num;
}

function change_hex_string(str: string) {
  let i: string[] = Array.from(str) as string[];
  let a = '0';
  for (let ct = 0; ct < i.length; ct++) {
    if (i.length - ct <= 3) { a += (i[ct]); }
  }
  return a.replace(/^0+/g, '');
}

function setcard(setcard: number) {
  const json = JSON.parse(readFileSync('./external/setcard.json', 'utf8'));
  for (let i = 0; i< json.setcard.length; i++){
    if (json.setcard[i].id == setcard){ return json.setcard[i].name; }
  }
}