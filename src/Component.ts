import m, { Vnode } from 'mithril';
import { IAttrs } from './IAttrs';
import { DB, Dept } from './util';
import { ListItem, SelectList, Icons, Switch, Colors, Button, Input } from 'construct-ui'

export class FString {
    attrs : IAttrs;
    view(vnode : Vnode<IAttrs>) {
        this.attrs = vnode.attrs;
        return m(Input, {
            value: vnode.attrs.value,
            onchange: this.onchange
        });
    }

    onchange = (e) => {
        this.attrs.vupdate(e.target.value);
    }
}

export class FInt {
    view(vnode : Vnode<IAttrs>) {
        return m("input", vnode.attrs);
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
            DB.getList(this.attrs.ptype, (list)=>{
                if(!list) {
                    this.list = [];
                } else {
this.list = list;
                this.listdb = this.attrs.ptype;
                this.handleSelect(this.list[0])
                m.redraw();
                }
                
            })
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
            trigger: m(Button, {
                class: "btn",
                align: 'left',
                sublabel: this.listdb,
                compact: true,
                iconRight: Icons.CHEVRON_DOWN,
                label: this.attrs.value,
              })

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
          this.attrs.vupdate(item)
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
                class: "btn btn-primary",
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
          this.attrs.vupdate(item)
      }
}

class UnsupportedType {
    view(vnode:any) {
        return "Unsupported Component Type.";
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
            //return FBool;
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
        break;
    }

    return UnsupportedType;
}