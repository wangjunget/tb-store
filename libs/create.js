import obaa from './obaa'
import { getPath, needUpdate, fixPath, getUsing } from './path'

function create(store, option) {
  if (arguments.length === 2) {
    if (!store.instances) {
      store.instances = {}
    }

    if (!store.__changes_) {
      store.__changes_ = []
    }

    const changes = store.__changes_
    if (!store.onChange) {
      store.onChange = function (fn) {
        changes.push(fn)
      }
    }

    if (!store.offChange) {
      store.offChange = function (fn) {
        for (let i = 0, len = changes.length; i < len; i++) {
          if (changes[i] === fn) {
            changes.splice(i, 1)
            break
          }
        }
      }
    }
    const hasData = typeof option.data !== 'undefined'
    let clone
    if (option.data) {
      clone = JSON.parse(JSON.stringify(option.data))
      option.data.$ = store.data
    } else {
      option.data = store.data
    }
    observeStore(store)
    const onLoad = option.onLoad
    const onUnload = option.onUnload

    option.onLoad = function (e) {
      this.store = store

      option.use && (this.__updatePath = getPath(option.use))
      this.__use = option.use
      this.__hasData = hasData
      if (hasData) {
        Object.assign(option.data, JSON.parse(JSON.stringify(clone)))
      }
      store.instances[this.route] = store.instances[this.route] || []
      store.instances[this.route].push(this)
      this.computed = option.computed
      this.setData(option.data)
      const using = getUsing(store.data, option.use)

      option.computed && compute(option.computed, store, using, this)
      this.setData(using)

      onLoad && onLoad.call(this, e)
    }

    option.onUnload = function (e) {
      store.instances[this.route] = store.instances[this.route].filter(
        (ins) => ins !== this
      )
      onUnload && onUnload.call(this, e)
    }

    Page(option)
  }
}

create.Page = function (store, option) {
  create(store, option)
}

create.Component = function (store, option) {
  if (arguments.length === 2) {
    if (!store.instances) {
      store.instances = {}
    }

    if (!store.__changes_) {
      store.__changes_ = []
    }

    const changes = store.__changes_
    if (!store.onChange) {
      store.onChange = function (fn) {
        changes.push(fn)
      }
    }

    if (!store.offChange) {
      store.offChange = function (fn) {
        for (let i = 0, len = changes.length; i < len; i++) {
          if (changes[i] === fn) {
            changes.splice(i, 1)
            break
          }
        }
      }
    }
    const hasData = typeof option.data !== 'undefined'
    let clone
    if (option.data) {
      clone = JSON.parse(JSON.stringify(option.data))
      option.data.$ = store.data
    } else {
      option.data = store.data
    }
    observeStore(store)

    const onInit = option.onInit
    const didMount = option.didMount
    const didUnmount = option.didUnmount

    option.onInit = function (e) {
      this.store = store

      option.use && (this.__updatePath = getPath(option.use))
      this.__use = option.use
      this.__hasData = hasData
      if (hasData) {
        Object.assign(option.data, JSON.parse(JSON.stringify(clone)))
      }

      onInit && onInit.call(this, e)
    }

    option.didMount = function (e) {
      const store = this.store
      store.instances[this.is] = store.instances[this.is] || []
      store.instances[this.is].push(this)
      this.computed = option.computed
      this.setData(option.data)
      const using = getUsing(store.data, option.use)

      option.computed && compute(option.computed, store, using, this)
      this.setData(using)

      didMount && didMount.call(this, e)
    }

    option.didUnmount = function(e) {
      const instances = store.instances[this.is] || []
      let instanceIndex
      instances.forEach((item, index) => {
        if (item.$id === this.$id) {
          instanceIndex = index
        }
      })
      instances.splice(instanceIndex, 1)
      didUnmount && didUnmount.call(this, e)
    }

    Component(option)
  } else {

    const didMount = store.didMount
    const hasData = typeof store.data !== 'undefined'
    let clone

    store.didMount = function () {
      const page = getCurrentPages()[getCurrentPages().length - 1]
      // 页面未引入但是组件引入，使用默认直接创建组件

      if (page.store) {
        store.use && (this.__updatePath = getPath(store.use))
        this.store = page.store
        this.__use = store.use
        this.computed = store.computed
        if (store.data) {
          clone = JSON.parse(JSON.stringify(store.data))
          store.data.$ = this.store.data
        } else {
          store.data = this.store.data
        }
        this.__hasData = hasData
        if (hasData) {
          Object.assign(store.data, JSON.parse(JSON.stringify(clone)))
        }
        this.setData(store.data)
        const using = getUsing(this.store.data, store.use)

        store.computed && compute(store.computed, this.store, using, this)
        this.setData(using)

        page._omixComponents = page._omixComponents || []
        page._omixComponents.push(this)
      }

      didMount && didMount.call(this)
    }

    Component(store)
  }

}


