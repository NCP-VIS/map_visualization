const projection_center = [108, 38];

var city_data = [];  // 保存每个城市编号、名字、confirmed_number(确诊数)
var traffic_data = [];
var city_name_to_code_mapping = [];

var comfirmed_data;
var migration_data;
var confirmed_ratio = {data : [], max_number: 0.0};

var map_city_json;
var map_china_json;

const days = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];

function drawCity(smap, china_json, city_json) {
    const mapID = smap.mapID;
    let svg = smap.svg;
    let china = svg.append("g").attr('id', mapID + 'chinaMap');

    if (!smap.SHOW_CITYS) {
        let provinces = china.selectAll('path')
            .data(china_json.features)
            .enter()
            .append('path')
            .attr('d', smap.path)
            .attr('id', function (d) {
                return mapID + d.properties.name;
            })
            .attr('class', 'province')
            .attr('fill', '#fff')
            .attr('stroke', '#000')
            .attr('stroke-width', '0.3')
            .attr('center', function (d) {
                return d.properties.cp;
            })
            .on('mouseover', function (d) {
                d3.select(this)
                    .style('fill', SELECTEDCOLOR)
                    .attr('stroke', '#000')
                    .attr('stroke-width', '0.5')
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .style('fill', UNSELECTEDCOLOR)
                    .attr('stroke', '#000')
                    .attr('stroke-width', '0.3')
            })
    }

    if (smap.SHOW_CITYS) {
        let citys = china.selectAll('path')
            .data(city_json.features)
            .enter()
            .append('path')
            .attr('d', smap.path)
            .attr('id', function (d) {
                return mapID + "city_" + d.properties.code;
            })
            .attr('center', function (d) {
                return d.properties.centroid;
            })
            .attr('class', 'city')
            .attr('fill', '#fff')
            .attr('stroke', '#000')
            .attr('stroke-width', '0.3');
    }

    let circle = svg.append("g").selectAll("circle")
        .data(city_json.features)
        .enter()
        .append("circle")
        .attr("cx", (d) => smap.projection(d.properties.centroid)[0])
        .attr("cy", (d) => smap.projection(d.properties.centroid)[1])  // Zhenhua: 这里必须也用投影
        .attr("r", 0)
        .attr("fill-opacity", 0.5)
        .attr('class', 'circle')
        .attr("id", function (d) {
            return mapID + "circlecity_" + d.properties.code;
        });
}

function updateDate(smap, day) {
    let nDate = new Date(1 + '/' + 1 + '/' + 2020); //转换为MM-DD-YYYY格式
    let millSeconds = Math.abs(nDate) + (day * 24 * 60 * 60 * 1000);
    let rDate = new Date(millSeconds);
    let year = rDate.getFullYear();
    let month = rDate.getMonth() + 1;
    if (month < 10) month = "0" + month;
    let date = rDate.getDate();
    if (date < 10) date = "0" + date;
    d3
        .select("#" + smap.mapID + "singlemap")
        .select(".main-date")
        .text('日期: ' + month + '月' + date + '日');
    return [year, month, date];
}

