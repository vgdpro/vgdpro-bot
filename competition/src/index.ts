import { select } from '@satorijs/element/jsx-runtime';
import { console } from 'inspector';
import { Context, Schema } from 'koishi'
import internal from 'stream';

export const name = 'competition'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const koishi = require("koishi");

const { readFileSync, writeFileSync } = require('fs');

const fs = require('fs-extra');

const del_time = 1000 * 60 * 60;

export function apply(ctx: Context) {
  ctx.command("cp")
  .action(({session}, parameter: string, competition: string, player: string, time: string)=>{
    let filePath = './external/competition/competition_list/competition' + competition + '.json';
    if (!parameter) { return }
    if (parameter == 'start') {
      if (!exist(filePath)) {
        let mode = player;
        if (!mode || (mode != 'e' && mode != 's')) { return '请输入参数3！' + '&lt;' + '赛制' + '&gt;' + '\n' + '\u00A0' + '\u00A0' + 'e为淘汰赛' + '\u00A0' + 's为瑞士轮'; }
        if (!time) { time = '24'; } else if (Number(time) > 72) { return '时长最多为72小时'; } else if (Number(time) < 1) { return '时长最少为1小时'; }
        writeFile(filePath, competition, ctx, Number(time), mode)
        session.send((0, koishi.h)('message', '已创建比赛:' + '\u00A0' + competition + '\n' + '\u00A0' + '\u00A0' + '注:比赛会在' + time + '小时后删除'));
      } else {
        session.send((0, koishi.h)('message', '比赛已存在！'));
      }
    }
    else if (parameter == 'end') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      unlink(filePath, competition);
      session.send((0, koishi.h)('message', '比赛已结束！'));
    }
    else if (parameter == 'add') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      if (getjson(filePath, 'count')[0] > 0) { return '比赛已开起，不可添加选手'; }
      if (check_player(filePath, player)) { return '选手已存在'; }
      let json = {player};
      let input = addjson(filePath, json);
      writeFileSync(filePath, input);
      return '已添加选手:' + '\u00A0' + player;
    }
    else if (parameter == 'del') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      if (getjson(filePath, 'count')[0] > 0) { return '比赛已开起，不可删除选手'; }
      if (!check_player(filePath, player)) { return '选手不存在'; }
      let input = deljson(filePath, getjson(filePath, 'players').findIndex(item => item == player));
      writeFileSync(filePath, input);
      return '已删除选手:' + '\u00A0' + player;
    }
    else if (parameter == 'newTurn') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      return distribute_opponent(filePath, 'new');
    }
    else if (parameter == 'reTurn') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      let json = JSON.parse(readFileSync(filePath, 'utf8'));
      if (json.count[0] == 0) { return '请开启第一轮比赛！'; }
      if (json.mode[0] == 'e') {
        let remove_g = [];
        for (let i = 0; i < json.out.length; i++) {
          let ct = getjson(filePath, 'players').findIndex(item => item == json.out[i]);
          if (json.opponent[ct].length == json.count[0]) {
            remove_g.push(json.out[i]);
          }
        }
        for (let i = 0; i < remove_g.length; i++) {
          let ct = json.out.findIndex(item => item == remove_g[i]);
          json.out.splice(ct, 1);
        }
      }
      for (let i = 0; i < json.players.length; i++) {
        for (let a = json.opponent[i].length; a >= json.count[0]; a--) {
          json.opponent[i].splice(a - 1, 1)
        }
        for (let a = json.core[i].length; a >= json.count[0]; a--) {
          json.core[i].splice(a - 1, 1)
        }
        json.wdl[i].win = json.core[i].filter(item => item == 3).length;
        json.wdl[i].draw = json.core[i].filter(item => item == 1).length;
        json.wdl[i].lose = json.core[i].filter(item => item == 0).length;
      }
      writeFileSync(filePath, JSON.stringify(json));
      return distribute_opponent(filePath, 're');
    }
    else if (parameter == 'win' || parameter == 'draw' || parameter == 'lose') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      if (!check_player(filePath, player)) { return '选手不存在'; }
      return add_score(player, filePath, parameter);
    }
    else if (parameter == 'modeChange') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      let json = JSON.parse(readFileSync(filePath, 'utf8'));
      if (json.count[0] == 0) {
        if (json.mode[0] == 's') {
          json.mode[0] = 'e';
        } else {
          json.mode[0] = 's';
        }
      } else {
        if (json.mode[0] == 'e') {
          return '淘汰赛在比赛开始后不可改为瑞士轮！'
        }
        else if (!player) {
          return '比赛已开始进行，请输入出轮人数！';
        }
        else {
          let players = getjson(filePath, 'players');
          let core = getjson(filePath, 'core');
          let wdl = getjson(filePath, 'wdl');
          let turn_count = getjson(filePath, 'count')[0];
          let opponent = getjson(filePath, 'opponent');
          if (players.length < player) { return '出轮人数过多！'; }
          let arrays = relist(players, wdl, core, opponent, turn_count);
          players = arrays[0];
          wdl = arrays[1];
          core = arrays[2];
          for (let i = Number(player); i < players.length; i++) {
            if (getjson(filePath, 'out').findIndex(item => item == players[i]) == -1) { json.out.push(players[i]); }
          }
        }
        json.mode[0] = 'e';
      }
      writeFileSync(filePath, JSON.stringify(json));
      return '赛制已更改';
    }
    else if (parameter == 'reSubmitScore') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      let json = JSON.parse(readFileSync(filePath, 'utf8'));
      let score = time;
      let count = getjson(filePath, 'players').findIndex(item => item == player);
      let turn_count = getjson(filePath, 'count')[0];
      let opponent = json.opponent[count][turn_count - 1]
      if (!opponent || opponent == 'none') { return '该玩家在本轮比赛中没有对手'; }
      if (!score) {
        return '请输入比分！';
      }
      else if (score == 'win') {
        let ct = getjson(filePath, 'out').findIndex(item => item == player)
        if ( ct > -1 && getjson(filePath, 'mode')[0] == 'e') { json.out.splice(ct, 1); }
        if (getjson(filePath, 'out').findIndex(item => item == opponent) == -1 && getjson(filePath, 'mode')[0] == 'e') {
          json.out.push(opponent);
        }
        json.core[count].splice(turn_count - 1, 1);
        json.core[getjson(filePath, 'players').findIndex(item => item == opponent)].splice(turn_count - 1, 1);
        for (let i of [count, getjson(filePath, 'players').findIndex(item => item == opponent)]) {
          json.wdl[i].win = json.core[i].filter(item => item == 3).length;
          json.wdl[i].draw = json.core[i].filter(item => item == 1).length;
          json.wdl[i].lose = json.core[i].filter(item => item == 0).length;
        }
        writeFileSync(filePath, JSON.stringify(json));
        add_score(player, filePath, 'win');
        add_score(opponent, filePath, 'lose');
      }
      else if (score == 'draw') {
        for (let p of [player, opponent]) {
          let ct = getjson(filePath, 'out').findIndex(item => item == p)
          if ( ct > -1 && getjson(filePath, 'mode')[0] == 'e') { json.out.splice(ct, 1); }
        } 
        json.core[count].splice(turn_count - 1, 1);
        json.core[getjson(filePath, 'players').findIndex(item => item == opponent)].splice(turn_count - 1, 1);
        for (let i of [count, getjson(filePath, 'players').findIndex(item => item == opponent)]) {
          json.wdl[i].win = json.core[i].filter(item => item == 3).length;
          json.wdl[i].draw = json.core[i].filter(item => item == 1).length;
          json.wdl[i].lose = json.core[i].filter(item => item == 0).length;
        }
        writeFileSync(filePath, JSON.stringify(json));
        add_score(player, filePath, 'draw');
        add_score(opponent, filePath, 'draw');
      }
      else if (score == 'lose') {
        let ct = getjson(filePath, 'out').findIndex(item => item == opponent)
        if ( ct > -1 && getjson(filePath, 'mode')[0] == 'e') { json.out.splice(ct, 1); }
        if (getjson(filePath, 'out').findIndex(item => item == player) == -1 && getjson(filePath, 'mode')[0] == 'e') {
          json.out.push(player);
        }
        json.core[count].splice(turn_count - 1, 1);
        json.core[getjson(filePath, 'players').findIndex(item => item == opponent)].splice(turn_count - 1, 1);
        for (let i of [count, getjson(filePath, 'players').findIndex(item => item == opponent)]) {
          json.wdl[i].win = json.core[i].filter(item => item == 3).length;
          json.wdl[i].draw = json.core[i].filter(item => item == 1).length;
          json.wdl[i].lose = json.core[i].filter(item => item == 0).length;
        }
        writeFileSync(filePath, JSON.stringify(json));
        add_score(player, filePath, 'lose');
        add_score(opponent, filePath, 'win');
      }
      else {
        if (getjson(filePath, 'mode')[0] == 'e')  {
          return '淘汰赛中不可采用此方法更改比分';
        }
        let core = [];
        let core_per_turn = [];
        let str = ''
        for (let i of Array.from(score)) {
          if (i == '-') {
            core_per_turn.push(Number(str));
            str = '';
          } else {
            str += i;
          }
        }
        if (core_per_turn.length < turn_count) { return '比分数量少于比赛轮数';}
        core_per_turn.push(Number(str));
        core[0] = core_per_turn.filter(i => i == 3).length
        core[1] = core_per_turn.filter(i => i == 1).length
        core[2] = core_per_turn.filter(i => i == 0).length
        if (core[0] + core[1] + core[2] != getjson(filePath, 'count')[0]) { return '比分存在冲突！'; }
        let players = getjson(filePath, 'players');
        let i = players.findIndex(item => item == player);
        for (let a = 0; a < core_per_turn.length; a++) {
          if (json.core[i][a] != core_per_turn[a]) {
            let opponent = json.opponent[i][a];
            if (!opponent) { return '比分冲突！'; }
            let i_op = players.findIndex(item => item == opponent);
            if (getjson(filePath, 'out').findIndex(item => item == opponent) == -1) { json.out.push(opponent); }
            if (core_per_turn[a] == 1) {
              json.core[i_op][a] = 1;
            } else {
              json.core[i_op][a] = 3 - core_per_turn[a];
            }
            json.wdl[i_op].win = json.core[i_op].filter(item => item == 3).length;
            json.wdl[i_op].draw = json.core[i_op].filter(item => item == 1).length;
            json.wdl[i_op].lose = json.core[i_op].filter(item => item == 0).length;
          }
        }
        json.wdl[i].win = core[0];
        json.wdl[i].draw = core[1];
        json.wdl[i].lose = core[2];
        json.core[i] = core_per_turn;
        writeFileSync(filePath, JSON.stringify(json));
        return '比分已更改:' + '\u00A0' + core[0] + '-' + core[1] + '-' + core[2];
      }
      return '比分已更改:' + '\u00A0' + JSON.parse(readFileSync(filePath, 'utf8')).wdl[count].win + '-' + JSON.parse(readFileSync(filePath, 'utf8')).wdl[count].draw + '-' + JSON.parse(readFileSync(filePath, 'utf8')).wdl[count].lose;
    }
    else if (parameter == 'check') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      if (!check_player(filePath, player)) { return '选手不存在'; }
      let players = getjson(filePath, 'players');
      let count = players.findIndex(i => i == player);
      let core = getjson(filePath, 'core');
      let wdl = getjson(filePath, 'wdl');
      let opponent = getjson(filePath, 'opponent');
      let str = player + '：\n\u00A0\u00A0' + wdl[count][0] + '-' + wdl[count][1] + '-' + wdl[count][2] + '\n\u00A0\u00A0总分：' + get_all_core(core, count).toString() + '\n\u00A0\u00A0累进分：' + get_accumulate_core(core, count).toString() + '\n\u00A0\u00A0对手：';
      for (let i = 0; i < opponent[count].length; i++) {
        str += '\n\u00A0\u00A0\u00A0\u00A0';
        str += '第' + (i + 1).toString() + '轮：';
        str += opponent[count][i];
      }
      return str;
    }
    else if (parameter == 'list') {
      if (!exist(filePath)) { return '比赛不存在！'; }
      let array = getjson(filePath, 'players');
      let wdl = getjson(filePath, 'wdl');
      let core = getjson(filePath, 'core');
      let turn_count = getjson(filePath, 'count')[0];
      let opponent = getjson(filePath, 'opponent');
      let mode = ['瑞士轮', '淘汰赛'];
      let mode_count = 0;
      if (getjson(filePath, 'mode')[0] == 'e') { mode_count++; }
      let str = mode[mode_count] + '\u00A0\u00A0第' + turn_count.toString() +'轮' + ':\n' ;
      let a = 1;
      if (turn_count == 0) {
        array.sort((a, b) => a.localeCompare(b));
      } else {
        let arrays = relist(array, wdl, core, opponent, turn_count);
        array = arrays[0];
        wdl = arrays[1];
        core = arrays[2];
      }
      for (let i = 0; i < array.length; i++) {
        str += a.toString() + ':' + '\u00A0';
        str += array[i];
        if (turn_count > 0) {
          str += '\u00A0\u00A0';
          str += wdl[i][0];
          str += '-';
          str += wdl[i][1];
          str += '-';
          str += wdl[i][2];
          str += '\u00A0\u00A0';
          str += get_all_core(core, i);
        }
        str += '\n';
        a++;
      }
      return str;
    }
    else if (parameter == 'help') {
      if (!competition) {
        let str = 'VGPro官方机器人比赛模式使用中，接下来是指令介绍：';
        str += '\n\u00A0\u00A01：/cp help [比赛名称] (获得指令帮助|输入比赛名称得到本次比赛瑞士轮轮数推荐)';
        str += '\n\u00A0\u00A02：/cp start &lt;比赛名称&gt; &lt;比赛模式&gt; [比赛保存时间] (创建一个比赛，模式为“淘汰赛”或“瑞士轮”，即“e”和“s”)';
        str += '\n\u00A0\u00A03：/cp end &lt;比赛名称&gt; (结束一个比赛)';
        str += '\n\u00A0\u00A04：/cp add &lt;比赛名称&gt; &lt;选手名称&gt; (为比赛添加一名选手)';
        str += '\n\u00A0\u00A05：/cp del &lt;比赛名称&gt; &lt;选手名称&gt; (为比赛删除一名选手)';
        str += '\n\u00A0\u00A06：/cp newTurn &lt;比赛名称&gt; (开始新的一轮比赛)';
        str += '\n\u00A0\u00A07：/cp reTurn &lt;比赛名称&gt; (重新开始这一轮比赛)';
        str += '\n\u00A0\u00A08：/cp &lt;win|draw|lose&gt; &lt;比赛名称&gt; &lt;选手名称&gt; (提交比分：胜|平|负)';
        str += '\n\u00A0\u00A09：/cp reSubmitScore &lt;比赛名称&gt; &lt;选手名称&gt; &lt;win|draw|lose|比分&gt; (重新提交一名选手的比分，win|draw|lose为当前此轮比分，瑞士轮可改全局比分，如“胜-胜-负-平”即填“3-3-0-1”)';
        str += '\n\u00A0\u00A010：/cp check &lt;比赛名称&gt; &lt;选手名称&gt; (查询选手比分)';
        str += '\n\u00A0\u00A011：/cp list &lt;比赛名称&gt; (显示比赛成员列表)';
        str += '\n\u00A0\u00A012：/cp modeChange &lt;比赛名称&gt; [出轮人数] (更改比赛模式，主要用于瑞士轮出轮后改为淘汰赛)';
        return str;
      } else {
        if (!exist(filePath)) { return '比赛不存在！'; }
        if (getjson(filePath, 'mode')[0] == 's') {
          let turn_count = 0;
          let player_count = 4;
          let players_count = getjson(filePath, 'players').length;
          let n = 2;
          if (players_count < 8) { return '人数过少，推荐使用淘汰赛制'; }
          while (n < players_count) {
            n * 2;
            turn_count++;
          }
          while (player_count * player_count < players_count) {
            player_count * 2;
          }
          return '当前比赛共' + players_count + '人，推荐' + turn_count + '轮出' + player_count + '强';
        }
      }
    }
  })
}

