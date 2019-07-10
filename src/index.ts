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
  Colors
} from "construct-ui";
import {ICountryModel, countries} from "./countries";
import types from "./types.json";
import constraints from "./types.json";

console.log(types);

const CountryList = SelectList.ofType<ICountryModel>();
class Configurator {
  private selectedItem: ICountryModel = countries[0];
  private closeOnSelect = true;
  private header = false;
  private footer = false;
  private loading = false;

  public view(vnode: any) {
    return m(Card, 
      {
        fluid: true,
      },
      m("h4", "Configure " + vnode.attrs.sublabel), 
      [
        m(CountryList, {
          closeOnSelect: this.closeOnSelect,
          header: this.header ? m('h4', 'Header content') : undefined,
          footer: this.footer ? m('h4[style=margin: 15px 0 0 0]', 'Footer content') : undefined,
          items: countries,
          itemRender: this.renderItem,
          itemPredicate: this.itemPredicate,
          onSelect: this.handleSelect,
          loading: this.loading,
          popoverAttrs: {
            hasArrow: false,
            position: "auto-start"
          },
          trigger: m(Button, {
            fluid: true,
            iconRight: Icons.CHEVRON_DOWN,
            // sublabel: vnode.attrs.sublabel,
            label: this.selectedItem && this.selectedItem.name.substring(0,20),
            style: 'min-width: 200px'
          })
  }),
      m(Button, {
        label: "Save Changes",
        iconLeft: Icons.SAVE,
        style: 'margin-top: 10px',
        fluid: true
      }, "hello")
    ]
    );
  }

  private renderItem = (item: ICountryModel) => m(ListItem, {
    contentRight: m('', { style: `color:${Colors.BLUE_GREY200}` }, item.code),
    label: item.name,
    selected: this.selectedItem && this.selectedItem.name === item.name
  })

  private itemPredicate(query: string, item: ICountryModel) {
    return item.name.toLowerCase().includes(query.toLowerCase());
  }

  private handleSelect = (item: ICountryModel) => this.selectedItem = item;

}
class Home {
  view(vnode: any) {
    return m("h1", "Home")
  }
}
class Instrutors {
  view(vnode: any) {
    return m(Grid, {gutter: 10},[
      m(Col, {}, [m(Configurator, {sublabel: "Instructor"})]),
      m(Col, {}, m("h1", "Instructor Profile")),
    ])
  }
}
class Courses {
  view(vnode: any) {
    return m(Grid, {gutter: 10},[
      m(Col, {}, [m(Configurator, {sublabel: "Course"})]),
      m(Col, {}, m("h1", "Course Profile")),
    ])
  }
}
class Rooms {
  view(vnode: any) {
    return m(Grid, {gutter: 10},[
      m(Col, {}, [m(Configurator, {sublabel: "Room"})]),
      m(Col, {}, m("h1", "Room Profile")),
    ])
  }
}
var Body = Instrutors;
class Tab {
  constructor(public tabobj : any, public bodyobj : any){

  }
}

const tabs = [
  new Tab([m(Icon, {
    name: Icons.HOME,
    style: 'margin-right: 5px'
  }), 'ICRAS'], Home),
  new Tab('Instructors',Instrutors),
  new Tab('Courses',Courses),
  new Tab('Rooms', Rooms)
];


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
            onclick: () => {this.active = item.tabobj; Body = item.bodyobj;},
            align: "center",
            class: "topnav-tab"
          }))
        ])
    ]);
  }
};

class App {
  view(vnode: any) {
    return m('div', [m(Header), m(Body)]);
  }
}

m.mount(document.body, App)