function drawButtonLegend(smap) {
    let lenged = smap.legend.append('g');
    const w = smap.w, h = smap.h, mapID = smap.mapID, mt_cy = smap.mt_cy;
    lenged.append('text')
        .text(smap.legendText)//'内陆疫情与人口迁出图')
        .attr('class', 'main-title')
        .attr('x', w / 2)
        .attr('y', h / 15)
        .style('text-anchor', 'middle')
        .style('font-size', '2em')
        .style('fill', '#fff');

    lenged.append('text')
        .text('日期：')
        .attr('class', 'main-date')
        .attr('x', w / 10)
        .attr('y', 0.8 * h)
        .style('text-anchor', 'left')
        .style('font-size', '1.5em')
        .style('fill', '#fff');

    const t = Math.min(w, h);
    d3.select('.legend-area')
        .attr('style', "transform:translate(" + 0.666 * t + "px," + 0.8 * t + "px)");

    let mtimeline = lenged.append("g").attr("id", mapID + "mtimeline");
    let node_g = mtimeline.selectAll("g")
        .data(Array.from({ length: days.length }, (v, k) => k))
        .enter().append("g");

    const mt_radius = smap.mt_radius;
    const left = 20 + w / 2 - 1.66 * mt_radius * days.length;
    function cx(d){
        return left + 2.8 * mt_radius * d;
    }

    node_g.append("line")
        .attr("x1", cx)
        .attr("y1", mt_cy)
        .attr("x2", (d) => cx(d+1))
        .attr("y2", mt_cy)
        .attr("stroke-width", function (d) {
            return d + 1 < days.length ? 2 : 0;
        })
        .attr("stroke", "#000");

    node_g.append("circle")
        .attr("id", (d) => (mapID + "mtimeline" + d))
        .attr("r", mt_radius)
        .attr("cx", cx)
        .attr("cy", mt_cy)
        .attr("class", "unselectMTimeLine")
        .on("mouseover", function (d) {
            let t = d3.select(this);
            if(t.attr("class") === "unselectMTimeLine"){
                t.attr("class", "unselectHoverMTimeLine");
            }
        })
        .on("mouseout", function (d) {
            let t = d3.select(this);
            if(t.attr("class") === "unselectHoverMTimeLine"){
                t.attr("class", "unselectMTimeLine");
            }
        })
        .on("click", function (d) {
            //console.log("button click", smap.today);
            pause_btn_func();
            turnDay(smap, d);
        });

    function draw_left_tri(left1, y_offset = mt_radius + 4){
        return  (left1 + y_offset) + "," + (mt_cy + y_offset)
            + " " + (left1) + "," + mt_cy
            + " " + (left1 + y_offset) + "," + (mt_cy - y_offset);
    }

    function draw_right_tri(left1, y_offset = mt_radius + 4){
        return (left1 + y_offset) + "," + (mt_cy) + " "
            + (left1) + "," + (mt_cy - y_offset) + " "
            + (left1) + "," + (mt_cy + y_offset);
    }

    function tri_token(tri){
        tri.attr("stroke-width", 0)
            .attr("stroke", "#DA9492")
            .attr("fill", "#C23531")
            .on("mouseover", function () {
                d3.select(this).attr("stroke-width", 2);
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke-width", 0);
            });
    }

    let tri_left = mtimeline.append("g").append("polygon")
        .attr("points", function () {
            return draw_left_tri(left - mt_radius * 3.5);
        })
        .attr("id", mapID + "mt_tri_left")
        .on("click", function () {
            //console.log("tri left", smap.today);
            if(smap.today > 0){
                let t = d3.select("#" + mapID + "mtimeline" + (smap.today - 1));
                t.on("click").apply(t, [smap.today - 1]);
            }
        });
    tri_token(tri_left);

    let tri_right = mtimeline.append("g").append("polygon")
        .attr("points", function () {
            return draw_right_tri(cx(days.length) - mt_radius - 2);
        })
        .attr("id", mapID + "mt_tri_right")
        .on("click", function () {
            if(smap.today < days.length - 1){
                d3.select("#" + mapID + "mtimeline" + (smap.today + 1)).on('click').apply(this, [smap.today + 1]);
            }
        });

    tri_token(tri_right);

    function start_btn_func() {
        if(!smap.is_play){
            smap.is_play = true;
            updatesAll(smap, smap.today);
        }
        else{
            console.log("is playing...");
        }
    }
    function pause_btn_func() {
        smap.is_play = false;
        if(smap.timer != null){
            window.clearTimeout(smap.timer);
        }
    }
    function reset_btn_func() {
        pause_btn_func();
        turnDay(smap,0);
    }
    function start_btn_style(scale){
        return "transform:translate(" + (cx(days.length) + 1.5 * mt_radius) + "px,"
            + (mt_cy - mt_radius - 5.5) + "px)" + "scale(" + scale + ")";
    }
    function pause_btn_style(scale){
        return "transform:translate(" + (cx(days.length) + 5.5 * mt_radius) + "px,"
            + (mt_cy - mt_radius - 5.5) + "px)" + "scale(" + scale + ")";
    }
    function reset_btn_style(scale){
        return "transform:translate(" + (cx(days.length) + 9.5 * mt_radius) + "px,"
            + (mt_cy - mt_radius - 5.5) + "px)" + "scale(" + scale + ")";
    }
    function gen_btn(onclickfn, stylefn, id, d){
        return mtimeline.append("g").append("path")
            .attr("id", id)
            .attr("fill", "#C23531")
            .on("mouseover", function () {
                d3.select(this).attr("fill", "#E26531");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "#C23531");
            })
            .attr("style",stylefn(0.025))
            .attr("d",  d)
            .on("click", onclickfn);
    }

    const iconres = {
        "start": "M743.4 476l-352-214c-31.6-17.6-71.4 5-71.4 42v416c0 36.8 39.6 59.6 71.4 42l352-202c32.8-18.2 32.8-65.6 0-84zM1008 512C1008 238 786 16 512 16S16 238 16 512s222 496 496 496 496-222 496-496z m-896 0c0-221 179-400 400-400s400 179 400 400-179 400-400 400S112 733 112 512z",
        "pause": "M512 16C238 16 16 238 16 512s222 496 496 496 496-222 496-496S786 16 512 16z m0 896c-221 0-400-179-400-400S291 112 512 112s400 179 400 400-179 400-400 400z m192-560v320c0 17.6-14.4 32-32 32h-96c-17.6 0-32-14.4-32-32V352c0-17.6 14.4-32 32-32h96c17.6 0 32 14.4 32 32z m-224 0v320c0 17.6-14.4 32-32 32h-96c-17.6 0-32-14.4-32-32V352c0-17.6 14.4-32 32-32h96c17.6 0 32 14.4 32 32z",
        "reset": "M1008 512C1008 238 786 16 512 16S16 238 16 512s222 496 496 496 496-222 496-496z m-896 0c0-221 179-400 400-400s400 179 400 400-179 400-400 400S112 733 112 512z m592-160v320c0 17.6-14.4 32-32 32H352c-17.6 0-32-14.4-32-32V352c0-17.6 14.4-32 32-32h320c17.6 0 32 14.4 32 32z"
    };

    let start_button = gen_btn(start_btn_func, start_btn_style, "mtimelinestart",iconres["start"]);
    let pause_button = gen_btn(pause_btn_func, pause_btn_style, "mtimelinepause",iconres["pause"]);
    let reset_button = gen_btn(reset_btn_func, reset_btn_style, "mtimelinereset", iconres["reset"]);
}

