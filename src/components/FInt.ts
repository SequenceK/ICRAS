import m, { Vnode } from 'mithril';
import { IAttrs } from './IAttrs';

export class FInt {
    view(vnode : Vnode<IAttrs>) {
        return m("input", vnode.attrs);
    }
}