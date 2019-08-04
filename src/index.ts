import 'construct-ui/lib/index.css'
import m, { Vnode } from 'mithril';
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
import { DB, AppToaster, OverlayWindow, Dept, getCookie, eraseCookie } from './util';
import { TimetableBody } from './timetable';
import "jsoneditor/dist/jsoneditor.min.css";
import * as JSE from 'jsoneditor/dist/jsoneditor.min.js';
import readme from './readme.md';

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
    this.list = Dept.getlist(this.db);

    
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
    m.route.set("icras/tab/"+this.profile.type+"/"+this.profile.id)
    m.redraw();
  }

}
class Home {
  view(vnode: any) {
    return m(".home", [
      m.trust(readme)
    ])
  }
}


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
  addoverlay: boolean;

  view(vnode: any) {
    if(!Dept.isLoggedIn || !Dept.types ||  !Dept.constraints) {
      return "";
    }
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
          onclick: () => this.createNew()
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
        m(Button, {label: "Add", onclick: ()=>this.openadd(), size: "xl"}),
        m(Button, {label: "Remove", onclick: ()=>this.remove(), size: "xl"}),
        m(Button, {label: "Create", onclick: ()=>this.opencreate(), size: "xl"}),
        m(Button, {label: "Delete", onclick: ()=>this.delete(), size: "xl"}),
        m(Button, {label: "Save", onclick: ()=>this.save(), class: "profile-top-right", size: "xl"})
      ]),
      props,
      m(Overlay, {
        isOpen: this.creationOverlay,
        content
      }),
      m(OverlayWindow, {isOpen: this.addoverlay, content: [
        m("h3", "Add"),
        m(Selector, {type: this.type, db: this.db, onselect: (id)=>{
          this.add(id)
        }}),
        m(Button, {label:"cancel", onclick:()=>{this.addoverlay = false;}})
      ]})
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
        pstate.changed = false;
      });
    }
  }

  openadd() {
    this.addoverlay = true;
  }
  opencreate() {
    this.creationOverlay = true;
  }


  remove() {
    if(this.item) {
      Dept.remove(this.db, this.id, ()=>{
        this.reset()
        m.route.set("icras/tab/"+this.type)
        m.redraw();
      })
    }
  }
  add(id) {
    Dept.create(this.db, id, ()=>{
      this.addoverlay = false;
      m.route.set("icras/tab/"+this.type+"/"+id)
      m.redraw();
    })
     
  }
  createNew() {
    Dept.create(this.db, this.newid, ()=>{
      this.creationOverlay = false;
      m.route.set("icras/tab/"+this.type+"/"+this.newid)
      m.redraw();
    })
     
  }
  
  delete() {
    if(this.item){
      Dept.delete(this.db, this.item, ()=>{
        this.reset()
        m.route.set("icras/tab/"+this.type)
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
  new Tab('Timetable', Profile, {href: "icras/timetable/"}),
  new Tab('Configure', Profile, {href: "icras/configure/"}),
  new Tab('Logout', Profile, {href: "icras/logout"})
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

class Selector {
  private list : string[];
  private selectedItem: string;
  private closeOnSelect = true;
  private loading = false;
  private db : string;
  private type : string;
  private onselect: any;
  private initialvalue : any;

  public view(vnode: any) {
    this.type = vnode.attrs.type;
    this.db = vnode.attrs.db;
    this.onselect = vnode.attrs.onselect;

    if(this.initialvalue != null && !this.selectedItem) {
      this.selectedItem = this.initialvalue;
    }

    DB.getList(this.db, (list)=>{
      this.list = list;
    });

    
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
            iconRight: Icons.CHEVRON_DOWN,
            sublabel: this.type,
            label: this.selectedItem && this.selectedItem.substring(0,20),
          })
      })
  }

  private renderItem = (item: string) => m(ListItem, {
    label: item,
    selected: this.selectedItem === item,
  })

  private itemPredicate(query: string, item: string) {
    return item.toLowerCase().includes(query.toLowerCase());
  }

  private handleSelect = (item: string) => {
    this.selectedItem = item;
    this.onselect(item);
  }

}

class Login {
  selectedDep : string;
  view(vnode: any) {
    var dep = getCookie("department")
    if(dep) {
      Dept.login(dep)
    }
    return [
      m("h4", "Select Department"),
      m(Selector, {type:"Department", db: "departments", onselect: (item)=>{this.onselect(item)}}),
      m(Button, {label: "login", onclick: ()=>this.login()})
    ]
  }

  onselect(item) {
    this.selectedDep = item;
  }

  login() {
    Dept.login(this.selectedDep, ()=>{
      this.onlogin();
    })
  }

  onlogin() {

  }
}

class SaveDialog {
  page:string;
  type:string;
  id:string;
  saveDialog:boolean = false;
  view(vnode: any) {
    var page = m.route.param("page");
    var type = m.route.param("type");
    var id = m.route.param("id");
    console.log("ASDFASDF")
    if(pstate.changed) {
      if(page != this.page || type != this.type || id != this.id) {
        this.saveDialog = true;
      }
    } else {
      this.page = page
      this.type = type
      this.id = id
    }
    return [
      m(OverlayWindow, {isOpen: this.saveDialog, content:[
      m("h4", "Save Changes?"),
      m(Button, {label: "Save", onclick: ()=>this.save()}),
      m(Button, {label: "Discard", onclick: ()=>this.discard()}),
    ]})
  ]
  }

  save() {
    DB.putitem(type_map[this.type], DB.getItem(type_map[this.type], this.id), ()=>{
        this.saveDialog = false;
        pstate.changed = false;
    })
  }

  discard() {
    DB.loadItem(type_map[this.type], this.id, ()=>{
      this.saveDialog = false;
      pstate.changed = false;
    })
  }

  cancel() {
    this.saveDialog = false;
    m.route.set("icras/"+this.page+"/"+this.type+"/"+this.id)
  }
}



class ConfigureParams {
  typesEditor : any;

  oncreate(vnode:any) {
    if(!Dept.types) {
      return ""
    }
    this.typesEditor = new JSE.default(vnode.dom, {mode: 'text'})
    this.typesEditor.set(Dept.types)
  }
  onupdate(vnode) {
    if(!this.typesEditor && Dept.types) {
      this.typesEditor = new JSE.default(vnode.dom, {mode: 'text'})
      this.typesEditor.set(Dept.types)
    }
  }
  view(vnode : any) {
    if(!Dept.types) {
      return ""
    }
    return m(".profile",[
      m(".profile-top", [
        m(Button, {label:"Save", size:"xl", onclick: ()=>this.save()})
      ])
    ])
  }

  save() {
    Dept.types = this.typesEditor.get()
    DB.putitem("icras", Dept.types);
  }
}

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
      case "configure":
        body = m(ConfigureParams)
        break
      case "logout":
        eraseCookie("department")
        Dept.isLoggedIn = false;
        m.route.set("icras/home")
        break;
      default:
        body = "404"
    }
    return m('div', [m(Header), body, 
      m(AppToaster, {
      clearOnEscapeKey: true,
      position: "top-end"
    }),
    m(OverlayWindow, {isOpen: !Dept.isLoggedIn && page != "home", content:m(Login)}),
    //m(SaveDialog)
  ]);
  }

  
}


m.route(document.getElementById("root"), "icras/home", {
  "icras/:page": App,
  "icras/:page/:type": App,
  "icras/:page/:type/:id": App
})

