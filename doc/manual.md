# 基本概念介绍
## Application
在Bucky的概念里，一个`分布式应用系统`被称作一个Application.用旧的概念来看，Application包括了 前端的App(iOS,Android,Web)以及后台的各种服务。目前Bucky只涵盖了后端逻辑的开发。
一个Application的生命周期的长度超越了传统的`进程`，其生命周期的表达只是一个状态，用来表示`系统是否在线`。即使系统里没有任何活动的代码，只要系统处于在线状态，那么Application就处于活的状态。
大部分的代码在运行的时候都需要知道当前所在的Application,我们通常用app.json来描述这个Application:

### app.json
目前app.json的内容非常简单，内容如下

```
{
  "appID" : "bx.demos.account",
  "appHost" : "https://weixin.xmaose.com/apphost/",
  "repositoryHost" : "https://weixin.xmaose.com/repository/",
  "appver" : "1.0.0.1",
  "token" : "abcdef0123"
}
```

定义了Application的唯一ID,app相关信息，以及该Application依赖的core service的地址。
开发者需要修改的是appID,请按 域名.产品 的方法定义一个唯一的appID.

## XARPackage
XARPackage是在Bucky中代码的物理组织形式。基本上属于Application的逻辑，都应该放在一个合适的XARPackage中。
XARPackage里包含的js文件以`module`的概念被XARPackage持有。但加载XARPackage除了会默认运行一次onload.js外，并不会加载任何内部的模块。

XARPackage的结构如下
<<目录>>
	+ config.json
	+ onload.js
	+ module.js
	+ otherfile
    <<子目录>>

也就是说只要在一个目录中添加一个符合规范的config.json,这个目录就能被系统识为一个XARPackage了。

### config.json
一个典型的config.json的格式如下
```
{
	"packageID" : "userinfo",
	"version" : "1.0.0.0",
	"build" : 1,
	"meta" : { 
		"desc" : "userinfo storage"
	},

	"depends" : [],
	"modules" : {
		"client" : "client.js",
	},

   "deviceType" : "pc_server",
	"drivers" : [
	],
	"storages" : ["/users/"],
   "knowledges" : ["global.events","global.runtimes","global.devices","global.storages","global.loadrules"]
}
```

packageID:关键字段 需要与代码当前的目录名相同
version:友好版本，给人看的，并无实际功能
build:关键字段 当不指定版本号去加载package的时候，系统会加载该package的默认版本（通常是最大的build号的包)，在某些场合也可以指定depend package的最小build版本。随着package里内容的更新，build号应该越来越大。
meta:是描述信息，纯粹用于展示
depends:关键字段 是该package的依赖package.意味着当该package加载完成后，其所依赖的package也必须都加载完成
modules:关键字段 定义了package内部的模块与实现代码的关系，这个表以后可以使用tools.js来自动生成
deviceType:关键字段 定义了package允许在什么类型的设备上加载。允许在所有设备上加载填写`*`,目前支持以下这些设备类型`[pc_client,wx_client,h5_client,pc_server]`
derviers:关键字段 定义了package依赖的驱动（后面会介绍driver的概念）
storages:关键字段 定义了package依赖的系统状态存储分区 (后面会介绍storage的概念)
knowledges:关键字段 定义了package依赖的knowledges(后面会介绍knowledge的概念)，package加载成功时，会完成其依赖knowledges的同步
简单的说，这个config包含了两部分信息，“package是什么”，以及“package依赖什么”。系统会根据"package依赖什么"的信息，做自动调度。

### module
一个典型的module的代码如下，基本上和nodejs的module写法一致
```
"use strict";
function md5(str,onComplete) {
    console.log("md5:" + str);
	 onComplete(str);
}
function foo(str) {
	console.log("foo:" + str);	
}

module.exports = {};
module.exports.md5 = md5;
```

在这个module中只导出了一个接口函数md5,而foo是内部函数，只能在module内部使用。
被导出的函数的最后一个参数`必须`是`完成函数`，也就是说，导出的函数默认是`异步`的。

### Remark
一个处于开发状态的XARPackage是不能按正常流程加载的，只有被发布到Package服务上的XARPackage才能按流程正常加载。所以在开始测试前，请不要忘记运行一次发布脚本
为了方便调试，bucky支持XARPackage的`全本地加载`模式，按如下方法就可以让应用系统以`全本地加载`模式运行。这样就能使用常见的nodejs调试器对代码进行调试了。

