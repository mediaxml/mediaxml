### Query Preprocessor

#### Selectors

#### Casting

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
``

##### `$classConstructorName(<j-:s>)`

Returns the class constructor name for given input. This function will
always return a string.

#### Transform

This section contains functions for transforming input into a new
output.

##### `$tuple()`

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

##### `$keys()`

##### `$json()`

##### `$array()`

##### `$date()`

##### `$int()`

##### `$float()`

##### `$boolean()`

##### `$string()`

##### `$true()`

##### `$false()`

#### Strings

##### `$camelcase()`

##### `$length()`

#### Arrays

##### `$concat()`

##### `$length()`

##### `$unique()`

##### `$slice()`

##### `$join()`

##### `$isArray()`

#### Utility

##### `$print()`

##### `$now()`


