### Query Preprocessor

Queries are preprocessed to handle special syntax as sugar on top of
_JSONata syntax_.

#### Selectors

##### `:children([index[, count]])`

Selects children from an object that has a `children` field value.
Values from the `children` array can be sliced optionally when called
with functional syntax `children(start, count)`.

```js
$:children(2, 4) /** slices 4 children from the root starting at index 2 */
```

##### `[:]attr([name])`

Selects an attribute value of by name from an object that has an
`attribute` field value.

```js
**:attr(url) /** selects "url" attribute from any node */
```

##### `:text`

Selects text value from an object that has a `text` field value.

```js
**:text /** selects text value from any node */
```

##### Ordinals

Ordinals as selectors like `:first` and `:last` can be used to
reference the first and last elements in an array. Ordinals like
`:second`, `:third`, `:fourth` all the way to up `:tenth` can be used to
reference their corresponding element in an array.

###### `:first`

Selects the first element in an array.

```js
$:children:first /** This is the same as $.children[0] */
```

###### `:second`

Selects the second element in an array.

```js
$:children:second /** This is the same as $.children[1] */
```

###### `:third`

Selects the third element in an array.

```js
$:children:third /** This is the same as $.children[2] */
```

###### `:fourth`

Selects the fourth element in an array.

```js
$:children:fourth /** This is the same as $.children[3] */
```

###### `:fifth`

Selects the fifth element in an array.

```js
$:children:fifth /** This is the same as $.children[4] */
```

###### `:sixth`

Selects the sixth element in an array.

```js
$:children:sixth /** This is the same as $.children[5] */
```

###### `:seventh`

Selects the seventh element in an array.

```js
$:children:seventh /** This is the same as $.children[6] */
```

###### `:eighth`

Selects the eighth element in an array.

```js
$:children:eighth /** This is the same as $.children[7] */
```

###### `:ninth`

Selects the ninth element in an array.

```js
$:children:ninth /** This is the same as $.children[8] */
```

###### `:tenth`

Selects the tenth element in an array.

```js
$:children:tenth /** This is the same as $.children[9] */
```

###### `:last`

Selects the last element in an array.

```js
$:children:last /** This is the same as $.children[-1] */
```

#### Operators

##### `is`

Comparison operator that compares values in a variety of ways.

###### `is [not] <string|array|number|boolean|object|function>`

Compares value to a primitive type.

```js
/** finds all nodes with an url attribute that is a non-empty string */
**[attr(url) is string and attr(url) is not empty]
```

###### `is [not] <null|true|false|NaN|Infinity>`

Compares value to a constant type.

```js
/** finds all nodes with an role attribute that is not null */
**[attr(role) is not null]
```

###### `is [not] <Date|Document|Node|Fragment|Text>`

Compares value to a class type.

```js
/** finds any value that is a `Date` instance */
**[is Date]
```

###### `is [not] <expr>`

Compares value to right hand expression.

```js
/** finds any node where the url attribute is not a "bad url" */
**[attr(url) is not "bad url"]
```

##### `as`

Casting operator that can cast values to a variety of other values.

###### `as <array|boolean|float|function|int|number|object|string>`

Cast a value to a primitive type.

```js
123 as boolean /** true */
456 as string /** '456' */
123.456 as int /** 123 */
'0.12300' as float /** 0.123 */
'abc' as array /** ['a', 'b', 'c'] */
123 as string as array /** [] */
```

###### `as <false|true|NaN|null>`

Cast a value to a constant type.

```js
123 as false /** false */
"foo" as true /** true */
0 as null /** null */
123 as NaN /** NaN */
```

###### `as <Date|Document|Fragment|Node|Text>`

Cast a value to an instance type.

```js
"2020-04-20" as Date /** 2020-04-20T00:00:00.000Z */
```

###### `as camelcase`

Cast a value to a camel cased string.

```js
"hello world" as camelcase /** helloWorld */
```

###### `as pascalcase`

Cast a value to a pascal cased string.

```js
"hello world" as camelcase /** HelloWorld */
```

###### `as snakecase`

Cast a value to a snake cased string.

```js
"hello world" as camelcase /** hello_world */
```

###### `as json`

Cast a value to a parsed JSON.

```js
'{"hello": "world"}' as json /** { hello: 'world' } */
```

###### `as keys`

Cast a value to an enumeration of its keys.

```js
({"hello": true, "world": false}) as keys /** ['hello', 'world'] */
```

###### `as sorted`

Cast a value to a sorted array.

```js
([3, 2, 1, 'a', 'b']) as sorted /** [1, 2, 3, 'a', 'b'] */
```

###### `as reversed`

Cast a value to a reversed string or array.

```js
'123cba' as reversed /** 'abc321' */
```

###### `as unique`

Cast a value to an array or string with unique elements

```js
'aabbccdd' as unique /** 'abcd' */
```

###### `as tuple`

Cast a value to tuple with `key` and `value` pairs.

```js
({"hello": "world"}) as tuple /** { key: 'hello', value: 'world' } */
```

##### `let <key> = <value>`

Sets a global variable for the execution of the query.

