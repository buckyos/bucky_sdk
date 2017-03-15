# 使用小应用云开发Live会聊

​	微信小程序发布了，对新事物好奇的我，准备去写个东东玩玩。在看过一遍官方所有文档后，觉得开发还不算难。可问题是我没做过后台开发，对后台的理解还停留在大学，搭个IIS，跑Asp.net。服务器是SQL Server。毕业后就在没弄过。虽然用Python或nodejs可以快速搭建一个服务器，可是感觉还是很麻烦。小程序还强制要求用https。这样很多工程外的东西就更麻烦，要申请域名，申请SSL证书，找个云服务器。我就是想简单做个东西，要弄那么多复杂、无用，还要花银子的事情。真是让我兴趣大减。

​	幸运的是，听说一个NB的朋友，搞出了一个小应用云，可以让我不关心所有后台那些复杂的细节。比如不用自己去搞云，不用自己搭WebServer和数据库，不用域名，不用SSL。如果用户量大了，还不用关心那些如何扩容、负载均衡、分布式数据存储，一切小应用云帮我搞定。我只管写我的业务逻辑就好。

​	在有了小应用云后，开始考虑写个什么东西。一个经常参加各种业内会议的朋友曾说过一个痛点，每次参与一个会议，都要建一个微信群，方便到场的人员沟通交流，也方便加嘉宾的微信。可问题是他是嘉宾，有时不想这样泄露个人微信账号。可又没办法。要是有个临时的会议聊天室就好了。又方便线上沟通，也方便发布与会信息，还可以保密个人微信账号。这个点子觉得可行。

现在给这个点子一个名字：会聊。

