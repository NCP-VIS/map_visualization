var SELECTEDCOLOR = '#F0F3F3';
var UNSELECTEDCOLOR = '#FFF';
//var THRESHOLD = 80;

var w = parseInt(d3.select('#map').style('width'));
var h = parseInt(d3.select('#map').style('height'));

const projection_center = [108, 38];

if (w > h) {
    translation = [w / 1.9, h / 2];
    scaling = Math.min(w, h);
} else {
    translation = [w / 1.8, h / 2];
    scaling = Math.min(w, h) * 0.8;
}

var comfirmed_data;
var migration_data;

var svg = d3.select('#map').append('svg').attr('width', w).attr('height', h);
var legend = d3.select('#legend').append('svg').attr('width', w).attr('height', h);

var projection = d3.geo.mercator().center(projection_center).translate(translation).scale(scaling);
var path = d3.geo.path().projection(projection);
var today = -1;
const mt_radius = 8, mt_cy = 0.95 * h;

//var days = Array.from({length:34}, (v,k) => k);
var is_play = true;
var timer;

var chinamap_json;
let province_each_svg;

const cpArr = [["11", "北京"], ["12", "天津"], ["31", "上海"], ["50", "重庆"], ["13", "河北"], ["41", "河南"], ["53", "云南"], ["21", "辽宁"], ["23", "黑龙江"], ["43", "湖南"], ["34", "安徽"], ["37", "山东"], ["65", "新疆"], ["32", "江苏"], ["33", "浙江"], ["36", "江西"], ["42", "湖北"], ["45", "广西"], ["62", "甘肃"], ["14", "山西"], ["15", "内蒙古"], ["61", "陕西"], ["22", "吉林"], ["35", "福建"], ["52", "贵州"], ["44", "广东"], ["63", "青海"], ["54", "西藏"], ["51", "四川"], ["64", "宁夏"], ["46", "海南"], ["71", "台湾"], ["81", "香港"], ["82", "澳门"]]
const cpMapping = new Map();
cpArr.forEach(m => {
    cpMapping.set(m[0], m[1]);
});

let selectedDay = 30;
let selectedDayData = new Map();
let selectedDayDataRecord = [];
let selectedDayDataDomain = [0, 0];
let cityColorScale;

function compFunc(a, b) {
    if(a>b) {
        return 1;
    }
    else if(a<b) {
        return -1;
    }
    return 0;
}

function mapclear(){
    selectedDayData = new Map();
    selectedDayDataRecord = [];
    selectedDayDataDomain = [0, 0];
}

function extractData() {
    mapclear();
    let json = comfirmed_data;
    //console.log(json);
    //console.log("selectedDay", selectedDay);
    //console.log(updateDate(selectedDay));
    for (let key in json.data) {
        // console.log(key, record);
        const pCode = cpMapping.get(key.substring(0, 2));
        let tmpValue = 0;
        json.data[key].forEach(item => {
            if (item.yday === selectedDay) {
                tmpValue = item.number;
            }
        });
        if (typeof selectedDayData.get(pCode) !== 'undefined') {
            tmpValue += selectedDayData.get(pCode);
        }
        if(tmpValue>4000){
            tmpValue = 4000 + Math.log(tmpValue-4000);
        }
        //tmpValue = tmpValue;
        selectedDayData.set(pCode, tmpValue);
        selectedDayDataRecord.push(tmpValue);

    }
    // selectedDayDataRecord = selectedDayDataRecord.sort();
    selectedDayDataRecord.sort(compFunc);
    selectedDayDataDomain = [selectedDayDataRecord[0], selectedDayDataRecord[parseInt(selectedDayDataRecord.length / 5)], selectedDayDataRecord[parseInt(2 * selectedDayDataRecord.length / 5)], selectedDayDataRecord[selectedDayDataRecord.length - 1]];
    setColorScale(selectedDayDataDomain);
}

function extractData1() {
    mapclear();
    let json = migration_data;
    let mday = updateDate(selectedDay);
    var data = json[mday[0] + mday[1] + mday[2]];//json['20200123'];
    for (var key in data) {
        var pro = data[key];
        var pro_name = pro.province_name;
        var tmpValue = pro.value;
        var pCode = 0;
        cpArr.forEach(item => {
            if (pro_name.indexOf(item[1]) != -1) {
                pCode = item[0]+'0000';
            }
        });
        //tmpValue = tmpValue;
        pro_name = pro_name.replace('省','').replace('市','').replace('自治区','').replace('回族','').replace('维吾尔','').replace('壮族','')
        selectedDayData.set(pro_name, tmpValue);
        selectedDayDataRecord.push(tmpValue);
    }
    selectedDayDataRecord.sort(compFunc)
    //console.log(selectedDayDataRecord);
    selectedDayDataDomain = [selectedDayDataRecord[0], selectedDayDataRecord[parseInt(selectedDayDataRecord.length / 5)], selectedDayDataRecord[parseInt(2 * selectedDayDataRecord.length / 5)], selectedDayDataRecord[selectedDayDataRecord.length - 1]];
    //console.log('###############', selectedDayDataDomain);
    setColorScale(selectedDayDataDomain);
}