function initUI(smap) {
    drawCity(smap, map_china_json, map_city_json);
    drawButtonLegend(smap);
    initMTimeLine(smap);
}

function ProcessConfirmedData(confirmed_json, popu_pro_json, popu_city_json) {
    comfirmed_data = confirmed_json;
    let average_city_popu = 0.0, city_cnt = 0;
    for(let mcity in popu_city_json){
        average_city_popu += popu_city_json[mcity][1];
        city_cnt++;
    }
    average_city_popu /= city_cnt;
    // let tt = [];
    for(let city_id in confirmed_json.data){
        let popu = popu_city_json[city_id];
        if(popu === undefined){ // 不是城市，是省份
            for(let j in popu_pro_json){
                if(popu_pro_json[j][0] === parseInt(city_id)){
                    popu = [j, popu_pro_json[j][1]];
                    break;
                }
            }
            if(popu === undefined){
                popu = ["city" + city_id, average_city_popu];
            }
        }
        const confirmed_seq = confirmed_json.data[city_id];
        let t = confirmed_ratio.data[city_id] = [];
        for(let day in confirmed_seq){
            let d = Object();
            d.number = confirmed_seq[day].number / popu[1];
            //console.log(popu, "number", confirmed_seq[day].number, "yday", confirmed_seq[day].yday, "divide", d.number);
            confirmed_ratio.max_number = Math.max(confirmed_ratio.max_number, d.number);
            d.yday = confirmed_seq[day].yday;
            t.push(d);
        }
    }

    //console.log(confirmed_ratio);
    //console.log(tt);
}

function ProcessMigrationData(json) {
    migration_data = json;
}

function ProcessTrafficData(json) {
    traffic_data = json;
}

