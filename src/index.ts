import 'construct-ui/lib/index.css'
import m from 'mithril';
import {
  Button,
  Icons,
  SelectList,
  ListItem,
  Icon,
  Tabs,
  TabItem,
  Overlay,
  Input,
  Card,
} from "construct-ui";
import { Properties as Properties, pstate } from './type_components';
import { DB, AppToaster } from './util';
import { TimetableBody } from './timetable';

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
    pstate.changed = false
    m.route.set("icras/tab/"+this.profile.type+"/"+this.profile.id)
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
  creationOverlay : boolean;
  newid : string;

  view(vnode: any) {
    const style = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100
    };

    const cardStyles = {
      margin: '40px auto'
    };

    const content = m('', { style }, [
      m(Card, { style: cardStyles }, [
        m('h3', 'Enter ID'),
        m(Input, {
          value: this.newid,
          onchange: (e:Event) => {this.newid = (e.target as HTMLInputElement).value;pstate.changed = true;}
        }),
        m("br"),
        m(Button, {
          label: 'Create',
          onclick: () => this.createNew();
        }),
        m(Button, {
          label: 'Close',
          onclick: () => this.creationOverlay = false
        })
      ])
    ]);

    this.type = m.route.param("type");
    
    var tdb = type_map[this.type];
    var id = m.route.param("id")
    if(this.db != tdb || this.id != id) {
      this.reset();
    }
    this.db = tdb;
    this.id = id;
    
    if(!this.id && last_selected_id[this.type]){
      this.id = last_selected_id[this.type];
      m.route.set("icras/tab/"+this.type+"/"+this.id)

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
        m(Button, {label: "Create", onclick: ()=>this.opencreate(), size: "xl"}),
        m(Button, {label: "Delete", onclick: ()=>this.delete(), size: "xl"}),
        m(Button, {label: "Save", onclick: ()=>this.save(), class: "profile-top-right", size: "xl"})
      ]),
      props,
      m(Overlay, {
        isOpen: this.creationOverlay,
        content
      })
    ])
  }

  load() {
    this.item = DB.getItem(this.db, this.id);
  }

  reset() {
    this.id = null;
    this.item = null;
    last_selected_id[this.type] = "";
  }

  save() {
    if(this.item) {
      DB.putitem(this.db, this.item, ()=>{
        AppToaster.show({
          message: `Save Successful`,
          icon: Icons.SAVE,
          timeout: 1000,
        });
      });
    }
  }

  opencreate() {
    this.creationOverlay = true;
  }

  createNew() {
    DB.putitem(this.db, {_id: this.newid}, ()=>{
      DB.update();
      DB.loadList(this.db)
      m.redraw();
    })
    this.creationOverlay = false; 
  }
  
  delete() {
    if(this.item){
      this.item["_deleted"] = true;
      DB.putitem(this.db, this.item, ()=>{
        DB.update();
        this.reset()
        m.route.set("icras/tab/"+this.type)
        DB.loadList(this.db)
        m.redraw();
      })

    }
  }
}




class Tab {
  constructor(public tabobj : any, public bodyobj : any, public attrs: any){}
}

const tabs = [
  new Tab([m(Icon, {
    name: Icons.HOME,
    style: 'margin-right: 5px'
  }), 'ICRAS'], Home, {type: "home", href: "icras/home/"}),
  new Tab('Instructors',Profile, {type:"instructor", db: "instructors", href: "icras/tab/instructor/"}),
  new Tab('Courses',Profile, {type:"course", db: "courses", href: "icras/tab/course/"}),
  new Tab('Rooms', Profile, {type:"room", db: "rooms", href: "icras/tab/room/"}),
  new Tab('Timetable', Profile, {href: "icras/timetable/"})
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
            href: item.attrs.href,
            oncreate: m.route.link
          }))
        ])
    ]);
  }
};

class App {
  view(vnode: any) {
    var page = m.route.param("page");
    var body : any = "Error"
    switch(page) {
      case "tab":
        body = m(Profile)
        break
      case "home":
        body = m(Home)
        break
      case "timetable":
        body = m(TimetableBody)
        break
      default:
        body = "404"
    }
    return m('div', [m(Header), body, 
      m(AppToaster, {
      clearOnEscapeKey: true,
      position: "top-end"
    })
  ]);
  }
}


m.route(document.getElementById("root"), "icras/home", {
  "icras/:page": App,
  "icras/:page/:type": App,
  "icras/:page/:type/:id": App
})

