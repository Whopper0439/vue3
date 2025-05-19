class Person {
  constructor(name) {
    this.name = name
  }

  sayHi() {
    console.log('我是原型方法', this.name)
  }
}

const p = new Person('张三')

// 实例方法的优先级>原型方法, 覆盖，原型链
p.sayHi() = function() {
  console.log('我是实例的一个属性',this.name)
}

p.sayHi()