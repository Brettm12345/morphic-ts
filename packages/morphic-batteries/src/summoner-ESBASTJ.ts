import { cacheUnaryFunction } from '@morphic-ts/common/lib/core'

import { modelEqInterpreter } from '@morphic-ts/eq-interpreters/lib/interpreters'

import { modelShowInterpreter } from '@morphic-ts/show-interpreters/lib/interpreters'

import { modelFastCheckInterpreter } from '@morphic-ts/fastcheck-interpreters/lib/interpreters'

import { modelJsonSchemaInterpreter } from '@morphic-ts/json-schema-interpreters/lib/interpreters'

import { ProgramNoUnionURI } from './program-no-union'

import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { identity } from 'fp-ts/lib/function'
import { resolveSchema } from '@morphic-ts/json-schema-interpreters/lib/utils'
import { modelIoTsNonStrictInterpreter } from '@morphic-ts/io-ts-interpreters/lib/interpreters'

import * as U from './usage'

import { ESBASTJInterpreterURI } from './interpreters-ESBASTJ'

/** Type level override to keep Morph type name short */
/**
 *  @since 0.0.1
 */
export interface M<R, L, A> extends U.Materialized<R, L, A, ProgramNoUnionURI, ESBASTJInterpreterURI> {}
/**
 *  @since 0.0.1
 */
export interface UM<R, A> extends M<R, unknown, A> {}

/**
 *  @since 0.0.1
 */
export const AsOpaque = <R, E, A>(x: M<R, E, A>): M<R, E, A> => x
/**
 *  @since 0.0.1
 */
export const AsUOpaque = <R, A>(x: UM<R, A>): UM<R, A> => x

/**
 *  @since 0.0.1
 */
export interface Summoner<R> extends U.Summoners<ProgramNoUnionURI, ESBASTJInterpreterURI, R> {
  <L, A>(F: U.ProgramType<R, L, A>[ProgramNoUnionURI]): M<R, L, A>
}

/**
 *  @since 0.0.1
 */
export const summonFor = <R>(env: NonNullable<R>) =>
  U.makeSummoner<Summoner<R>>(cacheUnaryFunction, program => ({
    build: identity,
    eq: program(modelEqInterpreter)(env).eq,
    show: program(modelShowInterpreter)(env).show,
    arb: program(modelFastCheckInterpreter)(env).arb,
    strictType: program(modelIoTsNonStrictInterpreter)(env).type,
    type: program(modelIoTsNonStrictInterpreter)(env).type,
    jsonSchema: pipe(program(modelJsonSchemaInterpreter)(env).schema({}), E.chain(resolveSchema))
  }))
