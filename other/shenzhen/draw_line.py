import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as colors
import matplotlib.cm as cmx
import scipy
import scipy.interpolate

plt.rcParams['font.family'] = ['sans-serif']
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False
#plt.axis("equal")
def get_yday(date):
    if date == '-':
        return -1
    month_day = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    month = int(date[:2])
    day = int(date[2:4])
    yday = day
    if month == 12:
        return yday - 31
    for i in range(month-1):
        yday += month_day[i]
    return yday


def add_number(dic, key):
    if key is not -1:
        if key not in dic.keys():
            dic[key] = 1
        else:
            dic[key] += 1


data = []
arrived = []
uncomfortable = []
history = []
confirmed = []
for line in open('myout.txt', 'r'):
    line = line.strip()
    items = line.split(' ')
    if len(items) > 3:
        data.append([get_yday(items[0]), get_yday(items[1]), get_yday(items[2]), get_yday(items[3])])
data = sorted(data, key=lambda k: (k[1], k[0]), reverse=False)
#print(len(data))

DRAW_POINTS = True
if DRAW_POINTS:
    plt.figure(figsize=(21, 7), dpi=300)
    plt.subplot(121)
    #plt.figure(figsize=(6,6))

    myname = "points-shenzhen"
    colorcnt = 7
    colorvalues = range(colorcnt)
    jet = cm = plt.get_cmap("rainbow")
    cNorm = colors.Normalize(vmin=0, vmax=colorvalues[-1])
    scalarMap = cmx.ScalarMappable(norm=cNorm, cmap=jet)
    col = ["#FF0000", "#FF7D00", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"]
    #col = ["#EE1010", "#EE7D10", "#EEEE10", "#10EE10", "#10EEEE", "#1010EE", "#EE10EE"]
    draw_color = [7, 39, 71, 116, 157, 215, 253]
    act_draw_color = []
    draw_idx = 0
    usefulcnt = 0
    for item_index, item in enumerate(data):
        if item[1] >= item[0] and not (item[0] == -1):
            colorVal = scalarMap.to_rgba(colorvalues[(len(data) - usefulcnt ) % colorcnt])
            if draw_idx < len(draw_color) and usefulcnt == draw_color[draw_idx]:
                act_draw_color.append(item_index)
                draw_idx += 1
            else:
                for j in [0, 3]:
                    plt.scatter(item[j], usefulcnt, c='#999999', s=4)  # c=col[usefulcnt % len(col)]) #  c=col[j] #colorVal
            usefulcnt += 1
    print(act_draw_color)
    for arr_idx, item_index in enumerate(act_draw_color):
        item = data[item_index]
        # print(item_index, item)
        plt.plot([item[0] + 0.2, item[3] - 0.2], [item_index, item_index], color=col[arr_idx], linewidth=0.8, linestyle='-')
        for j in [0, 3]:
            plt.scatter(item[j], item_index, c=col[arr_idx], s=36)
    usefulcnt = 0
    for item_index, item in enumerate(data):
        if item[1] >= item[0] and not (item[0] == -1):
            plt.plot([item[0]+0.2, item[3]-0.2], [usefulcnt, usefulcnt], color='#AAAAAA', linewidth=0.4, linestyle='-')
            usefulcnt += 1
    xdata_2 = [i[1] for i in data]
    mlen = len(xdata_2)
    xdata_2map = {}
    for index, item in enumerate(xdata_2):
        if item not in xdata_2map.keys():
            xdata_2map[item] = [index]
        else:
            xdata_2map[item].append(index)
    xx2 = []
    yy2 = []
    for item in xdata_2map:
        t = sum(xdata_2map[item]) / len(xdata_2map[item])
        xx2.append(item)
        yy2.append(t)
    #xx2 = xx2[1:]
    #yy2 = yy2[1:]
    z1 = np.polyfit(xx2, yy2, 5)
    zz1 = np.poly1d(z1)
    plt.plot(xx2, zz1(xx2), linewidth=2)
    plt.xlabel('时间节点')
    plt.ylabel('病例')
    plt.xticks([5, 10, 15, 20, 25, 30, 35, 40], ["01.05", "01.10", "01.15", "01.20", "01.25", "01.30", "02.04", "02.09"])
    #plt.yticks([])
    #plt.show()

    #plt.savefig(myname + ".png")
    #plt.close()
    # Draw Legend
    DRAW_LEGNED = False
    if DRAW_LEGNED:
        plt.figure()
        plt.plot(xx2, zz1(xx2), linewidth=8)
        plt.scatter([22, 30], [125.55, 125.55], c='red', s=36 * 16)
        plt.plot([22, 30], [125.55, 125.55], c='gray',linewidth=1, linestyle=':')
        plt.scatter([25.5], [125.55], marker='v', s = 36*16)
        #print(25.5, zz1(25.5))
        plt.xticks([])
        plt.yticks([])
        plt.show()
#exit(0)
# Analyse the data
offset_arrive_to_uncomfortable = {}
#offset_hospitalized_to_uncomfortable = {}
#offset_confirmed_to_hospitalized = {}
offset_confirmed_to_uncomfortable = {}
#offset_confirmed_to_arrived = {}


for item in data:
    arrive_to_uncomfortable_number = (item[1] - item[0]) if item[0] is not -1 and item[1] > item[0] else -1
    # hospitalized_to_uncomfortable = item[2] - item[1]
    #confirmed_to_hospitalized = item[3] - item[2]
    confirmed_to_uncomfortable = item[3] - item[1]
    #confirmed_to_arrived = (item[3] - item[0]) if item[0] is not -1 and item[1] > item[0] else -1
    add_number(offset_arrive_to_uncomfortable, arrive_to_uncomfortable_number)
    #add_number(offset_hospitalized_to_uncomfortable, hospitalized_to_uncomfortable)
    #add_number(offset_confirmed_to_hospitalized, confirmed_to_hospitalized)
    add_number(offset_confirmed_to_uncomfortable, confirmed_to_uncomfortable)
    #add_number(offset_confirmed_to_arrived, confirmed_to_arrived)

#sets = [offset_arrive_to_uncomfortable, offset_confirmed_to_uncomfortable]
sets = [offset_confirmed_to_uncomfortable]
#offset_hospitalized_to_uncomfortable,
#offset_confirmed_to_hospitalized,
#ffset_confirmed_to_uncomfortable,
#offset_confirmed_to_arrived]
#for i in offset_arrive_to_uncomfortable:
#    print(i)
#plt.figure(figsize=(16, 7), dpi=300)
#print("confirmed_to_uncomfortable", offset_confirmed_to_uncomfortable)
#res = 0
#tot = 0
#for idx in offset_arrive_to_uncomfortable:
#    #print(idx, offset_confirmed_to_uncomfortable[idx])
#    res += idx * offset_arrive_to_uncomfortable[idx]
#    tot += offset_arrive_to_uncomfortable[idx]
#print(res / tot)
for index, chart_name in enumerate(["发病到确诊时间"]):
    #plt.subplot("12" + str(index + 1))
    plt.subplot(143)
    data_set = sets[index]
    name_list = sorted(data_set.keys())
    numbers = [data_set[name] for name in name_list]
    SMOOTH = True
    if SMOOTH:
        def lis(arr):
            n = len(arr)
            m = [0] * n
            for x in range(n - 2, -1, -1):
                for y in range(n - 1, x, -1):
                    if arr[x] > arr[y] and m[x] <= m[y]:
                        m[x] += 1
                max_value = max(m)
                result = []
                xxres = []
                for i in range(n):
                    if m[i] == max_value:
                        result.append(arr[i])
                        xxres.append(name_list[i])
                        max_value -= 1
            return result, xxres
        numbers[-1] = numbers[-2]
        #name_list = name_list[:-1]
        res, xxres = lis(numbers)
        #if index == 1 and xxres[0] > 1:
        ttt = xxres[0]
        xxres = name_list[:ttt] + xxres
        res = numbers[:ttt] + res
        #res = res[:-1]
        #xxres = xxres[:-1]
        #print(res, xxres)
        xnew = np.linspace(min(xxres), max(xxres), 7)
        inter1 = scipy.interpolate.interp1d(xxres, res, kind='linear')
        y1 = inter1(xnew)
        xxnew = np.linspace(min(xxres), max(xxres), 100)
        inter2 = scipy.interpolate.interp1d(xnew, y1, kind='quadratic')
        y2 = inter2(xxnew)
        plt.plot(xxnew, y2, linewidth=2)
    else:
        plt.bar(range(len(name_list)), numbers)#, tick_label=name_list)
    plt.title(chart_name)
    plt.xticks([i for i in range(0, name_list[-1], 5)])
    plt.xlabel("时间/天")
    plt.ylabel("数量/人")
    #break
#plt.show()
plt.savefig('aaa.png')
plt.close()

