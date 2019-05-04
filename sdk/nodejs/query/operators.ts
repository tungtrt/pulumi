// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Evaluator, Operator } from "./interfaces";
import { range } from "./sources";
import { isAsyncIterable } from "./util";

//
// Restriction operators.
//

export function filter<TSource>(f: (t: TSource, i: number) => boolean): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const [t, i] of zip(source, range(0))) {
            if (f(t, i)) {
                yield t;
            }
        }
    };
}

//
// Projection operators.
//

export function flatMap<TSource, TInner, TResult = TInner>(
    selector: (t: TSource, index: number) => Iterable<TInner> | AsyncIterable<TInner>,
    resultSelector: (t: TSource, ti: TInner) => TResult = (t, ti) => <TResult>(<unknown>ti),
): Operator<TSource, TResult> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const [t, i] of zip(source, range(0))) {
            const us = selector(t, i);
            if (isAsyncIterable(us)) {
                for await (const u of us) {
                    yield resultSelector(t, u);
                }
            } else {
                for (const u of us) {
                    yield resultSelector(t, u);
                }
            }
        }
    };
}

export function map<TSource, TResult>(
    f: (t: TSource, i: number) => TResult,
): Operator<TSource, TResult> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const [t, i] of zip(source, range(0))) {
            yield f(t, i);
        }
    };
}

//
// Partitioning operators.
//

export function skip<TSource>(n: number): Operator<TSource, TSource> {
    if (n < 0) {
        throw Error("skip was provided a negative number of elements to skip");
    }

    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const [t, i] of zip(source, range(1))) {
            if (i > n) {
                yield t;
            }
        }
    };
}

export function skipWhile<TSource>(
    predicate: (t: TSource, i: number) => boolean,
): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        let stopSkipping = false;
        for await (const [t, i] of zip(source, range(0))) {
            if (stopSkipping === true) {
                yield t;
            } else if (predicate(t, i) === false) {
                stopSkipping = true;
                yield t;
            }
        }
    };
}

export function take<TSource>(n: number): Operator<TSource, TSource> {
    if (n < 0) {
        throw Error("take was provided a negative number of elements to take");
    }

    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const [t, i] of zip(source, range(0))) {
            if (i >= n) {
                return;
            }
            yield t;
        }
    };
}

export function takeWhile<TSource>(
    predicate: (t: TSource, i: number) => boolean,
): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const [t, i] of zip(source, range(0))) {
            if (predicate(t, i) === false) {
                return;
            }
            yield t;
        }
    };
}

//
// Join operators.
//

export function join<TOuter, TInner, TKey, TResult>(
    inner: AsyncIterableIterator<TInner>,
    outerKeySelector: (to: TOuter) => TKey,
    innerKeySelector: (ti: TInner) => TKey,
    resultSelector: (to: TOuter, ti: TInner) => TResult,
): Operator<TOuter, TResult> {
    return async function*(outer: AsyncIterableIterator<TOuter>) {
        const inners = new Map<TKey, TInner>();

        for await (const t of inner) {
            inners.set(innerKeySelector(t), t);
        }

        for await (const t of outer) {
            const key = outerKeySelector(t);
            if (key === undefined) {
                continue;
            } else if (inners.has(key)) {
                yield resultSelector(t, <TInner>inners.get(key));
            }
        }
    };
}

// public static IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey,
// TResult>(
//     this IEnumerable<TOuter> outer,
//     IEnumerable<TInner> inner,
//     Func<TOuter, TKey> outerKeySelector,
//     Func<TInner, TKey> innerKeySelector,
//     Func<TOuter, IEnumerable<TInner>, TResult> resultSelector);
// public static IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey,
// TResult>(
//     this IEnumerable<TOuter> outer,
//     IEnumerable<TInner> inner,
//     Func<TOuter, TKey> outerKeySelector,
//     Func<TInner, TKey> innerKeySelector,
//     Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
//     IEqualityComparer<TKey> comparer);

//
// Concatenation operators.
//

export function concat<TSource>(iter: AsyncIterable<TSource>): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const t of source) {
            yield t;
        }

        for await (const t of iter) {
            yield t;
        }
    };
}

//
// Ordering operators.
//

