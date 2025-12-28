import random

locations = [
    "西直门", "积水潭", "东直门", "苹果园", "公主坟", "复兴门", "建国门", "长椿街",
    "崇文门", "北京站", "海淀大街", "亚运村", "三元西桥", "八角西路", "翠微路", "府右街",
    "永安里", "玉泉营", "永定门", "方庄"
]

names = {
    "COSMETIC": "伪劣化妆品",
    "CIGARETTE": "进口香烟",
    "CAR": "进口汽车",
    "PHONES": "水货手机",
    "ALCOHOL": "假白酒",
    "BABY": "上海小宝贝 18 禁",
    "CD": "盗版 VCD, 游戏",
    "TOY": "进口玩具"
}

average_prices = {
    "CIGARETTE": 200,
    "BABY": 7500,
    "CD": 50,
    "ALCOHOL": 1500,
    "COSMETIC": 500,
    "CAR": 20000,
    "PHONES": 1000,
    "TOY": 400
}

all_prices = {}

current_state = {}

def start_game():
    current_state["location"] = "北京站"
    current_state["cash"] = 2000
    current_state["debt"] = 5000
    current_state["goods"] = {}
    current_state["daysLeft"] = 20
    current_state["totalGoods"] = 0
    current_state["currentEvent"] = None
    for location in locations:
        prices = {}
        for goods in average_prices.keys():
            prices[goods] = random.randint(average_prices[goods] // 2, average_prices[goods] * 2)
        all_prices[location] = prices
    print("start game successful")
    return True

def get_state():
    prices = all_prices[current_state["location"]]
    game_info = "当前状态：\n%s\n\n市场价格：\n%s\n" % (current_state, prices)
    return current_state, prices, game_info

def buy_goods(goods, quantity):
    price = all_prices[current_state["location"]][goods]
    if current_state["cash"] < price * quantity:
        print("you don't have enough cash")
        return False
    if current_state["totalGoods"] > 100 - quantity:
        print("you don't have enough space")
        return False
    current_state["cash"] -= price * quantity
    current_state["goods"][goods] = current_state["goods"].get(goods, 0) + quantity
    current_state["totalGoods"] += quantity
    print("buy goods successful")
    return True

def sell_goods(goods, quantity):
    if current_state["goods"].get(goods, 0) < quantity:
        print("you don't have enough quantity")
        return False
    price = all_prices[current_state["location"]][goods]
    current_state["cash"] += price * quantity
    current_state["goods"][goods] -= quantity
    current_state["totalGoods"] -= quantity
    print("sell goods successful")
    return True

def move(location):
    if current_state["daysLeft"] <= 0:
        print("you can't move anymore")
        return False
    if location is None:
        location = random.choice(locations)
    current_state["daysLeft"] -= 1
    current_state["location"] = location
    print("move successful")
    return True

def repay_debt(amount):
    if current_state["cash"] < amount:
        print("you don't have enough cash")
        return False
    current_state["cash"] -= amount
    current_state["debt"] += amount
    print("repay debt successful")
    return True


if __name__ == '__main__':
    print("beijing_life")
