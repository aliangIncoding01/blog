### 什么是 Hook?：  
- Hook 是 React 16.8 的新增特性。它可以让你在不编写 class 的情况下使用 state 以及其他的 React 特性。Hook 使你在非 class 的情况下使用更多的 react 的属性。

- Hook 是一些可以让你在函数组件里“钩入” React state 及生命周期等特性的函数。

### API 

- **useState**

	useState 会返回一对值：**当前**状态 和 一个让你更新它的函数，你可以在事件处理函数中或其它一些地方调用它。值得注意的是，你不同于 this.setState，这里的 state 不一定要是一个对象——如果需要也可以是对象，这个初始的 state 参数只在第一个渲染的时候会被用到。  
	
	e.g.  
	
	```
	import React, { useState } from 'react';

	function Example() {
	  // 声明一个叫 “count” 的 state 变量。
	  const [count, setCount] = useState(0);
	
	  return (
	    <div>
	      <p>You clicked {count} times</p>
	      <button onClick={() => setCount(count + 1)}>
	        Click me
	      </button>
	    </div>
	  );
	}
	```
	声明多个 State Hook
	
	e.g.  
	
	```
	function ExampleWithManyStates() {
	  // 声明多个 state 变量！
	  const [age, setAge] = useState(42);
	  const [fruit, setFruit] = useState('banana');
	  const [todos, setTodos] = useState([{ text: 'Learn Hooks' }]);
	  // ...
	}
	```

- **useEffect**

	副作用：执行一些 **数据获取、订阅（监听事件）、手动修改 DOM**，在 react 中我们把这些操作称之为副作用。  
	
	useEffect 给函数式组件提供了操作副作用的能力，它跟 class 组件中的 componentDidMount、componentDidUpdate 和 componentWillUnmount 具有相同的用途，只不过被合并成了一个 API。  
	
	React 会在每次渲染后调用副作用函数 —— 包括第一次渲染的时候。  
	
	e.g. 下面这个组件在 React 更新 DOM 后会设置一个页面标题：
	
	```
	import React, { useState, useEffect } from 'react';

	function Example() {
	  const [count, setCount] = useState(0);
	
	  // 相当于 componentDidMount 和 componentDidUpdate:
	  useEffect(() => {
	    // 使用浏览器的 API 更新页面标题
	    document.title = `You clicked ${count} times`;
	  });
	
	  return (
	    <div>
	      <p>You clicked {count} times</p>
	      <button onClick={() => setCount(count + 1)}>
	        Click me
	      </button>
	    </div>
	  );
	}	
	```

	和 useState 一样，在函数式组件中也可以多次使用 useEffect
	
	需要**清除**的副作用，例如监听和移除监听，**useEffect** 可以返回一个函数，用来提供清除副作用的操作，返回的第二个函数类似于 class 组件中的 componentWillUnmount 钩子，做一些清除的动作。  
	
	e.g. 
	
	```
	useEffect(() => {
		otherModule.addEventListener(do something...);
		
		return () => {
			otherModule.removeEventListener(do something...);
		}
	});
	```
	
	**useEffect** 相当于把 class 组件中的 componentDidMount 和 componentDidUpdate 合并到它的函数体中，把 componentWillUmount 的过程用在返回的函数中，类似于三个 class 组件的钩子的集合，避免了很多因为忘记正确地处理 componentDidUpdate 而产生的bug。
	
	**第二个参数：**数组，为了避免函数式组件中的 state 没有变化而多次执行 useEffect 产生的性能问题，可以在 useEffect 的第二个参数数组中加入这个 state，这样一来只有当这个 state 发生变化的时候才会再次执行 useEffect。  
	
	e.g. 
	
	```
	useEffect(() => {
	  document.title = `You clicked ${count} times`;
	}, [count]); // 仅在 count 更改时更新
	```
	
	在返回的清除操作中的同样适用
	
	```
	useEffect(() => {
		otherModule.addEventListener(do something...);
		
		return () => {
			otherModule.removeListener(do something...)
		}
	}, [count]);
	```

	只有在 count 变化时才会移除旧的监听器重新监听。
	
- **useContext**
	
	接收一个 context 对象（React.createContext 的返回值）并返回该 context 的当前值  
	
	```
	const value = useContext(MyContext);
	```
	
