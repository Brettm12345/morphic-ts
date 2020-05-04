import { makeADT, ofType } from '../../src'

interface Foo {
  type: 'foo'
  a: string
  b: number
}

interface Bar {
  type: 'bar'
  c: string
  d: number
}

interface Baz {
  type: 'baz'
  e: string
  f: number
}

const fooBar = makeADT('type')({
  foo: ofType<Foo>(),
  bar: ofType<Bar>(),
  baz: ofType<Baz>()
})

fooBar.match({}, x => x) // $ExpectType (a: Foo | Bar | Baz) => Foo | Bar | Baz
fooBar.match({ foo: () => (undefined as any) as never }, x => x) // $ExpectType (a: Foo | Bar | Baz) => Bar | Baz
fooBar.match({ foo: x => x.type, bar: x => x.type, baz: x => x.type }) // $ExpectType (a: Foo | Bar | Baz) => "foo" | "bar" | "baz"

// $ExpectType (a: Foo | Bar | Baz) => number
fooBar.matchClassic({
  foo: foo => foo.a.length,
  bar: _ => 2,
  baz: _ => 2
})

// $ExpectType (a: Foo | Bar | Baz) => unknown
fooBar.matchClassic({
  foo: foo => foo.a.length,
  // $ExpectError
  bar: _ => '2',
  baz: _ => 2
})

// $ExpectError
fooBar.matchClassic({
  foo: foo => foo.a.length,
  baz: _ => 2
})

// $ExpectType (a: Foo | Bar | Baz) => number
fooBar.matchClassic(
  {
    foo: foo => foo.a.length,
    bar: _ => 2,
    baz: _ => 2
  },
  // $ExpectType (x: never) => number
  x => 2
)

// $ExpectType (a: Foo | Bar | Baz) => unknown
fooBar.matchClassic(
  {
    foo: foo => foo.a.length,
    bar: _ => 2
  },
  // $ExpectError
  x => '2'
)

// $ExpectType (a: Foo | Bar | Baz) => unknown
fooBar.matchClassic(
  {
    foo: foo => foo.a.length,
    // $ExpectError
    bar: _ => 'zz'
  },
  x => 2
)

// This is a pathological case but it won't be helpful if typechecking (infers never)
// Also only correct programs would be accepted

// $ExpectType (a: Foo | Bar | Baz) => never
fooBar.matchClassic(
  // $ExpectError
  {},
  // $ExpectError
  x => 2
)

// $ExpectType (a: Foo | Bar | Baz) => number
fooBar.matchClassic(
  {
    foo: foo => foo.a.length,
    bar: _ => 2
  },
  // $ExpectType (x: Baz) => number
  x => 2
)

// $ExpectType Reducer<number, Foo | Bar | Baz>
fooBar.createReducer(0)(
  {
    foo: foo => n => n + foo.a.length
  },
  bar_baz => n => n + bar_baz.type.length // $ExpectType (bar_baz: Bar | Baz) => (n: number) => number
)

fooBar.strict<number>(fooBar.match({ foo: () => 1 }, _ => 2)) // $ExpectType (_: Foo | Bar | Baz) => number