function ProcessData(china_json, city_json, confirmed_json, migration_json, traffic_json,
                     popu_pro_json, popu_city_json)
{
    for (let d of city_json.features) {
        city_data[d.properties.code] = { 'city_name': d.properties.name, 'confirmed_number': [] };
        city_name_to_code_mapping[d.properties.name] = { 'city_code': d.properties.code, 'center': d.properties.centroid };
    }
    ProcessConfirmedData(confirmed_json, popu_pro_json, popu_city_json);
    ProcessMigrationData(migration_json);
    ProcessTrafficData(traffic_json);
    map_city_json = city_json;
    map_china_json = china_json;
}

function TranslationAndScaling(singleMap) {
    const w = singleMap.w, h = singleMap.h;
    if (w > h) {
        singleMap.translation = [w / 1.9, h / 2];
        singleMap.scaling = Math.min(w, h);
    } else {
        singleMap.translation = [w / 1.8, h / 2];
        singleMap.scaling = Math.min(w, h) * 0.8;
    }
}

function createSingleMapDiv(smap) {
    const mapID = smap.mapID;
    let totDiv = $('<div></div>')
        .attr("id", mapID + "singlemap")
        .appendTo("body");
    let mapDiv = $('<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0;"></div>')
        .attr("id", mapID + "map")
        .appendTo(totDiv);
    let heatDiv = $('<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0;"></div>')
        .attr("id", mapID + "heatmap")
        .appendTo(totDiv);
    let legendDiv = $('<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0; "></div>')
        .attr("id", mapID + "legend")
        .appendTo(totDiv);
    let legendAreaDiv = $('<div class="legend-area"></div>')
        .attr("style", "transform:translate(" + 0.666 * smap.w + "px," + 0.8 * smap.h + "px);")
        .appendTo(legendDiv);
    let spanMin = $('<span></span>')
        .attr("id", mapID + "min")
        .appendTo(legendAreaDiv);
    let spanMax = $('<span></span>')
        .attr("id", mapID + "max")
        .appendTo(legendAreaDiv);
    let gradientImg = $('<img src="" alt="" style="width:100%" />')
        .attr("id", mapID + "gradient")
        .appendTo(legendAreaDiv);
    let mapWrapperDiv = $('<div></div>')
        .attr("id", mapID + "map-wrapper")
        .appendTo(totDiv);
    return totDiv;
}

function singleMapUpdate(smap, target){
    let day_number = days[target];
    //updateBubble(smap, 18);
    updateDate(smap, day_number);
    if(smap.DRAW_LINE){
        updateLine(smap, smap.today, target);
    }
}

// 把现有模块封装起来
function createSingleMap(singleMapID,
                         WIDTH = null,
                         HEIGHT = null,
                         before_svg_func = (smap) => {},
                         update_func = singleMapUpdate,
                         THRESHOLD = 80,
                         legendText = '可视化',
                         AUTO_PLAY = true,
                         DRAW_LINE = false,
                         show_citys = false,
                         //SELECTEDCOLOR = '#F0F3F3',
                         //UNSELECTEDCOLOR = '#FFF'
)
{
    let obj = Object();
    obj.mapID = singleMapID;
    obj.updateFunc = update_func;
    obj.AUTO_PLAY = AUTO_PLAY;
    obj.DRAW_LINE = DRAW_LINE;
    obj.SHOW_CITYS = show_citys;
    obj.THRESHOLD = THRESHOLD;
    obj.legendText = legendText;
    obj.w = WIDTH == null ? parseInt(d3.select('#' + obj.mapID +'map').style('width')) : WIDTH;
    obj.h = HEIGHT == null ? parseInt(d3.select('#' + obj.mapID +'map').style('height')): HEIGHT;
    obj.totDiv = createSingleMapDiv(obj);
    obj.mt_radius = 8;
    obj.mt_cy = 0.95 * obj.h;

    before_svg_func(obj);

    obj.svg = d3.select('#' + obj.mapID + 'map').append('svg')
        .attr('width', obj.w).attr('height', obj.h);

    obj.today = -1;
    obj.is_play = true;
    obj.timer = null;
    obj.legend = d3.select('#' + obj.mapID + 'legend').append('svg')
        .attr('width', obj.w).attr('height', obj.h);

    TranslationAndScaling(obj);
    obj.projection = d3.geo.mercator().center(projection_center).translate(obj.translation).scale(obj.scaling);
    obj.path = d3.geo.path().projection(obj.projection);

    return obj;
}

