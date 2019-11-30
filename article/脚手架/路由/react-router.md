## react-router

*路由不只是页面切换，更是代码组织方式*

**为什么要用路由？**  

- 页面切换
- URL 定位页面（模块）
- 更有语义的组织资源
- 通过 **Router** 控制容器组件，达到只有容器组件变化，而浏览器不刷新的效果

**路由特性**

- 声明式路由
- 动态路由

**实现方式**

- URL 路径     

	**BrowserRouter**: aa/bb/ 路径的方式匹配路由  

- hash 路由  

	**HashRouter**: #/***/ hash的方式匹配路由
	
- 内存路由  

	**MemoryRouter**: 路径地址不变，地址匹配存到内存中
	
**资源组织**

- 业务逻辑松耦合
- 易于扩展、重构和维护（模块单元清晰）
- 路由层面实现 **lazy load**

**Demo**

```
import React from 'react'
import {
	BrowserRouter,
	Route,
	Link
} from 'react-router-dom'

const Home = () => <h1>Home</h1>
const Hello = () => <h1>Hello</h1>
const About = () => <h1>About</h1>

export default class RouterSimple extends React.component {
	render () {
		return (
			<Router>
				<div>
					<ul id="menu">
						<li>
							<Link to="/home">Home</Link>
						</li>
						<li>
							<Link to="/hello">Hello</Link>
						</li>
						<li>
							<Link to="/about">About</Link>
						</li>
					</ul>
					
					<div id="page-container">
						// path匹配路径，component匹配组件
						<Route path="/home" component={Home} />
						<Route path="/hello" component={Hello} />
						<Route path="/about" component={About} />
					</div>
				</div>
			</Router>
		);
	}
}

```

**主要API**

- **< Link to="Route配置的地址" >** : 普通链接，不会出发浏览器刷新

```
import { Link } from 'react-router-dom'

<Link to="/about">About</Link>
```

- **< NavLink to="" activeClassName="页面选中之后要给页面添加的类名">** : 类似 < Link >,但是会添加当前选中状态

```
<NavLink 
	to="/faq" 
	activeClassName="selected"
>FAQS</NavLink>
```

- **< prompt when="func(){需要满足的条件}" message="提示的内容">** : 满足条件时提示用户是否离开页面

```
import { Prompt } from 'react-router'

<Prompt
	when="{formIsHalfFilledOut}"
	message="Are you sure you want to leave?"
/>	
```

- **< Redirect >** : 重定向当前页面，例如登录判断

```
import { Route, Redirect } from 'react-router'

<Route exact path="/" render={() => (
	loggedIn ? (
		<Redirect to="/dashboard"/>
	) : (
		<PublicHomePage/>
	)
)}/>
```

- **< Route exact(是否精确匹配) path="/aaa" component={组件}>** : 路由配置的核心标记，路径匹配时显示对应的组件，如没有 exact 属性，模糊匹配多个 path 时同时显示对应的组件

```
import { BrowserRouter as Router, Route} from 'react-router-dom';

<Router>
	<div>
		<Route exact path="/" component={Home} />
		<Route path="/news" component={NewsFeed} />
	</div>
</Router>
```

- **< Switch >** : 只显示第一个匹配的路由， 当匹配模糊匹配多个 path 时，只显示第一个 < Route > 配置的组件

```
import { switch ,Route } from 'react-router';

<switch>
	<Route exact path="/" component={Home}/>
	<Route path="/about" component={About}/>
	<Route path="/:user" component={User}/>
	<Route component={NoMatch}/>
</switch>
```

**通过URL传参**

Route 绑定的组件会给组件传参，作为组件的 props.match 传入，页面状态尽量通过URL参数定义

```
const Topic = ({match}) => (
	<h1> Topic {match.params.id} </h1>
);

<Route path="topic/:id" component={Topic} />
```

**嵌套路由**

- 每个 React 组件都可以是路由的容器组件
- React Router 的声明式语法可以方便的定义嵌套式路由
- 底层的 path 配置必须包含顶层的配置，没有 exact ，同时匹配，嵌套导航，同时显示组件

```
import React from 'react';
import {
	BrowserRouter as Router,
	Route,
	Link
} from 'react-router-dom';

const Category = ({ match }) => (
	<h1> Sub Category {match.params.id} </h1>
);

const SubCategory = ({ match }) => (
	<div>
		<h1> Category {match.params.id} </h1>
		
		<ul id="menu">
			<li>
				<Link to="{`/category/${match.params.id}/sub/1`}">
					Sub Category1
				</Link>
			</li>
			<li>
				<Link to="{`/category/${match.params.id}/sub/2`}">
					Sub Category2
				</Link>
			</li>
			<li>
				<Link to="{`/category/${match.params.id}/sub/3`}">
					Sub Category3
				</Link>
			</li>
		</ul>
		
		<div>
			<Route
				path="/category/:id/sub/:subId"
				component={Category}
			></Route>
		</div>
	</div>
);

export default class NestedRoute extends React.PurecComponent {
	render () {
		return (
			<Router>
				<div>
					<ul id="menu">
						<li>
							<Link to="/category/1">Category 1</Link>
						</li>
						<li>
							<Link to="/category/2">Category 2</Link>
						</li>
						<li>
							<Link to="/category/3">Category 3</Link>
						</li>
					</ul>
					
					<div id="page-container">
						<Route 
							path="/category/:id"
							component={SubCategory}
						></Route>
					</div>
				</div>
			</Router>
		);
	}
}
```