function compute(computed, store, using, scope) {
  for (let key in computed) {
    using[key] = computed[key].call(store.data, scope)
  }
}

function observeStore(store) {
  const oba = obaa(store.data, (prop, value, old, path) => {
    let patch = {}
    if (prop.indexOf('Array-push') === 0) {
      let dl = value.length - old.length
      for (let i = 0; i < dl; i++) {
        patch[fixPath(path + '-' + (old.length + i))] = value[old.length + i]
      }
    } else if (prop.indexOf('Array-') === 0) {
      patch[fixPath(path)] = value
    } else {
      patch[fixPath(path + '-' + prop)] = value
    }

    _update(patch, store)
  })

  if (!store.set) {
    store.set = function (obj, prop, val) {
      obaa.set(obj, prop, val, oba)
    }
  }

  const backer = store.data
  Object.defineProperty(store, 'data', {
    enumerable: true,
    get: function () {
      return backer
    },
    set: function () {
      throw new Error(
        'You must not replace store.data directly, instead assign nest prop'
      )
    },
  })
}

function _update(kv, store) {
  for (let key in store.instances) {
    store.instances[key].forEach((ins) => {
      _updateOne(kv, store, ins)
      if (ins._omixComponents) {
        ins._omixComponents.forEach((compIns) => {
          _updateOne(kv, store, compIns)
        })
      }
    })
  }
  store.__changes_.forEach((change) => {
    change(kv)
  })
  store.debug && storeChangeLogger(store, kv)
}

function _updateOne(kv, store, ins) {
  if (
    !(store.updateAll || (ins.__updatePath && needUpdate(kv, ins.__updatePath)))
  ) {
    return
  }
  if (!ins.__hasData) {
    return _updateImpl(kv, store, ins)
  }
  const patch = Object.assign({}, kv)
  for (let pk in patch) {
    if (!/\$\./.test(pk)) {
      patch['$.' + pk] = kv[pk]
      delete patch[pk]
    }
  }
  _updateImpl(patch, store, ins)
}

function _updateImpl(data, store, ins) {
  return _doUpdate(data, store, ins)
  // if (!wx.nextTick) {
  //   return _doUpdate(data, store, ins)
  // }
  // if (ins._omixDataBuffer === undefined) {
  //   ins._omixDataBuffer = {}
  // }
  // Object.assign(ins._omixDataBuffer, data)
  // if (!ins._omixTickScheduled) {
  //   wx.nextTick(function() {
  //     _doUpdate(ins._omixDataBuffer, store, ins)
  //     ins._omixDataBuffer = {}
  //     ins._omixTickScheduled = false
  //   })
  //   ins._omixTickScheduled = true
  // }
}

function _doUpdate(data, store, ins) {
  if (Object.keys(data).length === 0) {
    return
  }
  ins.setData.call(ins, data)
  const using = getUsing(store.data, ins.__use)
  ins.computed && compute(ins.computed, store, using, ins)
  ins.setData.call(ins, using)
}

function storeChangeLogger(store, diffResult) {
  try {
    const preState = my.getStorageSync({key: `CurrentState`}) || {}
    const title = `Data Changed`
    console.groupCollapsed(
      `%c  ${title} %c ${Object.keys(diffResult)}`,
      'color:#e0c184; font-weight: bold',
      'color:#f0a139; font-weight: bold'
    )
    console.log(`%c    Pre Data`, 'color:#ff65af; font-weight: bold', preState)
    console.log(
      `%c Change Data`,
      'color:#3d91cf; font-weight: bold',
      diffResult
    )
    console.log(
      `%c   Next Data`,
      'color:#2c9f67; font-weight: bold',
      store.data
    )
    console.groupEnd()
    my.setStorageSync({
      key: `CurrentState`,
      data: store.data
    })
  } catch (e) {
    console.log(e)
  }
}

create.obaa = obaa

export default create