function addjson(filePath: string, json: {}) {
  let source = JSON.parse(readFileSync(filePath, 'utf8'));
  source.players.push(json);
  source.core.push([]);
  source.wdl.push({win: 0, draw: 0,lose: 0});
  source.opponent.push([]);
  return JSON.stringify(source);
}

function deljson(filePath: string, json) {
  let source = JSON.parse(readFileSync(filePath, 'utf8'));
  let indexToRemove = 0;
  if (typeof json === 'number') {
    indexToRemove = json;
  } else {
    indexToRemove = source.players.findIndex(item => item == json);
  }
  source.players.splice(indexToRemove, 1);
  source.core.splice(indexToRemove, 1);
  source.wdl.splice(indexToRemove, 1);
  source.opponent.splice(indexToRemove, 1);
  return JSON.stringify(source);
}

function check_player(filePath: string, parameter: string) {
  let json = getjson(filePath, 'players');
  if (!parameter) { return false; }
  return json.some(element => element == parameter);
}

function exist(filePath: string) {
  return fs.existsSync(filePath);
}

function writeFile(filePath: string, parameter: string, ctx: Context, time: number, mode: string) {
  fs.writeFile(filePath, '{"players": [],"core": [],"wdl":[],"opponent":[],"count":[0],"mode":["' + mode + '"],"out":[]}').then(() => {
    console.log('competition' + parameter + ' has been saved!');
    ctx.setTimeout(async () => {
      unlink(filePath, parameter)
    }, del_time * time)
  })
}

