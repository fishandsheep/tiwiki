UPDATE tournaments SET
  summary_zh = 'Ti2 于 2012 年在美国西雅图举行，Invictus Gaming 在决赛击败卫冕冠军 Natus Vincere，夺得中国战队首座 Ti 冠军。赛事总奖金池为 160 万美元。',
  china_summary = 'Invictus Gaming 夺冠，成为首支赢得 Ti 的中国战队；本届中国战队由此完成从 Ti1 亚军到 Ti2 冠军的突破。'
WHERE id = 'ti2' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti3 于 2013 年在美国西雅图举行，Alliance 在决赛击败 Natus Vincere 夺冠，总奖金池增至 287 万美元。',
  china_summary = 'TongFu 取得殿军，为中国战队本届最佳成绩；中国战队未能延续 Ti2 的冠军表现。'
WHERE id = 'ti3' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti4 于 2014 年在美国西雅图举行，Newbee 在决赛击败 Vici Gaming 夺冠，总奖金池首次突破 1,000 万美元。',
  china_summary = 'Newbee 与 Vici Gaming 会师决赛，中国战队包揽冠亚军；Newbee 为中国赛区赢得第二座 Ti 冠军。'
WHERE id = 'ti4' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti5 于 2015 年在美国西雅图举行，Evil Geniuses 在决赛击败 CDEC Gaming 夺冠，总奖金池达到 1,842 万美元。',
  china_summary = '从预选赛突围的 CDEC Gaming 获得亚军，是中国战队本届最佳成绩。'
WHERE id = 'ti5' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti7 于 2017 年在美国西雅图 KeyArena 举行，Team Liquid 在决赛击败 Newbee 夺冠，总奖金池为 2,478 万美元。',
  china_summary = 'Newbee 获得亚军，为中国战队本届最佳成绩。'
WHERE id = 'ti7' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti9 于 2019 年在上海梅赛德斯-奔驰文化中心举行，OG 在决赛击败 Team Liquid，成为首支连续两届夺得 Ti 冠军的队伍。总奖金池为 3,433 万美元。',
  china_summary = 'PSG.LGD 获得季军，为主场作战的中国战队本届最佳成绩。'
WHERE id = 'ti9' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti10 于 2021 年在罗马尼亚布加勒斯特举行，Team Spirit 在决赛击败 PSG.LGD 夺冠；4,001 万美元总奖金池为历届最高。',
  china_summary = 'PSG.LGD 获得亚军，为中国战队本届最佳成绩。'
WHERE id = 'ti10' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti11 于 2022 年在新加坡举行，Tundra Esports 在决赛击败 Team Secret 夺冠，总奖金池为 1,893 万美元。',
  china_summary = 'Team Aster 获得殿军，为中国战队本届最佳成绩。'
WHERE id = 'ti11' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti12 于 2023 年回到美国西雅图举行，Team Spirit 在决赛击败 Gaimin Gladiators，赢得队史第二座 Ti 冠军。',
  china_summary = 'LGD Gaming 获得季军，为中国战队本届最佳成绩。'
WHERE id = 'ti12' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti13 于 2024 年在丹麦哥本哈根 Royal Arena 举行，Team Liquid 在决赛击败 Gaimin Gladiators 夺冠，总奖金池为 277 万美元。',
  china_summary = 'Xtreme Gaming 取得第 5 名，为中国战队本届最佳成绩。'
WHERE id = 'ti13' AND trim(coalesce(summary_zh, '')) = '';

UPDATE tournaments SET
  summary_zh = 'Ti14 于 2025 年在德国汉堡举行，Team Falcons 在决赛击败 Xtreme Gaming 夺冠，总奖金池为 288 万美元。',
  china_summary = 'Xtreme Gaming 获得亚军，为中国战队本届最佳成绩。'
WHERE id = 'ti14' AND trim(coalesce(summary_zh, '')) = '';
