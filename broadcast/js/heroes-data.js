(() => {
  "use strict";

  /**
   * Lane/position model:
   * - Clash Lane
   * - Mid Lane
   * - Roam
   * - Farm Lane
   * - Jungle
   *
   * `combatClass` preserves the source combat archetype.
   * `role` is the primary broadcast lane.
   * `positions` can contain multiple valid lanes for flexible heroes.
   */
  const heroes = [
  {
    "id": "agudo",
    "name": "Agudo",
    "role": "Jungle",
    "sourceKey": "aguduo",
    "assets": {
      "icon": "assets/heroes/icons/agudo.webp",
      "portrait": "assets/heroes/portraits/agudo.webp"
    },
    "combatClass": "Jungler",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "erin",
    "name": "Erin",
    "role": "Farm Lane",
    "sourceKey": "ailin",
    "assets": {
      "icon": "assets/heroes/icons/erin.webp",
      "portrait": "assets/heroes/portraits/erin.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "arke",
    "name": "Arke",
    "role": "Jungle",
    "sourceKey": "ake",
    "assets": {
      "icon": "assets/heroes/icons/arke.webp",
      "portrait": "assets/heroes/portraits/arke.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "angela",
    "name": "Angela",
    "role": "Mid Lane",
    "sourceKey": "anqila",
    "assets": {
      "icon": "assets/heroes/icons/angela.webp",
      "portrait": "assets/heroes/portraits/angela.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "aoyin",
    "name": "Ao'yin",
    "role": "Farm Lane",
    "sourceKey": "aoyin",
    "assets": {
      "icon": "assets/heroes/icons/aoyin.webp",
      "portrait": "assets/heroes/portraits/aoyin.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "shouyue",
    "name": "Shouyue",
    "role": "Farm Lane",
    "sourceKey": "bailishouyue",
    "assets": {
      "icon": "assets/heroes/icons/shouyue.webp",
      "portrait": "assets/heroes/portraits/shouyue.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "xuance",
    "name": "Xuance",
    "role": "Jungle",
    "sourceKey": "bailixuance",
    "assets": {
      "icon": "assets/heroes/icons/xuance.webp",
      "portrait": "assets/heroes/portraits/xuance.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "baiqi",
    "name": "Bai Qi",
    "role": "Clash Lane",
    "sourceKey": "baiqi",
    "assets": {
      "icon": "assets/heroes/icons/baiqi.webp",
      "portrait": "assets/heroes/portraits/baiqi.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "drbian",
    "name": "Dr. Bian",
    "role": "Mid Lane",
    "sourceKey": "bianque",
    "assets": {
      "icon": "assets/heroes/icons/drbian.webp",
      "portrait": "assets/heroes/portraits/drbian.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "maishiranui",
    "name": "Mai Shiranui",
    "role": "Mid Lane",
    "sourceKey": "buzhihuowu",
    "assets": {
      "icon": "assets/heroes/icons/maishiranui.webp",
      "portrait": "assets/heroes/portraits/maishiranui.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "caiyan",
    "name": "Cai Yan",
    "role": "Roam",
    "sourceKey": "caiwenji",
    "assets": {
      "icon": "assets/heroes/icons/caiyan.webp",
      "portrait": "assets/heroes/portraits/caiyan.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "caocao",
    "name": "Cao Cao",
    "role": "Clash Lane",
    "sourceKey": "caocao",
    "assets": {
      "icon": "assets/heroes/icons/caocao.webp",
      "portrait": "assets/heroes/portraits/caocao.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "change",
    "name": "Chang'e",
    "role": "Mid Lane",
    "sourceKey": "change",
    "assets": {
      "icon": "assets/heroes/icons/change.webp",
      "portrait": "assets/heroes/portraits/change.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "genghiskhan",
    "name": "Genghis Khan",
    "role": "Farm Lane",
    "sourceKey": "chengjisihan",
    "assets": {
      "icon": "assets/heroes/icons/genghiskhan.webp",
      "portrait": "assets/heroes/portraits/genghiskhan.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "chengyaojin",
    "name": "Cheng Yaojin",
    "role": "Clash Lane",
    "sourceKey": "chengyaojin",
    "assets": {
      "icon": "assets/heroes/icons/chengyaojin.webp",
      "portrait": "assets/heroes/portraits/chengyaojin.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "daji",
    "name": "Daji",
    "role": "Mid Lane",
    "sourceKey": "daji",
    "assets": {
      "icon": "assets/heroes/icons/daji.webp",
      "portrait": "assets/heroes/portraits/daji.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "dharma",
    "name": "Dharma",
    "role": "Clash Lane",
    "sourceKey": "damo",
    "assets": {
      "icon": "assets/heroes/icons/dharma.webp",
      "portrait": "assets/heroes/portraits/dharma.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "daqiao",
    "name": "Da Qiao",
    "role": "Roam",
    "sourceKey": "daqiao",
    "assets": {
      "icon": "assets/heroes/icons/daqiao.webp",
      "portrait": "assets/heroes/portraits/daqiao.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Mid Lane",
      "Roam"
    ]
  },
  {
    "id": "augran",
    "name": "Augran",
    "role": "Jungle",
    "sourceKey": "dasiming",
    "assets": {
      "icon": "assets/heroes/icons/augran.webp",
      "portrait": "assets/heroes/portraits/augran.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle",
      "Clash Lane"
    ]
  },
  {
    "id": "dianwei",
    "name": "Dian Wei",
    "role": "Jungle",
    "sourceKey": "dianwei",
    "assets": {
      "icon": "assets/heroes/icons/dianwei.webp",
      "portrait": "assets/heroes/portraits/dianwei.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "diaochan",
    "name": "Diaochan",
    "role": "Mid Lane",
    "sourceKey": "diaochan",
    "assets": {
      "icon": "assets/heroes/icons/diaochan.webp",
      "portrait": "assets/heroes/portraits/diaochan.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Clash Lane",
      "Mid Lane"
    ]
  },
  {
    "id": "direnjie",
    "name": "Di Renjie",
    "role": "Farm Lane",
    "sourceKey": "direnjie",
    "assets": {
      "icon": "assets/heroes/icons/direnjie.webp",
      "portrait": "assets/heroes/portraits/direnjie.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "donghuang",
    "name": "Donghuang",
    "role": "Clash Lane",
    "sourceKey": "donghuangtaiyi",
    "assets": {
      "icon": "assets/heroes/icons/donghuang.webp",
      "portrait": "assets/heroes/portraits/donghuang.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane",
      "Roam"
    ]
  },
  {
    "id": "dunshan",
    "name": "Dun Shan",
    "role": "Roam",
    "sourceKey": "dunshan",
    "assets": {
      "icon": "assets/heroes/icons/dunshan.webp",
      "portrait": "assets/heroes/portraits/dunshan.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "dolia",
    "name": "Dolia",
    "role": "Roam",
    "sourceKey": "duoliya",
    "assets": {
      "icon": "assets/heroes/icons/dolia.webp",
      "portrait": "assets/heroes/portraits/dolia.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "fei",
    "name": "Fei",
    "role": "Jungle",
    "sourceKey": "fei",
    "assets": {
      "icon": "assets/heroes/icons/fei.webp",
      "portrait": "assets/heroes/portraits/fei.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "ganmo",
    "name": "Gan & Mo",
    "role": "Mid Lane",
    "sourceKey": "ganjiangmoye",
    "assets": {
      "icon": "assets/heroes/icons/ganmo.webp",
      "portrait": "assets/heroes/portraits/ganmo.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "gao",
    "name": "Gao",
    "role": "Mid Lane",
    "sourceKey": "gaojianli",
    "assets": {
      "icon": "assets/heroes/icons/gao.webp",
      "portrait": "assets/heroes/portraits/gao.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "geya",
    "name": "Geya",
    "role": "Farm Lane",
    "sourceKey": "geya",
    "assets": {
      "icon": "assets/heroes/icons/geya.webp",
      "portrait": "assets/heroes/portraits/geya.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "musashi",
    "name": "Musashi",
    "role": "Clash Lane",
    "sourceKey": "gongbenwuzang",
    "assets": {
      "icon": "assets/heroes/icons/musashi.webp",
      "portrait": "assets/heroes/portraits/musashi.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "arli",
    "name": "Arli",
    "role": "Farm Lane",
    "sourceKey": "gongsunli",
    "assets": {
      "icon": "assets/heroes/icons/arli.webp",
      "portrait": "assets/heroes/portraits/arli.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "guanyu",
    "name": "Guan Yu",
    "role": "Clash Lane",
    "sourceKey": "guanyu",
    "assets": {
      "icon": "assets/heroes/icons/guanyu.webp",
      "portrait": "assets/heroes/portraits/guanyu.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "guiguzi",
    "name": "Guiguzi",
    "role": "Roam",
    "sourceKey": "guiguzi",
    "assets": {
      "icon": "assets/heroes/icons/guiguzi.webp",
      "portrait": "assets/heroes/portraits/guiguzi.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "heino",
    "name": "Heino",
    "role": "Mid Lane",
    "sourceKey": "hainuo",
    "assets": {
      "icon": "assets/heroes/icons/heino.webp",
      "portrait": "assets/heroes/portraits/heino.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Clash Lane",
      "Mid Lane"
    ]
  },
  {
    "id": "haiyue",
    "name": "Hai Yue",
    "role": "Mid Lane",
    "sourceKey": "haiyue",
    "assets": {
      "icon": "assets/heroes/icons/haiyue.webp",
      "portrait": "assets/heroes/portraits/haiyue.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "hanxin",
    "name": "Han Xin",
    "role": "Jungle",
    "sourceKey": "hanxin",
    "assets": {
      "icon": "assets/heroes/icons/hanxin.webp",
      "portrait": "assets/heroes/portraits/hanxin.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "houyi",
    "name": "Hou Yi",
    "role": "Farm Lane",
    "sourceKey": "houyi",
    "assets": {
      "icon": "assets/heroes/icons/houyi.webp",
      "portrait": "assets/heroes/portraits/houyi.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "mulan",
    "name": "Mulan",
    "role": "Clash Lane",
    "sourceKey": "huamulan",
    "assets": {
      "icon": "assets/heroes/icons/mulan.webp",
      "portrait": "assets/heroes/portraits/mulan.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "huangzhong",
    "name": "Huang Zhong",
    "role": "Farm Lane",
    "sourceKey": "huangzhong",
    "assets": {
      "icon": "assets/heroes/icons/huangzhong.webp",
      "portrait": "assets/heroes/portraits/huangzhong.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "garo",
    "name": "Garo",
    "role": "Farm Lane",
    "sourceKey": "jialuo",
    "assets": {
      "icon": "assets/heroes/icons/garo.webp",
      "portrait": "assets/heroes/portraits/garo.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "ziya",
    "name": "Ziya",
    "role": "Mid Lane",
    "sourceKey": "jiangziya",
    "assets": {
      "icon": "assets/heroes/icons/ziya.webp",
      "portrait": "assets/heroes/portraits/ziya.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane",
      "Roam"
    ]
  },
  {
    "id": "jinchan",
    "name": "Jin Chan",
    "role": "Mid Lane",
    "sourceKey": "jinchan",
    "assets": {
      "icon": "assets/heroes/icons/jinchan.webp",
      "portrait": "assets/heroes/portraits/jinchan.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane",
      "Roam"
    ]
  },
  {
    "id": "jing",
    "name": "Jing",
    "role": "Jungle",
    "sourceKey": "jing",
    "assets": {
      "icon": "assets/heroes/icons/jing.webp",
      "portrait": "assets/heroes/portraits/jing.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "jixiaoman",
    "name": "Ji Xiaoman",
    "role": "Clash Lane",
    "sourceKey": "jixiaoman",
    "assets": {
      "icon": "assets/heroes/icons/jixiaoman.webp",
      "portrait": "assets/heroes/portraits/jixiaoman.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "ukyo",
    "name": "Ukyo Tachibana",
    "role": "Clash Lane",
    "sourceKey": "juyoujing",
    "assets": {
      "icon": "assets/heroes/icons/ukyo.webp",
      "portrait": "assets/heroes/portraits/ukyo.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "kaizer",
    "name": "Kaizer",
    "role": "Clash Lane",
    "sourceKey": "kai",
    "assets": {
      "icon": "assets/heroes/icons/kaizer.webp",
      "portrait": "assets/heroes/portraits/kaizer.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "biron",
    "name": "Biron",
    "role": "Clash Lane",
    "sourceKey": "kuangtie",
    "assets": {
      "icon": "assets/heroes/icons/biron.webp",
      "portrait": "assets/heroes/portraits/biron.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "laixiao",
    "name": "Lai Xiao",
    "role": "Clash Lane",
    "sourceKey": "laixiao",
    "assets": {
      "icon": "assets/heroes/icons/laixiao.webp",
      "portrait": "assets/heroes/portraits/laixiao.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "lam",
    "name": "Lam",
    "role": "Jungle",
    "sourceKey": "lan",
    "assets": {
      "icon": "assets/heroes/icons/lam.webp",
      "portrait": "assets/heroes/portraits/lam.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "lanling",
    "name": "Lanling",
    "role": "Jungle",
    "sourceKey": "lanlingwang",
    "assets": {
      "icon": "assets/heroes/icons/lanling.webp",
      "portrait": "assets/heroes/portraits/lanling.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "fuzi",
    "name": "Fuzi",
    "role": "Clash Lane",
    "sourceKey": "laofuzi",
    "assets": {
      "icon": "assets/heroes/icons/fuzi.webp",
      "portrait": "assets/heroes/portraits/fuzi.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "lianpo",
    "name": "Lian Po",
    "role": "Clash Lane",
    "sourceKey": "lianpo",
    "assets": {
      "icon": "assets/heroes/icons/lianpo.webp",
      "portrait": "assets/heroes/portraits/lianpo.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane",
      "Roam"
    ]
  },
  {
    "id": "libai",
    "name": "Li Bai",
    "role": "Jungle",
    "sourceKey": "libai",
    "assets": {
      "icon": "assets/heroes/icons/libai.webp",
      "portrait": "assets/heroes/portraits/libai.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "liubang",
    "name": "Liu Bang",
    "role": "Clash Lane",
    "sourceKey": "liubang",
    "assets": {
      "icon": "assets/heroes/icons/liubang.webp",
      "portrait": "assets/heroes/portraits/liubang.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane",
      "Roam"
    ]
  },
  {
    "id": "liubei",
    "name": "Liu Bei",
    "role": "Jungle",
    "sourceKey": "liubei",
    "assets": {
      "icon": "assets/heroes/icons/liubei.webp",
      "portrait": "assets/heroes/portraits/liubei.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "liushan",
    "name": "Liu Shan",
    "role": "Roam",
    "sourceKey": "liushan",
    "assets": {
      "icon": "assets/heroes/icons/liushan.webp",
      "portrait": "assets/heroes/portraits/liushan.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "lixin",
    "name": "Li Xin",
    "role": "Clash Lane",
    "sourceKey": "lixin",
    "assets": {
      "icon": "assets/heroes/icons/lixin.webp",
      "portrait": "assets/heroes/portraits/lixin.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "fang",
    "name": "Fang",
    "role": "Farm Lane",
    "sourceKey": "liyuanfang",
    "assets": {
      "icon": "assets/heroes/icons/fang.webp",
      "portrait": "assets/heroes/portraits/fang.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane",
      "Jungle"
    ]
  },
  {
    "id": "masterluban",
    "name": "Master Luban",
    "role": "Roam",
    "sourceKey": "lubandashi",
    "assets": {
      "icon": "assets/heroes/icons/masterluban.webp",
      "portrait": "assets/heroes/portraits/masterluban.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "luban",
    "name": "Luban No.7",
    "role": "Farm Lane",
    "sourceKey": "lubanqihao",
    "assets": {
      "icon": "assets/heroes/icons/luban.webp",
      "portrait": "assets/heroes/portraits/luban.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "luna",
    "name": "Luna",
    "role": "Jungle",
    "sourceKey": "luna",
    "assets": {
      "icon": "assets/heroes/icons/luna.webp",
      "portrait": "assets/heroes/portraits/luna.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "lubu",
    "name": "Lu Bu",
    "role": "Clash Lane",
    "sourceKey": "lvbu",
    "assets": {
      "icon": "assets/heroes/icons/lubu.webp",
      "portrait": "assets/heroes/portraits/lubu.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "machao",
    "name": "Ma Chao",
    "role": "Clash Lane",
    "sourceKey": "machao",
    "assets": {
      "icon": "assets/heroes/icons/machao.webp",
      "portrait": "assets/heroes/portraits/machao.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "marcopolo",
    "name": "Marco Polo",
    "role": "Farm Lane",
    "sourceKey": "makeboluo",
    "assets": {
      "icon": "assets/heroes/icons/marcopolo.webp",
      "portrait": "assets/heroes/portraits/marcopolo.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "menki",
    "name": "Menki",
    "role": "Clash Lane",
    "sourceKey": "mengqi",
    "assets": {
      "icon": "assets/heroes/icons/menki.webp",
      "portrait": "assets/heroes/portraits/menki.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "mengtian",
    "name": "Meng Tian",
    "role": "Clash Lane",
    "sourceKey": "mengtian",
    "assets": {
      "icon": "assets/heroes/icons/mengtian.webp",
      "portrait": "assets/heroes/portraits/mengtian.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "mengya",
    "name": "Meng Ya",
    "role": "Farm Lane",
    "sourceKey": "mengya",
    "assets": {
      "icon": "assets/heroes/icons/mengya.webp",
      "portrait": "assets/heroes/portraits/mengya.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "milady",
    "name": "Milady",
    "role": "Mid Lane",
    "sourceKey": "milaidi",
    "assets": {
      "icon": "assets/heroes/icons/milady.webp",
      "portrait": "assets/heroes/portraits/milady.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "ming",
    "name": "Ming",
    "role": "Roam",
    "sourceKey": "mingshiyin",
    "assets": {
      "icon": "assets/heroes/icons/ming.webp",
      "portrait": "assets/heroes/portraits/ming.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "miyue",
    "name": "Mi Yue",
    "role": "Clash Lane",
    "sourceKey": "miyue",
    "assets": {
      "icon": "assets/heroes/icons/miyue.webp",
      "portrait": "assets/heroes/portraits/miyue.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "mozi",
    "name": "Mozi",
    "role": "Mid Lane",
    "sourceKey": "mozi",
    "assets": {
      "icon": "assets/heroes/icons/mozi.webp",
      "portrait": "assets/heroes/portraits/mozi.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane",
      "Roam"
    ]
  },
  {
    "id": "nakoruru",
    "name": "Nakoruru",
    "role": "Jungle",
    "sourceKey": "nakelulu",
    "assets": {
      "icon": "assets/heroes/icons/nakoruru.webp",
      "portrait": "assets/heroes/portraits/nakoruru.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "nezha",
    "name": "Nezha",
    "role": "Clash Lane",
    "sourceKey": "nezha",
    "assets": {
      "icon": "assets/heroes/icons/nezha.webp",
      "portrait": "assets/heroes/portraits/nezha.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "niumo",
    "name": "Niumo",
    "role": "Roam",
    "sourceKey": "niumo",
    "assets": {
      "icon": "assets/heroes/icons/niumo.webp",
      "portrait": "assets/heroes/portraits/niumo.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "nuwa",
    "name": "Nuwa",
    "role": "Mid Lane",
    "sourceKey": "nvwa",
    "assets": {
      "icon": "assets/heroes/icons/nuwa.webp",
      "portrait": "assets/heroes/portraits/nuwa.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "pangu",
    "name": "Pangu",
    "role": "Clash Lane",
    "sourceKey": "pangu",
    "assets": {
      "icon": "assets/heroes/icons/pangu.webp",
      "portrait": "assets/heroes/portraits/pangu.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle",
      "Clash Lane"
    ]
  },
  {
    "id": "pei",
    "name": "Pei",
    "role": "Jungle",
    "sourceKey": "peiqinhu",
    "assets": {
      "icon": "assets/heroes/icons/pei.webp",
      "portrait": "assets/heroes/portraits/pei.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "sakeer",
    "name": "Sakeer",
    "role": "Roam",
    "sourceKey": "sangqi",
    "assets": {
      "icon": "assets/heroes/icons/sakeer.webp",
      "portrait": "assets/heroes/portraits/sakeer.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "shangguan",
    "name": "Shangguan",
    "role": "Mid Lane",
    "sourceKey": "shangguanwaner",
    "assets": {
      "icon": "assets/heroes/icons/shangguan.webp",
      "portrait": "assets/heroes/portraits/shangguan.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "dyadia",
    "name": "Dyadia",
    "role": "Roam",
    "sourceKey": "shaosiyuan",
    "assets": {
      "icon": "assets/heroes/icons/dyadia.webp",
      "portrait": "assets/heroes/portraits/dyadia.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "shenmengxi",
    "name": "Shen Mengxi",
    "role": "Mid Lane",
    "sourceKey": "shenmengxi",
    "assets": {
      "icon": "assets/heroes/icons/shenmengxi.webp",
      "portrait": "assets/heroes/portraits/shenmengxi.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "sikongzhen",
    "name": "Sikong Zhen",
    "role": "Clash Lane",
    "sourceKey": "sikongzhen",
    "assets": {
      "icon": "assets/heroes/icons/sikongzhen.webp",
      "portrait": "assets/heroes/portraits/sikongzhen.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Mid Lane"
    ]
  },
  {
    "id": "simayi",
    "name": "Sima Yi",
    "role": "Jungle",
    "sourceKey": "simayi",
    "assets": {
      "icon": "assets/heroes/icons/simayi.webp",
      "portrait": "assets/heroes/portraits/simayi.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Mid Lane",
      "Jungle"
    ]
  },
  {
    "id": "sulie",
    "name": "Su Lie",
    "role": "Clash Lane",
    "sourceKey": "sulie",
    "assets": {
      "icon": "assets/heroes/icons/sulie.webp",
      "portrait": "assets/heroes/portraits/sulie.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane",
      "Roam"
    ]
  },
  {
    "id": "sunbin",
    "name": "Sun Bin",
    "role": "Roam",
    "sourceKey": "sunbin",
    "assets": {
      "icon": "assets/heroes/icons/sunbin.webp",
      "portrait": "assets/heroes/portraits/sunbin.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "sunce",
    "name": "Sun Ce",
    "role": "Clash Lane",
    "sourceKey": "sunce",
    "assets": {
      "icon": "assets/heroes/icons/sunce.webp",
      "portrait": "assets/heroes/portraits/sunce.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "ladysun",
    "name": "Lady Sun",
    "role": "Farm Lane",
    "sourceKey": "sunshangxiang",
    "assets": {
      "icon": "assets/heroes/icons/ladysun.webp",
      "portrait": "assets/heroes/portraits/ladysun.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "sunwukong",
    "name": "Sun Wukong",
    "role": "Jungle",
    "sourceKey": "sunwukong",
    "assets": {
      "icon": "assets/heroes/icons/sunwukong.webp",
      "portrait": "assets/heroes/portraits/sunwukong.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "taiyi",
    "name": "Taiyi",
    "role": "Roam",
    "sourceKey": "taiyizhenren",
    "assets": {
      "icon": "assets/heroes/icons/taiyi.webp",
      "portrait": "assets/heroes/portraits/taiyi.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "princessfrost",
    "name": "Princess Frost",
    "role": "Mid Lane",
    "sourceKey": "wangzhaojun",
    "assets": {
      "icon": "assets/heroes/icons/princessfrost.webp",
      "portrait": "assets/heroes/portraits/princessfrost.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "wuzetian",
    "name": "Wu Zetian",
    "role": "Mid Lane",
    "sourceKey": "wuzetian",
    "assets": {
      "icon": "assets/heroes/icons/wuzetian.webp",
      "portrait": "assets/heroes/portraits/wuzetian.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "dun",
    "name": "Dun",
    "role": "Clash Lane",
    "sourceKey": "xiahoudun",
    "assets": {
      "icon": "assets/heroes/icons/dun.webp",
      "portrait": "assets/heroes/portraits/dun.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane",
      "Roam"
    ]
  },
  {
    "id": "charlotte",
    "name": "Charlotte",
    "role": "Clash Lane",
    "sourceKey": "xialuote",
    "assets": {
      "icon": "assets/heroes/icons/charlotte.webp",
      "portrait": "assets/heroes/portraits/charlotte.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "xiangyu",
    "name": "Xiang Yu",
    "role": "Clash Lane",
    "sourceKey": "xiangyu",
    "assets": {
      "icon": "assets/heroes/icons/xiangyu.webp",
      "portrait": "assets/heroes/portraits/xiangyu.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane",
      "Roam"
    ]
  },
  {
    "id": "xiaojo",
    "name": "Xiao Qiao",
    "role": "Mid Lane",
    "sourceKey": "xiaoqiao",
    "assets": {
      "icon": "assets/heroes/icons/xiaojo.webp",
      "portrait": "assets/heroes/portraits/xiaojo.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "xishi",
    "name": "Xi Shi",
    "role": "Mid Lane",
    "sourceKey": "xishi",
    "assets": {
      "icon": "assets/heroes/icons/xishi.webp",
      "portrait": "assets/heroes/portraits/xishi.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "athena",
    "name": "Athena",
    "role": "Jungle",
    "sourceKey": "yadianna",
    "assets": {
      "icon": "assets/heroes/icons/athena.webp",
      "portrait": "assets/heroes/portraits/athena.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "allain",
    "name": "Allain",
    "role": "Clash Lane",
    "sourceKey": "yalian",
    "assets": {
      "icon": "assets/heroes/icons/allain.webp",
      "portrait": "assets/heroes/portraits/allain.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane"
    ]
  },
  {
    "id": "yangjian",
    "name": "Yang Jian",
    "role": "Clash Lane",
    "sourceKey": "yangjian",
    "assets": {
      "icon": "assets/heroes/icons/yangjian.webp",
      "portrait": "assets/heroes/portraits/yangjian.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "yangyuhuan",
    "name": "Yang Yuhuan",
    "role": "Mid Lane",
    "sourceKey": "yangyuhuan",
    "assets": {
      "icon": "assets/heroes/icons/yangyuhuan.webp",
      "portrait": "assets/heroes/portraits/yangyuhuan.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane",
      "Roam"
    ]
  },
  {
    "id": "yao",
    "name": "Yao",
    "role": "Clash Lane",
    "sourceKey": "yao1",
    "assets": {
      "icon": "assets/heroes/icons/yao.webp",
      "portrait": "assets/heroes/portraits/yao.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "yaria",
    "name": "Yaria",
    "role": "Roam",
    "sourceKey": "yao2",
    "assets": {
      "icon": "assets/heroes/icons/yaria.webp",
      "portrait": "assets/heroes/portraits/yaria.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "arthur",
    "name": "Arthur",
    "role": "Clash Lane",
    "sourceKey": "yase",
    "assets": {
      "icon": "assets/heroes/icons/arthur.webp",
      "portrait": "assets/heroes/portraits/arthur.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "yingzheng",
    "name": "Ying Zheng",
    "role": "Mid Lane",
    "sourceKey": "yingzheng",
    "assets": {
      "icon": "assets/heroes/icons/yingzheng.webp",
      "portrait": "assets/heroes/portraits/yingzheng.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "yixing",
    "name": "Yixing",
    "role": "Mid Lane",
    "sourceKey": "yixing",
    "assets": {
      "icon": "assets/heroes/icons/yixing.webp",
      "portrait": "assets/heroes/portraits/yixing.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "yuange",
    "name": "Yuan Ge",
    "role": "Jungle",
    "sourceKey": "yuange",
    "assets": {
      "icon": "assets/heroes/icons/yuange.webp",
      "portrait": "assets/heroes/portraits/yuange.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "yuji",
    "name": "Yu Ji",
    "role": "Farm Lane",
    "sourceKey": "yuji",
    "assets": {
      "icon": "assets/heroes/icons/yuji.webp",
      "portrait": "assets/heroes/portraits/yuji.webp"
    },
    "combatClass": "Marksman",
    "positions": [
      "Farm Lane"
    ]
  },
  {
    "id": "ying",
    "name": "Ying",
    "role": "Jungle",
    "sourceKey": "yunying",
    "assets": {
      "icon": "assets/heroes/icons/ying.webp",
      "portrait": "assets/heroes/portraits/ying.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "yunzhongjun",
    "name": "Yun Zhongjun",
    "role": "Jungle",
    "sourceKey": "yunzhongjun",
    "assets": {
      "icon": "assets/heroes/icons/yunzhongjun.webp",
      "portrait": "assets/heroes/portraits/yunzhongjun.webp"
    },
    "combatClass": "Assassin",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "zhangfei",
    "name": "Zhang Fei",
    "role": "Roam",
    "sourceKey": "zhangfei",
    "assets": {
      "icon": "assets/heroes/icons/zhangfei.webp",
      "portrait": "assets/heroes/portraits/zhangfei.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "zhangliang",
    "name": "Zhang Liang",
    "role": "Mid Lane",
    "sourceKey": "zhangliang",
    "assets": {
      "icon": "assets/heroes/icons/zhangliang.webp",
      "portrait": "assets/heroes/portraits/zhangliang.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane",
      "Roam"
    ]
  },
  {
    "id": "zhaohuaizhen",
    "name": "Zhao Huaizhen",
    "role": "Clash Lane",
    "sourceKey": "zhaohuaizhen",
    "assets": {
      "icon": "assets/heroes/icons/zhaohuaizhen.webp",
      "portrait": "assets/heroes/portraits/zhaohuaizhen.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle",
      "Clash Lane"
    ]
  },
  {
    "id": "zhaoyun",
    "name": "Zhao Yun",
    "role": "Jungle",
    "sourceKey": "zhaoyun",
    "assets": {
      "icon": "assets/heroes/icons/zhaoyun.webp",
      "portrait": "assets/heroes/portraits/zhaoyun.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Jungle"
    ]
  },
  {
    "id": "ladyzhen",
    "name": "Lady Zhen",
    "role": "Mid Lane",
    "sourceKey": "zhenji",
    "assets": {
      "icon": "assets/heroes/icons/ladyzhen.webp",
      "portrait": "assets/heroes/portraits/ladyzhen.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "kui",
    "name": "Kui",
    "role": "Roam",
    "sourceKey": "zhongkui",
    "assets": {
      "icon": "assets/heroes/icons/kui.webp",
      "portrait": "assets/heroes/portraits/kui.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Roam"
    ]
  },
  {
    "id": "wuyan",
    "name": "Wuyan",
    "role": "Clash Lane",
    "sourceKey": "zhongwuyan",
    "assets": {
      "icon": "assets/heroes/icons/wuyan.webp",
      "portrait": "assets/heroes/portraits/wuyan.webp"
    },
    "combatClass": "Fighter",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "zhouyu",
    "name": "Zhou Yu",
    "role": "Mid Lane",
    "sourceKey": "zhouyu",
    "assets": {
      "icon": "assets/heroes/icons/zhouyu.webp",
      "portrait": "assets/heroes/portraits/zhouyu.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane"
    ]
  },
  {
    "id": "zhuangzi",
    "name": "Zhuangzi",
    "role": "Roam",
    "sourceKey": "zhuangzhou",
    "assets": {
      "icon": "assets/heroes/icons/zhuangzi.webp",
      "portrait": "assets/heroes/portraits/zhuangzi.webp"
    },
    "combatClass": "Support",
    "positions": [
      "Clash Lane",
      "Roam"
    ]
  },
  {
    "id": "zhubajie",
    "name": "Zhu Bajie",
    "role": "Clash Lane",
    "sourceKey": "zhubajie",
    "assets": {
      "icon": "assets/heroes/icons/zhubajie.webp",
      "portrait": "assets/heroes/portraits/zhubajie.webp"
    },
    "combatClass": "Tank",
    "positions": [
      "Clash Lane",
      "Jungle"
    ]
  },
  {
    "id": "kongming",
    "name": "Kongming",
    "role": "Mid Lane",
    "sourceKey": "zhugeliang",
    "assets": {
      "icon": "assets/heroes/icons/kongming.webp",
      "portrait": "assets/heroes/portraits/kongming.webp"
    },
    "combatClass": "Mage",
    "positions": [
      "Mid Lane",
      "Jungle"
    ]
  }
];

  const heroMap = Object.freeze(
    heroes.reduce((accumulator, hero) => {
      accumulator[hero.id] = hero;
      return accumulator;
    }, Object.create(null))
  );

  window.HOK_HEROES = Object.freeze(heroes);
  window.HOK_HERO_MAP = heroMap;
  window.HOK_LANES = Object.freeze([
    "Clash Lane",
    "Mid Lane",
    "Roam",
    "Farm Lane",
    "Jungle"
  ]);
})();
