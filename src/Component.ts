import m, { Vnode } from 'mithril';
import { IAttrs } from './IAttrs';
import { DB, Dept } from './util';
import { ListItem, SelectList, Icons, Switch, Colors, Button, Input } from 'construct-ui'

export class FString {
    attrs : IAttrs;
    view(vnode : Vnode<IAttrs>) {
        this.attrs = vnode.attrs;
        return m("input", {
            id: this.attrs.pid,
            class: this.attrs.class,
            value: this.attrs.value,
            oncreate: this.inputcreated
        });
    }
    inputcreated = (vnode)=>{
        vnode.dom.addEventListener('input', this.onchange);
        vnode.dom.addEventListener('propertychange', this.onchange);
    }
    onchange = (e) => {
        this.attrs.vupdate(e.srcElement.value, this.attrs.pid);
    }
}

export class FInt {
    attrs : IAttrs;
    view(vnode : Vnode<IAttrs>) {
        this.attrs = vnode.attrs;
        return m("input", {
            type: "number",
            id: this.attrs.pid,
            class: this.attrs.class,
            value: this.attrs.value,
            oncreate: this.inputcreated
        });
    }
    inputcreated = (vnode)=>{
        vnode.dom.addEventListener('input', this.onchange);
        vnode.dom.addEventListener('propertychange', this.onchange);
    }
    onchange = (e) => {
        this.attrs.vupdate(e.srcElement.value, this.attrs.pid);
    }
}

export class FBool {
    attrs : IAttrs;
    view(vnode : Vnode<IAttrs>) {
        this.attrs = vnode.attrs;
        return m("input", {
            type: "checkbox",
            id: this.attrs.pid,
            class: this.attrs.class,
            checked: this.attrs.value,
            oncreate: this.inputcreated
        });
    }
    inputcreated = (vnode)=>{
        vnode.dom.addEventListener('input', this.onchange);
        vnode.dom.addEventListener('propertychange', this.onchange);
    }
    onchange = (e) => {
        this.attrs.vupdate(e.srcElement.checked, this.attrs.pid);
    }
}


const SList = SelectList.ofType<string>();
export class FDBPointer {
    list : string[] = null;
    selected : string;
    attrs : IAttrs
    listdb : string
    loading : boolean = true;
    view(vnode : Vnode<IAttrs>) {
        this.attrs = vnode.attrs;
        if(this.attrs.ptype != this.listdb) {
            this.list = DB.getList(this.attrs.ptype)   
        }

        this.loading = this.list == null;


        return m(SList, {
            closeOnSelect: true,
            items: this.list,
            itemRender: this.renderItem,
            itemPredicate: this.itemPredicate,
            onSelect: this.handleSelect,
            loading: this.loading,
            popoverAttrs: {
                hasArrow: false
              },
            trigger: m("button", {
                class: this.attrs.class,
              }, this.attrs.value?this.attrs.value:"Select...")

            }, 
        )
    }


    renderItem = (item: string) => m(ListItem, {
        label: item,
        selected: this.selected == item
      })
    
      itemPredicate(query: string, item: string) {
        return item.toLowerCase().includes(query.toLowerCase());
      }
    
      handleSelect = (item: string) => {
          this.selected = item;
          this.attrs.vupdate(item, this.attrs.pid)
      }
}

export class FDeptPointer {
    list : string[] = [];
    selected : string;
    attrs : IAttrs
    listdb : string
    view(vnode : Vnode<IAttrs>) {
        this.attrs = vnode.attrs;
        this.selected = this.attrs.value;
        if(this.attrs.ptype != this.listdb) {
            this.list = Dept.getlist(this.attrs.ptype);
            this.listdb = this.attrs.ptype;
            this.handleSelect(this.list[0])
        }


        return m(SList, {
            closeOnSelect: true,
            items: this.list,
            itemRender: this.renderItem,
            itemPredicate: this.itemPredicate,
            onSelect: this.handleSelect,
            popoverAttrs: {
                hasArrow: false
              },
            trigger: m("button", {
                class: this.attrs.class,
              }, this.attrs.value)

            }, 
        )
    }


    renderItem = (item: string) => m(ListItem, {
        label: item,
        selected: this.selected == item
      })
    
      itemPredicate(query: string, item: string) {
        return item.toLowerCase().includes(query.toLowerCase());
      }
    
      handleSelect = (item: string) => {
          this.selected = item;
          this.attrs.vupdate(item, this.attrs.pid)
      }
}

class UnsupportedType {
    view(vnode:any) {
        return m(".form-control","Unsupported Component Type.");
    }
}

export function getComponent(type) {
    switch(type) {
        case "int":
            return FInt;
        break;
        case "string":
            return FString;
        break;
        case "bool":
            return FBool;
        break;
        case "time":
            //return FTime;
        break;
        default:
            var lchar = type[type.length-1];
            if( lchar == "]" || lchar == "*") {
                if(lchar == "]") {
                    //return FArray;
                } else {
                    //return FPointer;
                }
            }
            else if(Dept.types[type]) {
                //return Form with composite type
            }
        break;
    }

    return UnsupportedType;
}