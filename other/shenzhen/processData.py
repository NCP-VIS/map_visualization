import pandas as pd
import math
df = pd.read_excel("shenzhen.xlsx")

def gendata(n: float):
    x = str(int(n))
    return "0" + x if len(x) == 3 else x


with open("myout.txt", "w") as f:
    for index, row in df.iterrows():
        if row["禁用"] == 'y':
            continue
        jiechu = 0
        if not math.isnan(row["本地接触"]):
            jiechu = row["本地接触"]
        elif not math.isnan(row["离开武汉"]):
            jiechu = row["离开武汉"]
        elif not math.isnan(row["离开湖北"]):
            jiechu = row["离开湖北"]
        elif not math.isnan(row["别处返回（除湖北）"]):
            jiechu = row["别处返回（除湖北）"]
        f.write(gendata(jiechu) + " " + gendata(row["不适"]) + " " + gendata(row["入院"]) + " " + gendata(row["确诊"]) + "\n")

