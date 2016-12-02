
#参考手册  

##全局函数 
### + RuntimeInstance getCurrentRuntime() 
常用接口，获得当前代码所在的RuntimeInstance对象。  
如果该函数返回null,说明框架没有正确初始化。  

### + Application getCurrentApp()  
常用接口，获得当前的应用系统。  
如果该函数返回null,说明框架没有正确初始化。  

### + initCurrentRuntime   
在各种javascript环境中用来初始化bucky的client runtime。根据javascript运行环境的不同，该函数可能有不同的参数。  
在小程序环境中初始化Bucky Runtime  

#### + BX_LOG(string info,int level,traceid)
输出一行日志，内容为info,级别为一下可选值
>var BX_LOG_LEVEL_ERROR = 50;  
>var BX_LOG_LEVEL_WARN  = 40;  
>var BX_LOG_LEVEL_INFO  = 30;  
>var BX_LOG_LEVEL_DEBUG = 20;  

通过调整当前的日志级别，可以让低于日志级别的日志不显示。
`以上日志实现内测阶段使用传统的本地日志，未来会使用更适合分布式系统调试使用的统一日志收集系统`  
BX_INFO,BX_ERROR,BX_DEBUG,BX_WARN 是相应级别的便捷函数。

### - void setCurrentApp(Application)  
这是一个私有接口，正常应用逻辑开发不应该手工初始化 Application对象。  

##Application  
Application对象，用来得到当前运行的分布式应用的信息  

### + void Application.init(AppInfo appInfo,function onInitComplete)  
异步初始化Application对象。Application对象会从core service中读取必要的信息，所以这个操作时异步的。  
#### 参数列表  
#### `appInfo`：一般从app.json读取，内容如下：  
```
{  
  "appID" : "bx.demos.account",  
  "appHost" : "https://weixin.xmaose.com/apphost/",  
  "repositoryHost" : "https://weixin.xmaose.com/repository/"  
} 
```
appID是应用的唯一ID。  
appHost与repositoryHost是app运行依赖的核心服务地址。配置不同的服务器可以用来区分线上版本和开发版本。  

#### `onInitComplete`: function(erroCode,appInfo){...}  
当初始化完成后，会调用该函数。  

### + string Application.getID()  
返回Application的唯一ID.   

### + string Application.getHost()  
返回Application依赖的app host服务地址。  

##RuntimeInfo  
用来表示一个具体的RuntimeInstance.这个对象应用开发很少使用，我们并不鼓励在应用逻辑中过于依赖某个具体的RuntimeInstance。  
#### `RuntimeInfo.ID` : RuntimeInstance的唯一ID。   
#### `RuntimeInfo.OwnerDeviceID` : RuntimeInstance所在的设备ID。   
#### `RuntimeInfo.OwnerAppID` : RuntimeInstance所属的Application ID。  
#### `RuntimeInfo.OwnerAppHost` : RuntimeInstance所属的Application所在的App Host服务地址。  
### `RuntimeInfo.Ability` : RuntimeInstance所拥有的Ability列表，通常是其所在Device的Ability列表的子集。  
### `RuntimeInfo.PostURL` : RuntimeInstance的RPC URL,系统内部使用。  

##RuntimeInstance  
核心对象。    
RuntimeInstance代表的是当前代码的运行环境。一般通过全局函数getCurrentRuntime()来获取。  

### + string RuntimeInstance.getInstanceID()  
返回当前Runtime的唯一ID  

### + Device RuntimeInstance.getOwnerDevice()  
返回当前Runtime所在的设备对象。  

### + Application RuntimeInstance.getOwnerApp()  
返回当前Runtime属于哪个Application. 通常该函数的返回等价于getCurrentApp()  