function unlink(filePath: string, parameter: string) {
  fs.stat(filePath, (err, stats) => {
    if (stats) {
      fs.unlink(filePath, (err) => {
        if (err) {
          return console.error(`Error deleting the file: ${err.code}: ${err.message}`);
        }
        console.log('competition' + parameter + ' has been deleted successfully.');
      });
    }
    else {
      console.log('competition' + parameter + ' not found');
    }
  });
}

function getjson(filePath: string, parameter: string) {
  let json = JSON.parse(readFileSync(filePath, 'utf8'));
  let array = [];
  if (parameter == 'players') {
    for (let i = 0; i < json.players.length; i++) {
      array.push(json.players[i].player);
    }
  }
  else if (parameter == 'opponent') {
    for (let i = 0; i < json.opponent.length; i++) {
      array.push(json.opponent[i]);
    }
  }
  else if (parameter == 'out') {
    for (let i = 0; i < json.out.length; i++) {
      array.push(json.out[i]);
    }
  }
  else if (parameter == 'core') {
    for (let i = 0; i < json.core.length; i++) {
      array.push(json.core[i]);
    }
  }
  else if (parameter == 'wdl') {
    for (let i = 0; i < json.wdl.length; i++) {
      array[i] = [];
      array[i].push(json.wdl[i].win);
      array[i].push(json.wdl[i].draw);
      array[i].push(json.wdl[i].lose);
    }
  }
  else if (parameter == 'count') {
    return json.count;
  }
  else if (parameter == 'mode') {
    return json.mode;
  }
  return array;
}

