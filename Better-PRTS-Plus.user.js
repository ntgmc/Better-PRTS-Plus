// ==UserScript==
// @name         Better-PRTS-Plus
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  [整合版] 在 zoot.plus 实现“完美持有/助战筛选”与“更好的暗黑模式”。修复登录框反白、突袭标签、作业详情、B站链接净化及弹窗底部白底问题。
// @author       一只摆烂的42 & Gemini 3 pro
// @match        https://zoot.plus/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    //                            MODULE 1: 配置与常量
    // =========================================================================

    const OPS_STORAGE_KEY = 'prts_plus_user_ops';
    const DISPLAY_MODE_KEY = 'prts_plus_display_mode'; // 'GRAY' | 'HIDE'
    const DARK_MODE_KEY = 'prts_plus_dark_mode_v3';

    // 罗德岛配色定义 (用于暗黑模式)
    const c = {
        bgDeep: '#18181c',      // 全局深底
        bgCard: '#232326',      // 卡片/弹窗
        bgHover: '#2d2d30',     // 悬浮/输入框背景
        border: '#38383b',      // 边框
        textMain: '#e0e0e0',    // 主字
        textSub: '#9ca3af',     // 辅字
        primary: '#5c8ae6',     // 罗德岛蓝
        tagRedBg: '#4a1e1e',    // 突袭-暗红背景
        tagRedText: '#fca5a5',  // 突袭-亮粉红文字
        tagRedBorder: '#7f1d1d' // 突袭-深红边框
    };

    // =========================================================================
    //                            [新增] 干员头像数据映射
    // =========================================================================
    const RAW_OPS = [
      {"id":"char_002_amiya","name":"阿米娅"},{"id":"char_003_kalts","name":"凯尔希"},{"id":"char_009_12fce","name":"12F"},{"id":"char_010_chen","name":"陈"},{"id":"char_017_huang","name":"煌"},{"id":"char_1011_lava2","name":"炎狱炎熔"},{"id":"char_1012_skadi2","name":"浊心斯卡蒂"},{"id":"char_1013_chen2","name":"假日威龙陈"},{"id":"char_1014_nearl2","name":"耀骑士临光"},{"id":"char_1016_agoat2","name":"纯烬艾雅法拉"},{"id":"char_1019_siege2","name":"维娜·维多利亚"},{"id":"char_101_sora","name":"空"},{"id":"char_1020_reed2","name":"焰影苇草"},{"id":"char_1021_kroos2","name":"寒芒克洛丝"},{"id":"char_1023_ghost2","name":"归溟幽灵鲨"},{"id":"char_1024_hbisc2","name":"濯尘芙蓉"},{"id":"char_1026_gvial2","name":"百炼嘉维尔"},{"id":"char_1027_greyy2","name":"承曦格雷伊"},{"id":"char_1028_texas2","name":"缄默德克萨斯"},{"id":"char_1029_yato2","name":"麒麟R夜刀"},{"id":"char_102_texas","name":"德克萨斯"},{"id":"char_1030_noirc2","name":"火龙S黑角"},{"id":"char_1031_slent2","name":"淬羽赫默"},{"id":"char_1032_excu2","name":"圣约送葬人"},{"id":"char_1033_swire2","name":"琳琅诗怀雅"},{"id":"char_1034_jesca2","name":"涤火杰西卡"},{"id":"char_1035_wisdel","name":"维什戴尔"},{"id":"char_1036_fang2","name":"历阵锐枪芬"},{"id":"char_1038_whitw2","name":"荒芜拉普兰德"},{"id":"char_1039_thorn2","name":"引星棘刺"},{"id":"char_103_angel","name":"能天使"},{"id":"char_1040_blaze2","name":"烛煌"},{"id":"char_1041_angel2","name":"新约能天使"},{"id":"char_1042_phatm2","name":"酒神"},{"id":"char_1043_leizi2","name":"司霆惊蛰"},{"id":"char_1044_hsgma2","name":"斩业星熊"},{"id":"char_1045_svash2","name":"凛御银灰"},{"id":"char_1046_sbell2","name":"圣聆初雪"},{"id":"char_1047_halo2","name":"溯光星源"},{"id":"char_106_franka","name":"芙兰卡"},{"id":"char_107_liskam","name":"雷蛇"},{"id":"char_108_silent","name":"赫默"},{"id":"char_109_fmout","name":"远山"},{"id":"char_110_deepcl","name":"深海色"},{"id":"char_112_siege","name":"推进之王"},{"id":"char_113_cqbw","name":"W"},{"id":"char_115_headbr","name":"凛冬"},{"id":"char_117_myrrh","name":"末药"},{"id":"char_118_yuki","name":"白雪"},{"id":"char_120_hibisc","name":"芙蓉"},{"id":"char_121_lava","name":"炎熔"},{"id":"char_122_beagle","name":"米格鲁"},{"id":"char_123_fang","name":"芬"},{"id":"char_124_kroos","name":"克洛丝"},{"id":"char_126_shotst","name":"流星"},{"id":"char_127_estell","name":"艾丝黛尔"},{"id":"char_128_plosis","name":"白面鸮"},{"id":"char_129_bluep","name":"蓝毒"},{"id":"char_130_doberm","name":"杜宾"},{"id":"char_131_flameb","name":"炎客"},{"id":"char_133_mm","name":"梅"},{"id":"char_134_ifrit","name":"伊芙利特"},{"id":"char_135_halo","name":"星源"},{"id":"char_136_hsguma","name":"星熊"},{"id":"char_137_brownb","name":"猎蜂"},{"id":"char_140_whitew","name":"拉普兰德"},{"id":"char_141_nights","name":"夜烟"},{"id":"char_143_ghost","name":"幽灵鲨"},{"id":"char_144_red","name":"红"},{"id":"char_145_prove","name":"普罗旺斯"},{"id":"char_147_shining","name":"闪灵"},{"id":"char_148_nearl","name":"临光"},{"id":"char_149_scave","name":"清道夫"},{"id":"char_1502_crosly","name":"弑君者"},{"id":"char_150_snakek","name":"蛇屠箱"},{"id":"char_151_myrtle","name":"桃金娘"},{"id":"char_154_morgan","name":"摩根"},{"id":"char_155_tiger","name":"因陀罗"},{"id":"char_157_dagda","name":"达格达"},{"id":"char_158_milu","name":"守林人"},{"id":"char_159_peacok","name":"断罪者"},{"id":"char_163_hpsts","name":"火神"},{"id":"char_164_nightm","name":"夜魔"},{"id":"char_166_skfire","name":"天火"},{"id":"char_171_bldsk","name":"华法琳"},{"id":"char_172_svrash","name":"银灰"},{"id":"char_173_slchan","name":"崖心"},{"id":"char_174_slbell","name":"初雪"},{"id":"char_179_cgbird","name":"夜莺"},{"id":"char_180_amgoat","name":"艾雅法拉"},{"id":"char_181_flower","name":"调香师"},{"id":"char_183_skgoat","name":"地灵"},{"id":"char_185_frncat","name":"慕斯"},{"id":"char_187_ccheal","name":"嘉维尔"},{"id":"char_188_helage","name":"赫拉格"},{"id":"char_190_clour","name":"红云"},{"id":"char_192_falco","name":"翎羽"},{"id":"char_193_frostl","name":"霜叶"},{"id":"char_194_leto","name":"烈夏"},{"id":"char_195_glassb","name":"真理"},{"id":"char_196_sunbr","name":"古米"},{"id":"char_197_poca","name":"早露"},{"id":"char_198_blackd","name":"讯使"},{"id":"char_199_yak","name":"角峰"},{"id":"char_2012_typhon","name":"提丰"},{"id":"char_2013_cerber","name":"刻俄柏"},{"id":"char_2014_nian","name":"年"},{"id":"char_2015_dusk","name":"夕"},{"id":"char_201_moeshd","name":"可颂"},{"id":"char_2023_ling","name":"令"},{"id":"char_2024_chyue","name":"重岳"},{"id":"char_2025_shu","name":"黍"},{"id":"char_2026_yu","name":"余"},{"id":"char_202_demkni","name":"塞雷娅"},{"id":"char_204_platnm","name":"白金"},{"id":"char_206_gnosis","name":"灵知"},{"id":"char_208_melan","name":"玫兰莎"},{"id":"char_209_ardign","name":"卡缇"},{"id":"char_210_stward","name":"史都华德"},{"id":"char_211_adnach","name":"安德切尔"},{"id":"char_212_ansel","name":"安赛尔"},{"id":"char_213_mostma","name":"莫斯提马"},{"id":"char_214_kafka","name":"卡夫卡"},{"id":"char_215_mantic","name":"狮蝎"},{"id":"char_218_cuttle","name":"安哲拉"},{"id":"char_219_meteo","name":"陨星"},{"id":"char_220_grani","name":"格拉尼"},{"id":"char_222_bpipe","name":"风笛"},{"id":"char_225_haak","name":"阿"},{"id":"char_226_hmau","name":"吽"},{"id":"char_230_savage","name":"暴行"},{"id":"char_235_jesica","name":"杰西卡"},{"id":"char_236_rope","name":"暗索"},{"id":"char_237_gravel","name":"砾"},{"id":"char_240_wyvern","name":"香草"},{"id":"char_241_panda","name":"食铁兽"},{"id":"char_242_otter","name":"梅尔"},{"id":"char_243_waaifu","name":"槐琥"},{"id":"char_245_cello","name":"塑心"},{"id":"char_248_mgllan","name":"麦哲伦"},{"id":"char_249_mlyss","name":"缪尔赛思"},{"id":"char_250_phatom","name":"傀影"},{"id":"char_252_bibeak","name":"柏喙"},{"id":"char_253_greyy","name":"格雷伊"},{"id":"char_254_vodfox","name":"巫恋"},{"id":"char_258_podego","name":"波登可"},{"id":"char_260_durnar","name":"坚雷"},{"id":"char_261_sddrag","name":"苇草"},{"id":"char_263_skadi","name":"斯卡蒂"},{"id":"char_264_f12yin","name":"山"},{"id":"char_265_sophia","name":"鞭刃"},{"id":"char_271_spikes","name":"芳汀"},{"id":"char_272_strong","name":"孑"},{"id":"char_274_astesi","name":"星极"},{"id":"char_275_breeze","name":"微风"},{"id":"char_277_sqrrel","name":"阿消"},{"id":"char_278_orchid","name":"梓兰"},{"id":"char_279_excu","name":"送葬人"},{"id":"char_281_popka","name":"泡普卡"},{"id":"char_282_catap","name":"空爆"},{"id":"char_283_midn","name":"月见夜"},{"id":"char_284_spot","name":"斑点"},{"id":"char_285_medic2","name":"Lancet-2"},{"id":"char_286_cast3","name":"Castle-3"},{"id":"char_289_gyuki","name":"缠丸"},{"id":"char_290_vigna","name":"红豆"},{"id":"char_291_aglina","name":"安洁莉娜"},{"id":"char_293_thorns","name":"棘刺"},{"id":"char_294_ayer","name":"断崖"},{"id":"char_297_hamoni","name":"和弦"},{"id":"char_298_susuro","name":"苏苏洛"},{"id":"char_300_phenxi","name":"菲亚梅塔"},{"id":"char_301_cutter","name":"刻刀"},{"id":"char_302_glaze","name":"安比尔"},{"id":"char_304_zebra","name":"暴雨"},{"id":"char_306_leizi","name":"惊蛰"},{"id":"char_308_swire","name":"诗怀雅"},{"id":"char_311_mudrok","name":"泥岩"},{"id":"char_322_lmlee","name":"老鲤"},{"id":"char_325_bison","name":"拜松"},{"id":"char_326_glacus","name":"格劳克斯"},{"id":"char_328_cammou","name":"卡达"},{"id":"char_332_archet","name":"空弦"},{"id":"char_333_sidero","name":"铸铁"},{"id":"char_336_folivo","name":"稀音"},{"id":"char_337_utage","name":"宴"},{"id":"char_338_iris","name":"爱丽丝"},{"id":"char_340_shwaz","name":"黑"},{"id":"char_341_sntlla","name":"寒檀"},{"id":"char_343_tknogi","name":"月禾"},{"id":"char_344_beewax","name":"蜜蜡"},{"id":"char_345_folnic","name":"亚叶"},{"id":"char_346_aosta","name":"奥斯塔"},{"id":"char_347_jaksel","name":"杰克"},{"id":"char_348_ceylon","name":"锡兰"},{"id":"char_349_chiave","name":"贾维"},{"id":"char_350_surtr","name":"史尔特尔"},{"id":"char_355_ethan","name":"伊桑"},{"id":"char_356_broca","name":"布洛卡"},{"id":"char_358_lisa","name":"铃兰"},{"id":"char_362_saga","name":"嵯峨"},{"id":"char_363_toddi","name":"熔泉"},{"id":"char_365_aprl","name":"四月"},{"id":"char_366_acdrop","name":"酸糖"},{"id":"char_367_swllow","name":"灰喉"},{"id":"char_369_bena","name":"贝娜"},{"id":"char_373_lionhd","name":"莱恩哈特"},{"id":"char_376_therex","name":"THRM-EX"},{"id":"char_377_gdglow","name":"澄闪"},{"id":"char_378_asbest","name":"石棉"},{"id":"char_379_sesa","name":"慑砂"},{"id":"char_381_bubble","name":"泡泡"},{"id":"char_383_snsant","name":"雪雉"},{"id":"char_385_finlpp","name":"清流"},{"id":"char_388_mint","name":"薄绿"},{"id":"char_391_rosmon","name":"迷迭香"},{"id":"char_394_hadiya","name":"哈蒂娅"},{"id":"char_4000_jnight","name":"正义骑士号"},{"id":"char_4004_pudd","name":"布丁"},{"id":"char_4006_melnte","name":"玫拉"},{"id":"char_4009_irene","name":"艾丽妮"},{"id":"char_400_weedy","name":"温蒂"},{"id":"char_4010_etlchi","name":"隐德来希"},{"id":"char_4011_lessng","name":"止颂"},{"id":"char_4013_kjera","name":"耶拉"},{"id":"char_4014_lunacu","name":"子月"},{"id":"char_4015_spuria","name":"空构"},{"id":"char_4016_kazema","name":"风丸"},{"id":"char_4017_puzzle","name":"谜图"},{"id":"char_4019_ncdeer","name":"九色鹿"},{"id":"char_401_elysm","name":"极境"},{"id":"char_4023_rfalcn","name":"红隼"},{"id":"char_4025_aprot2","name":"暮落"},{"id":"char_4026_vulpis","name":"忍冬"},{"id":"char_4027_heyak","name":"霍尔海雅"},{"id":"char_402_tuye","name":"图耶"},{"id":"char_4032_provs","name":"但书"},{"id":"char_4036_forcer","name":"见行者"},{"id":"char_4039_horn","name":"号角"},{"id":"char_4040_rockr","name":"洛洛"},{"id":"char_4041_chnut","name":"褐果"},{"id":"char_4042_lumen","name":"流明"},{"id":"char_4043_erato","name":"埃拉托"},{"id":"char_4045_heidi","name":"海蒂"},{"id":"char_4046_ebnhlz","name":"黑键"},{"id":"char_4047_pianst","name":"车尔尼"},{"id":"char_4048_doroth","name":"多萝西"},{"id":"char_4051_akkord","name":"协律"},{"id":"char_4052_surfer","name":"寻澜"},{"id":"char_4054_malist","name":"至简"},{"id":"char_4055_bgsnow","name":"鸿雪"},{"id":"char_4058_pepe","name":"佩佩"},{"id":"char_405_absin","name":"苦艾"},{"id":"char_4062_totter","name":"铅踝"},{"id":"char_4063_quartz","name":"石英"},{"id":"char_4064_mlynar","name":"玛恩纳"},{"id":"char_4065_judge","name":"斥罪"},{"id":"char_4066_highmo","name":"海沫"},{"id":"char_4067_lolxh","name":"罗小黑"},{"id":"char_4071_peper","name":"明椒"},{"id":"char_4072_ironmn","name":"白铁"},{"id":"char_4077_palico","name":"泰拉大陆调查团"},{"id":"char_4078_bdhkgt","name":"截云"},{"id":"char_4079_haini","name":"海霓"},{"id":"char_4080_lin","name":"林"},{"id":"char_4081_warmy","name":"温米"},{"id":"char_4082_qiubai","name":"仇白"},{"id":"char_4083_chimes","name":"铎铃"},{"id":"char_4087_ines","name":"伊内丝"},{"id":"char_4088_hodrer","name":"赫德雷"},{"id":"char_4091_ulika","name":"U-Official"},{"id":"char_4093_frston","name":"Friston-3"},{"id":"char_4098_vvana","name":"薇薇安娜"},{"id":"char_4100_caper","name":"跃跃"},{"id":"char_4102_threye","name":"凛视"},{"id":"char_4104_coldst","name":"冰酿"},{"id":"char_4105_almond","name":"杏仁"},{"id":"char_4106_bryota","name":"苍苔"},{"id":"char_4107_vrdant","name":"维荻"},{"id":"char_4109_baslin","name":"深律"},{"id":"char_4110_delphn","name":"戴菲恩"},{"id":"char_4114_harold","name":"哈洛德"},{"id":"char_4116_blkkgt","name":"锏"},{"id":"char_4117_ray","name":"莱伊"},{"id":"char_4119_wanqin","name":"万顷"},{"id":"char_411_tomimi","name":"特米米"},{"id":"char_4121_zuole","name":"左乐"},{"id":"char_4122_grabds","name":"小满"},{"id":"char_4123_ela","name":"艾拉"},{"id":"char_4124_iana","name":"双月"},{"id":"char_4125_rdoc","name":"医生"},{"id":"char_4126_fuze","name":"导火索"},{"id":"char_4130_luton","name":"露托"},{"id":"char_4131_odda","name":"奥达"},{"id":"char_4132_ascln","name":"阿斯卡纶"},{"id":"char_4133_logos","name":"逻各斯"},{"id":"char_4134_cetsyr","name":"魔王"},{"id":"char_4136_phonor","name":"PhonoR-0"},{"id":"char_4137_udflow","name":"深巡"},{"id":"char_4138_narant","name":"娜仁图亚"},{"id":"char_4139_papyrs","name":"莎草"},{"id":"char_4140_lasher","name":"衡沙"},{"id":"char_4141_marcil","name":"玛露西尔"},{"id":"char_4142_laios","name":"莱欧斯"},{"id":"char_4143_sensi","name":"森西"},{"id":"char_4144_chilc","name":"齐尔查克"},{"id":"char_4145_ulpia","name":"乌尔比安"},{"id":"char_4146_nymph","name":"妮芙"},{"id":"char_4147_mitm","name":"渡桥"},{"id":"char_4148_philae","name":"菲莱"},{"id":"char_4151_tinman","name":"锡人"},{"id":"char_4155_talr","name":"裁度"},{"id":"char_415_flint","name":"燧石"},{"id":"char_4162_cathy","name":"凯瑟琳"},{"id":"char_4163_rosesa","name":"瑰盐"},{"id":"char_4164_tecno","name":"特克诺"},{"id":"char_4165_ctrail","name":"云迹"},{"id":"char_416_zumama","name":"森蚺"},{"id":"char_4171_wulfen","name":"钼铅"},{"id":"char_4172_xingzh","name":"行箸"},{"id":"char_4173_nowell","name":"诺威尔"},{"id":"char_4177_brigid","name":"水灯心"},{"id":"char_4178_alanna","name":"阿兰娜"},{"id":"char_4179_monstr","name":"Mon3tr"},{"id":"char_4182_oblvns","name":"丰川祥子"},{"id":"char_4183_mortis","name":"若叶睦"},{"id":"char_4184_dolris","name":"三角初华"},{"id":"char_4185_amoris","name":"祐天寺若麦"},{"id":"char_4186_tmoris","name":"八幡海铃"},{"id":"char_4187_graceb","name":"聆音"},{"id":"char_4188_confes","name":"CONFESS-47"},{"id":"char_4191_tippi","name":"蒂比"},{"id":"char_4193_lemuen","name":"蕾缪安"},{"id":"char_4194_rmixer","name":"信仰搅拌机"},{"id":"char_4195_radian","name":"电弧"},{"id":"char_4196_reckpr","name":"录武官"},{"id":"char_4198_christ","name":"Miss.Christine"},{"id":"char_4199_makiri","name":"松桐"},{"id":"char_4202_haruka","name":"遥"},{"id":"char_4203_kichi","name":"吉星"},{"id":"char_4204_mantra","name":"真言"},{"id":"char_4207_branch","name":"折桠"},{"id":"char_4208_wintim","name":"冬时"},{"id":"char_420_flamtl","name":"焰尾"},{"id":"char_4211_snhunt","name":"雪猎"},{"id":"char_421_crow","name":"羽毛笔"},{"id":"char_422_aurora","name":"极光"},{"id":"char_423_blemsh","name":"瑕光"},{"id":"char_426_billro","name":"卡涅利安"},{"id":"char_427_vigil","name":"伺夜"},{"id":"char_430_fartth","name":"远牙"},{"id":"char_431_ashlok","name":"灰毫"},{"id":"char_433_windft","name":"掠风"},{"id":"char_436_whispr","name":"絮雨"},{"id":"char_437_mizuki","name":"水月"},{"id":"char_440_pinecn","name":"松果"},{"id":"char_445_wscoot","name":"骋风"},{"id":"char_446_aroma","name":"阿罗玛"},{"id":"char_449_glider","name":"蜜莓"},{"id":"char_450_necras","name":"死芒"},{"id":"char_451_robin","name":"罗宾"},{"id":"char_452_bstalk","name":"豆苗"},{"id":"char_455_nothin","name":"乌有"},{"id":"char_456_ash","name":"灰烬"},{"id":"char_457_blitz","name":"闪击"},{"id":"char_458_rfrost","name":"霜华"},{"id":"char_459_tachak","name":"战车"},{"id":"char_464_cement","name":"洋灰"},{"id":"char_466_qanik","name":"雪绒"},{"id":"char_469_indigo","name":"深靛"},{"id":"char_472_pasngr","name":"异客"},{"id":"char_473_mberry","name":"桑葚"},{"id":"char_474_glady","name":"歌蕾蒂娅"},{"id":"char_475_akafyu","name":"赤冬"},{"id":"char_476_blkngt","name":"夜半"},{"id":"char_478_kirara","name":"绮良"},{"id":"char_479_sleach","name":"琴柳"},{"id":"char_484_robrta","name":"罗比菈塔"},{"id":"char_485_pallas","name":"帕拉斯"},{"id":"char_486_takila","name":"龙舌兰"},{"id":"char_487_bobb","name":"波卜"},{"id":"char_488_buildr","name":"青枳"},{"id":"char_489_serum","name":"蚀清"},{"id":"char_491_humus","name":"休谟斯"},{"id":"char_492_quercu","name":"夏栎"},{"id":"char_493_firwhl","name":"火哨"},{"id":"char_494_vendla","name":"刺玫"},{"id":"char_496_wildmn","name":"野鬃"},{"id":"char_497_ctable","name":"晓歌"},{"id":"char_498_inside","name":"隐现"},{"id":"char_499_kaitou","name":"折光"},{"id":"char_500_noirc","name":"黑角"},{"id":"char_501_durin","name":"杜林"},{"id":"char_502_nblade","name":"夜刀"},{"id":"char_503_rang","name":"巡林者"}
    ];

    // 生成 ID 映射表
    const OP_ID_MAP = {};
    RAW_OPS.forEach(op => { OP_ID_MAP[op.name] = op.id; });

    // 状态变量 - 筛选
    let currentFilterMode = 'NONE';
    let displayMode = GM_getValue(DISPLAY_MODE_KEY, 'GRAY');
    let ownedOpsSet = new Set();
    let isProcessingFilter = false;
    let rafId = null;
    let filterDebounceTimer = null;

    // 状态变量 - 暗黑模式
    let isDarkMode = localStorage.getItem(DARK_MODE_KEY) === null ? true : (localStorage.getItem(DARK_MODE_KEY) === 'true');

    // =========================================================================
    //                            MODULE 2: 样式定义
    // =========================================================================

    const mergedStyles = `
        /* --- [暗黑模式核心样式] --- */
        html.dark, html.dark body, html.dark #root, html.dark #app,
        html.dark .bg-zinc-50, html.dark .bg-slate-50, html.dark .bg-gray-50, html.dark .bg-white,
        html.dark .bg-zinc-100, html.dark .bg-slate-100, html.dark .bg-gray-100 {
            background-color: ${c.bgDeep} !important;
            color: ${c.textMain} !important;
        }

        /* 顶部导航栏 */
        html.dark .bp4-navbar {
            background-color: ${c.bgCard} !important;
            border-bottom: 1px solid ${c.border} !important;
            box-shadow: none !important;
        }

        /* 抽屉(Drawer) 与 弹窗(Dialog/Overlay) 核心修复 */
        html.dark .bp4-drawer,
        html.dark .bp4-drawer > section,
        html.dark .bp4-overlay-content,
        html.dark .bp4-dialog {
            background-color: ${c.bgCard} !important;
            color: ${c.textMain} !important;
            box-shadow: 0 0 0 1px ${c.border}, 0 4px 8px rgba(0,0,0,0.5) !important;
        }

        /* 抽屉/弹窗 头部修复 */
        html.dark .bp4-drawer .bg-slate-100,
        html.dark .bp4-drawer header,
        html.dark .bp4-dialog-header {
            background-color: ${c.bgCard} !important;
            border-bottom: 1px solid ${c.border} !important;
            color: ${c.textMain} !important;
        }
        
        /* [新增修复] 弹窗底部操作栏 (Footer) */
        html.dark .bp4-dialog-footer,
        html.dark .bp4-dialog-footer-fixed {
            background-color: ${c.bgCard} !important;
            border-top: 1px solid ${c.border} !important;
            color: ${c.textMain} !important;
        }

        html.dark .bp4-dialog-header .bp4-heading {
            color: #fff !important;
        }
        html.dark .bp4-dialog-close-button .bp4-icon {
            color: ${c.textSub} !important;
        }

        /* 组件通用 */
        html.dark .bp4-card, html.dark .card-container {
            background-color: ${c.bgCard} !important;
            border: 1px solid ${c.border} !important;
            box-shadow: none !important;
            color: ${c.textMain} !important;
        }

        /* 菜单项文字与交互 */
        html.dark .bp4-menu-item {
            color: ${c.textMain} !important;
        }
        html.dark .bp4-menu-item:hover,
        html.dark .bp4-menu-item.bp4-active,
        html.dark .bp4-menu-item.bp4-intent-primary.bp4-active {
            background-color: ${c.primary} !important;
            color: #fff !important;
        }
        html.dark .bp4-menu-item.bp4-disabled {
            color: ${c.textSub} !important;
            background-color: transparent !important;
        }

        /* --- [修复作业详情动作序列颜色条] --- */
        html.dark .bp4-card.border-l-4 {
            border-left-width: 4px !important;
        }
        html.dark .border-sky-700 { border-left-color: #0369a1 !important; }    /* 部署 */
        html.dark .border-pink-700 { border-left-color: #be185d !important; }   /* 倍速/撤退 */
        html.dark .border-violet-700 { border-left-color: #6d28d9 !important; } /* 技能/挂机 */
        html.dark .border-red-700 { border-left-color: #b91c1c !important; }    /* 警告/撤退 */
        html.dark .border-emerald-700 { border-left-color: #047857 !important; }
        html.dark .border-yellow-700 { border-left-color: #a16207 !important; }

        /* 文字颜色适配 */
        html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark .bp4-heading, html.dark strong { color: #fff !important; }
        html.dark .text-gray-700, html.dark .text-zinc-600, html.dark .text-slate-900, html.dark .text-gray-800 { color: ${c.textMain} !important; }
        html.dark .text-gray-500, html.dark .text-zinc-500 { color: ${c.textSub} !important; }

        /* 登录Tab页签适配 */
        html.dark .bp4-tab { color: ${c.textSub} !important; }
        html.dark .bp4-tab[aria-selected="true"] { color: ${c.primary} !important; }

        /* --- [按钮与输入框修复] --- */
        html.dark .bp4-button {
            background-color: ${c.bgHover} !important;
            background-image: none !important;
            border: 1px solid ${c.border} !important;
            color: ${c.textMain} !important;
            box-shadow: none !important;
        }
        html.dark .bp4-button:hover { background-color: #3e3e42 !important; }
        html.dark .bp4-button.bp4-intent-primary {
            background-color: ${c.primary} !important;
            color: #fff !important;
            border: none !important;
        }

        /* 输入框本体 */
        html.dark .bp4-input, html.dark textarea, html.dark select {
            background-color: ${c.bgHover} !important;
            color: #fff !important;
            border: 1px solid ${c.border} !important;
            box-shadow: none !important;
        }
        html.dark .bp4-input::placeholder { color: #666 !important; }

        /* 弹窗内的输入框（加强权重） */
        html.dark .bp4-dialog .bp4-input {
            background-color: ${c.bgHover} !important;
            color: #fff !important;
        }

        /* --- [关键：修复浏览器自动填充(Autofill)导致的白色/黄色背景] --- */
        html.dark input:-webkit-autofill,
        html.dark input:-webkit-autofill:hover,
        html.dark input:-webkit-autofill:focus,
        html.dark input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px ${c.bgHover} inset !important;
            -webkit-text-fill-color: #fff !important;
            caret-color: #fff !important;
            transition: background-color 5000s ease-in-out 0s;
        }

        /* 标签 (Tag) 修复 */
        html.dark .bp4-tag {
            background-color: #333 !important;
            color: #ccc !important;
            border: 1px solid #444 !important;
        }
        html.dark .bp4-tag[class*="bg-red-"], html.dark .bp4-tag.bg-red-400 {
            background-color: ${c.tagRedBg} !important;
            color: ${c.tagRedText} !important;
            border-color: ${c.tagRedBorder} !important;
        }
        html.dark .bg-orange-200 { background-color: #4a3020 !important; border-color: #6d4020 !important; }

        /* Markdown & Links */
        html.dark .markdown-body { color: ${c.textMain} !important; background: transparent !important; }
        html.dark .markdown-body pre, html.dark .markdown-body code { background-color: ${c.bgHover} !important; color: ${c.textMain} !important; }
        html.dark .markdown-body table tr:nth-child(2n) { background-color: rgba(255, 255, 255, 0.05) !important; }
        html.dark .markdown-body a { color: ${c.primary} !important; }

        /* --- [V8.1 样式修复：彻底解决遮挡问题] --- */

        /* 1. 描述容器 (占位层) */
        .prts-desc-wrapper {
            position: relative;
            height: 24px;
            margin: 2px 0;
            width: 100%;
            /* 平时层级较低，但在悬停时极大提升，确保盖住下面的所有内容 */
            z-index: 10;
        }
        .prts-desc-wrapper:hover {
            z-index: 100; /* 关键：悬停时提升父级层级 */
        }

        /* 2. 描述内容 (实体层) */
        .prts-desc-content {
            width: 100%;
            height: 24px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            /* cursor: help; */
            font-size: 13px;
            color: #6b7280;
            line-height: 24px;
            border-radius: 4px;
            /* 默认背景透明，防止遮挡背景图 */
            background-color: transparent; 
        }

        /* 3. 悬停展开状态 */
        .prts-desc-wrapper:hover .prts-desc-content {
            position: absolute;
            top: -4px;
            left: -8px;
            width: calc(100% + 16px);
            height: auto;
            
            white-space: normal; /* 允许换行 */
            overflow: visible;
            
            /* 视觉样式 */
            background-color: #ffffff; /* 必须是实色背景 */
            color: #374151;
            padding: 4px 8px;
            
            /* 强阴影，增加层次感 */
            box-shadow: 0 4px 16px rgba(0,0,0,0.2); 
            border: 1px solid #e5e7eb;
        }

        /* 4. 暗黑模式适配 */
        html.dark .prts-desc-content { color: #9ca3af; }
        
        html.dark .prts-desc-wrapper:hover .prts-desc-content {
            background-color: #232326; /* 暗黑模式下的实色背景 */
            color: #e5e7eb;
            border-color: #3f3f46;
            box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        }

        /* 5. 视频容器 & 按钮 (层级调低) */
        .prts-video-box {
            margin-top: 2px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            position: relative;
            z-index: 1; /* 关键：层级要比展开后的描述低 */
        }

        .prts-bili-link {
            display: inline-flex !important;
            align-items: center;
            color: #94a3b8 !important; 
            font-size: 12px !important;
            font-weight: normal !important;
            text-decoration: none !important;
            padding: 2px 0;
            background: transparent !important;
            border: none !important;
            transition: color 0.2s;
            cursor: pointer;
        }
        .prts-bili-link:hover {
            color: #fb7299 !important; 
            text-decoration: underline !important;
        }

        html.dark .prts-bili-link { color: #52525b !important; }
        html.dark .prts-bili-link:hover { color: #fb7299 !important; }
        
        .prts-bili-link .bp4-icon { margin-right: 4px; font-size: 11px; }


        /* --- [V10.2 UI 修复：原生风格 + 独立成行] --- */

        /* 1. 筛选栏容器 (第二排) */
        #prts-filter-bar {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            width: 100%;
            /* 上下间距，使其看起来像第二排工具栏 */
            margin-top: 8px; 
            margin-bottom: 12px;
            padding-left: 2px; /* 微调对齐 */
        }

        /* 2. 按钮风格：Blueprint Minimal (极简灰色) */
        .prts-btn {
            background: none !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 6px 12px !important;
            font-size: 14px !important;
            color: #5c7080 !important; /* 原生灰色 */
            border-radius: 3px !important;
            min-height: 30px !important;
            line-height: 1 !important;
            font-weight: normal !important;
            margin-right: 4px !important;
            transition: background-color 0.1s cubic-bezier(0.4, 1, 0.75, 0.9) !important;
        }

        /* 悬停 */
        .prts-btn:hover {
            background-color: rgba(167, 182, 194, 0.3) !important;
            color: #1c2127 !important;
            text-decoration: none !important;
        }

        /* 选中 */
        .prts-btn.prts-active {
            background-color: rgba(167, 182, 194, 0.3) !important;
            color: #2563eb !important; /* 罗德岛蓝 */
            font-weight: 600 !important;
        }

        /* 暗黑模式 */
        html.dark .prts-btn { color: #a7b6c2 !important; }
        html.dark .prts-btn:hover,
        html.dark .prts-btn.prts-active {
            background-color: rgba(138, 155, 168, 0.15) !important;
            color: #f5f8fa !important;
        }
        html.dark .prts-btn.prts-active { color: #60a5fa !important; }

        /* 图标 */
        .prts-btn .bp4-icon {
            margin-right: 7px !important;
            color: #5c7080 !important;
            fill: currentColor !important;
        }
        html.dark .prts-btn .bp4-icon { color: #a7b6c2 !important; }
        .prts-btn.prts-active .bp4-icon { color: #2563eb !important; }
        html.dark .prts-btn.prts-active .bp4-icon { color: #60a5fa !important; }

        /* 分隔符 */
        .prts-divider {
            width: 1px;
            height: 16px;
            background-color: rgba(16, 22, 26, 0.15);
            margin: 0 8px;
            display: inline-block;
        }
        html.dark .prts-divider {
            background-color: rgba(255, 255, 255, 0.15);
        }

        /* --- 状态标签样式 --- */
        .prts-status-label {
            margin-top: 12px !important;
            padding-top: 8px !important;
            border-top: 1px dashed #e5e7eb !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            line-height: 1.5 !important;
        }
        html.dark .prts-status-label { border-top-color: #444 !important; }

        .prts-label-support { color: #d97706 !important; }
        html.dark .prts-label-support { color: #ff9d2e !important; }

        .prts-label-missing { color: #dc2626 !important; }
        html.dark .prts-label-missing { color: #f87171 !important; }

        /* --- 卡片视觉降级 (置灰模式) --- */
        .prts-card-gray .bp4-card {
            opacity: 0.4 !important;
            filter: grayscale(0.9) !important;
            transition: opacity 0.2s ease, filter 0.2s ease !important;
            background-color: #f3f4f6 !important;
        }
        html.dark .prts-card-gray .bp4-card { background-color: #1a1a1a !important; }

        /* 悬停恢复 */
        .prts-card-gray:hover .bp4-card {
            opacity: 0.95 !important;
            filter: grayscale(0) !important;
        }
        
        /* --- [V6.1 日间模式配色修复] --- */

        /* 1. 关卡代号徽章 - 配色优化 */
        .prts-level-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            /* 日间模式：使用罗德岛亮蓝，清爽醒目 */
            background-color: #3b82f6; 
            color: #ffffff !important;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 700;
            font-size: 0.95em;
            margin-right: 8px;
            border: 1px solid #2563eb; /* 边框稍微深一点 */
            vertical-align: middle;
            line-height: 1.2;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
        }
        /* 暗黑模式：保持深色沉浸感，但改为深蓝而非纯黑 */
        html.dark .prts-level-badge {
            background-color: #1e3a8a; /* 深蓝色 */
            border-color: #1e40af;
            color: #e0e7ff !important;
            box-shadow: none;
        }
        
        /* 2. 干员/干员组 统一网格 */
        .prts-op-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px; /* 间距 */
            margin-top: 8px;
            margin-bottom: 8px;
            align-items: center;
        }

        /* 3. 核心修复：强制交互层(Popover Wrapper)对齐 */
        /* Zoot原本的 wrapper 可能是 block 或 inline，导致高度塌陷或对齐错误 */
        .prts-op-grid .bp4-popover2-target {
            display: inline-flex !important; 
            margin: 0 !important;
            padding: 0 !important;
            vertical-align: top !important;
            height: 42px !important; /* 强制高度一致 */
        }

        /* 3. 统一容器基础样式 */
        .prts-op-item, .prts-op-text {
            position: relative;
            width: 42px;
            height: 42px;
            /* 移除 overflow: hidden 以允许 Tooltip 显示 */
            /* border-radius: 4px;  <-- 移交给内部元素 */
            /* cursor: help; */
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }
        
        .prts-op-item:hover, .prts-op-text:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 50; /* 提升层级确保气泡在最上层 */
        }

        /* 2. 干员头像容器 - 配色优化 */
        .prts-op-item {
            position: relative;
            width: 42px;
            height: 42px;
            /* 日间模式：浅灰白底色，避免"黑洞" */
            background-color: #f8fafc; 
            border: 1px solid #cbd5e1; /* 浅灰色边框 */
            border-radius: 4px;
            /* cursor: help; */
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }
        /* 暗黑模式：深色底，避免太亮刺眼 */
        html.dark .prts-op-item {
            background-color: #1f2937;
            border-color: #374151;
        }

        .prts-op-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 50;
            border-color: #3b82f6; /* 悬停时边框变蓝 */
        }
        html.dark .prts-op-item:hover {
            border-color: #60a5fa;
        }
        
        .prts-op-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            border-radius: 3px; /* 图片自己负责圆角 */
        }
        
        /* 3. 干员组(文字方块) - 保持一致性微调 */
        .prts-op-text {
            position: relative;
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            /* 日间模式 */
            background-color: #f1f5f9;
            color: #475569;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            line-height: 1.1;
            padding: 2px;
            word-break: break-all;
            /* cursor: help; */
            box-sizing: border-box;
            transition: transform 0.2s;
        }
        .prts-op-text:hover {
            transform: translateY(-2px);
            z-index: 50;
            border-style: solid;
            border-color: #3b82f6;
            background-color: #fff;
        }
        /* 暗黑模式 */
        html.dark .prts-op-text {
            background-color: #27272a;
            color: #d1d5db;
            border-color: #52525b;
        }
        html.dark .prts-op-text:hover {
            background-color: #27272a;
            border-color: #60a5fa;
        }
        
        /* 4. [新增] 模拟 Zoot 原生风格的 Tooltip */
        /* 通过 data-prts-tooltip 属性触发 */
        [data-prts-tooltip]:hover::after {
            content: attr(data-prts-tooltip);
            position: absolute;
            bottom: 115%; /* 显示在上方 */
            left: 50%;
            transform: translateX(-50%);
            background-color: #30404d; /* Blueprint Dark Gray */
            color: #f5f8fa;
            padding: 5px 8px;
            font-size: 12px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 0 0 1px rgba(16,22,26,.1), 0 2px 4px rgba(16,22,26,.2), 0 8px 24px rgba(16,22,26,.2);
            z-index: 100;
        }
        /* 小三角 */
        [data-prts-tooltip]:hover::before {
            content: "";
            position: absolute;
            bottom: 100%; /* 紧贴上方 */
            left: 50%;
            transform: translateX(-50%);
            border-width: 5px;
            border-style: solid;
            border-color: #30404d transparent transparent transparent;
            z-index: 100;
        }
        html.dark [data-prts-tooltip]:hover::after { background-color: #202b33; }
        html.dark [data-prts-tooltip]:hover::before { border-color: #202b33 transparent transparent transparent; }

        /* --- [V11.4 样式紧急修复：角标颜色强制高亮] --- */

        /* 1. 基础角标样式 (卡片 & 弹窗通用) */
        .prts-op-skill, .prts-popover-skill {
            position: absolute;
            bottom: 0;
            right: 0;
            
            /* 强制白底黑字，确保最高对比度 */
            background-color: #ffffff !important; 
            color: #000000 !important;
            
            font-size: 11px !important;
            font-weight: 900 !important; /* 最粗体 */
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            
            padding: 0 4px;
            min-width: 14px;
            text-align: center;
            line-height: 14px;
            
            border-top-left-radius: 4px;
            /* 加深阴影，防止在亮色头像上看不清边界 */
            box-shadow: 0 0 2px rgba(0,0,0,0.5); 
            pointer-events: none;
            z-index: 10;
        }

        /* 2. [关键修复] 针对弹窗内角标的特异性覆盖 */
        /* 这里的层级必须非常深，以覆盖 V5.0 中那个通配符 * 的颜色强制 */
        html.dark .bp4-popover2-content .prts-popover-skill,
        html.dark .prts-popover-skill {
            background-color: #ffffff !important; /* 保持纯白底 */
            color: #000000 !important;            /* 强制纯黑字 */
            border: 1px solid #d1d5db;            /* 加个微弱灰边框防止晕染 */
        }

        /* 日间模式也加个保险 */
        .bp4-popover2-content .prts-popover-skill {
            background-color: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #e5e7eb;
        }
        
        /* --- [V5.0 修复：Tooltip/气泡提示 配色修复] --- */
        /* 针对 "复制神秘代码" 等所有悬停提示 */
        html.dark .bp4-popover2-content {
            background-color: #262626 !important; /* 深灰色背景，比纯黑稍亮 */
            color: #ffffff !important;             /* 强制纯白文字 */
            border: 1px solid #404040 !important;  /* 增加微弱边框，提升辨识度 */
            box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }

        /* 暴力覆盖 Tooltip 内部可能存在的 Tailwind 文字颜色类 (如 text-slate-700) */
        html.dark .bp4-popover2-content,
        html.dark .bp4-popover2-content * {
            color: #ffffff !important;
        }

        /* 修复气泡连接处的小三角 (Arrow) 颜色 */
        html.dark .bp4-popover2-arrow-fill {
            fill: #262626 !important; /* 填充色与背景一致 */
        }
        html.dark .bp4-popover2-arrow-border {
            fill: #404040 !important; /* 边框色与边框一致 */
        }
        
        /* 隐藏原始标签 */
        .bp4-tag[data-op-extracted="true"] { display: none !important; }
        
        /* --- [V6.3 侧边栏最终修复：解决文字消失] --- */

        /* 1. 创作工具折叠 */
        .prts-sidebar-collapsed {
            max-height: 48px !important;
            overflow: hidden !important;
            cursor: pointer !important;
            opacity: 0.9;
        }
        .prts-sidebar-header-icon {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .prts-sidebar-header-icon::after {
            content: "▼";
            font-size: 0.8em;
            color: #9ca3af;
            transition: transform 0.3s;
        }
        .prts-sidebar-expanded .prts-sidebar-header-icon::after { transform: rotate(180deg); }

        /* 2. 公告按钮 (Notice Button) */
        .prts-notice-btn {
            cursor: pointer !important;
            border-left: 4px solid #3b82f6 !important; /* 蓝色左边条 */
            transition: transform 0.2s, box-shadow 0.2s !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            min-height: 48px !important;
            padding: 0 16px !important; /* 增加左右内边距 */
        }
        .prts-notice-btn:hover {
            transform: translateX(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        }

        /* [核心修复]：只隐藏包含列表的那个 div，而不是所有带 flex 的元素 */
        /* 这里的 > div 表示只隐藏直接子元素中的 div，通常是放列表的容器 */
        .prts-notice-btn > div:not(.bp4-heading), 
        .prts-notice-btn ul {
            display: none !important;
        }

        /* [核心修复]：强制标题显示并纠正颜色 */
        .prts-notice-btn h4.bp4-heading {
            display: flex !important; /* 恢复 flex 布局 */
            align-items: center !important;
            margin: 0 !important;
            width: 100% !important;
            opacity: 1 !important;
            visibility: visible !important;
            color: #1f2937 !important; /* 日间：深灰 */
        }
        
        /* 暗黑模式下强制反白 */
        html.dark .prts-notice-btn h4.bp4-heading {
            color: #f3f4f6 !important; /* 夜间：亮白 */
        }

        /* 3. 弹窗内标签 */
        .prts-dialog-tag {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            margin-right: 8px;
            color: #fff;
            vertical-align: middle;
        }
        .prts-tag-update { background-color: #10b981; }
        .prts-tag-fix { background-color: #f59e0b; }
        .prts-tag-event { background-color: #3b82f6; }
        .prts-tag-note { background-color: #64748b; }
        
        /* --- [V9.4 悬浮球样式：优雅慢速动画版] --- */

        /* 1. 悬浮球容器 (定位与基座) */
        #prts-float-container {
            position: fixed;
            z-index: 9999;
            display: flex;
            align-items: center;
            opacity: 0.6;
            user-select: none;
            
            /* [核心修改]：
               1. 增加 transform 属性的过渡，让贴边/展开有动画
               2. 时间设为 0.6s (更慢)
               3. 使用 ease-out (先快后慢) 让动作更自然
            */
            transition: opacity 0.3s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        /* 交互状态：悬停、打开面板时变为不透明 */
        #prts-float-container:hover,
        #prts-float-container.prts-float-open {
            opacity: 1;
        }

        /* [关键修复]：拖拽时必须关闭动画，否则会感到严重的延迟 */
        #prts-float-container.is-dragging {
            opacity: 1;
            transition: none !important;
        }

        /* 吸附动画 (松手后的归位动画) */
        #prts-float-container.is-snapping {
            transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* 2. 贴边自动隐藏逻辑 */
        /* 右侧吸附隐藏 */
        #prts-float-container.snap-right:not(:hover):not(.prts-float-open):not(.is-dragging) {
            transform: translateX(calc(100% - 12px));
        }
        /* 左侧吸附隐藏 */
        #prts-float-container.snap-left:not(:hover):not(.prts-float-open):not(.is-dragging) {
            transform: translateX(calc(-100% + 12px));
        }

        /* 3. 悬浮按钮 (图标) */
        .prts-float-btn {
            width: 48px;
            height: 48px;
            background-color: #fff;
            border: 1px solid #e5e7eb;
            border-right: none; /* 默认贴右边 */
            border-radius: 8px 0 0 8px;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #374151;
            transition: all 0.3s; /* 按钮本身的颜色变化不需要太慢 */
            position: relative;
            z-index: 2;
        }
        .prts-float-btn svg { width: 24px; height: 24px; fill: currentColor; }
        
        /* 左侧吸附时翻转 */
        #prts-float-container.snap-left .prts-float-btn {
            border-radius: 0 8px 8px 0;
            border-right: 1px solid #e5e7eb;
            border-left: none;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
        }

        /* 暗黑模式按钮 */
        html.dark .prts-float-btn {
            background-color: #232326;
            border-color: #3f3f46;
            color: #e5e7eb;
            box-shadow: -2px 2px 12px rgba(0,0,0,0.5);
        }

        /* 4. 控制面板 */
        .prts-settings-panel {
            position: absolute;
            top: 0;
            width: 260px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1;
            
            /* 默认隐藏 */
            visibility: hidden;
            opacity: 0;
            pointer-events: none;
            
            /* 面板弹出也慢一点，保持一致 */
            transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* 面板定位 */
        /* 右侧吸附时：面板在左 */
        .prts-settings-panel {
            right: 55px; left: auto;
            transform: translateX(20px) scale(0.95);
            transform-origin: top right;
        }
        /* 左侧吸附时：面板在右 */
        #prts-float-container.snap-left .prts-settings-panel {
            left: 55px; right: auto;
            transform: translateX(-20px) scale(0.95);
            transform-origin: top left;
        }

        /* 激活显示 */
        #prts-float-container.prts-float-open .prts-settings-panel {
            visibility: visible;
            opacity: 1;
            transform: translateX(0) scale(1);
            pointer-events: auto;
        }

        /* 暗黑模式面板 */
        html.dark .prts-settings-panel {
            background: #18181c;
            border-color: #3f3f46;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        }

        /* 5. 面板内容 (保持不变) */
        .prts-panel-title {
            font-size: 14px; font-weight: bold; margin-bottom: 12px;
            color: #1f2937; display: flex; align-items: center;
            padding-bottom: 8px; border-bottom: 1px solid #f3f4f6;
        }
        html.dark .prts-panel-title { color: #f3f4f6; border-color: #3f3f46; }

        .prts-panel-item {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 12px; font-size: 13px; color: #4b5563;
        }
        html.dark .prts-panel-item { color: #d1d5db; }

        .prts-switch { position: relative; display: inline-block; width: 36px; height: 20px; }
        .prts-switch input { opacity: 0; width: 0; height: 0; }
        .prts-slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #ccc; transition: .4s; border-radius: 34px;
        }
        .prts-slider:before {
            position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px;
            background-color: white; transition: .4s; border-radius: 50%;
        }
        input:checked + .prts-slider { background-color: #3b82f6; }
        input:checked + .prts-slider:before { transform: translateX(16px); }
        html.dark .prts-slider { background-color: #4b5563; }
        html.dark input:checked + .prts-slider { background-color: #2563eb; }
        
        /* --- [V11.3 弹窗头像化样式] --- */
        
        .prts-popover-grid {
            display: flex; flex-wrap: wrap; gap: 6px; max-width: 320px; padding: 4px;
        }
        .prts-popover-item {
            position: relative; width: 48px; height: 48px;
            background-color: #1f2937; border: 1px solid #e5e7eb;
            border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        html.dark .prts-popover-item { border-color: #4b5563; }
        .prts-popover-img {
            width: 100%; height: 100%; object-fit: cover; border-radius: 3px;
        }
        .prts-popover-skill {
            position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.7);
            color: #fff; font-size: 10px; padding: 1px 4px; border-top-left-radius: 4px; line-height: 1.2;
        }
    `;

    GM_addStyle(mergedStyles);

    // =========================================================================
    //                            MODULE 3: 暗黑模式逻辑
    // =========================================================================

    function applyDarkMode(enable) {
        const html = document.documentElement;
        if (enable) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        updateDarkModeButtonIcon(enable);
    }

    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        localStorage.setItem(DARK_MODE_KEY, isDarkMode);
        applyDarkMode(isDarkMode);
    }

    function updateDarkModeButtonIcon(isDark) {
        const btn = document.getElementById('prts-mode-toggle');
        if (!btn) return;

        const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

        btn.innerHTML = isDark ? moonSvg : sunSvg;
        btn.title = isDark ? "关闭暗黑模式" : "开启暗黑模式";
        btn.style.color = isDark ? c.primary : '#5f6b7c';
    }

    // 辅助函数：通过 XPath 获取元素
    function getElementByXPath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function manageDarkModeButton() {
        // 1. 隐藏原版按钮
        const targetXPath = "/html/body/main/div/div[1]/div[4]/button[2]";
        const oldButton = getElementByXPath(targetXPath);
        if (oldButton && oldButton.id !== 'prts-mode-toggle') {
            oldButton.style.display = 'none';
        }

        // 2. 插入自定义按钮
        // 尝试找到容器
        const containerXPath = "/html/body/main/div/div[1]/div[4]";
        const container = getElementByXPath(containerXPath) || document.querySelector('.bp4-navbar .flex.md\\:gap-4.gap-3');

        if (container && !document.getElementById('prts-mode-toggle')) {
            const myBtn = document.createElement('button');
            myBtn.id = 'prts-mode-toggle';
            myBtn.className = 'bp4-button bp4-minimal';
            myBtn.type = 'button';
            myBtn.style.marginLeft = '4px';
            myBtn.onclick = toggleDarkMode;
            container.appendChild(myBtn);
            updateDarkModeButtonIcon(isDarkMode);
        }
    }

    // =========================================================================
    //                            MODULE 4: 筛选与净化逻辑
    // =========================================================================

    function isFilterDisabledPage() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    function loadOwnedOps() {
        const storedData = GM_getValue(OPS_STORAGE_KEY, '[]');
        try {
            const ops = JSON.parse(storedData);
            ownedOpsSet = new Set(ops.filter(op => op.own === true).map(op => op.name));
            console.log(`[Better PRTS] 已加载 ${ownedOpsSet.size} 名持有干员`);
        } catch (e) {
            console.error('[Better PRTS] 数据解析失败', e);
        }
    }

    function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json, .txt';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const jsonStr = event.target.result;
                    const json = JSON.parse(jsonStr);
                    if (!Array.isArray(json)) throw new Error("非数组格式");
                    GM_setValue(OPS_STORAGE_KEY, jsonStr);
                    loadOwnedOps();
                    alert(`✅ 导入成功！\n共识别 ${json.length} 条数据，持有 ${ownedOpsSet.size} 名干员。`);
                    if (currentFilterMode !== 'NONE') requestFilterUpdate();
                } catch (err) {
                    alert('❌ 导入失败，请检查文件格式。\n' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function toggleDisplayMode() {
        displayMode = (displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        GM_setValue(DISPLAY_MODE_KEY, displayMode);

        // 简单粗暴：删掉整个栏，injectFilterControls 会自动重建
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();

        requestFilterUpdate();
    }

    function toggleFilter(mode) {
        if (ownedOpsSet.size === 0) {
            alert('请先导入干员数据！');
            return;
        }
        currentFilterMode = (currentFilterMode === mode) ? 'NONE' : mode;
        updateFilterButtonStyles();
        requestFilterUpdate();
    }

    function updateFilterButtonStyles() {
        const perfectBtn = document.getElementById('btn-perfect');
        const supportBtn = document.getElementById('btn-support');
        if (!perfectBtn || !supportBtn) return;

        perfectBtn.classList.remove('prts-active');
        supportBtn.classList.remove('prts-active');

        if (currentFilterMode === 'PERFECT') perfectBtn.classList.add('prts-active');
        else if (currentFilterMode === 'SUPPORT') supportBtn.classList.add('prts-active');
    }

    // --- [V10.3 注入逻辑：高清 Material 图标修复版] ---
    function injectFilterControls() {
        if (isFilterDisabledPage()) {
            const existing = document.getElementById('prts-filter-bar');
            if (existing) existing.remove();
            return;
        }

        const searchInputGroup = document.querySelector('.bp4-input-group');
        if (!searchInputGroup) return;
        const searchRow = searchInputGroup.parentElement;
        if (!searchRow) return;

        let controlBar = document.getElementById('prts-filter-bar');

        if (!controlBar) {
            controlBar = document.createElement('div');
            controlBar.id = 'prts-filter-bar';

            const createBpBtn = (text, svgPath, onClick, id) => {
                const btn = document.createElement('button');
                btn.type = "button";
                btn.className = 'prts-btn';
                btn.id = id;
                // 注意：这里 viewBox 改为了 "0 0 24 24" 以适配高清图标
                btn.innerHTML = `
                    <span class="bp4-icon" aria-hidden="true" style="margin-right:6px">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="${svgPath}"></path></svg>
                    </span>
                    <span class="bp4-button-text">${text}</span>
                `;
                btn.onclick = onClick;
                return btn;
            };

            const createDivider = () => {
                const div = document.createElement('div');
                div.className = 'prts-divider';
                return div;
            };

            // 使用 Material Design 标准图标路径 (24x24)
            const paths = {
                // 干净的导入图标 (箭头指向底座)
                import: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',

                // 眼睛 (置灰模式 - 可见)
                eyeOn: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',

                // 划掉的眼睛 (隐藏模式 - 不可见)
                eyeOff: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4.01.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',

                // 星星 (完美阵容)
                perfect: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',

                // 人群 (允许助战)
                support: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
            };

            controlBar.append(
                createBpBtn('导入干员', paths.import, handleImport, 'btn-import'),
                createBpBtn(displayMode === 'GRAY' ? '置灰模式' : '隐藏模式', displayMode === 'GRAY' ? paths.eyeOn : paths.eyeOff, toggleDisplayMode, 'btn-setting'),
                createDivider(),
                createBpBtn('完美阵容', paths.perfect, () => toggleFilter('PERFECT'), 'btn-perfect'),
                createBpBtn('允许助战', paths.support, () => toggleFilter('SUPPORT'), 'btn-support')
            );

            updateFilterButtonStyles();
        }

        if (searchRow.nextSibling !== controlBar) {
            searchRow.parentNode.insertBefore(controlBar, searchRow.nextSibling);
            if (currentFilterMode !== 'NONE') requestFilterUpdate();
        }
    }

    // --- [V8.0 逻辑：强力清洗 + 悬浮层构建] ---
    function cleanBilibiliLinks(cardInner) {
        if (!CONFIG.cleanLink) return;
        // 1. 找到描述容器
        const descContainer = cardInner.querySelector('.grow.text-gray-700');
        if (!descContainer || descContainer.dataset.biliProcessed) return;

        let html = descContainer.innerHTML;
        let videoUrl = null;

        // =========================================================
        // A. 提取 B站链接 (提取后从原文删除)
        // =========================================================
        const regex = /((?:【.*?】\s*)?(https?:\/\/(?:www\.)?(?:bilibili\.com\/video\/|b23\.tv\/)[^\s<"']+))/gi;
        const match = regex.exec(html);

        if (match) {
            const fullTextToRemove = match[1];
            videoUrl = match[2];
            // 从 HTML 中删掉链接文本
            html = html.replace(fullTextToRemove, '');
        }

        // =========================================================
        // B. 强力清洗末尾空行 (Goal 1)
        // =========================================================
        // 正则解释：匹配末尾的 <p>空</p>, <br>, 空格，且重复多次
        // (?: ... ) 非捕获组
        // <p>\s*(?:<br\s*\/?>)?\s*<\/p>  匹配 <p>  </p> 或 <p><br></p>
        // <br\s*\/?>                     匹配 <br>
        // \s                             匹配换行符、空格
        const trailingTrashRegex = /(?:<p>\s*(?:<br\s*\/?>)?\s*<\/p>|<br\s*\/?>|\s)+$/gi;

        // 执行清洗
        html = html.replace(trailingTrashRegex, '');

        // 如果清洗后只剩下空壳（比如只有空格），显示默认占位
        if (html.replace(/<[^>]+>/g, '').trim() === '') {
            html = '(无文字描述)';
        }

        // =========================================================
        // C. 重构 DOM 结构 (Goal 2: 悬浮层)
        // =========================================================
        // 以前是直接修改 innerHTML，现在我们要把它包起来
        // 结构：Wrapper (固定高度) -> Content (悬浮) -> HTML

        descContainer.innerHTML = `<div class="prts-desc-content">${html}</div>`;

        // 给父容器添加 Wrapper 类，使其具备相对定位和固定高度
        descContainer.classList.add('prts-desc-wrapper');
        // 移除原有的 flex-grow 类，防止高度异常拉伸
        descContainer.classList.remove('grow');
        // 保持宽度占满
        descContainer.style.width = '100%';

        // =========================================================
        // D. 插入视频按钮 (如果有)
        // =========================================================
        if (videoUrl) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'prts-video-box';

            const linkBtn = document.createElement('a');
            linkBtn.href = videoUrl;
            linkBtn.target = "_blank";
            linkBtn.className = 'prts-bili-link'; // 沿用 V7.1 的低调样式
            linkBtn.innerHTML = `<span class="bp4-icon bp4-icon-video"></span>参考视频`;

            linkBtn.onclick = (e) => {
                e.stopPropagation();
            };

            btnContainer.appendChild(linkBtn);

            if (descContainer.parentNode) {
                descContainer.parentNode.insertBefore(btnContainer, descContainer.nextSibling);
            }
        }

        descContainer.dataset.biliProcessed = "true";
    }

    function requestFilterUpdate() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(applyFilterLogic);
    }

    // --- [V6.0 最终完美版：支持异步加载 + 独立状态锁] ---
    function optimizeCardVisuals(card, cardInner) {
        if (!CONFIG.visuals) return;
        // 注意：移除了最外层的 card.dataset.visualOptimized 锁
        // 改为内部独立控制，因为关卡代号和干员列表可能不同步加载

        // =========================================================
        // 1. 【关卡代号】异步等待策略
        // =========================================================
        const heading = cardInner.querySelector('h4, h5, .bp4-heading');
        const stageCodeSpan = cardInner.querySelector('.flex.whitespace-pre .inline-block.font-bold.my-auto');

        // 只有当标题存在，且【从未处理过徽章】时才执行
        if (stageCodeSpan && heading && !heading.dataset.badgeProcessed) {
            const rawCode = stageCodeSpan.innerText.trim(); // 获取当前显示的文字

            // --- 核心判断逻辑 ---
            // 内部ID特征：包含下划线 "_" (如 act47side_07) 或者 以小写字母开头且较长
            // 有效代号特征：通常较短，或者以大写字母/数字开头 (如 UR-7, 1-7, H12-4)
            const isInternalId = rawCode.includes('_') || (rawCode.length > 5 && /^[a-z]/.test(rawCode));

            if (isInternalId) {
                // console.log('检测到内部ID，等待异步更新:', rawCode);
                // 关键点：直接跳过，不标记 badgeProcessed。
                // 等网页 DOM 变成 "UR-7" 时，Observer 会再次调用此函数，那时就会进入下面的 else
            } else {
                // console.log('检测到有效代号，执行处理:', rawCode);

                // 1. 寻找存放标题文本的具体容器
                const titleTextNode = heading.querySelector('.whitespace-nowrap.overflow-hidden.text-ellipsis') || heading;
                let currentText = titleTextNode.innerText;

                // 2. 标题去重清洗
                const escapedCode = rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`^\\s*(\\[|【)?\\s*${escapedCode}\\s*(\\]|】)?\\s*([-|:：\\s]+)?`, 'i');

                if (regex.test(currentText)) {
                    titleTextNode.innerText = currentText.replace(regex, '');
                }

                // 3. 插入徽章
                const badge = document.createElement('span');
                badge.className = 'prts-level-badge';
                badge.innerText = rawCode;
                heading.insertBefore(badge, heading.firstChild);

                // 4. 标记为已完成，以后不再处理此标题
                heading.dataset.badgeProcessed = "true";
            }
        }

        // =========================================================
        // 3. 【干员列表】交互一致性处理
        // =========================================================
        const allDivs = Array.from(cardInner.querySelectorAll('div'));
        const labelDiv = allDivs.find(div => div.innerText.trim() === '干员/干员组');

        // 使用 dataset.opsProcessed 独立控制干员部分的锁
        if (labelDiv && !labelDiv.dataset.opsProcessed) {
            const tagsContainer = labelDiv.nextElementSibling;
            if (tagsContainer) {
                const tags = tagsContainer.querySelectorAll('.bp4-tag');

                let grid = tagsContainer.querySelector('.prts-op-grid');
                if (!grid) {
                    grid = document.createElement('div');
                    grid.className = 'prts-op-grid';
                    tagsContainer.insertBefore(grid, tagsContainer.firstChild);
                }

                let hasProcessedAny = false;

                tags.forEach(tag => {
                    if (tag.dataset.opExtracted) return;

                    const rawText = tag.innerText.trim();
                    const cleanText = rawText.replace(/^\[|\]$/g, '');
                    const parts = cleanText.split(/\s+/);
                    const nameKey = parts[0];
                    const extraInfo = parts[1] || "";

                    let newItem = null;

                    if (OP_ID_MAP[nameKey]) {
                        // A: 图片头像
                        const opId = OP_ID_MAP[nameKey];
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-item';

                        const img = document.createElement('img');
                        img.src = `https://zoot.plus/assets/operator-avatars/webp96/${opId}.webp`;
                        img.className = 'prts-op-img';
                        img.loading = "lazy";
                        newItem.appendChild(img);

                    } else if (nameKey.length > 0) {
                        // B: 文字方块
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-text';
                        newItem.innerText = nameKey;
                    }

                    if (newItem && extraInfo) {
                        const badge = document.createElement('div');
                        badge.className = 'prts-op-skill';
                        badge.innerText = extraInfo;
                        newItem.appendChild(badge);
                    }

                    if (!newItem) return;

                    // 交互处理
                    const interactiveWrapper = tag.closest('.bp4-popover2-target');

                    if (interactiveWrapper) {
                        grid.appendChild(interactiveWrapper);
                        interactiveWrapper.innerHTML = '';
                        interactiveWrapper.appendChild(newItem);
                    } else {
                        // 模拟 Tooltip
                        const tooltipText = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('data-prts-tooltip', tooltipText);

                        grid.appendChild(newItem);
                        tag.style.display = 'none';
                    }

                    tag.dataset.opExtracted = "true";
                    hasProcessedAny = true;
                });

                // 只有当真的找到了干员并处理后，才给干员部分上锁
                // 这样即使干员也是异步加载的，也能正确处理
                if (hasProcessedAny && tags.length > 0) {
                   // labelDiv.dataset.opsProcessed = "true"; // 可选：如果干员列表不会变，可以加上这个锁
                }
            }
        }
    }

    // --- [V11.2 逻辑：适配单干员及列表] ---
    function enhancePopover(portalNode) {
        // 1. 找到内容容器
        const content = portalNode.querySelector('.bp4-popover2-content');
        if (!content || content.dataset.optimized) return;

        // 2. 获取原始文本
        const text = content.innerText.trim();

        // 3. 判断逻辑升级：
        // (1) 有箭头 "->" (Zoot标准格式)
        // (2) 有逗号 "," (列表格式)
        // (3) [新增] 单干员格式：取第一个词，看是否为有效干员名

        // 预处理：去掉可能的箭头，提取第一个词作为潜在干员名
        const cleanText = text.replace(/^->\s*/, '');
        const firstWord = cleanText.split(/[\s,，]+/)[0]; // 按空格或逗号分割，取第一个
        const isSingleOperator = OP_ID_MAP[firstWord];

        // 如果既不是箭头格式，也不是列表，且第一个词也不是干员，则认为是无关弹窗，直接返回
        if (!text.startsWith('->') && !text.includes(',') && !isSingleOperator) return;

        // 4. 解析干员列表 (逻辑保持不变，天然支持单干员)
        // 移除 "->" 前缀，按逗号分隔
        const rawList = cleanText.split(/[,，]\s*/);

        // 准备数据容器
        const validOps = [];

        rawList.forEach(entry => {
            const parts = entry.trim().split(/\s+/); // "纯烬艾雅法拉 1" -> ["纯烬艾雅法拉", "1"]
            const name = parts[0];
            const skill = parts[1] || "";

            // 检查是否在我们的 ID 库中
            if (OP_ID_MAP[name]) {
                validOps.push({
                    name: name,
                    id: OP_ID_MAP[name],
                    skill: skill
                });
            }
        });

        // 5. 只有当确实解析出了干员，才进行替换
        if (validOps.length > 0) {
            // 清空原有文字
            content.innerHTML = '';

            // 创建网格
            const grid = document.createElement('div');
            grid.className = 'prts-popover-grid';

            validOps.forEach(op => {
                const item = document.createElement('div');
                item.className = 'prts-popover-item';
                // 单干员时，title提示依然保留，体验更好
                item.title = `${op.name} ${op.skill ? '(技能 ' + op.skill + ')' : ''}`;

                const img = document.createElement('img');
                img.src = `https://zoot.plus/assets/operator-avatars/webp96/${op.id}.webp`;
                img.className = 'prts-popover-img';

                item.appendChild(img);

                if (op.skill) {
                    const badge = document.createElement('div');
                    badge.className = 'prts-popover-skill';
                    badge.innerText = op.skill;
                    item.appendChild(badge);
                }

                grid.appendChild(item);
            });

            content.appendChild(grid);

            // 标记已处理
            content.dataset.optimized = "true";
        }
    }

    function applyFilterLogic() {
        if (isFilterDisabledPage()) return;
        isProcessingFilter = true;

        try {
            let cards = document.querySelectorAll('ul.grid > li, .tabular-nums ul > li');
            if (cards.length === 0) return;

            cards.forEach(card => {
                const cardInner = card.querySelector('.bp4-card');
                if (!cardInner) return;

                // 1. [新增] 视觉优化 (头像化、徽章化、折叠描述)
                //    注意：这一步在筛选逻辑之前执行，改善视觉体验
                optimizeCardVisuals(card, cardInner);

                // 2. [原有] Bilibili 链接净化
                cleanBilibiliLinks(cardInner);

                // 3. [原有] 筛选逻辑 (保持不变，但需注意选择器)
                //    注意：虽然CSS隐藏了 .bp4-tag，但DOM中它们依然存在，
                //    所以下面的 querySelectorAll('.bp4-tag') 依然能正常工作。
                let isUnavailable = false;
                let statusType = null;
                let statusValue = null;

                if (currentFilterMode !== 'NONE') {
                    const tags = Array.from(card.querySelectorAll('.bp4-tag'));
                    let requiredOps = [];

                    tags.forEach(tag => {
                        if (tag.querySelector('h4')) return;
                        const text = tag.innerText.trim();
                        // 过滤非干员标签
                        if (['普通', '突袭', 'Beta'].includes(text) ||
                            text.includes('活动关卡') || text.includes('剿灭') || text.includes('危机合约') ||
                            text.includes('|') || text.startsWith('[') || text.includes('更新') ||
                            text.includes('医疗') || text.includes('奶')) return;

                        const opName = text.split(/\s+/)[0];
                        if (opName && !['json', '作者'].includes(opName)) {
                            requiredOps.push(opName);
                        }
                    });

                    let missingCount = 0;
                    let missingOpName = '';
                    requiredOps.forEach(op => {
                        if (!ownedOpsSet.has(op)) {
                            missingCount++;
                            if (missingCount === 1) missingOpName = op;
                        }
                    });

                    if (currentFilterMode === 'PERFECT') {
                        if (missingCount > 0) isUnavailable = true;
                    } else if (currentFilterMode === 'SUPPORT') {
                        if (missingCount > 1) isUnavailable = true;
                    }

                    if (isUnavailable) {
                        statusType = 'missing';
                        statusValue = missingCount;
                    } else if (currentFilterMode === 'SUPPORT' && missingCount === 1) {
                        statusType = 'support';
                        statusValue = missingOpName;
                    }
                }

                // 处理隐藏
                if (isUnavailable && displayMode === 'HIDE') {
                    if (card.style.display !== 'none') card.style.display = 'none';
                    return;
                } else {
                    if (card.style.display === 'none') card.style.display = '';
                }

                // 处理置灰
                const hasGrayClass = card.classList.contains('prts-card-gray');
                if (isUnavailable && displayMode === 'GRAY') {
                    if (!hasGrayClass) card.classList.add('prts-card-gray');
                } else {
                    if (hasGrayClass) card.classList.remove('prts-card-gray');
                }

                // 处理标签
                const existingLabel = cardInner.querySelector('.prts-status-label');
                if (!statusType) {
                    if (existingLabel) existingLabel.remove();
                    return;
                }

                let newHtml = '';
                let newClass = 'prts-status-label';
                if (statusType === 'support') {
                    newClass += ' prts-label-support';
                    newHtml = `<span class="bp4-icon" style="margin-right:6px;">🆘</span>需助战: ${statusValue}`;
                } else {
                    newClass += ' prts-label-missing';
                    newHtml = `<span class="bp4-icon" style="margin-right:6px;">✘</span>缺 ${statusValue} 人`;
                }

                if (existingLabel) {
                    if (existingLabel.innerHTML !== newHtml || existingLabel.className !== newClass) {
                        existingLabel.className = newClass;
                        existingLabel.innerHTML = newHtml;
                    }
                } else {
                    const labelDiv = document.createElement('div');
                    labelDiv.className = newClass;
                    labelDiv.innerHTML = newHtml;
                    cardInner.appendChild(labelDiv);
                }
            });

        } finally {
            isProcessingFilter = false;
        }
    }

    // --- [V6.3 侧边栏逻辑修复] ---
    function optimizeSidebar() {
        if (!CONFIG.sidebar) return;
        const cards = document.querySelectorAll('.bp4-card');

        cards.forEach(card => {
            if (card.dataset.sidebarOptimized) return;
            const textContent = card.innerText;

            // 1. 创作工具 (折叠)
            if (textContent.includes('创建新作业') || textContent.includes('拖拽上传')) {
                card.classList.add('prts-sidebar-collapsed');
                const header = card.querySelector('h4, h5, h3, .bp4-heading') || card.firstElementChild;
                if (header) {
                    header.classList.add('prts-sidebar-header-icon');
                    if (!header.dataset.origText) {
                         header.dataset.origText = header.innerText;
                         header.innerHTML = `🛠️ 创作工具`;
                         header.title = "点击展开/折叠";
                    }
                }
                card.onclick = (e) => {
                    if (e.target.closest('a') || e.target.closest('button')) return;
                    card.classList.toggle('prts-sidebar-collapsed');
                    card.classList.toggle('prts-sidebar-expanded');
                };
                card.dataset.sidebarOptimized = "true";
            }

            // 2. 公告 (按钮化)
            // 判断条件：包含“公告”二字，并且里面有个列表(ul)，确保没找错卡片
            if (textContent.includes('公告') && card.querySelector('ul')) {
                card.classList.add('prts-notice-btn');

                const header = card.querySelector('h4, h5, h3, .bp4-heading');
                if (header) {
                    // 使用 emoji 代替图标，保证绝对可见
                    header.innerHTML = `📢 站务公告 <span style="font-size:12px; opacity:0.7; font-weight:normal; margin-left:auto;">点击查看详情</span>`;

                    // 移除可能干扰颜色的原有类名 (text-gray-700)
                    header.classList.remove('text-gray-700');
                }

                card.dataset.sidebarOptimized = "true";
            }
        });
    }

    // --- [V6.1 弹窗内部优化：给公告标题加高亮标签] ---
    function optimizeDialogContent() {
        // 查找当前打开的弹窗
        const dialog = document.querySelector('.bp4-dialog');
        if (!dialog || dialog.dataset.contentOptimized) return;

        // 检查标题是否是“公告”
        const title = dialog.querySelector('.bp4-heading');
        if (title && title.innerText.includes('公告')) {

            // 找到内容区域 (.markdown-body)
            const contentBody = dialog.querySelector('.markdown-body');
            if (contentBody) {
                // 遍历所有的 H2 标题 (公告通常用 H2 分割)
                const headers = contentBody.querySelectorAll('h2');

                headers.forEach(h2 => {
                    const text = h2.innerText;
                    let tagHtml = '';

                    // 关键词匹配
                    if (text.includes('升级') || text.includes('优化') || text.includes('更新')) {
                        tagHtml = `<span class="prts-dialog-tag prts-tag-update">更新</span>`;
                    } else if (text.includes('修复') || text.includes('问题') || text.includes('Bug')) {
                        tagHtml = `<span class="prts-dialog-tag prts-tag-fix">维护</span>`;
                    } else if (text.includes('活动') || text.includes('关卡')) {
                        tagHtml = `<span class="prts-dialog-tag prts-tag-event">活动</span>`;
                    } else {
                        tagHtml = `<span class="prts-dialog-tag prts-tag-note">通知</span>`;
                    }

                    // 插入标签到标题最前面
                    // 注意：原标题里可能包含 span (日期)，我们只在最前面插入
                    if (!h2.querySelector('.prts-dialog-tag')) {
                        h2.innerHTML = tagHtml + h2.innerHTML;
                    }
                });
            }

            dialog.dataset.contentOptimized = "true";
        }
    }


    // =========================================================================
    //                            MODULE 6: 悬浮控制球 (UI/Logic)
    // =========================================================================

    // 配置状态 (使用 GM_getValue 存储开关状态，默认为 true)
    const CONFIG = {
        visuals: GM_getValue('prts_cfg_visuals', true), // 干员头像优化
        sidebar: GM_getValue('prts_cfg_sidebar', true), // 侧边栏优化
        cleanLink: GM_getValue('prts_cfg_link', true),  // 链接净化
        filterBar: GM_getValue('prts_cfg_filter', true) // 显示筛选栏
    };

    function saveConfig() {
        GM_setValue('prts_cfg_visuals', CONFIG.visuals);
        GM_setValue('prts_cfg_sidebar', CONFIG.sidebar);
        GM_setValue('prts_cfg_link', CONFIG.cleanLink);
        GM_setValue('prts_cfg_filter', CONFIG.filterBar);
        // 保存后通常需要刷新页面或重新触发逻辑，这里简单处理为刷新生效提示
        // 或者是实时生效（视功能而定）
    }

    // --- [V9.3 逻辑修复：修复点击后无法自动贴边隐藏的问题] ---
    function createFloatingBall() {
        if (document.getElementById('prts-float-container')) return;

        // 1. 读取位置
        const savedPos = JSON.parse(GM_getValue('prts_float_pos', '{"top":"40%","isRight":true}'));

        const container = document.createElement('div');
        container.id = 'prts-float-container';

        // 初始化位置
        container.style.top = savedPos.top;
        if (savedPos.isRight) {
            container.style.left = 'auto';
            container.style.right = '0px';
            container.classList.add('snap-right');
        } else {
            container.style.left = '0px';
            container.style.right = 'auto';
            container.classList.add('snap-left');
        }

        // 2. 创建按钮
        const btn = document.createElement('div');
        btn.className = 'prts-float-btn';
        btn.title = "脚本设置 (可拖拽)";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M27,7.35l-9-5.2a4,4,0,0,0-4,0L5,7.35a4,4,0,0,0-2,3.46V21.19a4,4,0,0,0,2,3.46l9,5.2a4,4,0,0,0,4,0l9-5.2a4,4,0,0,0,2-3.46V10.81A4,4,0,0,0,27,7.35Zm-11.74-3a1.51,1.51,0,0,1,1.5,0l8.49,4.9L16,14.56,6.76,9.22Zm-9,18.17a1.51,1.51,0,0,1-.75-1.3v-9.8l9.24,5.33V27.39Zm19.48,0-8.49,4.9V16.72l9.24-5.33v9.8A1.51,1.51,0,0,1,25.74,22.49Z"></path></svg>`;

        // 3. 创建面板
        const panel = document.createElement('div');
        panel.className = 'prts-settings-panel';

        // --- 面板内容构建 (保持不变) ---
        const createSwitch = (label, checked, onChange) => {
            const div = document.createElement('div');
            div.className = 'prts-panel-item';
            div.innerHTML = `<span>${label}</span><label class="prts-switch"><input type="checkbox" ${checked ? 'checked' : ''}><span class="prts-slider"></span></label>`;
            const input = div.querySelector('input');
            input.onchange = (e) => onChange(e.target.checked);
            return div;
        };
        const title = document.createElement('div');
        title.className = 'prts-panel-title';
        title.innerHTML = `<span style="margin-right:auto">功能开关</span><span style="font-size:12px;opacity:0.6">刷新生效</span>`;
        panel.appendChild(title);

        panel.appendChild(createSwitch('🌙 暗黑模式', isDarkMode, (val) => {
            isDarkMode = val; localStorage.setItem(DARK_MODE_KEY, isDarkMode); applyDarkMode(isDarkMode);
        }));
        panel.appendChild(createSwitch('🖼️ 作业卡片美化', CONFIG.visuals, (val) => {
            CONFIG.visuals = val; saveConfig(); if(val) requestFilterUpdate(); else location.reload();
        }));
        panel.appendChild(createSwitch('🗂️ 侧边栏净化', CONFIG.sidebar, (val) => {
            CONFIG.sidebar = val; saveConfig(); if(val) optimizeSidebar();
        }));
        panel.appendChild(createSwitch('🔗 视频链接优化', CONFIG.cleanLink, (val) => {
            CONFIG.cleanLink = val; saveConfig(); if(val) requestFilterUpdate();
        }));
        const importBtn = document.createElement('button');
        importBtn.className = 'prts-btn';
        importBtn.style.width = '100%'; importBtn.style.marginTop = '8px';
        importBtn.innerHTML = '📂 导入干员数据';
        importBtn.onclick = handleImport;
        panel.appendChild(importBtn);
        // --- 面板内容结束 ---

        container.appendChild(panel);
        container.appendChild(btn);
        document.body.appendChild(container);

        // =========================================================
        // 4. 拖拽逻辑 (已修复)
        // =========================================================
        let isDragging = false;
        let hasMoved = false;
        let startX, startY;
        let initialLeft, initialTop;

        btn.addEventListener('mousedown', (e) => {
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;

            const rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            container.classList.remove('is-snapping');
            container.classList.add('is-dragging');

            // 锁定当前位置，防止跳变
            container.style.left = initialLeft + 'px';
            container.style.top = initialTop + 'px';
            container.style.right = 'auto';
            // 关键：禁用 CSS transform，由 JS 接管位置
            container.style.transform = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
            }

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // 边界限制
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;
            const elWidth = container.offsetWidth;
            const elHeight = container.offsetHeight;

            if (newLeft < 0) newLeft = 0;
            if (newLeft > winWidth - elWidth) newLeft = winWidth - elWidth;
            if (newTop < 0) newTop = 0;
            if (newTop > winHeight - elHeight) newTop = winHeight - elHeight;

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            container.classList.remove('is-dragging');

            // [核心修复]：无论是否发生拖动，都要清除内联 transform
            // 否则 'transform: none' 会残留，导致 CSS 中的 translateX 失效，无法缩回
            container.style.transform = '';

            if (hasMoved) {
                // --- 吸附逻辑 ---
                const winWidth = window.innerWidth;
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;

                container.classList.add('is-snapping');

                let isRight = true;
                if (centerX < winWidth / 2) {
                    container.style.left = '0px';
                    container.style.right = 'auto';
                    container.classList.remove('snap-right');
                    container.classList.add('snap-left');
                    isRight = false;
                } else {
                    container.style.left = 'auto';
                    container.style.right = '0px';
                    container.classList.remove('snap-left');
                    container.classList.add('snap-right');
                    isRight = true;
                }

                const topPercent = (rect.top / window.innerHeight * 100).toFixed(1) + '%';
                container.style.top = topPercent;

                GM_setValue('prts_float_pos', JSON.stringify({
                    top: topPercent,
                    isRight: isRight
                }));
            }
        });

        // 5. 点击交互
        btn.onclick = (e) => {
            e.stopPropagation();
            if (!hasMoved) {
                container.classList.toggle('prts-float-open');
            }
        };

        panel.onclick = (e) => e.stopPropagation();

        document.addEventListener('click', () => {
            if (!isDragging) {
                container.classList.remove('prts-float-open');
            }
        });
    }


    // =========================================================================
    //                            MODULE 5: 统一执行与监听
    // =========================================================================

    function init() {
        // 1. 初始化暗黑模式 (立即执行)
        applyDarkMode(isDarkMode);

        // 2. 初始化筛选数据
        loadOwnedOps();
        createFloatingBall(); // <--- 启动悬浮球
        injectFilterControls();

        // 3. 统一观察者
        const observer = new MutationObserver((mutations) => {
            // A. 暗黑模式按钮守护
            manageDarkModeButton();

            // 调用右侧栏优化
            optimizeSidebar();

            // 监听弹窗变化
            optimizeDialogContent();

            // B. 筛选与页面变动检测
            if (isProcessingFilter) return;
            if (isFilterDisabledPage()) return;

            let domChanged = false;
            for (const mutation of mutations) {
                if (mutation.target.classList && mutation.target.classList.contains('prts-status-label')) continue;
                if (mutation.target.id === 'prts-filter-bar') continue;

                if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                    domChanged = true;
                    break;
                }
            }

            if (domChanged) {
                injectFilterControls();
                if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
                filterDebounceTimer = setTimeout(requestFilterUpdate, 50);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // --- [V11.1 修复] 针对 Portal 内部变化的专用观察者 ---
        // 解决：第二次悬停时，Portal 节点被复用导致无法触发替换的问题
        const portalInnerObserver = new MutationObserver((mutations) => {
            if (!CONFIG.visuals) return;
            // 当 Portal 内部发生变化时，尝试重新执行增强逻辑
            // 注意：enhancePopover 内部有 dataset.optimized 检查，防止死循环
            mutations.forEach(mutation => {
                const portalNode = mutation.target.closest('.bp4-portal');
                if (portalNode) {
                    enhancePopover(portalNode);
                }
            });
        });

        // 监听 Body 根目录下的弹窗生成
        const bodyObserver = new MutationObserver((mutations) => {
            if (!CONFIG.visuals) return;

            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        // 检查是否是 Blueprint 的 Portal
                        if (node.nodeType === 1 && node.classList.contains('bp4-portal')) {
                            // 1. 立即尝试处理 (针对第一次渲染)
                            setTimeout(() => enhancePopover(node), 0);

                            // 2. [关键修复] 持续监听这个 Portal 内部的变化
                            // 这样当鼠标第二次悬停，React 刷新内部文字时，我们能再次捕捉到
                            portalInnerObserver.observe(node, { childList: true, subtree: true });
                        }
                    });
                }
            });
        });

        bodyObserver.observe(document.body, { childList: true });

        // 保底定时器 (应对极其顽固的React刷新)
        setInterval(() => {
            manageDarkModeButton();
            optimizeSidebar();
            optimizeDialogContent();
            createFloatingBall();
            if (CONFIG.sidebar) optimizeSidebar(); // 加入开关控制
            if (!isFilterDisabledPage() && !document.getElementById('prts-filter-bar')) {
                injectFilterControls();
            }
        }, 1000);
    }

    // 启动
    init();

})();