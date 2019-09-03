import m, { Vnode } from 'mithril';
import { Dept } from './util';
import {getComponent} from './Component';

interface IFormAttrs {
    type: string;
    object: any;
}

export class PForm {
    object: any;
    view(vnode: Vnode<IFormAttrs>) {
        this.object = vnode.attrs.object;

        var properties = this.generateComponents(vnode);

        return m(".properties", properties)
    }

    generateComponents(vnode: Vnode<IFormAttrs>) {
        if(!this.object) {
            return [];
        }
        var type = Dept.types[vnode.attrs.type];
        var longforms = {}
        var components : m.Vnode<any, any>[] = []
        for (var id in type) {
            var len = (type[id] as string).length
            if ((type[id][len - 1] == "]") || (type[id][len - 1] == "*")) {
                longforms[id] = type[id]
            } else {
                components.push(
                    m(getComponent(type[id]),{
                        pid: id,
                        ptype: type[id],
                        vupdate: (value:any)=>{this.object[id] = value;},
                        value: this.object[id]
                    })
                );
            }
        }
        for (var id in longforms) {
            components.push(
                m(getComponent(type[id]),{
                    pid: id,
                    ptype: type[id],
                    vupdate: (value:any)=>{this.object[id] = value;},
                    value: this.object[id]
                })
            );
        }

        return components;
    }
}