function getcount(filePath: string) {
  let json = JSON.parse(readFileSync(filePath, 'utf8'));
  let a = 0;
  for (let i = 0; i < json.opponent.length; i++) {
    if (json.opponent[i].length > a) { a = json.opponent[i].length; }
  }
  return a;
}

function distribute_opponent(filePath: string, parameter: string) {
  let json = JSON.parse(readFileSync(filePath, 'utf8'));
  let wdl = getjson(filePath, 'wdl');
  let players = getjson(filePath, 'players');
  let core = getjson(filePath, 'core');
  let count = getjson(filePath, 'count')[0];
  if (parameter == 'new' && check_count(wdl, count, players, getjson(filePath, 'out'), 'boolean') == 'false') {
    return check_count(wdl, count, players, getjson(filePath, 'out'), 'players')
  }
  let remove_g = [];
  let turn_count = count;
  if (parameter == 'new') { turn_count++; }
  let str = '第' + turn_count.toString() + '轮\n';
  let table = [];
  let bye = [];
  if (getjson(filePath, 'mode')[0] == 'e') {
    for (let i = 0; i < players.length; i++) {
      if (getjson(filePath, 'out').findIndex(item => item == players[i]) > -1) {
        remove_g.push(players[i]);
      }
    }
    for (let i = 0; i < remove_g.length; i++) {
      let ct = players.findIndex(item => item == remove_g[i]);
      players.splice(ct, 1);
      core.splice(ct, 1);
    }
    table = players.sort((a,b) => Math.floor(Math.random() * 3) - 2);
    if (table.length % 2 > 0) {
      bye.push(table[table.length - 1]);
      table.splice(table.length - 1, 1);
    }
  }
  else
  {
    let a = 0;
    for (let i = 0; i < players.length; i++) {
      if (get_accumulate_core(core, i) > a) { a = get_accumulate_core(core, i); }
    }
    while (a >= 0) {
      let t = [];
      /*---------------进行一个分组匹配---------------*/
      for (let i = 0; i < players.length; i++) {
        if (get_accumulate_core(core, i) == a) {
          t.push(players[i]);
        }
      }
      if (t.length > 0) {
        if (bye.length == 1) { t.push(bye[0]); }
        if (t.length % 2 > 0) {
          let ct = 0;
          do {
            ct = Math.floor(Math.random() * t.length);
          }
          while (bye.findIndex(item => item == t[ct]) > -1) {
            ct = Math.floor(Math.random() * t.length);
          }
          bye = [t[ct]];
          t.splice(ct, 1)
        } else {
          bye = [];
        }
        t.sort((a,b) => Math.floor(Math.random() * 3) - 2);
        for (let i = 0; i < t.length; i++) {
          table.push(t[i]);
        }
      }
      /*-----------------------------------------------*/
      a--;
    }
  }
  if (table.length > 0) {
    str += return_str(table, json, filePath);
  }
  if (bye.length == 1){
    str += '\n';
    str += bye[0];
    str += '\u00A0';
    str += '轮空';
    let count = players.findIndex(item => item == bye[0]);
    json.opponent[count].push('none');
    json.wdl[count].win += 1;
    json.core[count].push(3);
    writeFileSync(filePath, JSON.stringify(json));
  }
  json.count[0] = getcount(filePath);
  writeFileSync(filePath, JSON.stringify(json));
  return str;
}

