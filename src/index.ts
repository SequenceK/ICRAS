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
  QueryList,
  ControlGroup
} from "construct-ui";
import types from "./types.json";
import constraints from "./types.json";
import { FormConstructor } from './type_components';
import {IListLabel} from './util';
import { intructors } from './instructors';

console.log(types);
let QList = SelectList.ofType<IListLabel>();
class Configurator {
  private list : IListLabel[];
  private selectedItem: IListLabel;
  private closeOnSelect = true;
  private header = false;
  private footer = false;
  private loading = false;
  

  public view(vnode: any) {
    this.list = vnode.attrs.list;
    this.selectedItem = this.list[0];

    return m(".stack", 
      {
        fluid: true,
      },
      [
        m(ControlGroup, {size:"xl"}, [
        m(QList, {
          closeOnSelect: this.closeOnSelect,
          label: "Select:",
          items: this.list,
          itemRender: this.renderItem,
          itemPredicate: this.itemPredicate,
          onSelect: this.handleSelect,
          loading: this.loading,
          popoverAttrs: {
            hasArrow: false,
            position: "auto"
          },
          trigger: m(Button, {
            fluid: false,
            size: "xl",
            iconRight: Icons.CHEVRON_DOWN,
            sublabel: vnode.attrs.sublabel,
            label: this.selectedItem && this.selectedItem.label.substring(0,20),
          })
      }),
      m(Button, {
        label: "Save Changes",
        iconLeft: Icons.SAVE,
        fluid: false,
        size: "xl",
        onclick: ()=>document.cookie = JSON.stringify(sitem),
      })
    ])
    ]
    );
  }

  private renderItem = (item: IListLabel) => m(ListItem, {
    label: item.label,
    selected: this.selectedItem && this.selectedItem.label === item.label,
  })

  private itemPredicate(query: string, item: any) {
    return item.label.toLowerCase().includes(query.toLowerCase());
  }

  private handleSelect = (item: IListLabel) => this.selectedItem = item;

}
class Home {
  view(vnode: any) {
    return m("h1", "Home")
  }
}
var sitem = document.cookie && JSON.parse(document.cookie);
if(!sitem) {
  sitem = {};
}
class Instrutors {
  view(vnode: any) {
    return m("div", {gutter: 10},[
      m(Configurator, {sublabel: "Instructor", list: intructors}),
      m("h1", "Instructor Profile"), m(FormConstructor, {type:"instructor", selectedItem: sitem}),
    ])
  }
}
class Courses {
  view(vnode: any) {
    return m("div", {gutter: 10},[
      m(Configurator, {sublabel: "Course", list: intructors}),
      m("h1", "Course Profile"), m(FormConstructor, {type:"course", selectedItem: sitem}),
    ])
  }
}
class Profile {
  active: string = "p";
  loading: boolean = false;
  type: string;
  view(vnode: any) {
    this.type = vnode.attrs.type;

    return m("div", {gutter: 10},[
      m(Configurator, {sublabel: this.type, list: intructors}),
      m("h1", this.type + " Profile"), 
      m(Tabs, {
        align: "left",
        fluid: true,
        bordered: true,
        size: "l",
      }, [
        m(TabItem, {
            label: "Properties",
            active: this.active === "p",
            loading: this.loading,
            onclick: () => {this.active = "p";},
            align: "center",
          })
        ]),
      m(FormConstructor, {type:this.type, selectedItem: sitem}),
    ])
  }
}


class Tab {
  constructor(public tabobj : any, public bodyobj : any, public attrs: any){

  }
}

const tabs = [
  new Tab([m(Icon, {
    name: Icons.HOME,
    style: 'margin-right: 5px'
  }), 'ICRAS'], Home, {}),
  new Tab('Instructors',Profile, {type:"instructor"}),
  new Tab('Courses',Profile, {type:"course"}),
  new Tab('Rooms', Profile, {type:"room"})
];

var Body = tabs[0]
class Header {
  private active: string | any[] = 'Projects';
  private isLoading: boolean = false;

  view(vnode: any) {
    return m('.topnav', {}, [
      m(Tabs, {
        align: "center",
        fluid: true,
        bordered: true,
        size: "l",
        class: "topnav-tabs"
      }, [
        tabs.map(item => m(TabItem, {
            label: item.tabobj,
            active: this.active === item.tabobj,
            loading: item.tabobj === 'Projects' && this.isLoading,
            onclick: () => {this.active = item.tabobj; Body = item;},
            align: "center",
            class: "topnav-tab"
          }))
        ])
    ]);
  }
};

class App {
  view(vnode: any) {
    return m('div', [m(Header), m(".stack.body", {}, m(Body.bodyobj, Body.attrs))]);
  }
}
m.mount(document.body, App)