function MyMapUpdate0(smap, target) {
    let day_number = days[target];
    updateHeatmap(smap, day_number, confirmed_ratio);
    singleMapUpdate(smap, target);
}

function MyMapUpdate1(smap, target) {
    let day_number = days[target];
    updateHeatmap2(smap, day_number, comfirmed_data);
    singleMapUpdate(smap, target);
}

function MyMapUpdate2(smap, target) {
    let day_number = days[target];
    updateHeatmap2(smap, day_number, confirmed_ratio);
    singleMapUpdate(smap, target);
}

function MyMapUpdate3(smap, target) {
    let day_number = days[target];
    updateHeatmap(smap, day_number, comfirmed_data);
    singleMapUpdate(smap, target);
}

function MyMapUpdate4(smap, target) {
    let day_number = days[target];
    //updateHeatmap(smap, day_number, comfirmed_data);
    //console.log(migration_data);
    //console.log(comfirmed_data);
    updateBubble(smap, day_number);
    singleMapUpdate(smap, target);
}

function MyMapUpdate5(smap, target){
    let day_number = days[target];
    updateHeatmapMigration(smap, day_number, migration_data);
    //updateHeatmap(smap, day_number, comfirmed_data);
    singleMapUpdate(smap, target);
}

function MyMapUpdate6(smap, target){
    let day_number = days[target];
    updateHeatmapConfirmDivMigration(smap, day_number, comfirmed_data);
    //updateHeatmap(smap, day_number, comfirmed_data);
    singleMapUpdate(smap, target);
}

function initHeatMap(smap){
    smap.heatmapInstance = h337.create({
        container: document.querySelector('#' + smap.mapID + 'heatmap'),
        radius: Math.min(smap.w, smap.h) / 50,
        blur: .85,
        maxOpacity: .4,
        onExtremaChange: function (data) {
            updateLegend(smap, data);
        }
    });

    smap.legendCanvas = document.createElement('canvas');
    smap.legendCanvas.width = 100;
    smap.legendCanvas.height = 10;
    smap.mmin = document.querySelector('#' + smap.mapID + 'min');
    smap.mmin.style.float = "left";
    smap.mmax = document.querySelector('#' + smap.mapID + 'max');
    smap.mmax.style.float = "right";
    smap.gradientImg = document.querySelector('#' + smap.mapID + 'gradient');

    smap.legendCtx = smap.legendCanvas.getContext('2d');
    smap.gradientCfg = {};
}

// 生成[l, r]范围的随机数
function myrand(l, r) {
    return Math.random() * (r - l) + l;
}

