import m, { Vnode } from 'mithril';
import { Dept } from './util';
import {getComponent} from './Component';

interface IFormAttrs {
    type: string;
    object: any;
}

export class Form {
    object: any;
    view(vnode: Vnode<IFormAttrs>) {
        return m("form.form-css", {}, [
            m("fieldset.fieldset-css", [m("legend.properties-legend", "Properties"), this.generateComponents(vnode)])
        ]);
    }

    generateComponents(vnode: Vnode<IFormAttrs>) {
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
                        vinitial: this.object[id]
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
                    vinitial: this.object[id]
                })
            );
        }

        return components;
    }
}