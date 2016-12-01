小应用云(Tiny App Cloud) SDK （版本0.7.1) 简单使用说明

欢迎使用小应用云提供的bucky框架来快速构建您自己的小程序。bucky框架可以让后台开发不再需要关系后台主机的购买，配置开发，上线运维等繁琐的传统等业务无关的流程。只需要像编写一个本地模块一样开发／测试好一个“远端模块”，再发布到小应用云就完成了后台的开发工作。只需掌握javascript基础即可使用，无需学习其它技能。
bucky框架目前是一个后台框架，掌握之后除了给微信小程序开发后台，还可以给其它各种系统开发后台。

#SDK安装

##安装最新版本的nodejs
我们使用7.1版本的nodejs进行开发。所以，请先安装使用该版本以上的nodejs。

##确保sdk目录可以使用下列npm包,sdk提供的各种工具会依赖这些库
npm install xmlhttprequest
npm install deepcopy
npm install adm-zip

安装完成后，你可以在sdk目录下运行
node tools.js
node node_loader.js 
如果运行没有抛出异常就说明sdk安装成功可以正常工作了。

#SDK中包含的内容简介
首先阅读 doc/manual.md ，这是一个入门手册，可以用来一步一步的学习bucky框架
然后SDK中携带了一些实例，通过把这些实例跑起来可以建立起对bucky框架使用更直观的认识
开始使用bucky开发自己的项目后，可以通过 doc/reference.md 详细了解各个接口函数的意义和参数列表。 

##核心文件
wx_core.js 在微信小程序中使用的bucky框架核心文件
h5_core.js 在浏览器环境中使用的bucky框架核心文件
node_core.js 在nodejs环境中使用的bucky框架核心文件

##工具
node_loader.js 基于nodejs环境的加载器，可用作日常开发调试
tools.js bucky提供的一系列工具的合集，包括发布代码，修改应用系统状态，进行代码检查等等等等。

##示例
目前sdk中带有一个例子
##account
一个账号管理的例子，实现了最简单的注册，登陆接口。可以通过这个例子，了解一些最基础的概念是如何使用的。
可以在微信小程序，浏览器，nodejs环境中运行。

#意见和讨论
小应用云目前处于内测阶段，官方网站还在建设中。使用过程中有任何问题和建议，欢迎随时和我们联系
email:tac@buckyos.com
QQ群:435095186
github:https://github.com/buckyos/bucky_sdk