// 绘制第day天的线条
function drawLine(smap, day) {
    const mapID = smap.mapID;
    let traffics = traffic_data[days[day]];
    if (traffics !== undefined) {
        let mpairs = [];
        for (let d of traffics) {
            // TODO: 看起来traffic_data有点问题，有的to_center不是[,] 而是0
            // 有的from_center和to_center相等
            if(d.from_center !== 0 && d.to_center !== 0){
                if(d.from_center[0] !== d.to_center[0] || d.from_center[1] !== d.to_center[1]){
                    mpairs.push([d.from_center, d.to_center]);
                }
            }
        }
        let mline = smap.svg.append("g").attr("id", mapID + "mline" + day);
        mline
            .selectAll('path')
            .data(mpairs)
            .enter()
            .append('path')
            .attr('d', function (d) {
                const drawtype = 'c_shape';
                const p0 = smap.projection(d[0]), p1 = smap.projection(d[1]); // 两个端点
                const delta = [p1[0] - p0[0], p1[1] - p0[1]];
                switch (drawtype){
                    case "line":{
                        return 'M' + p0 + '  L' + p1;
                    }
                    case "s_shape": case "c_shape":{
                        // s_shape: S型曲线， c_shape: C型曲线
                        // 添加两个中间点，作为三次贝塞尔曲线的控制点
                        // 在线段的1/3 和 2/3 处，稍微偏离线段meps长处，加上控制点t1, t2
                        // 因为有fill，所以有一定宽度，所以能表示流量
                        const meps = 10;
                        const t1_offset = 0.333 + myrand(-0.1, 0.1);
                        const t2_offset = 0.666 + myrand(-0.1, 0.1);
                        // 稍微t1, t2引入随机偏移，如果有多趟相同位置的车次，不会重合
                        let t1 = [t1_offset * delta[0] + p0[0], t1_offset * delta[1] + p0[1]];
                        let t2 = [t2_offset * delta[0] + p0[0], t2_offset * delta[1] + p0[1]];
                        const len_delta = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);
                        let orient = [meps * delta[1] / len_delta, - meps * delta[0] / len_delta];
                        if(orient[1] < 0){
                            // 让C形凸起朝向相同
                            orient = [-orient[0], -orient[1]];
                        }
                        t1 = [orient[0] + t1[0], orient[1] + t1[1]];
                        if(drawtype === "s_shape"){
                            t2 = [-orient[0] + t2[0], -orient[1] + t2[1]]; // 也可以反向
                        }
                        else if (drawtype === "c_shape"){
                            t2 = [orient[0] + t2[0], orient[1] + t2[1]];
                        }
                        return 'M' + p0 + ' C' + t1 + ' ' + t2 + ' ' + p1; // 三次贝塞尔曲线
                    }
                }
            })
            .attr("stroke", "#f00")
            .attr("stroke-width", 1)
            .attr("fill", "#fa0")
            .attr("fill-opacity", 0.1);
    }

    // Zhenhua: TODO: 鼠标移动到车次线上，能显示出车次相关信息。
    // TODO: 添加箭头. 或是添加从出发点到终止点的动画
}

function updateBubble(smap, day) {
    const mapID = smap.mapID;
    let full_date = updateDate(smap, day);
    let migration_numbers = migration_data[full_date[0] + full_date[1] + full_date[2]];
    if (migration_numbers !== undefined) {
        for (let d of migration_numbers) {
            let migration_value = d.value;
            let selected_city_item = city_name_to_code_mapping[d.city_name];
            if (selected_city_item !== undefined) {
                let selected_id = selected_city_item.city_code;
                let linearScale = d3.scale.linear()
                    .domain([0, 15])
                    .range(['#0000FF', '#EE113D']);
                //console.log("migration_value", migration_value);
                const baseline = 0.8;
                //migration_value = Math.sqrt(migration_value)
                //if (migration_value > baseline) {
                //    migration_value = baseline + Math.sqrt(migration_value - baseline)
                //}
                if (migration_value > baseline) {
                    migration_value = baseline + Math.sqrt(migration_value - 2) / 30
                }
                const radius = Math.sqrt(migration_value) * 10;
                let circles = d3.select('#' + mapID + 'circlecity_' + selected_id)
                    .attr("r", radius)
                    .attr("fill", linearScale(migration_value));
            }
        }
    }
}

function updateHeatmapConfirmDivMigration(smap, day, mdata){
    //console.log("updateHeatmapConfirmDivMigration");
    //console.log(migration_data);
    //const mapID = smap.mapID;
    let average_migration = 0.0, cnt = 0;
    for(let mday in days){
        let full_date = updateDate(smap, days[mday]);
        let migration_numbers = migration_data[full_date[0] + full_date[1] + full_date[2]];
        if(migration_numbers !== undefined) {
            for (let city_idx in migration_numbers) {
                let val = migration_numbers[city_idx]["value"];
                if(val !== undefined && !isNaN(val)){
                    average_migration += val;
                }
                cnt++;
            }
        }
    }
    average_migration /= cnt;
    //console.log(average_migration);
    let confirmed_numbers = mdata.data; //comfirmed_data.data;
    let max_confirmed = mdata.max_number;//comfirmed_data.max_number;
    let points = [];
    let full_date = updateDate(smap, day);
    let migration_numbers = migration_data[full_date[0] + full_date[1] + full_date[2]];
    //console.log(migration_data);

    for(let city_id in confirmed_numbers){
        let city = confirmed_numbers[city_id];
        let mig_city = null;
        for(let mig_city_id in migration_numbers){
            mig_city = migration_numbers[mig_city_id];
            if(mig_city["code"] === city_id){
                break;
            }
        }
        let val = average_migration;
        if(mig_city != null){
            val = mig_city["value"];
        }
        //console.log("city_id", city_id, "city_name", mig_city["city_name"], "migration", val);
        let city_migration = 1e-10;
        let selected_number = 1e-10;
        for(let dd in city){
            if (dd.yday === (day - 1)){
                selected_number = dd.number / val;
                break;
            }
        }
        const p = smap.projection(mig_city["centroid"]);
        if(isNaN(p[1]) || isNaN(p[0])){
            continue;
        }
        points.push({
            x: Math.floor(p[0]),
            y: Math.floor(p[1]),
            value: val < 1e-10 ? 1e-10: Math.sqrt(val) })
    }
    let data = {
        min: 0,
        max: smap.THRESHOLD,
        data: points
    };
    smap.heatmapInstance.setData(data);
}

