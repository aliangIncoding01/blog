### 由 react-router 管理的项目入口

项目的入口文件，根节点不变，入口文件交由 **router** 配置文件管理

eg.

```
import React from 'react';
import ReactDom from 'react-dom';

import Router from './router/index'; // 路由统一管理的入口文件

ReactDom.render(
	<Router />,
	document.getElementById('root')
);
```

### 建立统一管理路由的文件夹 router

**router** 文件夹入口文件中包含 **Router** API、详细的路由配置以及 **getRoutesView** 组织具体业务路由配置的核心代码，用 **Router** API 包裹 **getRoutesView** 方法组织路由配置后的结果

eg.

```
import React from 'react';
import {BrowserRouter} from 'react-router-dom';

import routeConfig from './routeConfig';
import getRoutesView from './getRoutesView';

// 具体的路由配置由 Router 包裹
export default () => (
	<BrowserRouter>
		<div className="page">
		    {getRoutesView(routeConfig)} // getRoutesView 提供核心的方法，组织具体的路由配置
		</div>
	</BrowserRouter>
);
```
### 跟业务相关的具体路由配置 routeConfig

路由的配置分为两种：

- 集中式
- 分散式

**集中式：** 路由的配置文件写在统一的配置文件中，**import** 导入所有需要配置的组件

eg. 

```
import asyncComponent from '@/common/utils/asyncComponent'; // 动态 import，详情见项目

const CategoryEntrance = asyncComponent(() => import('../page'));
const CategoryOne = asyncComponent(() => import('../page/categoryOne'));
const CategoryTwo = asyncComponent(() => import('../page/categoryTwo'));

const routes = [
	{
		path: '/app',
		component: CategoryEntrance,
		childRoutes: [
			{
				path: '/app/categoryone',
				component: CategoryOne
			},
			{
				path: '/app/categorytwo',
				component: CategoryTwo
			}
		]
	}
];

export default routes;

```

**分散式：** 每个需要配置的模块都有自己的 **routeConfig** 在入口路由配置文件中引入所有组件的路由配置，在主配置文件的 **childRoutes** 字段中遍历每个模块私有的路由配置文件，使其最终结果和集中式配置一样

eg.

```
import asyncComponent from '@/common/util/asyncComponent';

// 每个模块的具体配置项
const demoRouteOne = {
	path: '/demoOne',
	name: 'demoOne',
	component: asyncComponent(() => import('./index')),
};
import demoRouteTwo from './demoRouteTwo/routeConfig';
import demoRouteThird from './demoRouteThird/routeConfig';

const App = asyncComponent(() => import('./App'));

const childRoutes = [
	demoRouteOne
	demoRouteTwo,
	demoRouteThird
];
// 线上环境pushdemoRoute
if (env !== 'production') {
	childRoutes.push(demoRoute);
}

const routes = {
	path: '/',
	name: 'App',
	component: App,
	childRoutes: [...childRoutes].filter(r => r.component || (r.childRoutes && r.childRoutes.length > 0)) // 过滤由配置项组成的数组，如果一个配置项中配置了 component 或者由子配置项则把该配置项添加到路由配置树中
};

export default routes;
```
**区别：**
 
- 集中式配置是在主配置文件中引入各个具体的业务模块，分散式路由配置是在主配置文件中引入各个模块的路由配置文件
- 集中式路由配置文件只有一个，分散式路由配置文件由多个放在各个具体的业务模块中

**共同点：**

- 分散式路由和集中式路由最后形成的路由配置树结构是完全一样的
- 无论分散式还是路由集中式，核心处理逻辑是一样的，都是处理最终生成的路由配置树

### 组织路由配置的核心方法 getRoutesView

```
import React from 'react';
import {Route} from 'react-router-dom';

export default function getRoutesView (routes) {
	const result = renderRoutes(routes, '/');
	return result;
}

function renderRoutes(routes, contentPath) {
	if (!routes || !routes.length) {
	    return;
	}
	const children = [];
		
	const renderRoute = (route, routeContextPath) => {
		const currentPath = route.path;
		// currentPath根据配置文件有可能是'/**',也有可能是'**'
		// 判断是否是'/'开头的绝对路径，是就用，不是就拼接成绝对路径
		let newPath = /^\//.test(currentPath)
		    ? currentPath
		    : `${routeContextPath}/${currentPath}`;
		// 确保只有一个'/'
		newPath = newPath.replace(/\/+/g, '/');
			
		if (route.component && route.childRoutes) {
		    const childRoutes = renderRoutes(route.childRoutes, newPath);
		    // 将子路由塞到父路由里面
		    children.push(
		        <Route
		            key={newPath}
		            path={newPath}
		            render={props => <route.component {...props}>{childRoutes}</route.component>}
		        />
		    );
		}
		else if (route.component) {
		    children.push(
		        <Route
		            key={newPath}
		            path={newPath}
		            component={route.component}
		            exact
		        />
		    );
		}
		else {
		    route.childRoutes.forEach(r => renderRoute(r, newPath));
		}
    }

	routes.forEach(item => renderRoute(item, contentPath));
	return children;
}

```

### render & component

**区别：** 嵌套路由会给**render** 传入一个匿名函数，用来渲染嵌套组件路由，如果用**component**，则每次都会卸载原来的组件创建新的组件，浪费资源，源码如下：

```
return (
  component ? ( // component prop gets first priority, only called if there's a match
    match ? React.createElement(component, props) : null
  ) : render ? ( // render prop is next, only called if there's a match
    match ? render(props) : null
  ) : children ? ( // children come last, always called
    typeof children === 'function' ? (
      children(props)
    ) : !Array.isArray(children) || children.length ? ( // Preact defaults to empty children array
      React.Children.only(children)
    ) : (
      null
    )
  ) : (
    null
  )
)
```