## Runtime
Runtime在Bucky的概念里，是代码运行的容器。一个容器我们称做一个RuntimeInstance。
一个RuntimeInstance 只属于一个Application.
一个处于在线状态的Application,可能会有多个属于该Application的RuntimeInstance,而每个RuntimeInstance又加载了不同的XARPackage.
Bucky框架的一个核心概念就是`为代码找到合适的运行容器`，而传统的开发模型要求`先准备好容器，再加载正确的代码`。通过对这个理念的观察，我们希望让开发者专注于开发业务逻辑，上传代码到小应用云后，由小应用云调度器在合适的时机创建合适的Runtime来运行开发者编写的代码 ,这样就能让逻辑代码尽可能的与分布式系统的计算拓扑的细节解耦。
应用开发创建的Runtime通常都是`client runtime`,或则被称作`匿名Runtime`。在不同的js运行时下初始化client runtime的方法就是各种initCurrentRuntime().
应用开发使用全局函数getCurrentRuntime()方法来得到一个Runtime Instance,使用其它方法创建／得到Runtime都是依赖计算拓扑的细节，在未来可以由系统的架构师在对bucky的原理特别清楚的情况下编写相关代码。
Runtime从物理上很像一个虚拟机，由自己独立的沙盒环境（包括Cache,Storage），并且系统提供了接口 pause/resume 一个指定的 Runtime，并可以在不同的物理设备之间迁移。（这些接口都是高级接口，应用开发不应常用）

### 加载XARPackage的流程简介
Runtime最重要的功能就是加载并运行代码，这段代码写起来如下：
```
getCurrentRuntime().loadXARPackage("packageA",function(thePackage) {
    thePackage.loadModule("moduleA",function (moduleA,errorCode) {
         moduleA.md5("test", function (result, errorCode) {
             console.log("md5 result is " + result);
         });
     });
});
```

这段代码的实现流程简介如下
1.通过读取global.loadrule,以及packageA的依赖项目，判断当前Runtime是否能直接记载packageA,不能直接加载则加载packageA.proxy
2.查找repository服务，获得packageA的相关文件
3.下载解析config.json,加载依赖项
4.运行package的onload.js，XARPackage加载成功
5.开始加载模块，通过config.json里的module表查到模块对应的实现文件
6.加载实现文件，返回结果

### Remark
系统设计希望loadModule是同步的，但这可能会导致在浏览器里无法正确实现。所以目前的写法会有些复杂。

## Device
Device代表一个可计算设备(包括PC,Server,手机，可穿戴设备等)。 在Bucky的概念中，一个Runtime在一个时刻只会运行在一个Device上。但Runtime可以在不同的Device上迁移。
在一个Device上可以创建／同时运行 多个Runtime.一个Device 可以属于（注册到）多个Application.
Device通过Driver机制提供了一些依赖原生设备的功能。这是Bucky框架与旧世界之间的桥梁（目前有两个驱动:mysql,redis)。应用开发应该尽量不依赖Driver.
Device对象通常通过getCurrentRuntime().getOwnerDevice()的方法获得，但一般应用开发应该尽量不使用这个对象。

### Driver
由于Driver是Device的本地功能，所以使用同步的方法加载。加载代码如下：
>let mysqlDriver = getCurrentRuntime().getDriver("bx.mysql.client")	
如果当前设备由安装"bx.mysql.client"驱动，那么就能加载成功。（使用驱动并不需要访问Device对象） 
目前框架只支持少量的驱动，列表如下   
bx.mysql.client  
bx.redis.client  

我们面向微信小程序定制的TinyAppCloud为了减少编写后台应用所需要的知识，目前并没有支持这些驱动。使用者也不用学习sql语句和redis api了。

## Proxy与RPC
当Runtime试图加载一个XARPackage时，系统会判断该Package是否适合加载在当前Runtime,如果不适合，那么机会尝试寻找一个已经加载了该XARPackage的Runtime(或则创建一个)。而在当前Runtime里加载的，则是一个Proxy Package.
Proxy Package实现了原始Package中的所有模块和接口，目前这些接口的实现都非常简单：

```
let thisRutnime = getCurrentRuntime();
let rpc_args = arguments;
thisRutnime.selectTargetRuntime("userinfo",username,function(targetRuntime) {
    thisRutnime.postRPCCall(targetRuntime,"userinfo:userinfo:Login",rpc_args,"",onComplete);
});
```
简单的说，就是为目标Package选择一个合适的Runtime加载，然后在发起一个从当前Runtime到目标Runtime的RPC Call.
每一个XARPackage都应该有一个Proxy Package.我们提供来工具来生成这些Proxy Package.
整个系统是不存在魔法的，通过阅读Proxy的代码，应用工程师也可以使用现有的知识来分析调试应用系统。而且系统也允许高级开发者根据需要，定制自己的Proxy逻辑。


## Knowledges
Knowledges是应用开发过程中需要经常打交道的一个核心概念，也是Bucky的关键设计之一。一开始，可以把Knowledge简单的理解成`全局配置`。当应用开发只读取Knowledge的时候，Knowledges系统本身也就退化成了一个全局配置系统。

Knowledge采用key-value设计，一个典型的使用Knowledge的代码如下