### + RuntimeStorage RuntimeInstance.getRuntimeStorage(string globalPath)  
Application所要永久保存的数据，最后一定会在某些Runtime上落地。当应用代码在这些有数据的Runtime上运行时，就能通过RuntimeStorage得到保存的数据。  
如果Runtime并不持有这些数据，那么该函数返回null。   
#### `globalPath` 表示数据所在的全局目录路径  
想象Application把数据保存在一个全局磁盘上，那么很自然的就会对数据分目录放，这些目录就通过globalPath来表达。  
如果应用比较简单，可以把数据全部保存在"/"分区下。  

### + LocalStorage RuntimeInstance.getLocalStorage()
`未实现` 返回当前Runtime持有的本地存储管理器。

### + RuntimeCache RuntimeInstance.getRuntimeCache()
`未实现` 返回当前Runtime持有的内存Cache管理器。 

### + RuntimeInfo RuntimeInstance.createRuntimeInfo()
返回与指代RuntimeInstance的一个RuntimeInfo.   

### + KnowledgeManager RuntimeInstance.getKnowledgeManager()
返回当前的Runtime所使用的KnowledegeManager对象。这是应用开发得到KnowledgeManager对象的主要方法。  

### + Driver RuntimeInstance.getDriver(string driverID)
得到一个驱动。驱动能否获取成功取决于当前Runtime所在的设备。  
驱动通常能提供一些功能，用于与旧世界打交道。应用开发应该尽量避免使用驱动。  
目前实现的驱动：(`小应用暂未开放加载驱动`)  
+ bx.mysql.client  
+ bx.mysql.redis  

### + void RuntimeInstance.loadXARPackage(xarInfo xarID,function onComplete)
核心函数,用于加载一个指定的package

### + XARPackage RuntimeInstance.getLoadedXARPackage(xarInfo xarID)
返回当前RuntimeInstance已经加载成功的一个Package。  
这是一个同步函数。 

### + RuntimeInfo RuntimeInstance.getRuntimeInfo(runtimeID) 
通过runtimeID获得其RuntimeInfo。

### + RuntimeInstance.selectTargetRuntime(packageID,packageInfo,selectKey,onComplete)
proxy会使用的核心函数，为一个操作选择一个合适的runtime

### + RuntimeInstance.callFunc(functionName,args,selectKey,traceID,onComplete)
通过functionName发起一次调用。  
functionName的定义参考BaseLib.parseFunctionName  
这个函数常用于自己编写proxy package的使用，一般应用开发并不需要手工调用该函数。 

### - RuntimeInstance.postRPCCalll(remoteRuntimeInfo,functionname,args,traceID,onComplete)
私有函数，发起一次RPC。

### - void RuntimeInstance.loadLocalXarPackage(xarInfo xarID,function onComplete)
私有函数，用于在微信小程序环境中加载本地XARPackage。

### - bool RuntimeInstance.isXARPackageCanLoad(packageInfo,string instanceID) 
判断当前Runtime是否允许`直接加载`目标XAR包。如果不允许，那么当前Runtime在加载目标XAR包时，会加载该XAR的proxy包

### - void RuntimeInstance.createRuntimeOnDevice()
`将要废弃` 私有函数

### - void RuntimeInstance.resumeRuntime()
`将要废弃` 私有函数

### - void RuntimeInstance.selectRuntimeByFilter()
`将要废弃` 私有函数

### - void RuntimeInstance.selectDeviceByFilter()
`将要废弃` 私有函数

### - void RuntimeInstance.selectRuntimeByStoragePath()
`将要废弃` 私有函数

### - void RuntimeInstance.enableRuntimeStorage(globalPath)
私有函数, 主要用于all in one local debug

### - void RuntimeInstance.bindRuntimeStorage(globalPath,localPath)
私有函数，主要用于all in one local debug.

### - void RuntimeInstance.initWithInfo(RuntimeInfo info)
私有函数

### - void RuntimeInstance.installDefaultDriverFromNode()
私有函数

##XARPackage
代表Bucky框架里最重要一个基础概念，是对各种工程文件进行模块化以后，物理上的一个包。  
通常通过RuntimeInstance对象的loadXARPackage函数获得。  