function return_str(array: string[], json, filePath: string) {
  let tab = 0;
  let a = 0;
  let str = '';
  for (let i = 0; i < array.length; i++) {
    if (a > 0) {
      if (a % 2 > 0) {
        str += '\u00A0';
        tab++;
        str += '第' + tab.toString() + '桌';
        str += '\u00A0';
        let t = getjson(filePath, 'players');
        let count = t.findIndex(item => item == array[i]);
        json.opponent[count].push(array[i - 1]);
        count = t.findIndex(item => item == array[i - 1]);
        json.opponent[count].push(array[i]);
        writeFileSync(filePath, JSON.stringify(json));
      }
      else {
        str += '\n';
      }
    }
    str += array[i];
    a++;
  }
  return str;
}

function get_all_core(array: string[], count: number) {
  let a = 0;
  for(let i = 0; i < array[count].length; i++) {
    a += Number(array[count][i]);
  }
  return a;
}

function get_next_core(array: string[], count: number, opponent: string[], players: string[]) {
  let a = 0;
  for (let op of opponent[count]) {
    let i = players.findIndex(item => item == op)
    a += get_all_core(array, i);
  }
  return a;
}

function get_accumulate_core(array: string[], count: number) {
  let a = 0;
  for(let i = 0; i < array[count].length; i++) {
    a *= 2;
    a += Number(array[count][i]);
  }
  return a;
}

