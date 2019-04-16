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

import { Enumerator } from "./interfaces";

export class RangeEnumerator implements Enumerator<number> {
    private curr: number;

    constructor(private readonly start: number, private readonly stop?: number) {
        this.curr = start - 1;
    }

    public dispose(): void {
        return;
    }

    public current(): number {
        return this.curr;
    }

    public moveNext(): boolean {
        if (this.stop === undefined || this.curr < this.stop) {
            this.curr++;
            return true;
        } else {
            return false;
        }
    }

    public reset(): void {
        this.curr = this.start - 1;
    }
}

export class ListEnumerator<T> implements Enumerator<T> {
    private index: number = -1;
    public static from<T>(ts: T[]): ListEnumerator<T> {
        return new ListEnumerator<T>(ts);
    }

    private constructor(private readonly ts: T[]) {}

    public dispose(): void {
        return;
    }

    public current(): T {
        if (this.index < 0) {
            throw Error("`moveNext` must be called before `current`");
        } else if (this.index >= this.ts.length) {
            throw Error("`current` called after the last element in the sequence");
        }

        return this.ts[this.index];
    }

    public moveNext(): boolean {
        this.index++;
        return this.index < this.ts.length;
    }

    public reset(): void {
        this.index = -1;
    }
}