### + packageInfo XARPackage.getPackageInfo()
返回该XARPackage定义在config.json中的配置信息。

### + XARPackage.loadModule(string moduleID,function onComplete)
通过模块ID加载XARPackage中的一个模块,加载结果通过onComplete返回。
XARPackage的config.json里定义了可以被加载的模块。
#### `onComplete` : function(Module,errorCode){...}
通过该回调返回结果。加载成功Module为非null值。

### XARPackage.isModuleExist(string moduleID)
判断模块是否存在。存在返回true.

### - XARPackage.loadLocalModule()
私有函数，微信小程序的环境加载js文件的方法较为特殊。

##Module
通过loadModule返回的对象，是一个包含所有导出函数的字典。
如果一个模块的结尾是按以下方法倒出的：
>module.exports = {};
>module.exports.Login = Login;
>module.exports.Register = Register;

那么加载该模块返回的字典为
>{
>    "Login" : [Function],
>    "Register" : [Function]
>}

##RuntimeStorage 
Application所要永久保存的数据，最后一定会在某些Runtime上落地。当应用代码在这些有数据的Runtime上运行时，就能通过RuntimeStorage得到保存的数据。  
RuntimeStorage使用K-V设计来保存结构化数据。

### + RuntimeStorage.setObject（string objID,object objItem,function onComplete）
要求在当前Storage目录保存一个ObjectItem.保存完成后会触发onComplete通知
该调用成功后一定会触发一次磁盘写入。消耗App的磁盘空间资源和IO吞吐资源。

### + RuntimeStorage.getObject(string objID,function onComplete)
要求从当前Storage目录读取一个ObjectItem.读取成功通过onComplete返回。
该调用成功后一定会触发一次磁盘读取。消耗App的IO吞吐资源。

### + RuntimeStorage.removeObject(string objID,function onComplete)
要求从当前Storage目录删除一个ObjectItem。删除结果通过onComplete返回。
该调用成功后会释放App的磁盘空间资源，消耗一定的IO吞吐资源。

### + RuntimeStorage.isObjectExists(string objID,function onComplete)
判断当前Storage目录是否存在一个ObjectItem.判断结果通过onComplete返回。
该调用会消耗App的IO吞吐资源。

##RuntimeCache
`内测版暂未开放`

## ErrorCode
Bukcy使用一些通用的错误代码（还会持续增加）来表示API的结果。

+ `ErrorCode.RESULT_OK` : 0  表示成功
+ `ErrorCode.RESULT_TIMEOUT` : 操作超时失败
+ `ErrorCode.RESULT_WAIT_INIT` : 2 操作失败，需要等待初始化成功
+ `ErrorCode.RESULT_ERROR_STATE` : 3 操作失败，处于错误的状态
+ `ErrorCode.RESULT_NOT_FOUND` : 4 操作失败，对象未找到   
+ `ErrorCode.RESULT_SCRIPT_ERROR` : 5 操作失败，脚本错误  
+ `ErrorCode.RESULT_NO_IMP` : 6 操作失败，该功能未实现  
+ `ErrorCode.RESULT_ALREADY_EXIST` : 7 操作失败，对象已存在  
+ `ErrorCode.RESULT_UNKNOWN` : 8 操作失败，未知错误

## KnowledgeManager
知识管理器是Bucky的一个关键设计，用于管理／同步 分布式系统里的一些关键的全局状态。   
在开发者看来，可以把KnowledgeManager想象成一个全局变量管理器（读多写少，但写有强一致性保证）  
提供必要的并行同步设施。  
内测阶段请简单实用KnowledgeManager,我们以后会有更详细的文档来更全面的介绍该设施

### InfoNode
KnowledgeManager通过Key返回的一个指定的全局状态对象。为了方便应用开发，读操作被设计为同步的。
目前只支持两种数据类型，不同的数据类型有不同粒度的操作函数。 
+ Object
+ Map 

#### + int InfoNode.getType()
获得该全局对象的类型。

