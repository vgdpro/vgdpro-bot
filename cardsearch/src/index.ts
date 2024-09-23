import { Context, Schema, Tables } from 'koishi'

export const name = 'cardsearch'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const koishi = require("koishi");

const { readFileSync, writeFileSync } = require('fs');

const search_none = '未找到符合条件的卡片';

const numbers_string = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export function apply(ctx: Context) {
  ctx.command("sc <card>")
  .action(({session}, card: string)=>{
    if (!card) { return '请输入卡名或卡号'; }
    let group: number[];
    if (is_number(card)) { group = read_json_by_id(card); } else { group = read_json_by_name(card); }
    let text = result_card(group, card);
    if (text === search_none) { return text; } else {
      let url = result_card(group, card, true);
      session.send((0, koishi.h)('message', text, (0, koishi.h)('image', { url: url })));
    }
  })
}

function read_json_by_id(search_card: string) {
  const json = JSON.parse(readFileSync('./external/cards.json', 'utf8'));
  for (let i = 0; i< json.cards.length; i++) {
    if (json.cards[i].card_id == search_card){ return [i]; }
  }
  return []
}

function read_json_by_name(search_card: string) {
  let search_result = [];
  let except = [];
  const json = JSON.parse(readFileSync('./external/cards.json', 'utf8'));
  for (let i = 0; i< json.cards.length; i++) {
    if (json.cards[i].card_name == search_card){ return [i]; }
    for (let search_character of search_card) {
      if (json.cards[i].card_name.includes(search_character)) {
        if (search_result.indexOf(i) == -1 && except.indexOf(i) == -1) { search_result.push(i); }
      }else{
        if (search_result.indexOf(i) > -1) {
          const indexToRemove = search_result.findIndex(element => element === i);
          search_result.splice(indexToRemove, 1);
          except.push(i);
        }
      }
    }
  }
  let t = [];
  if (search_result.length == 0 && except.length > 0) {
    for (let i of except) {
      for (let search_character of search_card) {
        if (!json.cards[i].card_name.includes(search_character)) {
          t.push(i);
        }
      }
      for (let name_character of json.cards[i].card_name) {
        if (!search_card.includes(name_character)) {
          t.push(i);
        }
      }
    }
    search_result = except.filter((i) => t.filter((element) => element === i).length <= 6);
    if (search_result.length > 0) {
      search_result.sort((a, b) => t.filter((element) => element === a).length - t.filter((element) => element === b).length);
      return [search_result[0]];
    }
    return [];
  }
  return search_result;
}

function result_card(group: number[], card: string, url: boolean = false) {
  if (group.length > 0) {
    if (group.length == 1) { return result_message(group[0], url); }
    else if (group.length > 1) {
      return chk_message(group, card, url);
    }
  }
  return search_none;
}

function chk_message(table: number[], card: string, url: boolean = false) {
  const json = JSON.parse(readFileSync('./external/cards.json', 'utf8'));
  let result_table = []
  result_table = table.filter((i) => json.cards[i].card_name.includes(card));
  if (result_table.length > 0){
    result_table.sort((a, b) => json.cards[a].card_name.length - json.cards[b].card_name.length)
    return result_message(result_table[0], url);
  }
  result_table = table.filter((i) => json.cards[i].card_name.length >= card,length);
  if (result_table.length > 0){
    result_table.sort((a, b) => json.cards[a].card_name.length - json.cards[b].card_name.length)
    return result_message(result_table[0], url);
  }
  return search_none;
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

function is_number(str: string) {
  for (let value of Array.from(str) as string[]) {
    if (numbers_string.indexOf(value) == -1) {
      return false;
    }
  }
  return true
}

function setcard(setcard: string) {
  const json = JSON.parse(readFileSync('./external/setcard.json', 'utf8'));
  for (let i = 0; i< json.setcard.length; i++){
    if (json.setcard[i].id == setcard){ return json.setcard[i].name; }
  }
}