function updateHeatmapMigration(smap, day, mdata){
    //const mapID = smap.mapID;
    let full_date = updateDate(smap, day);
    let migration_numbers = mdata[full_date[0] + full_date[1] + full_date[2]];
    let points = [];
    if(migration_numbers !== undefined) {
        for (let city_idx in migration_numbers) {
            let city = migration_numbers[city_idx];
            const p = smap.projection(city["centroid"]);
            if(isNaN(p[1]) || isNaN(p[0])){
                continue;
            }
            //let mval = Math.max(2.0, city["value"]);
            points.push({x: Math.floor(p[0]), y: Math.floor(p[1]), value: Math.sqrt(city["value"])});
        }
    }
    let data = {
        //min: 0,
        max: smap.THRESHOLD,
        data: points
    };
    smap.heatmapInstance.setData(data);
}

function updateHeatmap2(smap, day, mdata) {
    var confirmed_numbers = mdata.data;//comfirmed_data.data;
    var max_confirmed = mdata.max_number; //comfirmed_data.max_number;
    var points = [];
    var circles = d3.selectAll(".circle").each(function (d, i) {
        var selected_id = d3.select(this).attr("id").split('_')[1];
        if(selected_id.slice(-4,) === "0000"){
            if(selected_id !== "110000" && selected_id !=="310000" && selected_id !== "500000" && selected_id !== "710000"){
                return;
            }
        }
        var selected_number = 0;
        var last_number = 0;
        var full_date = updateDate(smap, day);
        if (confirmed_numbers[selected_id] != undefined) {
            for (var d of confirmed_numbers[selected_id]) {
                if (d.yday == (day - 2)) {
                    last_number = d.number;
                }
                if (d.yday == (day - 1))
                    selected_number = d.number;
            }
            const res = selected_number - last_number;
            points.push({ x: Math.floor(d3.select(this).attr("cx") ),
                y: Math.floor(d3.select(this).attr("cy") ),
                value: res < 1e-10 ? 1e-10 : res})
        }
    });
    var data = {
        min: 0.0,
        max: smap.THRESHOLD,
        data: points
    };
    smap.heatmapInstance.setData(data);
}

// 这里的day是具体日期, 不是编号
function updateHeatmap(smap, day, mdata, sel_func = (val) => {return val;}) {
    const mapID = smap.mapID;
    let confirmed_numbers = mdata.data; //comfirmed_data.data;
    let max_confirmed = mdata.max_number;//comfirmed_data.max_number;
    let points = [];
    let circles = d3
        //.select("#" + smap.mapID + "singlemap")
        .selectAll(".circle")
        .each(function (d, i) {
            const selected_id = d3.select(this).attr("id").split('_')[1];
            //console.log("selected_id", selected_id);
            if(selected_id.slice(-4,) === "0000"){
                if(selected_id !== "110000" && selected_id !=="310000" && selected_id !== "500000" && selected_id !== "710000"){
                    return;
                }
            }
            let selected_number = 0.0;
            if (confirmed_numbers[selected_id] !== undefined) {
                for (let dd of confirmed_numbers[selected_id]) {
                    if (dd.yday === (day - 1)){
                        selected_number = dd.number;
                        break;
                    }
                }
                const val = sel_func(selected_number);
                points.push({
                    x: Math.floor(d3.select(this).attr("cx") ),
                    y: Math.floor(d3.select(this).attr("cy") ),
                    value: val < 1e-10 ? 1e-10: val })
                // 貌似是heatmap的bug，如果全是0，显示会出问题..
            }
        });
    //console.log("updateHeatMap", day);
    let data = {
        min: 0,
        max: smap.THRESHOLD,
        data: points
    };
    smap.heatmapInstance.setData(data);
}