// public static OrderedSequence<TSource> OrderBy<TSource, TKey>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector);
// public static OrderedSequence<TSource> OrderBy<TSource, TKey>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector,
//     IComparer<TKey> comparer);
// public static OrderedSequence<TSource> OrderByDescending<TSource, TKey>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector);
// public static OrderedSequence<TSource> OrderByDescending<TSource, TKey>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector,
//     IComparer<TKey> comparer);
// public static OrderedSequence<TSource> ThenBy<TSource, TKey>(
//     this OrderedSequence<TSource> source,
//     Func<TSource, TKey> keySelector);
// public static OrderedSequence<TSource> ThenBy<TSource, TKey>(
//     this OrderedSequence<TSource> source,
//     Func<TSource, TKey> keySelector,
//     IComparer<TKey> comparer);
// public static OrderedSequence<TSource> ThenByDescending<TSource, TKey>(
//     this OrderedSequence<TSource> source,
//     Func<TSource, TKey> keySelector);
// public static OrderedSequence<TSource> ThenByDescending<TSource, TKey>(
//     this OrderedSequence<TSource> source,
//     Func<TSource, TKey> keySelector,
//     IComparer<TKey> comparer);

export function reverse<TSource>(): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        const ts: TSource[] = [];
        for await (const t of source) {
            ts.push(t);
        }

        for (const t of ts.reverse()) {
            yield t;
        }
    };
}

//
// Grouping operators.
//

export function groupBy<TSource, TKey, TResult = TSource>(
    keySelector: (t: TSource) => TKey,
    elementSelector?: (t: TSource) => TResult,
): (source: AsyncIterableIterator<TSource>) => Promise<Map<TKey, TResult[]>> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (elementSelector === undefined) {
            elementSelector = t => <TResult>(<unknown>t);
        }

        const groups = new Map<TKey, TResult[]>();
        for await (const t of source) {
            const key = keySelector(t);
            const val = elementSelector(t);

            if (!groups.has(key)) {
                groups.set(key, [val]);
            } else {
                const group = <TResult[]>groups.get(key);
                group.push(val);
            }
        }

        return groups;
    };
}

//
// Set operators.
//

export function distinct<TSource>(): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        const dist = new Set<TSource>();
        for await (const t of source) {
            if (!dist.has(t)) {
                dist.add(t);
                yield t;
            }
        }
    };
}

export function union<TSource>(second: AsyncIterableIterator<TSource>): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        const dist = new Set<TSource>();
        for await (const t of source) {
            if (!dist.has(t)) {
                dist.add(t);
                yield t;
            }
        }

        for await (const t of second) {
            if (!dist.has(t)) {
                dist.add(t);
                yield t;
            }
        }
    };
}

export function intersect<TSource>(
    second: AsyncIterableIterator<TSource>,
): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        const dist = new Set<TSource>();
        for await (const t of source) {
            dist.add(t);
        }

        const emitted = new Set<TSource>();
        for await (const t of second) {
            if (dist.has(t) && !emitted.has(t)) {
                emitted.add(t);
                yield t;
            }
        }
    };
}

export function except<TSource>(
    second: AsyncIterableIterator<TSource>,
): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        const dist = new Set<TSource>();
        for await (const t of source) {
            dist.add(t);
        }

        for await (const t of second) {
            if (dist.has(t)) {
                dist.delete(t);
            } else {
                dist.add(t);
            }
        }

        for (const t of dist) {
            yield t;
        }
    };
}

//
// Conversion operators.
//

export function toArray<TSource>(): Evaluator<TSource, TSource[]> {
    return async function(source: AsyncIterableIterator<TSource>) {
        const ret: TSource[] = [];
        for await (const t of source) {
            ret.push(t);
        }
        return ret;
    };
}

export function toMap<TKey, TSource, TResult = TSource>(
    keySelector: (t: TSource) => TKey,
    elementSelector?: (t: TSource) => TResult,
): Evaluator<TSource, Map<TKey, TResult>> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (elementSelector === undefined) {
            elementSelector = x => <TResult>(<unknown>x);
        }

        const ret = new Map<TKey, TResult>();
        for await (const t of source) {
            const key = keySelector(t);
            if (key === undefined) {
                throw Error("key selector can't produce a null value");
            }
            const val = elementSelector(t);
            ret.set(key, val);
        }
        return ret;
    };
}

