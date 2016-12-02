var util = require('../../utils/util.js')
var core = require('../../bucky/wx_core.js')
Page({
  data: {
    logs: ""
  },
  onLoad: function () {
    let that = this;
    function appendLog(s) {
      let old = that.data.logs;
      let now = old + s;
      that.setData({
        logs: now
      })
    }
    that.setData({
      logs: ""
    })

    let thisRuntime = core.getCurrentRuntime();
    appendLog("\r\nruntimeID:"+thisRuntime.getInstanceID());
    let thisDevice = thisRuntime.getOwnerDevice();
    appendLog("\r\ndeviceID:"+thisDevice.getDeviceID());
    appendLog("\r\nuserID:"+thisDevice.getOwnerUserID());

    let km = thisRuntime.getKnowledgeManager();
    km.dependKnowledge("global.events");
    km.dependKnowledge("global.runtimes");
    km.dependKnowledge("global.devices");
    km.dependKnowledge("global.storages");
    km.ready(function() {
      thisRuntime.loadXARPackage("client",function(thePackage) {
        if(thePackage) {
            appendLog("\r\nload client XAR OK!");
            thePackage.loadModule("client",function(theModule) {
              let clientModule = theModule;
              appendLog("\r\nload client module ok");
              clientModule.testLogin(function(result) {
                  appendLog("\r\ntestLogin result:"+result);
                  clientModule.testRegister(function(result) {
                      appendLog("\r\ntestRegister result:"+result);
                      clientModule.testLogin(function(result) {
                          appendLog("\r\ntestLast login result:"+result);
                          appendLog("\r\nCongratulations! account demo test passed!");
                      });
                  });
              });
          });
        } else {
            appendLog("\r\nload XAR faield");
        }
      });
    });
  }
})