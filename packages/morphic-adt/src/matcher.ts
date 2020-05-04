import { identity } from 'fp-ts/lib/function'
import { KeysDefinition, isIn } from '.'

type ValueByKeyByTag<Union extends Record<any, any>, Tags extends keyof Union = keyof Union> = {
  [Tag in Tags]: { [Key in Union[Tag]]: Union extends { [r in Tag]: Key } ? Union : never }
}

type Cases<Record, R> = { [key in keyof Record]: (v: Record[key]) => R }

interface Folder<A> {
  <R>(f: (a: A) => R): (a: A) => R
}

interface Transform<A, Tag extends keyof A> extends TransformInter<A, ValueByKeyByTag<A>[Tag]> {}
interface TransformInter<A, Record> {
  (match: Partial<Cases<Record, A>>): (a: A) => A
}

interface ReducerBuilder<S, A, Tag extends keyof A> {
  (match: Cases<ValueByKeyByTag<A>[Tag], (s: S) => S>): Reducer<S, A>
  // tslint:disable-next-line: unified-signatures
  <
    M extends Partial<Cases<ValueByKeyByTag<A>[Tag], (s: S) => S>>,
    D extends (
      _: { [k in keyof ValueByKeyByTag<A>[Tag]]: ValueByKeyByTag<A>[Tag][k] }[Exclude<
        keyof ValueByKeyByTag<A>[Tag],
        keyof M
      >]
    ) => (s: S) => S
  >(
    match: M,
    def: D
  ): Reducer<S, A>
}

/**
 * Dispatch calls for each tag value, ensuring a common result type `R`
 */

interface Matcher<A, Tag extends keyof A> extends MatcherInter<A, ValueByKeyByTag<A>[Tag]> {}

declare type EnforceNonEmptyRecord<R> = keyof R extends never ? never : R

interface MatcherInter<A, Record> {
  <R, M extends Cases<Record, R>>(match: M & Partial<Cases<Record, R>>): (
    a: A
  ) => ReturnType<M[keyof M]> extends infer R ? R : never
  <
    R,
    M extends Partial<Cases<Record, R>>,
    D extends (_: { [k in keyof Record]: Record[k] }[Exclude<keyof Record, keyof M>]) => R
  >(
    match: EnforceNonEmptyRecord<M> & Partial<Cases<Record, R>>,
    def: D
  ): (
    a: A
  ) =>
    | (ReturnType<NonNullable<M[keyof M]>> extends infer R ? R : never)
    | (unknown extends ReturnType<D> ? never : ReturnType<D>)
}

/**
 * Same purpose as `Matcher` but the result type is infered as a union of all branches results types
 */
interface MatcherWiden<A, Tag extends keyof A> extends MatcherWidenIntern<A, ValueByKeyByTag<A>[Tag]> {}

interface MatcherWidenIntern<A, Record> {
  <M extends Cases<Record, any>>(match: M): (a: A) => ReturnType<M[keyof M]> extends infer R ? R : never
  <
    M extends Partial<Cases<Record, any>>,
    D extends (_: { [k in keyof Record]: Record[k] }[Exclude<keyof Record, keyof M>]) => any
  >(
    match: M,
    def: D
  ): (
    a: A
  ) =>
    | (ReturnType<NonNullable<M[keyof M]>> extends infer R ? R : never)
    | (unknown extends ReturnType<D> ? never : ReturnType<D>)
}

/**
 *  @since 0.0.1
 */
export interface Reducer<S, A> {
  (state: S | undefined, action: A): S
}

/**
 *  @since 0.0.1
 */
export interface Matchers<A, Tag extends keyof A> {
  fold: Folder<A>
  transform: Transform<A, Tag>
  match: MatcherWiden<A, Tag>
  matchClassic: Matcher<A, Tag>
  createReducer: <S>(initialState: S) => ReducerBuilder<S, A, Tag>
  strict: <R>(f: (_: A) => R) => (_: A) => R
}

/**
 *  @since 0.0.1
 */
export const Matchers = <A, Tag extends keyof A>(tag: Tag) => (keys: KeysDefinition<A, Tag>): Matchers<A, Tag> => {
  const inKeys = isIn(keys)
  const match = (match: any, def?: any) => (a: any): any => (match[a[tag]] || def)(a)
  const transform = (match: any) => (a: any): any => {
    const c = match[a[tag]]
    return c ? c(a) : a
  }
  const fold = identity
  const createReducer = <S>(initialState: S): ReducerBuilder<S, A, Tag> => (m: any, def?: any) => {
    const matcher = match(m, def)
    return (s: any, a: any) => {
      const state = s === undefined ? initialState : s
      return inKeys(a[tag]) ? matcher(a)(state) : state
    }
  }
  return {
    match,
    matchClassic: match,
    transform,
    fold,
    createReducer,
    strict: identity
  }
}