// public static Lookup<TKey, TSource> ToLookup<TSource, TKey>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector);
// public static Lookup<TKey, TSource> ToLookup<TSource, TKey>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector,
//     IEqualityComparer<TKey> comparer);
// public static Lookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector,
//     Func<TSource, TElement> elementSelector);
// public static Lookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TKey> keySelector,
//     Func<TSource, TElement> elementSelector,
//     IEqualityComparer<TKey> comparer);
// public class Lookup<TKey, TElement> : IEnumerable<IGrouping<TKey,
// TElement>>
// {
//     public int Count { get; }
//     public IEnumerable<TElement> this[TKey key] { get; }
//     public bool Contains(TKey key);
//     public IEnumerator<IGrouping<TKey, TElement>> GetEnumerator();
// }

export function ofType<TSource, TResult extends TSource>(
    typeGuard: (o: TSource) => o is TResult,
): Operator<TSource, TResult> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        for await (const t of source) {
            if (typeGuard(t)) {
                yield t;
            }
        }
    };
}

//
// Equality operators.
//

// public static bool SequenceEqual<TSource>(
//     this IEnumerable<TSource> first,
//     IEnumerable<TSource> second);
// public static bool SequenceEqual<TSource>(
//     this IEnumerable<TSource> first,
//     IEnumerable<TSource> second,
//     IEqualityComparer<TSource> comparer);

//
// Element operators.
//

export function first<TSource>(predicate?: (t: TSource) => boolean): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        for await (const t of source) {
            if (predicate(t)) {
                return t;
            }
        }

        throw new Error("first could not find any elements that match predicate");
    };
}

export function firstOrDefault<TSource>(
    defaultValue: TSource,
    predicate?: (t: TSource) => boolean,
): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        for await (const t of source) {
            if (predicate(t)) {
                return t;
            }
        }

        return defaultValue;
    };
}

export function last<TSource>(predicate?: (t: TSource) => boolean): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        let curr: TSource | undefined;
        for await (const t of source) {
            if (predicate(t)) {
                curr = t;
            }
        }

        if (curr === undefined) {
            throw new Error("last could not find any elements that match predicate");
        } else {
            return curr;
        }
    };
}

export function lastOrDefault<TSource>(
    defaultValue: TSource,
    predicate?: (t: TSource) => boolean,
): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        let curr: TSource | undefined;
        for await (const t of source) {
            if (predicate(t)) {
                curr = t;
            }
        }

        if (curr === undefined) {
            return defaultValue;
        } else {
            return curr;
        }
    };
}

export function single<TSource>(predicate?: (t: TSource) => boolean): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        const seq: TSource[] = await toArray<TSource>()(filter(predicate)(source));
        if (seq.length === 0) {
            throw Error("single did not find any elements matching the predicate");
        } else if (seq.length > 1) {
            throw Error("single found multiple elements matching the predicate");
        }

        return seq[0];
    };
}

export function singleOrDefault<TSource>(
    defaultValue: TSource,
    predicate?: (t: TSource) => boolean,
): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        const seq: TSource[] = await toArray<TSource>()(filter(predicate)(source));
        if (seq.length === 0) {
            return defaultValue;
        } else if (seq.length > 1) {
            throw Error("single found multiple elements matching the predicate");
        } else {
            return seq[0];
        }
    };
}

export function elementAt<TSource>(index: number): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        // TODO: Maybe support `Array` here if we ever support sync iterables. This would allow us
        // to access that index directly.

        for await (const [t, i] of zip(source, range(0))) {
            if (i === index) {
                return t;
            }
        }

        throw Error(
            `elementAt tried to find item at index ${index}, but sequence had fewer elements`,
        );
    };
}

export function elementAtOrDefault<TSource>(
    defaultValue: TSource,
    index: number,
): Evaluator<TSource, TSource> {
    return async function(source: AsyncIterableIterator<TSource>) {
        // TODO: Maybe support `Array` here if we ever support sync iterables. This would allow us
        // to access that index directly.

        for await (const [t, i] of zip(source, range(0))) {
            if (i === index) {
                return t;
            }
        }

        return defaultValue;
    };
}