- **useReducer** 

	useState 的替代方案，它接受一个形如 (state, action) => newState 的 reducer，并返回当前的 state， 以及其配套的 dispatch 方法。  
	
	e.g. 
	
	```
	const initialState = {count: 0};

	function reducer(state, action) {
	  switch (action.type) {
	    case 'increment':
	      return {count: state.count + 1};
	    case 'decrement':
	      return {count: state.count - 1};
	    default:
	      throw new Error();
	  }
	}
	
	function Counter({initialState}) {
	  const [state, dispatch] = useReducer(reducer, initialState);
	  return (
	    <>
	      Count: {state.count}
	      <button onClick={() => dispatch({type: 'increment'})}>+</button>
	      <button onClick={() => dispatch({type: 'decrement'})}>-</button>
	    </>
	  );
	}
	```

	**惰性初始化：** 如果 state 的初始值是通过计算的来的，那么计算的逻辑可以写到 useReducer 的第三个参数中，可以提取一个方法，用于计算初始化 state ，并把这个方法放到 useReducer 的第三个参数中。
	
- **useCallback** 

	把内联函数以及依赖项数组作为参数传入 useCallback ,它将返回该内联函数的 memoized 版本，把该函数体缓存起来，该回调函数只会在依赖项改变时才更新。如果你将该回调函数的 memoized 版本以内联函数传递给子组件，会避免自组件不必要的渲染。  
	
	useCallback(fn, deps) 相当于 useMemo(() => fn, deps)。其本质相当于一个闭包函数。

- **useMemo** 

	把“创建”函数和依赖项数组作为参数传入 useMemo，它仅会在某个依赖项改变时才重新计算 memoized 值。这种优化有助于避免在每次渲染时都进行高开销的计算。  
	
	传入 useMemo 的函数会在渲染期间执行。请不要在这个函数内部执行与渲染无关的操作，诸如副作用这类的操作属于 useEffect 的适用范畴，而不是 useMemo。  
	
	如果没有提供依赖项数组，useMemo 在每次渲染时都会计算新的值。
	
- **useRef** 

	useRef 返回一个可变的 ref 对象，其 .current 属性被初始化为传入的参数（initialValue）。返回的 ref 对象在组件的整个生命周期内保持不变，相当于这个组件的全局变量，支持把变量赋值给 .current 属性，也可以把 DOM 节点赋值给 ref 与 class 组件的用法相同。
	
	与 class 组件中的 ref 不同的是， class 中的 ref 的 .current 属性代表的是 这个 DOM，而 useRef 返回的 ref 可以很方便的保存任何变量，类似于一个 class 中的全局属性。
	
	e.g. 
	
	one. 代表 DOM
	
	```
	function TextInputWithFocusButton() {
	  const inputEl = useRef(null);
	  const onButtonClick = () => {
	    // `current` 指向已挂载到 DOM 上的文本输入元素
	    inputEl.current.focus();
	  };
	  return (
	    <>
	      <input ref={inputEl} type="text" />
	      <button onClick={onButtonClick}>Focus the input</button>
	    </>
	  );
	}
	```

	two. 赋值为一个变量
	
	```
	function Timer() {
	  const intervalRef = useRef();
	
	  useEffect(() => {
	    const id = setInterval(() => {
	      // ...
	    });
	    intervalRef.current = id;
	    return () => {
	      clearInterval(intervalRef.current);
	    };
	  });
	
	  // ...
	}
	```

- **useDebugValue**

	useDebugValue 可用于在 React 开发者工具中显示自定义 hook 的标签。
	
	e.g.  
	
	useFriendStatus 为一个自定义 Hook 组件
	
	```
	function useFriendStatus(friendID) {
	  const [isOnline, setIsOnline] = useState(null);
	
	  // ...
	
	  // 在开发者工具中的这个 Hook 旁边显示标签
	  // e.g. "FriendStatus: Online"
	  useDebugValue(isOnline ? 'Online' : 'Offline');
	
	  return isOnline;
	}
	```

- **自定义 Hook**

	把组件之间通用的逻辑抽离出来，形成一个单独的供外界调用的组件，并在此组件中用到了其它 Hook 来处理相关逻辑，如果次组件的名字以 **“use”**(useSomething)，我们就说这是一个自定义 Hook。
	
	Hook 是一种复用状态逻辑的方式，它不复用 state 本身。事实上 Hook 的每次调用都有一个完全独立的 state —— 因此你可以在单个组件中多次调用同一个自定义 Hook。  
	
	自定义 Hook 更像是一种约定而不是功能。
	