```js
let a = 1;
let b = 2;
let c = $a + $b; /** 3 */
let key = 'd';
let $key = $c + 2; /** 5 */
print $d /** 5 */
```

##### `[target] has <subject>`

Check if `<subject>` is a property of `target`. Optionally, this
operator can be used in a query with the `target` omitted as it is
implicitly inferred.

```js
({ "foo": "bar" }) has "foo" // true
```

```js
**[attributes has url] // returns all nodes that have a "url" attribute
```

```js
**:attributes[has url] // returns all attributes that have a "url" field
```

##### `typeof <target>`

Computes the type of `target` as a string.

```js
typeof "foo" // 'string'
typeof ({}) // 'object'
typeof 123 // 'number'
```

##### `import <URI>`

Import a XML file or query string from a given `URI`. A valid `URI` can
be a HTTP(S) resource or a file path (optionally specified with
`file://`). The `import` operator requires a runtime loader. A runtime
loader is given for the `mxml(1)` command.

```js
import 'https://raw.githubusercontent.com/little-core-labs/mediaxml/master/example/mrss/feed.xml'

**[is text and is not empty]
```

##### `[target] contains <data>`

Checks if `data` is contained by `target`.

#### Casting

Types can be casted to and from a variety of types.

##### Primitives

```js
'123' as int // 123
```

```js
'123.456' as int // 123
```

```js
0 as boolean // false
```

```js
1 as boolean // true
```

```js
123 as string // '123'
```

```js
123 as int<16> // 291
```

```js
'abc' as array // ['a', 'b', 'c']
```

##### Specials

```js
$now() as Date // 2021-03-08T19:54:26.205Z
```

```js
'{"hello": "world"}' as json // { hello: 'world' }
```

```js
this as json // { name: '#empty', text: '', attributes: {}, children: [] }

```js
let $xml = '<rss><channel><title>hello</title></channel></rss>'
$xml as Node
/**
 * <rss>
 *   <channel>
 *     <title>hello</title>
 *   </channel>
 * </rss>
 */
```

##### String Casing

```js
'hello world' as CamelCase // helloWorld
```

```js
'hello world' as SnakeCase // hello_world
```

```js
'hello world' as PascalCase // HelloWorld
```

##### Transforms

```js
'fbdeca' as sorted // 'abcdef'
```

```js
([3,2,1]) as sorted // [3, 2, 1]
```

```js
({"d": 1, "c": 2, "b": 3, "a": 4}) as json as sorted
/**
 * {
 *   a: 4,
 *   b: 3,
 *   c: 2,
 *   d: 1
 * }
 */
```

```js
this as text // `<#empty />`
```

### JSONata Function Bindings

In addition to the [already built-in JSONata functions
](https://docs.jsonata.org/array-functions), the following functions are
registered as JSONata syntax functions and can be used in the query string.

#### Reflection

This section contains functions for reflecting runtime values such as
class constructor names or instance primitive type names.

##### `$typeof(<j-:s>)`

Returns the type of input as a string. This function will return `array` for
arrays, `date` for `Date` instances, otherwise `typeof input`.

```js
$typeof("string") // string
$typeof(123) // number
```

##### `$classConstructorName(<j-:s>)`

Returns the class constructor name for given input. This function will
always return a string.

#### Transform

This section contains functions for transforming input into a new
output.

##### `$tuple(<j-:a>)`

Convert input into `{key: ..., value: ...}` pairs.

```js
mxml (epg.xml)> **:attrs.$tuple() /** map all attributes to the `$tuple()` */
{
  key: 'source-info-url',
  value: 'http://www.schedulesdirect.org/'
}
{
  key: 'source-info-name',
  value: 'Schedules Direct'
}
...
```

##### `$keys(<j-:a>)`

Returns computed keys of input as an array.

##### `$json(<j-j?:j>)`

Converts input into a plain JSON object (parsed).

##### `$array(<j-:a>)`

Converts input to an array.

##### `$date(<j-:o>)`

Converts input into a date.

##### `$int(<j-j?:n>)`

Converts input into an integer.

##### `$float(<j-j?:n>)`

Converts input into a float.

##### `$boolean(<j-:b>)`

Converts input into a boolean.

##### `$string(<j-j?:s>)`

Converts input into a string.

##### `$true(<j-:b>)`

Returns true for any input.

##### `$false(<j-:b>)`

Returns false for any input.

#### Strings

##### `$camelcase(<s-:s>)`

Converts input string to camelcase.

##### `$length(<j-:n>)`

Returns the length of input string.

#### Arrays

##### `$concat(<a<j->:a>)`

Returns concatenated variable input as an array.

##### `$length(<j-:n>)`

Returns the length of input array.

##### `$unique(<j-:a>)`

Returns input array with only unique elements.

##### `$slice(<j-:a>)`

Returns a slice of an array or parser node.

##### `$join(<a-s?:s>)`

Returns an array joined by a given delimiter (default: ",").

##### `$isArray(<j-:b>)`

Returns true if input is an array, otherwise false.

#### Utility

##### `$print(<j-:l>)`

Prints variable input to stdout.

##### `$now(<j-:n>)`

Returns the UNIX Epoch in milliseconds.

