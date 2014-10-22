# [Ghost](https://github.com/TryGhost/Ghost) [![Build Status](https://travis-ci.org/TryGhost/Ghost.svg?branch=master)](https://travis-ci.org/TryGhost/Ghost)

#### Quickstart:
1. 请先切换到 stable 分支，再clone 代码
2. 数据库脚本 见 /360云盘/项目/笔戈博客/数据库/bigertech_blog2.0.sql
3. 复制 config.example.js ，命名为 config.js 。
修改文件config.js  中的development 下的数据库配置信息 ，

```
database: {
            client: 'mysql',
            connection: {
                host     : '127.0.0.1',
                user     : 'root',
                password : 'root',
                database : 'bigertech_blog',
                charset  : 'UTF8_GENERAL_CI'
            }
        },

```

在控制台，切换到工作目录，执行以下命令

1. `npm install -g grunt-cli`
1. `npm install`
1. `grunt init` (and `grunt prod` if you want to run Ghost in production mode)
1. `npm start`

### Production

在`config.example.js`中，新增了`cdn`配置，配置项如下：

```Javascript
isProduction: 配置是否线上环境（NODE_ENV=production，待改进）

staticAssetsUrl: 静态资源CDN, 如css, js等

dynamicAssetsUrl: 动态资源, 如用户上传的图片等

syncImagesPath: 同步文件到CDN服务器上的路径
```

### Images cutting

`config.example.js`中的`images`选项可以配置后台上传图片是否进行裁剪，以及裁剪的大小尺寸等，可配置项如下：

```
dir: 裁剪的图片存放路径，比如 300x200，那么生成的裁剪图片将会在 config.paths.imagesPath/300x200/ 下存放。

cutWidth: 裁剪的宽度

cutHeight: 裁剪的高度
```

以上三项任意一项留空都不会对图片进行裁剪处理。

## 后台插入文章类别和模板对应关系
编辑文章界面可以选择文章的类型，如果是视频 则需要在 tag 中的第一个位置插入，优酷的视频ID

文章类型    | 前端模板
----|-------
文字博客  | post-article.hbs
评测视频  | post-video.hbs
活动宣传  | post-active.hbs
专题      | post-topic.hbs

## 接口部分

接口一律使用`Promise`支持。

### 专题接口 - Positions

```

// 得到指定ID专题下的所有文章
getPostsByPositionId(postId);

// eg:
getPostsByPositionId(1).then(function(posts) {
    if (posts === null) {
        console.log('ID对应的专题不存在！');
        return when.reject(new NotFoundError());
    }

    posts.forEach(function(post) {
        // ... some code
    });
});

// 得到指定Slug专题下的所有文章
getPostsByPositionId(slug);

// eg:
getPostsByPositionSlug('news').then(function(posts) {
    if (posts === null) {
        console.log('Sulg对应的专题不存在！');
        return when.reject(new NotFoundError());
    }

    posts.forEach(function(post) {
        // ... some code
    });
});

// 得到指定Name专题下的所有文章
getPostsByPositionName(name);

// eg:
getPostsByPositionName('新闻专题').then(function(posts) {
    if (posts === null) {
        console.log('Name对应的专题不存在！');
        return when.reject(new NotFoundError());
    }

    posts.forEach(function(post) {
        // ... some code
    });
});

// 得到所有的专题
findAll(options).then(function(positions) {});

// 得到一个指定的专题
// { id: id } 或者 { name: 'news' } 等等
findOne(options).then(function(position) {});

// 更新一个专题信息
edit(data, options);

// 添加一个专题信息
add(data, options);

// 删除一个专题信息
destroy(options);
```

## 长微博

长微博的生成采用的是模拟浏览器截图的原理来生成的，使用的是`phantomjs`环境。

### phantomjs ###

确保当前服务器环境需要安装好[phantomjs](http://phantomjs.org/)。

### 长微博文章页 ###

```
changweiboPage/:slug
```

### 长微博预览页 ###

```
changweibo/:slug
```

## 新增改动
*  文章类别选择
*  每篇文章加入 文章图片
*  默认文章url为标题的拼音链接， 修改为数字
*  文章在界面中的位置指定
*  点赞功能
*  多说评论
*  百度统计
*  图片自动裁剪
*  线上环境CDN资源切换

## Copyright & License
笔戈科技出品

Copyright (c) 2013-2014 Ghost Foundation - Released under the [MIT license](LICENSE).
