
LoadAll(myloadfunc); // in common.js

function myloadfunc(){
    let map32 = createSingleMap("map32", 800, 600,
    initHeatMap, MyMapUpdate4, 40, "每日武汉流出人口气泡图",
    true, false, true);
    map32.totDiv.attr("style", "transform:translateX(0px)");
    initUI(map32);
}
