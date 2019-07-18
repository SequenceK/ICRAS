import 'flatpickr/dist/themes/light.css'
import Flatpickr from "flatpickr";
import 'construct-ui/lib/index.css'
import m from 'mithril';
import {
  Button,
  Icons,
  CustomSelect,
  ButtonGroup,
  Drawer,
  Dialog,
  SelectList,
  ListItem,
  FocusManager,
  Card,
  Icon,
  Grid,
  Col,
  Tabs,
  TabItem,
  InputSelect,
  Table,
  Colors,
  FormGroup,
  FormLabel,
  Form,
  Input,
  List,
  Tag,
  ControlGroup
} from "construct-ui";



import types from "./types.json";
import constraints from "./types.json";

class Timepicker {
  picker:any;
  selectedItem : any;
  fid : string;
  ftype : string;
  oncreate(vnode:any) {
    this.selectedItem = vnode.attrs.selectedItem;
    this.fid = vnode.attrs.fid;
    this.ftype = vnode.attrs.ftype;

    if(this.picker)
      this.picker.destroy();

    this.picker = Flatpickr(vnode.dom, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      defaultDate: "8:00",
      onChange: (selectedDates, dateStr, instance) => {this.selectedItem[this.fid] = dateStr; m.redraw()},
    });
  }
  onremove(){
    if(this.picker)
      this.picker.destroy();
  }
  view(vnode: any) {
    this.selectedItem = vnode.attrs.selectedItem;
    this.fid = vnode.attrs.fid;
    this.ftype = vnode.attrs.ftype;

    return m(Input, {value: this.selectedItem[this.fid]});
  }
}

class DeleteButton {
  selectedItem : any;
  fid : any;
  index : any;

  view(vnode : any) {
    this.selectedItem = vnode.attrs.selectedItem;
    this.fid = vnode.attrs.fid;
    this.index = vnode.attrs.index;
    return m(Button, {label: "Delete", iconLeft: Icons.X, onclick: (e: Event)=>{this.onclick(e)}});
  }

  onclick(e : Event) {
    var elem = e.target as any;
    this.selectedItem[this.fid].splice(this.index, 1);
  }
}
class ArrComponent {
  selectedItem : any;
  fid : string;
  ftype : string;
  view(vnode: any) {
    this.selectedItem = vnode.attrs.selectedItem;
    this.fid = vnode.attrs.fid;
    this.ftype = vnode.attrs.ftype;

    var forms = [];
    for(var i in this.selectedItem[this.fid]) {
      forms.push(m("tr.stack", [
        m("td.left.prop", m(Properties, {type: this.ftype, selectedItem: this.selectedItem[this.fid][i]})),
        m("td.right.prop", m(DeleteButton, {selectedItem:this.selectedItem, fid:this.fid, index:i}))
      ]));

    }
    forms.push(
      m(Button, {fluid: true, label: m(Icon, {name: Icons.PLUS}),style: "margin-left: 1em;",  onclick: ()=>this.addElem()})
    )

    return m("table", {interactive:false}, forms);
  }

  addElem() {
    if(!this.selectedItem[this.fid]) {
      this.selectedItem[this.fid] = []
    }
    this.selectedItem[this.fid].push({});
    m.redraw();
  }
  
}

class IntInput {
  selectedItem : any;
  fid : string;
  ftype : string;
  view(vnode: any) {
    this.selectedItem = vnode.attrs.selectedItem;
    this.fid = vnode.attrs.fid;
    this.ftype = vnode.attrs.ftype;
    return m(Input, {
      id: this.fid,
      name: this.ftype,
      fluid: true,
      value: this.selectedItem[this.fid],
      onchange: (e:Event) => {this.selectedItem[this.fid] = parseInt((e.target as HTMLInputElement).value);}
    });
  }
}

class StringInput {
  selectedItem : any;
  fid : string;
  ftype : string;
  view(vnode: any) {
    this.selectedItem = vnode.attrs.selectedItem;
    this.fid = vnode.attrs.fid;
    this.ftype = vnode.attrs.ftype;
    return m(Input, {
      id: this.fid,
      name: this.ftype,
      fluid: true,
      value: this.selectedItem[this.fid],
      onchange: (e:Event) => {this.selectedItem[this.fid] = (e.target as HTMLInputElement).value;}
    });
  }
}

function getComponent(fid : string, ftype : string, item : any) {
    const span = {
      xs: 12,
      sm: 12,
      md: 6
    };

  var label = m(FormLabel, { for: fid }, m("h4", fid));
  var input = m("input");
  switch(ftype) {
    case "int":
        input = m(IntInput, {
          fid: fid,
          ftype: ftype,
          selectedItem: item
        });
      break;
    case "string":
      input = m(StringInput, {
        fid: fid,
        ftype: ftype,
        selectedItem: item
      });
      break;
    case "time":
      input = m(Timepicker, {
        fid: fid,
        ftype: ftype,
        selectedItem: item
      });
      break;
    default:
      if(ftype.search('[a-zA-Z]+\[\]$')) {
        var arrtype = ftype.substr(0, ftype.length-2);
        label = [m("h3", fid), m("hr")];
        input = m(ArrComponent, {fid: fid,
          ftype: arrtype,
          selectedItem: item});
      }
      else {
        return m(FormGroup, {}, [fid, " unsupported type " + ftype]);
      }
      break;
  }

  return m(FormGroup, {span}, [
    label,
    input,
  ]);
}

class Constraint {
  view(vnode: any) {
    return m("div", {}, "TEST")
  }
}

class Constraints {
  selectedItem : any;
  type : string;
  view(vnode: any) {
    this.selectedItem = vnode.attrs.selectedItem;
    this.type = vnode.attrs.type;

    var forms = [];
    forms.push(m("h5", "Constraints"));
    for(var i in this.selectedItem["constraints"]) {
      forms.push([
        m("tr.alt", [
          m("td", m(Constraint, {type: this.type, selectedItem: this.selectedItem["constraints"][i]})),
          m("td.right", m(DeleteButton, {selectedItem:this.selectedItem, fid:"constraints", index:i}))
        ])
      ])
      
    }
    forms.push(
      m(ListItem, {
        label: m(Button, {label: "add constraint",  onclick: ()=>this.addElem(), style:"text-align:center;"})
      })
    )

    return m(Card, {}, m("table.stack", {interactive:false}, forms));
  }

  addElem() {
    if(!this.selectedItem["constraints"]) {
      this.selectedItem["constraints"] = []
    }
    this.selectedItem["constraints"].push({});
    m.redraw();
  }
  
}

export class Properties {
  propForm: any[] = [];
  active : string | any[] = "p";
  loading: boolean = false;
  formBody: any;
  selectedItem : any = {};

  generateView(type) {
    for(var f in type) {
      this.propForm.push(getComponent(f, type[f], this.selectedItem));
    }
  }

  view(vnode: any) {
    var type = vnode.attrs.type;
    this.selectedItem = vnode.attrs.selectedItem;
    this.propForm = [];
    if(types[type]) {
      this.generateView(types[type]);
    }


    return m("div", {}, [
      m("br"),
      m("div",{gutter: 15}, this.propForm),
      m("br"),
      m(Constraints, {selectedItem: this.selectedItem, type: type})
    ]);
  }
}

