import $$observable from './utils/symbol-observable'

import {
  Store,
  PreloadedState,
  StoreEnhancer,
  Dispatch,
  Observer,
  ExtendState
} from './types/store'
import { Action } from './types/actions'
import { Reducer } from './types/reducers'
import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'

/**
 Creates a Redux store that holds the state tree.
 The only way to change the data in the store is to call `dispatch()` on it.
 *
 There should only be a single store in your app. To specify how different
 parts of the state tree respond to actions, you may combine several reducers
 into a single reducer function by using `combineReducers`.
 *
 @param reducer A function that returns the next state tree, given
 the current state tree and the action to handle.
 *
 @param preloadedState The initial state. You may optionally specify it
 to hydrate the state from the server in universal apps, or to restore a
 previously serialized user session.
 If you use `combineReducers` to produce the root reducer function, this must be
 an object with the same shape as `combineReducers` keys.
 *
 @param enhancer The store enhancer. You may optionally specify it
 to enhance the store with third-party capabilities such as middleware,
 time travel, persistence, etc. The only store enhancer that ships with Redux
 is `applyMiddleware()`.
 *
 @returns A Redux store that lets you read the state, dispatch actions
 and subscribe to changes.
 */
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext {
  // 如果 preloadedState和enhancer都为function，不支持，throw new Error
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function.'
    )
  }

  // preloadedState为function enhancer为undefined的时候说明initState没有初始化, 但是有middleware
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState as StoreEnhancer<Ext, StateExt>
    preloadedState = undefined
  }
  // debugger
  // 如果参数enhancer存在
  if (typeof enhancer !== 'undefined') {
    // 如果enhancer存在，那他必须是个function, 否则throw Error哈
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }
    /**
     * 传入符合参数类型的参数，就可以执行 enhancer,
     * 但是这个return深深的吸引了我, 因为说明有applyMiddleware的时候后面的都不用看了 ??? 当然不可能
     * 可是applyMiddleware其实是必用项，所以猜想一下applyMiddleware强化store之后会enhancer赋值undefined，再次调用createStore
     * 上下打个debugger看一下执行顺序(debugger位置以注释)，果然不出所料
     * 好了， 假设我们还不知道applyMiddleware()这个funcrion具体干了什么，
     * 只知道他做了一些处理然后重新调用了createStore并且enhancer参数为undefined
     * 先记下，后续在看applyMiddleware， 因为我们现在要看的是createStore
     * * */
    // debugger

    return enhancer(createStore)(
      reducer,
      preloadedState as PreloadedState<S>
    ) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }

  let currentReducer = reducer // 临时存放 reducer 的地方
  let currentState = preloadedState as S // 临时存放 state 的地方
  let currentListeners: (() => void)[] | null = [] // 监听队列
  let nextListeners = currentListeners // 引用赋值, 和正式的队列进行区分, 别有他用
  let isDispatching = false // 是不是正在dispatch

  /**
   This makes a shallow copy of currentListeners so we can use
   nextListeners as a temporary list while dispatching.
   *
   This prevents any bugs around consumers calling
   subscribe/unsubscribe in the middle of a dispatch.
   */
  // Google翻译: 确保可以使下一个侦听器突变
  // 我的理解是存储一下快照, 以为接下来可能会进行操作.
  function ensureCanMutateNextListeners() {
    // 是否相同, 是不是简单的引用赋值, 是的话就浅拷贝一份
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   Reads the state tree managed by the store.
   *
   @returns The current state tree of your application.
   */
  // 获取当前的state
  function getState(): S {
    // 如果正在dispatch 就报错,因为要获取最新的state, dispatch很有可能会改变state
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState as S
  }

  /**
   Adds a change listener. It will be called any time an action is dispatched,
   and some part of the state tree may potentially have changed. You may then
   call `getState()` to read the current state tree inside the callback.

   You may call `dispatch()` from a change listener, with the following
   caveats:

   1. The subscriptions are snapshotted just before every `dispatch()` call.
   If you subscribe or unsubscribe while the listeners are being invoked, this
   will not have any effect on the `dispatch()` that is currently in progress.
   However, the next `dispatch()` call, whether nested or not, will use a more
   recent snapshot of the subscription list.

   2. The listener should not expect to see all state changes, as the state
   might have been updated multiple times during a nested `dispatch()` before
   the listener is called. It is, however, guaranteed that all subscribers
   registered before the `dispatch()` started will be called with the latest
   state by the time it exits.
   *
   @param listener A callback to be invoked on every dispatch.
   @returns A function to remove this change listener.
   */
  function subscribe(listener: () => void) {
    // listener必须为函数
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    // 如果正在dispatch中则抛错
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }

    // 是否有监听者,或者是否被订阅
    let isSubscribed = true

    // 保存快照, 拷贝一份监听队列到nextListeners(如果是引用的话)
    ensureCanMutateNextListeners()
    // 往监听队列里面推入一个监听者
    nextListeners.push(listener)

    // 返回一个取消订阅的方法
    return function unsubscribe() {
      // 如果没有被订阅, 直接shut down
      if (!isSubscribed) {
        return
      }

      // 如果正在dispatch 报错
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api/store#subscribelistener for more details.'
        )
      }

      // 取消订阅
      isSubscribed = false

      // 依旧是拿下当前的监听队列
      ensureCanMutateNextListeners()
      // 找到监听者
      const index = nextListeners.indexOf(listener)
      // 删除这个监听者
      nextListeners.splice(index, 1)
      // 清空当前的监听队列
      currentListeners = null
    }
  }

  /**
   Dispatches an action. It is the only way to trigger a state change.
   *
   The `reducer` function, used to create the store, will be called with the
   current state tree and the given `action`. Its return value will
   be considered the **next*state of the tree, and the change listeners
   will be notified.
   *
   The base implementation only supports plain object actions. If you want to
   dispatch a Promise, an Observable, a thunk, or something else, you need to
   wrap your store creating function into the corresponding middleware. For
   example, see the documentation for the `redux-thunk` package. Even the
   middleware will eventually dispatch plain object actions using this method.
   *
   @param action A plain object representing “what changed”. It is
   a good idea to keep actions serializable so you can record and replay user
   sessions, or use the time travelling `redux-devtools`. An action must have
   a `type` property which may not be `undefined`. It is a good idea to use
   string constants for action types.
   *
   @returns For convenience, the same action object you dispatched.
   *
   Note that, if you use a custom middleware, it may wrap `dispatch()` to
   return something else (for example, a Promise you can await).
   */
  // 修改store的唯一方法
  function dispatch(action: A) {
    // action必须是一个对象
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }

    // action必须拥有一个type
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }

    // 如果正在dispatching，那么不执行dispatch操作。
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    // 设置dispatching状态为true，并使用reducer生成新的状态树。
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      // 当获取新的状态树完成后，设置状态为false.
      isDispatching = false
    }

    // 将目前最新的监听方法放置到即将执行的队列中遍历并且执行
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    // 将触发的action返回
    return action
  }

  /**
   Replaces the reducer currently used by the store to calculate the state.
   *
   You might need this if your app implements code splitting and you want to
   load some of the reducers dynamically. You might also need this if you
   implement a hot reloading mechanism for Redux.
   *
   @param nextReducer The reducer for the store to use instead.
   @returns The same store instance with a new reducer in place.
   */
  // 这个其实很少用到, 官方的介绍是主要是用于动态替换reducer的时候会用到
  function replaceReducer<NewState, NewActions extends A>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    // 修改reducer
    // TODO: do this more elegantly
    ;((currentReducer as unknown) as Reducer<
      NewState,
      NewActions
    >) = nextReducer

    // This action has a similar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.
    dispatch({ type: ActionTypes.REPLACE } as A)
    // change the type of the store by casting it to the new store
    return (store as unknown) as Store<
      ExtendState<NewState, StateExt>,
      NewActions,
      StateExt,
      Ext
    > &
      Ext
  }

  /**
   Interoperability point for observable/reactive libraries.
   @returns A minimal observable of state changes.
   For more information, see the observable proposal:
   https://github.com/tc39/proposal-observable
   */
  // 查询之后,也没发现有什么特别的用处...暂时跳过,如果有帅哥看到的话可以不吝赐教
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       The minimal observable subscription method.
       @param observer Any object that can be used as an observer.
       The observer object should have a `next` method.
       @returns An object with an `unsubscribe` method that can
       be used to unsubscribe the observable from the store, and prevent further
       emission of values from the observable.
       */
      subscribe(observer: unknown) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          const observerAsObserver = observer as Observer<S>
          if (observerAsObserver.next) {
            observerAsObserver.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT } as A)

  const store = ({
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  } as unknown) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  return store
}
