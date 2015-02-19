'use strict';

/**
 * A collection of core utility functions.
 * @const
 */
var core = {};

/**
 * Unique id property prefix.
 * @type {String}
 * @protected
 */
core.UID_PROPERTY = 'core_' + ((Math.random() * 1e9) >>> 0);

/**
 * Counter for unique id.
 * @type {Number}
 * @private
 */
core.uniqueIdCounter_ = 1;

/**
 * When defining a class Foo with an abstract method bar(), you can do:
 * Foo.prototype.bar = core.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error will be thrown
 * when bar() is invoked.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be overridden.
 */
core.abstractMethod = function() {
  throw Error('Unimplemented abstract method');
};

/**
 * Creates a new function that, when called, has its keyword set to the
 * provided value, with a given sequence of arguments preceding any provided
 * when the new function is called.
 *
 * Usage: <pre>var fn = bind(myFunction, myObj, 'arg1', 'arg2');
 * fn('arg3', 'arg4');</pre>
 *
 * @param {function} fn A function to partially apply.
 * @param {!Object} context Specifies the object which this should point to
 *     when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to
 *     the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
core.bind = function(fn) {
  if (!fn) {
    throw new Error();
  }

  if (Function.prototype.bind) {
    return core.bindWithNative_.apply(core, arguments);
  } else {
    return core.bindWithoutNative_.apply(core, arguments);
  }
};

/**
 * Same as `core.bind`, but receives the arguments for the function as a single
 * param.
 * @param {function} fn A function to partially apply.
 * @param {!Object} context Specifies the object which this should point to
 *     when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to
 *     the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @protected
 */
core.bindWithArgs_ = function(fn, context) {
  var args = Array.prototype.slice.call(arguments, 2);

  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    Array.prototype.unshift.apply(newArgs, args);
    return fn.apply(context, newArgs);
  };
};

/**
 * Same as `core.bind`, but uses the native javascript `bind` function instead
 * of reimplementing it.
 *
 * @param {function} fn A function to partially apply.
 * @param {!Object} context Specifies the object which this should point to
 *     when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to
 *     the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @protected
 */
core.bindWithNative_ = function(fn) {
  var bind = fn.call.apply(fn.bind, arguments);
  return function() {
    return bind.apply(null, arguments);
  };
};

/**
 * Same as `core.bind`, but it can't receive any arguments for the function.
 * @param {function} fn A function to partially apply.
 * @param {!Object} context Specifies the object which this should point to
 *     when the function is run.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @protected
 */
core.bindWithoutArgs_ = function(fn, context) {
  return function() {
    return fn.apply(context, arguments);
  };
};

/**
 * Same as `core.bind`, but doesn't try to use the native javascript `bind`
 * function.
 *
 * @param {function} fn A function to partially apply.
 * @param {!Object} context Specifies the object which this should point to
 *     when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to
 *     the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @protected
 */
core.bindWithoutNative_ = function(fn, context) {
  if (arguments.length > 2) {
    return core.bindWithArgs_.apply(core, arguments);
  } else {
    return core.bindWithoutArgs_(fn, context);
  }
};

/**
 * Loops constructor super classes collecting its properties values. If
 * property is not available on the super class `undefined` will be
 * collected as value for the class hierarchy position. Must be used with
 * classes created using `core.inherits`.
 * @param {!function()} constructor Class constructor.
 * @param {string} propertyName Property name to be collected.
 * @return {Array.<*>} Array of collected values.
 */
core.collectSuperClassesProperty = function(constructor, propertyName) {
  var propertyValues = [constructor[propertyName]];
  while (constructor.superClass_) {
    constructor = constructor.superClass_.constructor;
    propertyValues.push(constructor[propertyName]);
  }
  return propertyValues;
};

/**
 * Gets an unique id. If `opt_object` argument is passed, the object is
 * mutated with an unique id. Consecutive calls with the same object
 * reference won't mutate the object again, instead the current object uid
 * returns. See {@link core.UID_PROPERTY}.
 * @type {opt_object} Optional object to be mutated with the uid. If not
 *     specified this method only returns the uid.
 * @throws {Error} when invoked to indicate the method should be overridden.
 */
