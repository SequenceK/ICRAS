import m, { Vnode } from 'mithril';
import { IAttrs } from './IAttrs';

export class FString {
    view(vnode : Vnode<IAttrs>) {
        return m("input", vnode.attrs);
    }
}