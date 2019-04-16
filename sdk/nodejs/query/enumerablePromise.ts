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

import { Enumerable, Enumerator } from "./interfaces";
import { Filter, FlatMap, Map, Take, ToArray } from "./operators";
import { ListEnumerator, RangeEnumerator } from "./sources";

export class EnumerablePromise<T> implements Enumerable<T> {
    static from<T>(source: T[] | PromiseLike<T[]>): EnumerablePromise<T> {
        if (Array.isArray(source)) {
            return new EnumerablePromise(Promise.resolve(ListEnumerator.from(source)));
        } else {
            return new EnumerablePromise(source.then(ListEnumerator.from));
        }
    }

    static range(start: number, stop?: number): EnumerablePromise<number> {
        return new EnumerablePromise(Promise.resolve(new RangeEnumerator(start, stop)));
    }
    private constructor(private readonly source: PromiseLike<Enumerator<T>>) {}

    public map<U>(f: (t: T) => U): EnumerablePromise<U> {
        return new EnumerablePromise(this.source.then(ts => new Map(ts, f)));
    }

    public filter(f: (t: T) => boolean): EnumerablePromise<T> {
        return new EnumerablePromise(this.source.then(ts => new Filter(ts, f)));
    }

    public take(n: number): EnumerablePromise<T> {
        return new EnumerablePromise(this.source.then(ts => new Take(ts, n)));
    }

    public toArray(): Enumerable<T[]> {
        return new EnumerablePromise(this.source.then(ts => new ToArray(ts)));
    }

    public flatMap<U>(f: (t: T) => U[]): EnumerablePromise<U> {
        return new EnumerablePromise(this.source.then(ts => new FlatMap(ts, f)));
    }

    public forEach(f: (t: T) => void): void {
        this.source.then(ts => {
            while (ts.moveNext()) {
                f(ts.current());
            }
            ts.dispose();
        });
    }
}
