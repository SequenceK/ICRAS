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
import { Properties as Properties } from './type_components';
import { DB, AppToaster } from './util';

let QList = SelectList.ofType<string>();
class Configurator {
  private list : string[];
  private selectedItem: string;
  private closeOnSelect = true;
  private header = false;
  private footer = false;
  private loading = false;
  private db : string;
  private profile: Profile;

  public view(vnode: any) {
    this.profile = vnode.attrs.profile;

    if(this.profile.db != this.db) {
      this.selectedItem = null;
      this.profile.reset();
    }
    this.db = this.profile.db;
    this.list = DB.getList(this.db);

    
    if(this.list == null) {
      this.list = [];
      this.selectedItem = "";
      this.loading = true;
    } else {
      this.loading = false;
    }
  
    return m(QList, {
          closeOnSelect: this.closeOnSelect,
          items: this.list,
          itemRender: this.renderItem,
          itemPredicate: this.itemPredicate,
          onSelect: this.handleSelect,
          loading: this.loading,
          popoverAttrs: {
            hasArrow: true,
            position: "auto"
          },
          trigger: m(Button, {
            size: "xl",
            iconRight: Icons.CHEVRON_DOWN,
            sublabel: this.profile.type,
            label: this.profile.id && this.profile.id.substring(0,20),
          })
      })
  }

  private renderItem = (item: string) => m(ListItem, {
    label: item,
    selected: this.profile.id === item,
  })

  private itemPredicate(query: string, item: string) {
    return item.toLowerCase().includes(query.toLowerCase());
  }

  private handleSelect = (item: string) => {
    this.selectedItem = item;
    this.profile.id = item;
    this.profile.load();
    m.route.set("/tab/"+this.profile.type+"/"+this.profile.id)
  }

}
class Home {
  view(vnode: any) {
    return m("h1", "Home")
  }
}

var sitemdb;
var sitem = document.cookie && JSON.parse(document.cookie);

var type_map = {
  "instructor": "instructors",
  "course": "courses",
  "room": "rooms"
}

var last_selected_id = {
}

class Profile {
  active: string = "p";
  loading: boolean = false;
  type: string;
  db: string;
  id: string;
  item: any;

  view(vnode: any) {
    this.type = m.route.param("type");
    if(this.type=="home") {
      return m("h1", "Home")
    } 
    
    var tdb = type_map[this.type];
    var id = m.route.param("id")
    if(this.db != tdb || this.id != id) {
      this.reset();
    }
    this.db = tdb;
    this.id = id;
    
    if(!this.id && last_selected_id[this.type]){
      this.id = last_selected_id[this.type];
      m.route.set("/tab/"+this.type+"/"+this.id)

    }
    if(this.id) {
      this.item = DB.getItem(this.db, this.id);
      last_selected_id[this.type] = this.id;
    }

    
    var props = m("div");
    if(this.item) {
      props = m(Properties, {type:this.type, selectedItem: this.item})
    }
    return m(".profile",[
      m(".profile-top", [
        m(Configurator, {profile: this}), 
        m(Button, {label: "Save", onclick: ()=>this.save(), class: "profile-top-right", size: "xl"})
      ]),
      props
    ])
  }

  load() {
    this.item = DB.getItem(this.db, this.id);
  }

  reset() {
    this.id = null;
    this.item = null;
  }

  save() {
    if(this.item) {
      DB.putitem(this.db, this.item);
    }
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
  }), 'ICRAS'], Profile, {type: "home"}),
  new Tab('Instructors',Profile, {type:"instructor", db: "instructors"}),
  new Tab('Courses',Profile, {type:"course", db: "courses"}),
  new Tab('Rooms', Profile, {type:"room", db: "rooms"})
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
        size: "lg",
        class: "topnav-tabs"
      }, [
        tabs.map(item => m(TabItem, {
            label: item.tabobj,
            active: this.active === item.tabobj,
            loading: item.tabobj === 'Projects' && this.isLoading,
            onclick: m.route.link,
            align: "center",
            class: "topnav-tab",
            href: "/tab/" + item.attrs.type + "/",
            oncreate: m.route.link
          }))
        ])
    ]);
  }
};

class App {
  view(vnode: any) {
    return m('div', [m(Header),  m(Body.bodyobj, Body.attrs), 
      m(AppToaster, {
      clearOnEscapeKey: true,
      position: "top-end"
    })
  ]);
  }
}


m.route(document.getElementById("root"), "/tab/home", {
  "/tab/:type": App,
  "/tab/:type/:id": App
})