​	有点子，有云了，开始考虑如何去做。这里先说下小应用云如何使用。小应用云的SDK在这里。[https://github.com/buckyos/bucky_sdk](https://github.com/buckyos/bucky_sdk)。里面有详细的说明。按照step by step的文档，很快就能搭出一个可以在小程序里跑的例子。完成了第一个例子后，对小程序云有了个简单的印象，写业务很直观。开发的时候，甚至都忽略了代码是跑在小程序里还是后台。实质上是虽然看似调用了本地的代码，其实只是加载了远程代码的一个代理对象。真实运行是代理内部自动完成RPC调用。

​	

现在回归到会聊要如何用小应用云来实现。首先对业务进行逻辑拆分。对于一个聊天室，有三种对象：

-    聊天室（公告，有效期，GPS，管理员等等）

-    用户（聊天室中的人）

-    聊天记录

按照小应用云的指导规范，应该有三个package，分别是chatroom，chatuser，history。

用最直观的方式，抽象出三个package的接口

```javascript
// chatroom
module.exports = {}
module.exports.createRoom = createRoom
module.exports.listChatRoom = listChatRoom
module.exports.listAllChatRoom = listAllChatRoom
module.exports.destroyChatRoom = destroyChatRoom
module.exports.getRoomInfo = getRoomInfo
module.exports.getBBS = getBBS -- 获取公告
module.exports.setBBS = setBBS -- 设置公告
module.exports.getAdmin = getAdmin
module.exports.enterChatRoom = enterChatRoom
module.exports.leaveChatRoom = leaveChatRoom
module.exports.getUserCount = getUserCount
module.exports.getUserList = getUserList
module.exports.getHistoryCount = getHistoryCount
module.exports.getHistoryList = getHistoryList
module.exports.getHistoryListInfo = getHistoryListInfo
module.exports.getQRCode = getQRCode -- 获取聊天室的二维码
module.exports.appendHistory = appendHistory

```

```javascript
// chatuser
module.exports = {}
module.exports.login = login
module.exports.createUser = createUser
module.exports.getUserInfo = getUserInfo

```

```javascript
// history
module.exports = {}
module.exports.getHistory = getHistory
module.exports.addHistory = addHistory

```

接口定好后，在实现时，遇到第一个问题是数据如何存储，小应用云提供了一个Storage，接口很简单，get和set。比任何数据库都要好用很多。解决数据存储后。就是简单的业务逻辑编写了。



这里用比较代表性的创建房间举个例子。

```javascript
function createRoom (userid, roomname, expiretime, gps, cb) {
  let thisRuntime = getCurrentRuntime()
  let logger = thisRuntime.getLogger()
  logger.info('!!!!start create room.')
  // console.log(arguments)
  let rs = thisRuntime.getRuntimeStorage('/chatroom/')

  getNextRoomID(rs, function (id) {
    let newRoom = {
      id: id,
      admin: userid,
      expire: expiretime,
      name: roomname,
      users: [userid],
      history: [],
      gps: gps,
      enableGPS: gps === null,
      time: new Date().getTime()
    }

    logger.info('set object', id, newRoom)
    rs.setObject(id, newRoom, function (objid, result) {
      addCreateRoomLink(rs, userid, id, function () {
        createRoomEvent(id, function(){
          cb(result ? newRoom : null)
        })
      })
    })
  })
}
```

代码逻辑很简单，就是根据房间属性，创建一个房间。创建完成后，回调用户的callback，这段代码实际上是跑在服务器端的。下面看看客户端小程序应该如何调用。

```javascript
buckyhelper.getChatRoomModule(function(chatroom){
      let openid = buckyhelper.getOpenID()
      console.log("create room", { openid: openid, name: name});
      let gps = {};
      if (that.data.limitLocation){
        gps["latitude"] = that.data.latitude
        gps["longitude"] = that.data.longitude
      }
      chatroom.createRoom(openid, name, 0, gps, function (roominfo) {
        console.log("create room callback", roominfo);
        if (roominfo){
          wx.redirectTo({url: `../chatroom/chatroom?id=${roominfo.id}`});
        } else {
          wx.showToast({ title: '创建房间失败!!' })
        }
        
      });
    })
  }
  
// buckyhelper
function loadPackageModule(packageName, moduleName, cb) {
  if(localmodules[packageName+"_"+moduleName]){
    cb(localmodules[packageName+"_"+moduleName])
  } else {
    let thisRuntime = core.getCurrentRuntime()
    thisRuntime.loadXARPackage(packageName, function(pkg) {
      console.assert(pkg != null)
      pkg.loadModule(moduleName, function(mod) {
        console.assert(mod != null)
        localmodules[packageName+"_"+moduleName] = mod
        cb(mod)
      })
    })
  }
  
}

function getChatRoomModule (cb) {
  loadPackageModule('chatroom', 'chatroom', cb);
}
```

看代码会发现，其实小程序端，像调用本地代码一样，调用了服务器的代码。整个这一切，都是小应用云SDK自动完成。真是解放了码农。



按照同样的方式，迅速完成了其他接口的开发。

接下来的问题是，在同一个房间的用户，在发消息之后，如果及时推送到其他用户。

小应用云提供一个GlobalEventManager的对象，可以全局创建一个event，在收到event的地方attach，在发送消息的地方fire，就可以实现及时推送。在小程序中，event内部是通过websocket来实现的。GlobalEventManager接口依然非常简单

```javascript
// 创建事件，每个房间id一个事件
function createRoomEvent(id, cb) {
   let thisRuntime = getCurrentRuntime()
   let logger = thisRuntime.getLogger()
   let em = thisRuntime.getGlobalEventManager();

    let eventName = 'room_event_' + id;
    em.createEvent(eventName, function() {
      logger.info('create event', eventName)
      cb()
    })
}

// 触发事件
// 通知用户有消息更新了,触发客户端主动拉取
let em = thisRuntime.getGlobalEventManager()
let eventName = 'room_event_' + roomid
em.fireEvent(eventName, JSON.stringify({eventType: 'count'}));

// 响应事件
let thisRuntime = core.getCurrentRuntime()
let em = thisRuntime.getGlobalEventManager()
let eventName = 'room_event_' + query.id
console.log('attach event', eventName)
em.attach(eventName, function(msg) {
  console.log('on room_event', msg)
  let msgObj = JSON.parse(msg)
  if(msgObj.eventType == "count"){
	that.FetchMessage(that.data.historyEndIndex, 0)
  } else if(msgObj.eventType == "bbs"){
	that.updateBBS()
  }
}, function(result, unknown) {
  console.log('attach event callback ', result, unknown)
})
```



写到这里，会聊的基本功能已经完成了，包括

- 会议室的创建，删除，属性管理
- 会议室的用户管理（进入、退出、管理房间）
- 会议室的聊天记录管理（发送，拉取，推送）



目前用户进入聊天室，需要手动输入聊天室的房间id。这种体验不够好，决定使用二维码的形式来传播房间id。方便用户进入。这个功能实现起来也不难。首先需要一个图床，用来存放二维码。小程序也有接口可以方便生成二维码，对应也有扫描的接口。



在小程序客户端请求房间二维码时，在小应用云的后台根据参数，生成对应的二维码，同时将二维码上传到图床，返回url给客户端。客户端拿到url后，下载并显示。



至此，会聊的后台逻辑已经基本开发完。这里不涉及小程序前台的界面开发。

总体感觉，小应用云用起来很直观，概念也不难理解。对于我这种没什么后台开发经验的人，很友好。前后台交互起来，也不觉得慢。由于还没什么用户量，还体验不到小应用云在扩容方面的能力。希望小应用云越做越好，像我这样懒的码农就有福了。哈哈。