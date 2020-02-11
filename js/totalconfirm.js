
LoadAll(myloadfunc); // in common.js

function myloadfunc(){
// 已经确诊
    let map31 = createSingleMap("map31", 600, 600,
        initHeatMap, MyMapUpdate3, 120, "各省市确诊人数每日累计量",
        true, false, true);
    map31.totDiv.attr("style", "transform:translateX(0px)");
    initUI(map31);
}