function setColorScale(dataDomain) {
    cityColorScale = d3.scale.linear().domain(dataDomain).range(['#c2ddec', '#ffffff', '#f4a683', '#6a011f']);
}

function updateProvince(){
    province_each_svg.attr('fill', (d) => {
        if(selectedDayData.get(d.properties.name) != undefined){
            return cityColorScale(selectedDayData.get(d.properties.name));
        }
        else{
            return '#fff';
        }
    })
}

function drawCity() {
    var china = svg.append("g").attr('id', 'chinaMap');

    province_each_svg = china.selectAll('path')
        .data(chinamap_json.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', function (d) {
            return d.properties.name;
        })
        .attr('class', 'province')
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
        });
    updateProvince();
}

function drawButtonLegend() {
    let lenged = legend.append('g');

    lenged.append('text')
        .text(titletext)
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

    d3.select('.legend-area')
        .style('left', 0.75 * w + 'px')
        .style('bottom', 0.2 * h + 'px');

    let mtimeline = lenged.append("g").attr("id", "mtimeline");
    let node_g = mtimeline.selectAll("g")
        .data(Array.from({ length: days.length }, (v, k) => k))
        .enter().append("g");

    const left = 20 + w / 2 - 1.66 * mt_radius * days.length;
    function cx(d) {
        return left + 3 * mt_radius * d;
    }

    node_g.append("line")
        .attr("x1", cx)
        .attr("y1", mt_cy)
        .attr("x2", (d) => cx(d + 1))
        .attr("y2", mt_cy)
        .attr("stroke-width", function (d) {
            return d + 1 < days.length ? 2 : 0;
        })
        .attr("stroke", "#000");

    node_g.append("circle")
        .attr("id", (d) => ("mtimeline" + d))
        .attr("r", mt_radius)
        .attr("cx", cx)
        .attr("cy", mt_cy)
        .attr("class", "unselectMTimeLine")
        .on("mouseover", function (d) {
            let t = d3.select(this);
            if (t.attr("class") === "unselectMTimeLine") {
                t.attr("class", "unselectHoverMTimeLine");
            }
        })
        .on("mouseout", function (d) {
            let t = d3.select(this);
            if (t.attr("class") === "unselectHoverMTimeLine") {
                t.attr("class", "unselectMTimeLine");
            }
        })
        .on("click", function (d) {
            pause_btn_func();
            turnDay(d);
        });

    function draw_left_tri(left1, y_offset = mt_radius + 4) {
        return (left1 + y_offset) + "," + (mt_cy + y_offset)
            + " " + (left1) + "," + mt_cy
            + " " + (left1 + y_offset) + "," + (mt_cy - y_offset);
    }

    function draw_right_tri(left1, y_offset = mt_radius + 4) {
        return (left1 + y_offset) + "," + (mt_cy) + " "
            + (left1) + "," + (mt_cy - y_offset) + " "
            + (left1) + "," + (mt_cy + y_offset);
    }

    function tri_token(tri) {
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
        .attr("id", "mt_tri_left")
        .on("click", function () {
            if (today > 0) {
                d3.select("#mtimeline" + (today - 1)).on("click").apply(this, [today - 1]);
            }
        });
    tri_token(tri_left);

    let tri_right = mtimeline.append("g").append("polygon")
        .attr("points", function () {
            return draw_right_tri(cx(days.length) - mt_radius - 2);
        })
        .attr("id", "mt_tri_right")
        .on("click", function () {
            if (today < days.length - 1) {
                d3.select("#mtimeline" + (today + 1)).on("click").apply(this, [today + 1]);
            }
        });

    tri_token(tri_right);
    function start_btn_func() {
        is_play = true;
        updatesAll(today);
    }
    function pause_btn_func() {
        is_play = false;
        window.clearTimeout(timer);
    }
    function reset_btn_func() {
        pause_btn_func();
        turnDay(0);
    }
    function start_btn_style(scale) {
        return "transform:translate(" + (cx(days.length) + 1.5 * mt_radius) + "px,"
            + (mt_cy - mt_radius - 5.5) + "px)" + "scale(" + scale + ")";
    }
    function pause_btn_style(scale) {
        return "transform:translate(" + (cx(days.length) + 5.5 * mt_radius) + "px,"
            + (mt_cy - mt_radius - 5.5) + "px)" + "scale(" + scale + ")";
    }
    function reset_btn_style(scale) {
        return "transform:translate(" + (cx(days.length) + 9.5 * mt_radius) + "px,"
            + (mt_cy - mt_radius - 5.5) + "px)" + "scale(" + scale + ")";
    }
    function gen_btn(onclickfn, stylefn, d) {
        return mtimeline.append("g").append("path")
            .attr("fill", "#C23531")
            .on("mouseover", function () {
                d3.select(this).attr("fill", "#E26531");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "#C23531");
            })
            .attr("style", stylefn(0.025))
            .attr("d", d)
            .on("click", onclickfn);
    }

    const iconres = {
        "start": "M743.4 476l-352-214c-31.6-17.6-71.4 5-71.4 42v416c0 36.8 39.6 59.6 71.4 42l352-202c32.8-18.2 32.8-65.6 0-84zM1008 512C1008 238 786 16 512 16S16 238 16 512s222 496 496 496 496-222 496-496z m-896 0c0-221 179-400 400-400s400 179 400 400-179 400-400 400S112 733 112 512z",
        "pause": "M512 16C238 16 16 238 16 512s222 496 496 496 496-222 496-496S786 16 512 16z m0 896c-221 0-400-179-400-400S291 112 512 112s400 179 400 400-179 400-400 400z m192-560v320c0 17.6-14.4 32-32 32h-96c-17.6 0-32-14.4-32-32V352c0-17.6 14.4-32 32-32h96c17.6 0 32 14.4 32 32z m-224 0v320c0 17.6-14.4 32-32 32h-96c-17.6 0-32-14.4-32-32V352c0-17.6 14.4-32 32-32h96c17.6 0 32 14.4 32 32z",
        "reset": "M1008 512C1008 238 786 16 512 16S16 238 16 512s222 496 496 496 496-222 496-496z m-896 0c0-221 179-400 400-400s400 179 400 400-179 400-400 400S112 733 112 512z m592-160v320c0 17.6-14.4 32-32 32H352c-17.6 0-32-14.4-32-32V352c0-17.6 14.4-32 32-32h320c17.6 0 32 14.4 32 32z"
    };

    let start_button = gen_btn(start_btn_func, start_btn_style, iconres["start"]);
    let pause_button = gen_btn(pause_btn_func, pause_btn_style, iconres["pause"]);
    let reset_button = gen_btn(reset_btn_func, reset_btn_style, iconres["reset"]);
}

