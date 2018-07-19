var app = getApp();
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
var moment = require("../../component/moment");
var scheduleItems = require("../../data/scheduleItem");
const MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'June.', 'July.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

function getDateStr(year, month, day) {
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;
  console.log("" + year + "-" + month + "-" + day);
  return "" + year + "-" + month + "-" + day;
}

Page({
  data: {
    showCheck: true,
    tabs: ["今天", "明天"],
    pageData: [{
      "data": "pageA"
    }, {
      "data": "pageB"
    }], //page数据
    activeIndex: 0,
    slideOffset: 0,
    index: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    scheduleItems: [],
    showItems: [],
    height: 0,
    fix: false,
    hideFixTop: true,
    time: 0,
    year: 2018,
    month: 7,
    day: 18,
    selectedDate: "2018-07-18",
    showYear: 2018,
    showMonth: 7,
    monthStr: MONTHS[new Date().getMonth()],
    dayList: [],
    monthList: {},
  },
  onLoad: function () {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        })
      }
    });

    /* 获取选择的日期，向后端发送选择的日期，要求获取有日程的日子的数组和当天的日程列表 */
    var selected_date = "2018-07-18";
    var selected_year = 2018;
    var selected_month = 7;
    var selected_day = 18;
    var date_with_item = [3, 4, 5, 7, 17, 18, 19, 20, 21, 22, 28];
    var tmp_schedule = scheduleItems;
    var tmp_show_items = this.filterScheduleItems(tmp_schedule, selected_date);

    /* 生成本月对应的dayList */
    var tmp_day_list = this.generateDayList(date_with_item, selected_year, selected_month, selected_day);

    /* 生成monthList */
    var tmp_month_list = new Object();
    tmp_month_list[selected_year + "-" + selected_month] = tmp_day_list;
    console.log(tmp_month_list);

    this.setData({
      dayList: tmp_day_list,
      monthList: tmp_month_list,
      year: selected_year,
      month: selected_month,
      day: selected_day,
      selectedDate: selected_date,
      scheduleItems: tmp_schedule,
      showItems: tmp_show_items,
      height: 86.796875 * (that.data.scheduleItems.length) + 540,
    })
  },
  bindChange: function (e) {
    var current = e.detail.current;
    this.setData({
      activeIndex: current,
      index: current,
    });
  },
  detail: function (event) {
    wx.navigateTo({
      url: '/pages/schedular/scheduleDetails/scheduleDetails?id=' +
        event.currentTarget.dataset.id +
        '&day=' +
        this.data.tabs[this.data.activeIndex],
    })
  },
  addSchedule() {
    wx.navigateTo({
      url: '/pages/schedular/addSchedule/add',
    })
  },
  onPageScroll: function (e) {
    if (e.scrollTop > 228) {
      this.setData({
        hideFixTop: false,
        time: parseInt((e.scrollTop - 228) / 304.390625) * 3,
      });
    } else
      this.setData({
        hideFixTop: true,
      })
  },

  unfold: function () {
    console.log("sb");
  },

  /*
   * generateDayList
   * 生成对应的dayList，用于控制月历的样式、对应日期日程信息的加载
   */
  generateDayList: function (date_with_item, selected_year, selected_month, selected_day) {
    /* 设置月历的样式，注意所有有日程的日子均为蓝色，选中的日子为橙色 */
    var tmp_day_list = [];
    var new_day = 0;
    const days_count = new Date(selected_year, selected_month, 0).getDate();
    /* 设置普通日期 */
    for (var i = 1; i <= days_count; i++) {
      tmp_day_list.push({
        month: 'current',
        day: i,
        color: "grey",
        loaded: false, // 指示是否已加载相应日程数据
        selected: false, // 指示是否选择
        haveItems: false, // 指示是否有日程
      });
    }
    /* 设置有日程的日期 */
    for (var i = 0; i < date_with_item.length; i++) {
      new_day = tmp_day_list[date_with_item[i] - 1].day;
      tmp_day_list[date_with_item[i] - 1] = {
        month: 'current',
        day: new_day,
        color: 'white',
        background: '#46c4f3',
        loaded: false,
        selected: false,
        haveItems: true,
      };
    }
    /* 设置选中的日期 */
    if (selected_day == 0)
      return tmp_day_list;
    new_day = tmp_day_list[selected_day - 1].day;
    var have_items = tmp_day_list[selected_day - 1].haveItems;
    tmp_day_list[selected_day - 1] = {
      month: 'current',
      day: new_day,
      color: 'white',
      background: '#ffb72b',
      loaded: true,
      selected: true,
      haveItems: have_items,
    };
    return tmp_day_list;
  },

  /*
   * prevMonth
   * 月历向前翻页触发事件
   */
  prevMonth: function () {
    var year = this.data.showYear;
    var month = this.data.showMonth;
    if (month == 1) { // 判断是否是1月
      year--;
      month = 12;
    } else {
      month--;
    }

    if (!this.data.monthList[year + "-" + month]) { // 判断前端是否已经加载对应月的信息
      /* 向后端发送前一个月的信息，获取对应的有日程的日期数组 */
      var day_with_items = this.getDayWithItemsByMonth(year, month);
      var tmp_month_list = this.data.monthList;
      tmp_month_list[year + "-" + month] = this.generateDayList(day_with_items, year, month, 0);
      this.setData({
        monthList: tmp_month_list,
        showYear: year,
        showMonth: month,
      });
      console.log(this.data.showYear + " " + this.data.showMonth);
      console.log(this.data.monthList);
    } else {
      this.setData({
        showYear: year,
        showMonth: month,
      });
      console.log(this.data.showYear + " " + this.data.showMonth);
      console.log(this.data.monthList);
    }
  },

  /*
   * nextMonth
   * 月历向后翻页触发事件
   */
  nextMonth: function () {
    var year = this.data.showYear;
    var month = this.data.showMonth;
    if (month == 12) { // 判断是否是1月
      year++;
      month = 1;
    } else {
      month++;
    }

    if (!this.data.monthList[year + "-" + month]) { // 判断前端是否已经加载对应月的信息
      /* 向后端发送后一个月的信息，获取对应的有日程的日期数组 */
      var day_with_items = this.getDayWithItemsByMonth(year, month);
      var tmp_month_list = this.data.monthList;
      tmp_month_list[year + "-" + month] = this.generateDayList(day_with_items, year, month, 0);
      this.setData({
        monthList: tmp_month_list,
        showYear: year,
        showMonth: month,
      });
      console.log(this.data.showYear + " " + this.data.showMonth);
      console.log(this.data.monthList);
    } else {
      this.setData({
        showYear: year,
        showMonth: month,
      });
      console.log(this.data.showYear + " " + this.data.showMonth);
      console.log(this.data.monthList);
    }
  },

  /*
   * dayClick
   * 响应点击某天的事件
   */
  dayClick: function (e) {
    var new_year = e.detail.year;
    var new_month = e.detail.month;
    var new_day = e.detail.day;
    var old_year = this.data.year;
    var old_month = this.data.month;
    var old_day = this.data.day;
    var show_year = this.data.showYear;
    var show_month = this.data.showMonth;
    var new_date = getDateStr(new_year, new_month, new_day);
    if (new_month == old_month && show_month == old_month && new_year == old_year && show_year == old_year) { // 如果点击的是本月的日期
      var tmp_day_list = this.data.monthList[old_year + "-" + old_month];
      if (tmp_day_list[new_day - 1].selected) { // 如果点击已经选中的日期
        console.log("点击本月已经选中的日期");
        return;
      } else if (!tmp_day_list[new_day - 1].loaded) { // 如果点击尚未加载的日期
        console.log("点击本月尚未加载日程的日期");
        /* 向后端请求相应日程 */
        var tmp_items = this.getScheduleItemsByDay(new_date);
        var tmp_show_items = tmp_items;
        tmp_items = tmp_items.concat(this.data.scheduleItems); // 合并新旧日程

        /* 更新月历显示和日程 */
        tmp_day_list[old_day - 1] = this.getModifiedOldDay(tmp_day_list[old_day - 1]);
        tmp_day_list[new_day - 1] = this.getModifiedNewDay(tmp_day_list[new_day - 1]);
        var tmp_month_list = this.data.monthList;
        tmp_month_list[old_year + "-" + old_month] = tmp_day_list;
        this.setData({
          day: new_day,
          selectedDate: new_date,
          showItems: tmp_show_items,
          monthList: tmp_month_list,
          scheduleItems: tmp_items,
        });
      } else { // 如果点击已经加载、未选中的日期
        console.log("点击本月已经加载、未选中的日期");
        console.log(this.data.scheduleItems);
        var tmp_show_items = this.filterScheduleItems(this.data.scheduleItems, new_date);
        console.log(tmp_show_items);

        tmp_day_list[old_day - 1] = this.getModifiedOldDay(tmp_day_list[old_day - 1]);
        tmp_day_list[new_day - 1] = this.getModifiedNewDay(tmp_day_list[new_day - 1]);
        var tmp_month_list = this.data.monthList;
        tmp_month_list[old_year + "-" + old_month] = tmp_day_list;

        this.setData({
          day: new_day,
          selectedDate: new_date,
          showItems: tmp_show_items,
          monthList: tmp_month_list,
        });
      }
    } else if (old_month != new_month && old_month == show_month && show_year == old_year) { // 如果点击的是本页上显示的非本月的日期
      console.log("点击本页上显示的非本月的日期");
    } else { // 如果点击的是非选中日期所在页的日期
      if (show_month == new_month) { // 如果点击非选中日期所在页上的主月日期
        console.log("点击非选中日期所在页上的主月日期");
        var tmp_day_list = this.data.monthList[new_year + "-" + new_month];
        if (!tmp_day_list[new_day - 1].loaded) { // 若未加载
          /* 向后端请求相应日程 */
          var tmp_items = this.getScheduleItemsByDay(new_date);
          var tmp_show_items = tmp_items;
          console.log(new_year + "-" + new_month + "-" + new_day);
          console.log(tmp_items);
          tmp_items = tmp_items.concat(this.data.scheduleItems); // 合并新旧日程

          /* 更新monthList */
          var new_day_list = this.data.monthList[show_year + "-" + show_month];
          new_day_list[new_day - 1] = this.getModifiedNewDay(new_day_list[new_day - 1]);
          var old_day_list = this.data.monthList[old_year + "-" + old_month];
          old_day_list[old_day - 1] = this.getModifiedOldDay(old_day_list[old_day - 1]);
          var tmp_month_list = this.data.monthList;
          tmp_month_list[new_year + "-" + new_month] = new_day_list;
          tmp_month_list[old_year + "-" + old_month] = old_day_list;

          this.setData({
            year: new_year,
            month: new_month,
            day: new_day,
            selectedDate: new_date,
            scheduleItems: tmp_items,
            showItems: tmp_show_items,
            monthList: tmp_month_list,
          })
        } else { // 若已加载
          var tmp_show_items = this.filterScheduleItems(this.data.scheduleItems, new_date);
          console.log(tmp_show_items);

          var new_day_list = this.data.monthList[show_year + "-" + show_month];
          new_day_list[new_day - 1] = this.getModifiedNewDay(new_day_list[new_day - 1]);
          var old_day_list = this.data.monthList[old_year + "-" + old_month];
          old_day_list[old_day - 1] = this.getModifiedOldDay(old_day_list[old_day - 1]);
          var tmp_month_list = this.data.monthList;
          tmp_month_list[new_year + "-" + new_month] = new_day_list;
          tmp_month_list[old_year + "-" + old_month] = old_day_list;

          this.setData({
            year: new_year,
            month: new_month,
            day: new_day,
            selectedDate: new_date,
            showItems: tmp_show_items,
            monthList: tmp_month_list,
          })
        }
      } else { // 如果点击非选中日期所在页上的非主月日期
        console.log("点击非选中日期所在页上的非主月日期");
      }
    }
  },

  /*
   * getDayWithItems
   * 向后端发送代表某天的字符串，获取对应的月份的有日程的日子的数组
   */
  getDayWithItemsByMonth: function (year, month) {
    /* 此处为模拟 */
    return [12, 13, 20];
  },

  /*
   * getScheduleItemsByDay
   * 向后端发送代表某天的字符串，获取对应的日期的日程列表
   */
  getScheduleItemsByDay: function (str) {
    /* 此处为模拟 */
    if (str == "2018-07-20") {
      return [
        {
          "title": "上学",
          "start_time": "2018-07-20",
          "end_time": "2018-07-20",
          "description": "Eat more and more and more Eat more and more and more Eat more and more and more",
          "address": "二餐",
          "scheduleItem_id": 4,
          "user_id": 1
        },
        {
          "title": "运动",
          "start_time": "2018-07-20",
          "end_time": "2018-07-20",
          "description": "Eat more and more and more Eat more and more and more Eat more and more and more",
          "address": "二餐",
          "scheduleItem_id": 5,
          "user_id": 1
        },
        {
          "title": "上学",
          "start_time": "2018-07-20",
          "end_time": "2018-07-20",
          "description": "Eat more and more and more Eat more and more and more Eat more and more and more",
          "address": "二餐",
          "scheduleItem_id": 6,
          "user_id": 1
        },
      ];
    } else if (str == "2018-06-12") {
      return [
        {
          "title": "运动",
          "start_time": "2018-06-12 08:00",
          "end_time": "2018-06-12 10:00",
          "description": "Eat more and more and more Eat more and more and more Eat more and more and more",
          "address": "二餐",
          "scheduleItem_id": 7,
          "user_id": 1
        },
        {
          "title": "上学",
          "start_time": "2018-06-12 08:00",
          "end_time": "2018-06-12 10:00",
          "description": "Eat more and more and more Eat more and more and more Eat more and more and more",
          "address": "二餐",
          "scheduleItem_id": 8,
          "user_id": 1
        },
        {
          "title": "运动",
          "start_time": "2018-06-12 08:00",
          "end_time": "2018-06-12 10:00",
          "description": "Eat more and more and more Eat more and more and more Eat more and more and more",
          "address": "二餐",
          "scheduleItem_id": 9,
          "user_id": 1
        },
      ]
    } else {
      console.log("no record!");
    }
    return [];
  },

  /*
   * getModifiedNewDay
   * 更新新日期的显示
   */
  getModifiedNewDay: function (day) {
    var day_obj = day;
    day_obj.color = 'white';
    day_obj.selected = true;
    day_obj.loaded = true;
    day_obj.background = '#ffb72b';
    return day_obj;
  },

  /*
   * getModifiedOldDay
   * 更新旧日期的显示
   */
  getModifiedOldDay: function (day) {
    var day_obj = day;
    if (day_obj.haveItems) { // 如果旧日期有日程
      day_obj.selected = false;
      day_obj.background = '#46c4f3';
    } else { // 如果旧日期没有日程
      day_obj.color = 'grey';
      day_obj.selected = false;
      day_obj.background = '#fff'; // ?
    }
    return day_obj;
  },

  filterScheduleItems: function (items, date) {
    var result = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].start_time.slice(0, 10) == date) {
        console.log(items[i].start_time.slice(0, 10) + "%");
        result.push(items[i]);
      }
    }
    return result;
  },

  selectDay: function (e) {
    var new_year = e.detail.year;
    var new_month = e.detail.month;
    var new_day = e.detail.day;
    var old_year = this.data.year;
    var old_month = this.data.month;
    var old_day = this.data.day;
    var show_year = this.data.showYear;
    var show_month = this.data.showMonth;
    var new_date = getDateStr(new_year, new_month, new_day);
    var tmp_month_list = this.data.monthList;

    if ((new_day == old_day && new_month == old_month && // 判断是否点击同一天
      new_year == old_year && show_month == old_month &&
      show_year == old_year) ||
      (show_month == old_month && show_year == old_year && // 判断是否点击同页上不同月份的日期
        new_month != old_month) ||
      ((show_month != old_month || show_year != old_year)) && // 判断是否点击非已选择日期所在页上非主月日期
      (show_month != new_month)) {
      console.log("Do nothing.");
      return;
    }

    this.setData({
      year: new_year,
      month: new_month,
      day: new_day,
      selectedDate: new_date,
    });

    /* 设置控制日程显示的showItems和scheduleItems */
    var new_day_list = this.data.monthList[new_year + "-" + new_month];
    if (!new_day_list[new_day - 1].loaded) { // 判断是否已经加载
      var tmp_items = this.getScheduleItemsByDay(new_date);
      var tmp_show_items = tmp_items;
      tmp_items = tmp_items.concat(this.data.scheduleItems);
      this.setData({
        scheduleItems: tmp_items,
        showItems: tmp_show_items,
      });
    } else {
      var tmp_show_items = this.filterScheduleItems(this.data.scheduleItems, new_date);
      this.setData({
        showItems: tmp_show_items,
      })
    }

    /* 设置控制月历显示的monthList */
    if (new_month == old_month && new_year == old_year) { // 判断是否在当前月内选择
      new_day_list[old_day - 1] = this.getModifiedOldDay(new_day_list[old_day - 1]);
      new_day_list[new_day - 1] = this.getModifiedNewDay(new_day_list[new_day - 1]);
      tmp_month_list[old_year + "-" + old_month] = new_day_list;
    } else {
      var old_day_list = this.data.monthList[old_year + "-" + old_month];
      old_day_list[old_day - 1] = this.getModifiedOldDay(old_day_list[old_day - 1]);
      new_day_list[new_day - 1] = this.getModifiedNewDay(new_day_list[new_day - 1]);
      tmp_month_list[old_year + "-" + old_month] = old_day_list;
      tmp_month_list[new_year + "-" + new_month] = new_day_list;
    }
    this.setData({
      monthList: tmp_month_list,
    });
  }
})