function check_count(array: string[], turn_count: number, players: string[], t: string[], type: string) {
  if (type == 'boolean') {
    for (let i = 0; i < array.length; i++) {
      let ct = 0;
      for (let count = 0; count < array[i].length; count++) {
        ct += Number(array[i][count]);
      }
      if (ct < turn_count && t.findIndex(item => item == players[i]) == -1) { return 'false'; }
    }
    return 'true';
  }
  let str = '还有选手的比分未填写，请先填写比分:';
  for (let i = 0; i < array.length; i++) {
    let ct = 0;
    for (let count = 0; count < array[i].length; count++) {
      ct += Number(array[i][count]);
    }
    if (ct < turn_count && t.findIndex(item => item == players[i]) == -1) { str += '\n\u00A0\u00A0'; str += players[i]; }
  }
  return str;
}

function add_score(player: string, filePath: string, parameter: string) {
  let json = JSON.parse(readFileSync(filePath, 'utf8'));
  let t = getjson(filePath, 'players');
  let count = t.findIndex(item => item == player);
  let turn_count = getjson(filePath, 'count')[0];
  let opponent = json.opponent[count][turn_count - 1]
  if ((json.wdl[count].win + json.wdl[count].draw + json.wdl[count].lose) >= turn_count) {
    return '比分已存在或冲突,当前比分:\u00A0\u00A0' + json.wdl[count].win.toString() + '-' + json.wdl[count].draw.toString() + '-' + json.wdl[count].lose.toString();
  }
  let str = '比分已添加,当前比分:';
  if (parameter == 'win') {
    json.core[count].push(3);
    json.wdl[count].win += 1;
    str += '\n\u00A0\u00A0' + player +':\u00A0\u00A0' + json.wdl[count].win.toString() + '-' + json.wdl[count].draw.toString() + '-' + json.wdl[count].lose.toString();
    if (opponent && opponent != 'none') {
      let count_op = t.findIndex(item => item == opponent);
      json.core[count_op].push(0);
      json.wdl[count_op].lose += 1;
      if (getjson(filePath, 'out').findIndex(item => item == opponent) == -1) { json.out.push(opponent); }
      str += '\n\u00A0\u00A0' + opponent +':\u00A0\u00A0' + json.wdl[count_op].win.toString() + '-' + json.wdl[count_op].draw.toString() + '-' + json.wdl[count_op].lose.toString();
    }
    writeFileSync(filePath, JSON.stringify(json));
  }
  else if (parameter == 'lose') {
    json.core[count].push(0);
    json.wdl[count].lose += 1;
    str += '\n\u00A0\u00A0' + player +':\u00A0\u00A0' + json.wdl[count].win.toString() + '-' + json.wdl[count].draw.toString() + '-' + json.wdl[count].lose.toString();
    if (opponent && opponent != 'none') {
      let count_op = t.findIndex(item => item == opponent);
      json.core[count_op].push(3);
      json.wdl[count_op].win += 1;
      if (getjson(filePath, 'out').findIndex(item => item == opponent) == -1) { json.out.push(opponent); }
      str += '\n\u00A0\u00A0' + opponent +':\u00A0\u00A0' + json.wdl[count_op].win.toString() + '-' + json.wdl[count_op].draw.toString() + '-' + json.wdl[count_op].lose.toString();
    }
    writeFileSync(filePath, JSON.stringify(json));
  }
  else if (parameter == 'draw') {
    json.core[count].push(1);
    json.wdl[count].draw += 1;
    str += '\n\u00A0\u00A0' + player +':\u00A0\u00A0' + json.wdl[count].win.toString() + '-' + json.wdl[count].draw.toString() + '-' + json.wdl[count].lose.toString();
    if (opponent && opponent != 'none') {
      let count_op = t.findIndex(item => item == opponent);
      json.core[count_op].push(1);
      json.wdl[count_op].draw += 1;
      str += '\n\u00A0\u00A0' + opponent +':\u00A0\u00A0' + json.wdl[count_op].win.toString() + '-' + json.wdl[count_op].draw.toString() + '-' + json.wdl[count_op].lose.toString();
    }
    writeFileSync(filePath, JSON.stringify(json));
  }
  return str;
}
function relist(players: string[], wdl: string[], core: string[], opponent: string[], turn_count: number) {
  let array_players = [];
  let array_wdl = [];
  let array_core = [];
  let array_players_I = [];
  let array_wdl_I = [];
  let array_core_I = [];
  let array_players_II = [];
  let array_wdl_II = [];
  let array_core_II = [];
  let all = 0;
  let next = 0;
  for (let i = 0; i < players.length; i++) {
    if (get_next_core(core, i, opponent, players) > next) { next = get_next_core(core, i, opponent, players); }
    if (get_all_core(core, i) > all) { all = get_all_core(core, i); }
  }
  let ct = 0;
  for (all; all >= 0; all--) {
    array_players_I[ct] = [];
    array_wdl_I[ct] = [];
    array_core_I[ct] = [];
    for (let i = 0; i < players.length; i++) {
      if (get_all_core(core, i) == all) {
        array_players_I[ct].push(players[i])
        array_wdl_I[ct].push(wdl[i])
        array_core_I[ct].push(core[i])
      }
    }
    ct++;
  }
  for (ct = 0; ct < array_players_I.length; ct++) {
    for (let i_next = next; i_next >= 0; i_next--) {
      if (!array_players_II[ct]) {
        array_players_II[ct] = [];
        array_wdl_II[ct] = [];
        array_core_II[ct] = [];
      }
      let a = 0;
      for (let i = 0; i < array_players_II[ct].length; i++) {
        a += array_players_II[ct][i].length;
      }
      if (a == array_players_I[ct].length) { break; }
      let group_players = [];
      let group_wdl = [];
      let group_core = [];
      for (let i = 0; i < array_players_I[ct].length; i++) {
        let find = players.findIndex(item => item == array_players_I[ct][i])
        if (get_next_core(core, find, opponent, players) == i_next) {
          group_players.push(array_players_I[ct][i])
          group_wdl.push(array_wdl_I[ct][i])
          group_core.push(array_core_I[ct][i])
        }
      }
      if (group_players.length > 0) {
        if (group_players.length > 1) {
          group_players.sort((a,b) => {
            let accumulate_a = get_accumulate_core(core, players.findIndex(item => item == a));
            let accumulate_b = get_accumulate_core(core, players.findIndex(item => item == b));
            if (accumulate_a > accumulate_b) { return 1; }
            if (accumulate_a == accumulate_b) { return 0; }
            if (accumulate_a < accumulate_b) { return -1; }
          });
        }
        array_players_II[ct].push(group_players);
        array_wdl_II[ct].push(group_wdl);
        array_core_II[ct].push(group_core);
      }
    }
  }
  for (ct = 0; ct < array_players_II.length; ct++) {
    for (let i = 0; i < array_players_II[ct].length; i++) {
      for (let i_II = 0; i_II < array_players_II[ct][i].length; i_II++) {
        array_players.push(array_players_II[ct][i][i_II]);
        array_wdl.push(array_wdl_II[ct][i][i_II]);
        array_core.push(array_core_II[ct][i][i_II]);
      }
    }
  }
  return [array_players, array_wdl, array_core]
}