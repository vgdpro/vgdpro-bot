import { Context, Schema, Tables } from 'koishi'

export const name = 'cardsearch'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const koishi = require("koishi");

const { readFileSync, writeFileSync } = require('fs');

const search_none = '未找到符合条件的卡片';

const numbers_string = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const cards_json = JSON.parse(readFileSync('./external/cards.json', 'utf8'));

const setcard_json = JSON.parse(readFileSync('./external/setcard.json', 'utf8'));

const strings_json = JSON.parse(readFileSync('./external/strings.json', 'utf8'));

const message = strings_json.explain

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
  ctx.command("rc").action(({session})=>{
    let random_code = random();
    let text = result_message(random_code);
    let url = result_message(random_code, true);
    session.send((0, koishi.h)('message', text, (0, koishi.h)('image', { url: url })));
  })
  ctx.command("vgpro <str>").action(({session}, str: string)=>{
    if (!str) {
      session.send((0, koishi.h)('message', message[0]));
    }
    else if (str === '官网') {
      session.send((0, koishi.h)('message', 'VGPro官网制作中，尽情期待'));
    }
    else if (str === '用户群') {
      session.send((0, koishi.h)('message', 'VGPro用户群群号：655640394，如果遇到bug可以加群反馈'));
    }
    else if (str === '开发群') {
      session.send((0, koishi.h)('message', '欢迎加入VGPro开发群群号：721095458，VGPro项目也需要你的一份力量'));
    }
    else if (str === '下载') {
      session.send((0, koishi.h)('message', 'VGPro游戏制作中，尽情期待'));
    }
    else if (str === '作者频道') {
      session.send((0, koishi.h)('message', 'VGPro项目主创：今晚有宵夜吗，你可以在Bilibili关注得到更多关于VGPro的消息'));
    }
  })
  ctx.command("关于").action(({session})=>{
    session.send((0, koishi.h)('message', message[1]));
  })
  ctx.command("使用说明").action(({session})=>{
    session.send((0, koishi.h)('message', message[3]));
 })
}

function random() {
  return Math.floor(Math.random() * (cards_json.length - 1));
}

function read_json_by_id(search_card: string) {
  for (let i = 0; i< cards_json.length; i++) {
    if (cards_json[i].card_id == search_card){ return [i]; }
  }
  return [];
}

function read_json_by_name(search_card: string) {
  let include_result: number[] = [];
  let search_result_n: number[] = [];
  let search_result: number[] = [];
  for (let i = 0; i< cards_json.length; i++) {
    if (cards_json[i].card_name == search_card){ return [i]; }
    if (cards_json[i].card_name.includes(search_card)) {
      if (include_result.indexOf(i) == -1) {
        include_result.push(i);
      }
    }
    else {
      let a = 0;
      for (let search_character of Array.from( search_card )) {
        if (cards_json[i].card_name.includes(search_character)) { a++; }
      }
      if (a > 0 && a > (Array.from(cards_json[i].card_name).length / 2)) {
        search_result_n.push(a);
        search_result.push(i);
      }
    }
  }
  if (include_result.length > 0) {
    include_result.sort((a, b) =>{
      return cards_json[a].card_name.length - cards_json[b].card_name.length
    })
    return include_result;
  }
  if (search_result.length > 0) {
    let a = 0;
    let result = -1;
    for (let i = 0; i < search_result.length; i++) {
      let num1 = search_result_n[i];
      let num2 = search_result[i];
      if (a < num1) {
        a = num1;
        result = num2;
      }
    }
    if (result > -1) return [result];
  }
  return [];
}

function result_card(group: number[], card: string, url: boolean = false) {
  if (group.length > 0) {
    return result_message(group[0], url);
  }
  return search_none;
}