// 把线条从today更新到第day天
// 这里today_copy和targetday传入的都是第几天，不是具体日期
function updateLine(smap, today_copy, targetday) {
    if (today_copy > targetday) { // 回退。隐藏已经画好的线
        for (let i = targetday + 1; i <= today_copy; i++) {
            let mline = smap.svg.select("#" + smap.mapID + "mline" + i);
            mline.attr("visibility", "hidden");
        }
    }
    else {
        for (let i = today_copy + 1; i <= targetday; i++) {
            // 如果已经画好了，直接显示。如果还没画，就绘制。
            let mline = smap.svg.select("#" + smap.mapID + "mline" + i);
            if (mline[0][0] == null) {
                drawLine(smap, i);
            }
            else {
                mline.attr("visibility", "visible");
            }
        }
    }
}

function turnDay(smap, targetday) {
    if (targetday > days.length) {
        console.log("Target Day > Max Day.");
        return null;
    }

    // 或者换一种写法, 直接找id
    d3
        .select("#" + smap.mapID + "singlemap")
        .selectAll(".selectMTimeLine")
        .attr("class", "unselectMTimeLine")
        .attr("r", smap.mt_radius);

    d3
        .select("#" + smap.mapID + "singlemap")
        .select("#" + smap.mapID + "mtimeline" + targetday)
        .attr("class", "selectMTimeLine")
        .attr("r", smap.mt_radius + 2);
    smap.updateFunc(smap, targetday);
    smap.today = targetday;
}

function updateLegend(smap, data) {
    // the onExtremaChange callback gives us min, max, and the gradientConfig
    // so we can update the legend
    smap.mmin.innerHTML = data.min;
    smap.mmax.innerHTML = ">" + smap.THRESHOLD + "人";
    // regenerate gradient image
    //console.log(data.gradient);
    if (data.gradient !== smap.gradientCfg) {
        smap.gradientCfg = data.gradient;
        let gradient = smap.legendCtx.createLinearGradient(0, 0, 100, 1);
        for (let key in smap.gradientCfg) {
            gradient.addColorStop(key, smap.gradientCfg[key]);
        }

        smap.legendCtx.fillStyle = gradient;
        smap.legendCtx.fillRect(0, 0, 100, 10);
        smap.gradientImg.src = smap.legendCanvas.toDataURL();
    }
}

function updatesAll(smap, i) {
    if (smap.is_play) {
        if (i <= days.length) {
            smap.timer = setTimeout(function () {
                turnDay(smap, i);
                updatesAll(smap, i + 1);
            }, 500)
        }
        else {
            i = 0;
            turnDay(smap, i);
            updatesAll(smap, i + 1);
        }
    }
}

function initMTimeLine(smap) {
    d3.selectAll("#" + smap.mapID + "mtimeline" + 0).on("click").apply(this, [0]);
    if(smap.AUTO_PLAY){
        smap.is_play = true;
        updatesAll(smap, smap.today);
    }
}

function LoadAll(func) {
    $.when(
        $.getJSON("./data/china.json"), // 中国地图，精确到省级
        $.getJSON("./data/city.json"),  // 中国地图，精确到市级
        $.getJSON("./data/data-c.json"),  // 确诊数量
        $.getJSON("./data/420100_to_citys_20200101_20200203_percent.json"),
        $.getJSON("./data/traffic.parsed.json"), // 交通信息
        $.getJSON("./data/population_province1.json"), // 精确到省的人口数量
        $.getJSON("./data/population_city.json"), // 精确到市的人口数量
    )
        .done(
            function (china_res, city_res, confirmed_res, migration_res, traffic_res,
                      popu_city_res, popu_pro_res)
            {
                ProcessData(china_res[0], city_res[0], confirmed_res[0], migration_res[0], traffic_res[0],
                    popu_city_res[0], popu_pro_res[0]);
                func();
            })
}