function initMTimeLine() {
    d3.selectAll("#mtimeline" + 0).each(function (d) {
        d3.select(this).on("click").apply(this, [d]);
    });
}

function initUI() {
    drawCity();
    //extractCityCode(citymap_json);
    //selectedDay = 21;
    //extractData1(selectedDay);
    //updateProvince();
    drawButtonLegend();
}

function updateDate(day) {
    let nDate = new Date(1 + '/' + 1 + '/' + 2020); //转换为MM-DD-YYYY格式
    let millSeconds = Math.abs(nDate) + (day * 24 * 60 * 60 * 1000);
    let rDate = new Date(millSeconds);
    let year = rDate.getFullYear();
    let month = rDate.getMonth() + 1;
    if (month < 10) month = "0" + month;
    let date = rDate.getDate();
    if (date < 10) date = "0" + date;
    d3.select(".main-date")
        .text('日期: ' + month + '月' + date + '日');
    return [year, month, date];
}

function turnDay(targetday) {
    selectedDay =  days[targetday];
    console.log("selectedDay", selectedDay);
    d3.selectAll(".selectMTimeLine").attr("class", "unselectMTimeLine").attr("r", mt_radius);
    d3.select("#mtimeline" + targetday).attr("class", "selectMTimeLine").attr("r", mt_radius + 2);
    updateDate(selectedDay);
    mycolorfunc();
    drawCity();
    //updateProvince();
    today = targetday;
}

function updatesAll(i) {
    if (is_play) {
        if (i <= days.length - 1) {
            timer = setTimeout(function () {
                turnDay(i);
                updatesAll(i + 1);
            }, 1000)
        }
        else {
            i = 0;
            turnDay(i);
            updatesAll(i + 1);
        }
    }
}

function LoadAll() {
    $.when(
        $.getJSON("./data/china.json"),
        $.getJSON("./data/city.json"),
        $.getJSON("./data/data-c.json"),
        $.getJSON("./data/420100_to_provinces_20200101_20200203.json")
    )
        .done(
            function (china_res, city_res, confirm_res, migration_res) {
                chinamap_json = china_res[0];
                citymap_json = city_res[0];
                comfirmed_data = confirm_res[0];
                migration_data = migration_res[0];
                initUI();
                initMTimeLine();
            })
}

LoadAll();

setTimeout(function () {
    is_play = true;
    updatesAll(0);
}, 600);