core.getUid = function(opt_object) {
  if (opt_object) {
    return opt_object[core.UID_PROPERTY] ||
      (opt_object[core.UID_PROPERTY] = core.uniqueIdCounter_++);
  }
  return core.uniqueIdCounter_++;
};

/**
 * Inherits the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   core.base(this, a, b);
 * }
 * core.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'c');
 * child.foo();
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
core.inherits = function(childCtor, parentCtor) {
  function TempCtor() {
  }
  TempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new TempCtor();
  childCtor.prototype.constructor = childCtor;

  /**
   * Calls superclass constructor/method.
   *
   * This function is only available if you use core.inherits to express
   * inheritance relationships between classes.
   *
   * @param {!object} me Should always be "this".
   * @param {string} methodName The method name to call. Calling superclass
   *     constructor can be done with the special string 'constructor'.
   * @param {...*} var_args The arguments to pass to superclass
   *     method/constructor.
   * @return {*} The return value of the superclass method/constructor.
   */
  childCtor.base = function(me, methodName) {
    var args = Array.prototype.slice.call(arguments, 2);
    return parentCtor.prototype[methodName].apply(me, args);
  };
};

/**
 * The identity function. Returns its first argument.
 * @param {*=} opt_returnValue The single value that will be returned.
 * @return {?} The first argument.
 */
core.identityFunction = function(opt_returnValue) {
  return opt_returnValue;
};

/**
 * Returns true if the specified value is a boolean.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
core.isBoolean = function(val) {
  return typeof val === 'boolean';
};

/**
 * Returns true if the specified value is not undefined.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
core.isDef = function(val) {
  return val !== undefined;
};

/**
 * Returns true if value is not undefined or null.
 * @param {*} val
 * @return {Boolean}
 */
core.isDefAndNotNull = function(val) {
  return core.isDef(val) && !core.isNull(val);
};

/**
 * Returns true if value is a dom element.
 * @param {*} val
 * @return {Boolean}
 */
core.isElement = function(val) {
  return val && typeof val === 'object' && val.nodeType === 1;
};

/**
 * Returns true if the specified value is a function.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
core.isFunction = function(val) {
  return typeof val === 'function';
};

/**
 * Returns true if value is null.
 * @param {*} val
 * @return {Boolean}
 */
core.isNull = function(val) {
  return val === null;
};

/**
 * Returns true if the specified value is an object. This includes arrays
 * and functions.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
core.isObject = function(val) {
  var type = typeof val;
  return type === 'object' && val !== null || type === 'function';
};

/**
 * Returns true if value is a string.
 * @param {*} val
 * @return {Boolean}
 */
core.isString = function(val) {
  return typeof val === 'string';
};

/**
 * Merges the values of a static property a class with the values of that
 * property for all its super classes, and stores it as a new static
 * property of that class. If the static property already existed, it won't
 * be recalculated.
 * @param {!function()} constructor Class constructor.
 * @param {string} propertyName Property name to be collected.
 * @param {function(*, *):*=} opt_mergeFn Function that receives an array filled
 *   with the values of the property for the current class and all its super classes.
 *   Should return the merged value to be stored on the current class.
 * @return {*} The value of the merged property.
 */
core.mergeSuperClassesProperty = function(constructor, propertyName, opt_mergeFn) {
  var mergedName = propertyName + '_MERGED';
  if (constructor[mergedName]) {
    return constructor[mergedName];
  }

  var merged = core.collectSuperClassesProperty(constructor, propertyName);
  if (opt_mergeFn) {
    merged = opt_mergeFn(merged);
  }
  constructor[mergedName] = merged;
  return constructor[mergedName];
};

/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
core.nullFunction = function() {};

/**
 * Creates a new function that, when called, has its this keyword set to the
 * provided value, with a given sequence of arguments following any provided
 * when the new function is called.
 *
 * Usage: <pre>var fn = rbind(myFunction, myObj, 'arg1', 'arg2');
 * fn('arg3', 'arg4');</pre>
 *
 * @param {function} fn A function to partially apply.
 * @param {!Object} context Specifies the object which this should point to
 *     when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to
 *     the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
core.rbind = function(fn, context) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var args = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.push.apply(newArgs, args);
      return fn.apply(context, newArgs);
    };
  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};

export default core;