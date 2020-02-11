
LoadAll(myloadfunc); // in common.js

function myloadfunc(){
    //累计确诊 / 当地人口
    let map40 = createSingleMap("map40", 600, 600,
    initHeatMap, MyMapUpdate0, 0.15, "累计确诊与当地人口比例",
    true, false, true);
    map40.totDiv.attr("style", "transform:translateX(0px)");
    initUI(map40);

    // 新增确诊 / 当地人口
    let map1 = createSingleMap("map1", 600, 600,
        initHeatMap, MyMapUpdate2, 0.04, "新增确诊与当地人口比例",
        true, false, true);
    map1.totDiv.attr("style", "transform:translate(600px)");
    initUI(map1);
}
