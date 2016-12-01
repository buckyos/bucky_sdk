//index.js
//获取应用实例
var core = require('../../bucky/wx_core.js')

var app = getApp()
Page({
  data: {
    motto: 'Hello Bucky',
    userInfo: {}
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../login/login'
    })
  },
  onLoad: function () {
    console.log('onLoad')
    var that = this;
    let tacApp = new core.Application();
    core.setCurrentApp(tacApp);
    tacApp.init(that.data.appConfig, function(errorCode,metaInfo) {
        core.initCurrentRuntime(that.data.packages);
        console.log('tac app init completed');
    });

    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    })
  }
})
