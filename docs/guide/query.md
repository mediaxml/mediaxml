### Query Preprocessor

Queries are preprocessed to handle special syntax as sugar on top of
_JSONata syntax_.

#### Selectors

##### `:children([index[, sliceLength]])`

##### `:attr([name])`

##### `:text`

##### Ordinals

###### `:first`
###### `:last`
###### Other Ordinals

#### Operators

##### `is`
##### `as`

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

