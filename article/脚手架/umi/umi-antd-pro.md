## 技术栈

- 框架：react
- 脚手架：umi（构建使用roadhog，基于webpack的封装）
- 组件库：antd
- 路由：react-router
- 状态管理：dva
- css：less、css module
- ajax：umi-request（封装fetch）
- 语言：ts（可选）
- 代码检查：eslint + stylelint + prettier
- 单测、e2e测试：jest、puppeteer
- 工具库：lodash、moment

## 搭建过程

#### 1. 搭建项目

```

# 进入新创建的demo目录
cd /demo/antdprodemo

# 用脚手架创建umi项目
npm create umi

# 安装依赖
npm install

# 本地运行
npm start

```

#### 2. 代码格式化

```
// .prettierrc.js

const fabric = require('@umijs/fabric');

module.exports = {
    ...fabric.prettier,
    tabWidth: 4, // 增加这行，将tab展示为4个space
};
```

#### 3. 需要了解的api和工具用法

- [路由配置（config.ts）](https://pro.ant.design/docs/router-and-nav-cn)
- [路由跳转](https://umijs.org/zh/guide/navigate-between-pages.html) 也可以使用```dva/router```中的```routerRedux```（```import { routerRedux } from 'dva/router';
```）进行跳转，参考user登录的逻辑实现。

- [dva](https://dvajs.com/guide/concepts.html#effect)
- [dva-loader](https://www.cnblogs.com/ww01/p/10412404.html)
- [Table](https://ant.design/components/table-cn/)
- [Form](https://ant.design/components/form-cn/)
- [umi中的model](https://umijs.org/zh/guide/with-dva.html#%E4%BD%BF%E7%94%A8)
- [区块（当前的区块都是页面级别的区块）](https://pro.ant.design/docs/block-cn)。安装好一个区块后，pages下会多出一个页面目录，目录下除了页面对应的组件实现外，还可能包括其他的文件或目录：model.js、service.js、_mock.js，/locale分别对应这个页面使用的model、请求和mock数据、国际化话术配置
- [布局（布局在路由中配置）](https://pro.ant.design/docs/layout-cn)
- [国际化（多语言）](https://pro.ant.design/docs/i18n-cn)