```
let km = getCurrentRuntime().getKnowledgeManager();
km.dependKnowledge("myconfig");
	km.ready(function(){
	let myconfig = km.getKnowledge("myconfig").objectRead();
	let back_color = myconfig["back_color"]
});
```

可以看到，使用Knowledge需要等待一个异步更新，以便得到系统的最新配置。框架为了简化这个过程，可以在XARPackage中配置依赖的Knowledge,这样在完成XARPackage加载后，运行应用代码前，框架就已经在当前Runtime里同步好了需要的Knowledge.
Runtime依赖的Knowledge会尽可能的自动保持同步。
Knowledges机制的核心是 更新->同步。简单使用只需要掌握同步接口就够了（目前还没有开放Knowledge的更新接口）
当两个Runtime之间要进行RPC时，会自动对两个Runtime都依赖的Knowledge的进行同步。
系统预定义了一些以"global."开头的基础knowledge,是因为Bucky的一些基础机制依赖这些knowledge(这也说明Knowledge是框架最底层的概念之一)。每个XARPackage都应该默认依赖这些knowledge.

## Storages
大部分后台系统的核心需求，就是`存储特定格式的数据`。Storages就是为了解决这个问题提供的概念。应用代码使用Storages一定会消耗应用的`磁盘资源`。
Bucky里的状态存储需求分为两大类，一类是整个系统存储的状态，称作Storages.另一类是某个runtime运行中需要存储的状态，称作Local storage（内测版还未开放接口）。
整个系统需要存储的状态，可以理解为一堆存放在不同目录的“对象”，目录格式类似于 `/` ,`/data/` 这种形式。具体的使用接口有点类似html5的local storage的设计，实例代码如下:

```
let rs = thisRuntime.getRuntimeStorage("/users/");
let uobj = {"id":"admin","password":"123123123","desc":"admin user"};

rs.isObjectExists(uobj.id,function(objid,isExists) {
	if(isExists) {
		logger.info("admin is exists");
	} else {
		logger.info("admin not register,will add user");
		rs.setObject(uobj.id,uobj,function(){
			logger.info("admin register ok");
		});
	}
});
```

上述代码要正确运行，其所在的package的config.json里要有`"storages" : ["/users/"]`的配置。如果没有正确进行配置，`thisRuntime.getRuntimeStorage("/users/")`将返回null.
正确的使用Storages需要首先进行建模，思考系统需要存储的数据，以及这些数据是如何进行分区的。
随后需要考虑Storages的容量问题：一个runtime的storage空间是优先的，那么如何使用多个runtime来组成一个`raid`来解决容量的问题？
在然后要考虑数据的安全问题：一个runtime所在的硬件是有可能损坏的，当一个runtime有可能丢失的情况下，如何用多个runtime来组成一个`raid`来解决可靠性问题？
最后要考虑数据的性能问题：假设一个runtime所在的硬件是有同时读写数限制的，当一个分区的数据读写特别热的情况下，如何用多个runtime组一个`raid`来解决性能问题？

以上问题的讨论都超过了这篇简单文字的范围，内测阶段对入门者来说只需要掌握基本概念就可以了，最简单的方法，就是所有的数据都写入到`/`分区就好了。

## Caches
使用Storages读、写数据的性能基本上等于读、写文件系统的性能，实际上并不够快。对于一部分热门的数据，可以保存到Cache中来提高性能。
应用代码使用Storages一定会消耗应用的`内存资源`。Caches系统的设计基本与Storages一致，但一个Runtime上的Cache容量通常比Storage更小，应用开发者需要仔细考虑Cache的同步机制与淘汰机制。

注:`内测阶段暂不支持Cache`

## App Global Event
`内测版本暂未支持`

## 安全机制
`内测版本暂未支持`

# 开发流程
我们希望Bucky框架能改进互联网应用系统的整体开发流程，让门槛更低，并减少传统后台系统开发需要的大量的配置开发与运维开发工作，让团队把精力放在业务开发上。
理想中的开发流程如下：
1.理解上述基本概念，丢掉旧有的后台开发的惯性思维，把精力放在“说清楚需求的完整流程上”
2.对系统的核心数据进行建模，思考关键的状态对象。
3.一口气把需求的流程代码写完（可以是伪代码）
4.模块化。模块边界就是系统部署代码到不同计算设备的边界。把代码按逻辑拆分到不同的XARPackage:Module::Interface中，注意Interface都是异步函数
5.完成一些必要的配置工作，让系统跑起来。

# 作业
对Bucky有了一个大概的了解以后，可以通过阅读《step by step》，一步一步的运行我们内测版带的简单例子，更具体的感受一下Bucky与小程序结合的快速开发体验。
1.修改appid,然后能把系统带的demo跑起来
2.在account demo上，添加好友列表的功能