#### + int InfoNode.getState()
获得该全局对象当前的状态，正常使用下能拿到的InfoNode的状态都是STATE_READY

#### + Object InfoNode.objectRead()
如果该状态的类型是Object,那么返回该Object

#### + void InfoNode.objectUpdate(Object newObj,function onComplete)
如果该状态的类型是Object，那么异步更新该全局状态。
`内测版未支持`  

#### + Object InfoNode.mapGet(string key)
如果该状态的类型是Map,那么返回key对应的value对象。  

#### + void InfoNode.mapSet(string key,Object objItem,function onComplete)
如果该状态的类型是Map，那么异步更新设置key对应的value对象为objItem。 更新结果通过onComplete返回。
`内测版未支持`  

#### + void InfoNode.mapGetClone()
如果该状态的类型是Map，那么返回整个map（通常用于便利)  

### + InfoNode KnowledgeManager.getKnowledge(string key)
核心函数，通过key返回一个全局状态对象。该函数是同步的。
该key必需通过KnowledgeManager.dependKnowledge事先要求依赖了。

### + void KnowledgeManager.dependKnowledge(string key,Object options)
核心函数，Runtime要求依赖key指定的全局状态。  

### + void KnowledgeManager.ready(function onReady)
核心函数，调用后当前所有依赖的全局状态如果都已同步完成，会触发onReady通知。

### + int KnowledgeManager.getState()
返回当前KnowledgeManager的状态。一般不需要调用函数。  

### - string KnowledgeManager.getInfoURL(string key)
私有函数  

### - void KnowledgeManager.addknowledgeKey(string key,InfoNode aNode)
私有函数  

### - void KnowledgeManager.removeknowledgeKey(string key)
私有函数   

##BaseLib
BaseLib定义了大量的功能性静态函数。
这是Bucky框架为了统一各个js运行时库的差异提供的基础功能库。框架会保证这些功能函数在不同的JS环境中都能工作，应用开发应该尽量使用BaseLib中提供的功能来完成需求。
如果您在开发过程中有基础功能的需求而该功能又不在BaseLib中，请给我们提Issue :)
`内测阶段BaseLib的功能函数以满足我们自己的需要为主，以后还会进一步调整和整理`

### + int BaseLib.setTimer(function func,int timeout)
创建一个timer,每隔timeout指定的毫秒的时间过去后，会执行func。
调用成功返回timerID

### + void BaseLib.killTimer(timerID)
停止一个timer。timerID由setTimer函数返回。

### + void BaseLib.setOnceTimer(function func,int timeout)
创建一个一次性的timer.经过timeout指定的毫秒时间后func被调用。

### + BaseLib.asynCall(function func)
发起一次`异步调用`，func函数会在被投递到下一个消息循环中调用。
非常有用的小函数，特别是用在处理某些事件的时候。

### + string BaseLib.hash(string method,string content,string format)  
通用hash函数，对content做method指定的hash算法，并把结果按format指定的格式返回  
目前method只支持md5  
format只支持  

### + string BaseLib.md5(string content,string format)
相当于调用 
>BaseLib.hash("md5",content,format)

### + int BaseLib.getRandomNum(min,max)
返回[min,max)之间的一个随机正数。  

### + string BaseLib.createGUID()
创建一个GUID String。 

### + bool BaseLib.isArrayContained(StringArray a,StringArray b)
判断一个字符串数组a是否被另一个字符串数组b包含。  

### + int BaseLib.inet_aton(string IP)
将一个"10.10.10.1"这样的字符串转换为32位整数  

### + string BaseLib.inet_ntoa(int num)
将一个32位整数转化为"10.10.10.1"这样的IP String  

### + FunctionInfo BaseLib.parseFunctionName(string functionName)
解析一个符合Bukcy定义的FunctionName.FunctionName看起来如下 $xarPackageID:$moudeID::$funcName@$runtimeInstanceID  
返回一个对象
```
{
  "packageInfo":"",
  "moduleID":"",
  "functionID":"",
  "instanceID":""
}
```