function result_message(i: number, url: boolean = false) {
  let table=[
    cards_json[i].card_name,
    cards_json[i].card_id,
    cards_json[i].card_country,
    cards_json[i].card_bloc,
    cards_json[i].card_type,
    cards_json[i].card_setcard,
    cards_json[i].card_level,
    cards_json[i].card_skill,
    cards_json[i].card_trigger,
    cards_json[i].card_atk,
    cards_json[i].card_def,
    cards_json[i].card_critical_strike,
    cards_json[i].card_text
  ];
  if (url) { return 'https://gitee.com/jwyxym/vgdpro-pics/raw/main/' + table[1] + '.jpg'; }
  let example=[
    strings_json.text.card_name,
    strings_json.text.card_id,
    strings_json.text.card_country,
    strings_json.text.card_bloc,
    strings_json.text.card_type,
    strings_json.text.card_setcard,
    strings_json.text.card_level,
    strings_json.text.card_skill,
    strings_json.text.card_trigger,
    strings_json.text.card_atk,
    strings_json.text.card_def,
    strings_json.text.card_critical_strike,
    strings_json.text.card_text,
    strings_json.text.card_defender
  ]
  let str = '找到卡片';
  let sn: number;
  for (let ct = 0; ct < table.length; ct++) {
    if (ct == 2) {
      if (table[ct][0] != '-') {
        str += '\n';
        str += example[ct];
        str += '\u00A0';
        let g = get_country(table[ct], strings_json.country);
        str += g[0];
        sn = Number(g[1]);
      }
    }
    else if (ct == 3) {
      if (Number(sn) > -1 && strings_json.bloc[sn].length > 0) {
        str += get([table[ct]], example[ct], strings_json.bloc[sn]);
      }
    }
    else if (ct == 4) {
      if (table[ct].indexOf('2') > -1) {
        if (table[ct].length > 1) { str += get(table[ct], example[ct], strings_json.type); }
        else {
          str += get(table[ct], example[ct], strings_json.type);
          str += '\u00A0';
          str += '|';
          str += '\u00A0';
          str += strings_json.type[3].name;
        }
      }
      else if (table[ct].indexOf('4') > -1) {
        let type_table = table[ct].filter(a => a != '4')
        if (type_table.length > 0) { str += get(type_table, example[ct], strings_json.type); }
        else { str += get(table[ct], example[ct], strings_json.type); }
      }
      else { str += get(table[ct], example[ct], strings_json.type); }
    }
    else if (ct == 5) {
      str += get_setcard(table[ct], example[ct]);
    }
    else if (ct == 7) {
      str += get(table[ct], example[ct], strings_json.skill);
      if (cards_json[i].card_defender == 'defender') {
        if (Array.from(get(table[ct], example[ct], strings_json.skill)).length > 1) {
          str += '\u00A0';
          str += '|';
          str += '\u00A0';
        } else {
          str += '\n';
          str += example[ct];
          str += '\u00A0';
          str += example[13]
        }
      }
    }
    else if (ct == 8) {
      str += get(table[ct], example[ct], strings_json.trigger);
    }
    else if (ct == 9 || ct == 10 || ct == 11) {
      if (table[ct] < 0) { continue; }
      if (table[4].indexOf('1') > -1) {
        str += '\n';
        str += example[ct];
        str += '\u00A0';
        str += '\u00A0';
        str += table[ct];
      }
    }
    else {
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
  for (let i = 0; i< setcard_json.length; i++){
    if (setcard_json[i].id == setcard){ return setcard_json[i].name; }
  }
}

function get_country(table: string[], country) {
  let str = ' '
  let a = 0;
  let sn = '-1';
  for (let i = 0; i < table.length; i++) {
    for (let ct = 0; ct < country.length; ct++) {
      if (table[i] == country[ct].id) {
        if (a > 0) {
          str += '\u00A0';
          str += '|';
          str += '\u00A0';
        }
        str += country[ct].name;
        if (Number(sn) < 0) { sn = country[ct].serial_number}
        a++;
      }
    }
  }
  return [str, sn]
}

function get_setcard(table, example) {
  let str = ' '
  if (table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('1') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('3f')).length > 0) {
    let race = table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('1') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('3f'));
    str += '\n';
    str += example[0];
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
  if (table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal(change_hex_string('3040')) && hex_to_decimal(change_hex_string(a)) < hex_to_decimal(change_hex_string('c06f'))).length > 0) {
    let spell_type = table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal(change_hex_string('3040')) && hex_to_decimal(change_hex_string(a)) < hex_to_decimal(change_hex_string('c06f')));
    str += '\n';
    str += example[1];
    str += '\u00A0';
    str += '\u00A0';
    let a = 0;
    spell_type.forEach(element => {
      if (a > 0) {
        str += '\u00A0';
        str += '|';
        str += '\u00A0';
      }
      str += setcard(element.replace(/^0+/g, ''));
      a++;
    });
  }
  if (table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('70') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('1ff')).length > 0) {
    let name = table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('70') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('1ff'));
    str += '\n';
    str += example[2];
    str += '\u00A0';
    str += '\u00A0';
    let a = 0;
    name.forEach(element => {
      if (a > 0) {
        str += '\u00A0';
        str += '|';
        str += '\u00A0';
      }
      str += setcard(element.replace(/^0+/g, ''));
      a++;
    });
  }
  if (table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('200') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('21f')).length > 0) {
    let skill = table.filter((a) => hex_to_decimal(change_hex_string(a)) >= hex_to_decimal('200') && hex_to_decimal(change_hex_string(a)) < hex_to_decimal('21f'));
    str += '\n';
    str += example[3];
    str += '\u00A0';
    str += '\u00A0';
    let a = 0;
    skill.forEach(element => {
      if (a > 0) {
        str += '\u00A0';
        str += '|';
        str += '\u00A0';
      }
      str += setcard(element.replace(/^0+/g, ''));
      a++;
    });
  }
  return str;
}

function get(table: string[], example_text: string, bloc) {
  let str_1 = ' ';
  let str_2 = ' ';
  if (table[0] == '-') { return ' '; }
  str_1 += '\n';
  str_1 += example_text;
  str_1 += '\u00A0';
  let a = 0;
  for (let i = 0; i < table.length; i++) {
    for (let ct = 0; ct < bloc.length; ct++) {
      if (table[i] == bloc[ct].id) {
        if (a > 0) {
          str_2 += '\u00A0';
          str_2 += '|';
          str_2 += '\u00A0';
        }
        str_2 += bloc[ct].name;
        a++;
      }
    }
  }
  return str_1 + str_2;
}