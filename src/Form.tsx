import m, { Vnode } from 'mithril';
import { Dept } from './util';
import {getComponent} from './Component';

interface IFormAttrs {
    type: string;
    object: any;
}

export class PForm {
    object: any;
    type: string;
    view(vnode: Vnode<IFormAttrs>) {
        this.object = vnode.attrs.object;
        this.type = vnode.attrs.type;

        return m("form.properties", m(".row", this.generateComponents()))
    }

    generateComponents() {
        var type = Dept.types[this.type];
        if(!type || !this.object) return [];

        var longforms = {}
        var components : any[] = []
        for (var id in type) {
            var len = (type[id] as string).length
            if ((type[id][len - 1] == "]") || (type[id][len - 1] == "*")) {
                longforms[id] = type[id]
            } else {
                components.push(<div class="col-auto">
                    <label for={id}><strong>{id}</strong></label>
                    {m(getComponent(type[id]),{
                        pid: id,
                        id: id,
                        ptype: type[id],
                        vupdate: (value:any, id:any)=>{this.object[id] = value;},
                        value: this.object[id],
                        class: "form-control"
                    })}
                    </div>
                );
            }
        }
        for (var id in longforms) {
                components.push(<div class="col-auto">
                    <label for={id}><strong>{id}</strong></label>
                    {m(getComponent(type[id]),{
                        pid: id,
                        id: id,
                        ptype: type[id],
                        vupdate: (value:any, id:any)=>{this.object[id] = value;},
                        value: this.object[id],
                        class: "form-control"
                    })}
                    </div>
                );
        }

        return components;
    }
}