### + void BaseLib.loadFileFromURL(string fileURL,function onComplete)
从一个URL使用HTTP GET方法异步加载文件，结果通过onComplete回调返回。  

### + void BaseLib.loadJSONFromURL(string fileURL,function onComplete)
从一个URL使用HTTP GET方法异步加载文件，并假设该文件的内容是一个JOSN.把解析的结果通过onComplete回调返回。  

### + void BaseLib.postJSON(string postURL,Object postBody,function onComplete)
往postURL使用HTTP POST方法发送一个用json编码的postBody,通过onComplete返回服务器的结果。  

### + void BaseLib.postData(string postURL,string postBody,function onComplete)
往postURL使用HTTP POST方法发送一个postBody,通过onComplete返回服务器的结果。    

### - void BaseLib.runScriptFromURL(string fileURL,function onComplete)
私有函数

### - void BaseLib.wxHttpRequest()
私有函数，用于兼容微信小程序的HttpRequest

### - void BaseLib.postJSONCall(string postURL,Object postBody,function onComplete)
私有函数

### - table BaseLib.readCookie()
私有函数

### - string BaseLib.writeCookie()
私有函数

### - Object BaseLib.encodeParamAsJson(Object args) 
私有函数

### - Object BaseLib.decodeResultFromJSON(Object jsonBody)
私有函数

### - BaseLib.fsExistsSync()
私有函数

### - BaseLib.fileExistsSync()
私有函数

### - BaseLib.dirExistsSync()
私有函数

### - BaseLib.mkdirsSync()
私有函数

### - BaseLib.deleteFolderRecursive()
私有函数

### - BaseLib.findSync()
私有函数

### - BaseLib.findOnceSync()
私有函数

### - BaseLib.findOutDir()
私有函数

### - BaseLib.findFiles()
私有函数

### - BaseLib.writeFileTo()
私有函数

### - BaseLib.writeFileToAsync()
私有函数


## Device
一般通过RuntimeInstance的getOwnerDevice得到。代表当前Runtime所在的计算设备。

### DeviceInfo 对象
代表系统中的一个可计算设备（不一定是当前的可计算设备）
当应用系统
#### `DeviceID` : 设备的唯一ID
#### `Type` : 设备的类型。目前有以下可用值  
+ "*"  可模拟任意设备（只有本地调试模式会使用）  
+ pc_server 后台服务器  
+ wx_client 微信小程序客户端  
+ browser_client 浏览器客户端  
#### `IsOnline` : 设备是否在线  
#### `Ability` : 设备的能力列表 `目前小应用云所有的设备都支持 wlan-interface,storage`
#### `Drivers` : 设备支持的驱动列表 `目前小应用云未提供任何驱动`

### + string Device.getDeviceID()
得到设备的ID   

### + Array Device.getAbility()
得到设备的能力列表 `目前小应用云所有的设备都支持 wlan-interface,storage`   

### + string Device.getDeviceType()
得到设备的类型。目前有以下可用值    
+ "*"  可模拟任意设备（只有本地调试模式会使用）  
+ pc_server 后台服务器  
+ wx_client 微信小程序客户端  
+ browser_client 浏览器客户端  

### + bool Device.isDriverInstalled(string driverID)
查询是否支持某个指定的驱动  

### + DeviceInfo Device.createDeviceInfo()
创建代表当前设备的DeviceInfo对象  

### - Device.getAppHost()
私有函数

### - Device.getAppRepositoryHost()
私有函数

### - Device.getOwnerAppHost()
私有函数

### - Device.getInterfaceURL()
私有函数

### - Device.getOwnerUserID()
私有函数

### - Device.getOwnerUserToken()
私有函数

### - Device.setOwnerUserID()
私有函数

### - Device.getRuntimeRootDir()
私有函数

### - Device.getInstalledDrivers()
私有函数

### - Device.loadFromConfig()
私有函数

## GlobalEventManager
依赖Knowledge作为底层系统实现的全局事件系统。
`内测版未提供该模块`