export function defaultIfEmpty<TSource>(defaultValue: TSource): Operator<TSource, TSource> {
    return async function*(source: AsyncIterableIterator<TSource>) {
        let sequenceEmpty = true;
        for await (const t of source) {
            sequenceEmpty = false;
            yield t;
        }

        if (sequenceEmpty) {
            yield defaultValue;
        }
    };
}

//
// Quantifiers.
//

export function any<TSource>(predicate?: (t: TSource) => boolean): Evaluator<TSource, boolean> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        for await (const t of source) {
            if (predicate(t)) {
                return true;
            }
        }

        return false;
    };
}

export function all<TSource>(predicate: (t: TSource) => boolean): Evaluator<TSource, boolean> {
    return async function(source: AsyncIterableIterator<TSource>) {
        for await (const t of source) {
            if (!predicate(t)) {
                return false;
            }
        }

        return true;
    };
}

export function contains<TSource>(value: TSource): Evaluator<TSource, boolean> {
    return async function(source: AsyncIterableIterator<TSource>) {
        const dist = new Set<TSource>([value]);
        for await (const t of source) {
            if (dist.has(t)) {
                return true;
            }
        }
        return false;
    };
}

//
// Aggregate operators.
//

export function count<TSource>(predicate?: (t: TSource) => boolean): Evaluator<TSource, number> {
    return async function(source: AsyncIterableIterator<TSource>) {
        if (predicate === undefined) {
            predicate = t => true;
        }

        let n = 0;
        for await (const t of source) {
            if (predicate(t)) {
                n++;
            }
        }

        return n;
    };
}

// public static Numeric Sum(
//     this IEnumerable<Numeric> source);
// public static Numeric Sum<TSource>(
//     this IEnumerable<TSource> source,
//     Func<TSource, Numeric> selector);

// export function sum(): Evaluator<number, number>;
// export function sum<TSource>(selector?: (t: TSource) => number): Evaluator<TSource, number>;
// export function sum(selector?: (t: any) => number): Evaluator<any, number> {
//     return async function(source: AsyncIterableIterator<any>) {
//         // If selector is undefined, the source should emit `number`.
//         if (selector === undefined) {
//             selector = t => t;
//         }

//         let total = 0;
//         for await (const t of source) {
//             total += selector(t);
//         }

//         return total;
//     };
// }

// public static Numeric Min(
//     this IEnumerable<Numeric> source);
// public static TSource Min<TSource>(
//     this IEnumerable<TSource> source);
// public static Numeric Min<TSource>(
//     this IEnumerable<TSource> source,
//     Func<TSource, Numeric> selector);
// public static TResult Min<TSource, TResult>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TResult> selector);

// public static Numeric Max(
//     this IEnumerable<Numeric> source);
// public static TSource Max<TSource>(
//     this IEnumerable<TSource> source);
// public static Numeric Max<TSource>(
//     this IEnumerable<TSource> source,
//     Func<TSource, Numeric> selector);
// public static TResult Max<TSource, TResult>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TResult> selector);

// public static Result Average(
//     this IEnumerable<Numeric> source);
// public static Result Average<TSource>(
//     this IEnumerable<TSource> source,
//     Func<TSource, Numeric> selector);

// public static TSource Aggregate<TSource>(
//     this IEnumerable<TSource> source,
//     Func<TSource, TSource, TSource> func);
// public static TAccumulate Aggregate<TSource, TAccumulate>(
//     this IEnumerable<TSource> source,
//     TAccumulate seed,
//     Func<TAccumulate, TSource, TAccumulate> func);
// public static TResult Aggregate<TSource, TAccumulate, TResult>(
//     this IEnumerable<TSource> source,
//     TAccumulate seed,
//     Func<TAccumulate, TSource, TAccumulate> func,
//     Func<TAccumulate, TResult> resultSelector);

//
// Misc.
//

export async function* zip<TSource1, TSource2, TResult = [TSource1, TSource2]>(
    source1: AsyncIterableIterator<TSource1>,
    source2: AsyncIterableIterator<TSource2>,
    resultSelector: (t1: TSource1, t2: TSource2) => TResult = (t1, t2) =>
        <TResult>(<unknown>[t1, t2]),
) {
    while (true) {
        const result1 = await source1.next();
        const result2 = await source2.next();
        if (result1.done || result2.done) {
            return;
        } else {
            yield resultSelector(result1.value, result2.value);
        }
    }
}
