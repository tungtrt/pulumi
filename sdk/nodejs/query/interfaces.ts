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

export interface Disposable {
    dispose(): void;
}

export interface Enumerable<T> {
    map<U>(f: (t: T) => U): Enumerable<U>;
    filter(f: (t: T) => boolean): Enumerable<T>;
    take(n: number): Enumerable<T>;
    flatMap(f: (t: T, index?: number) => T[]): Enumerable<T>;
    toArray(): Enumerable<T[]>;
    forEach(f: (t: T) => void): void;
}

export interface Enumerator<T> extends Disposable {
    current(): T;
    moveNext(): boolean;
    reset(): void;
}
