import m, { Vnode } from 'mithril';
import { DB, Dept, getCookie, eraseCookie } from './util';
import { BuildTabBody } from './buildtab';
import "jsoneditor/dist/jsoneditor.min.css";
import * as JSE from 'jsoneditor/dist/jsoneditor.min.js';
import readme from './readme.md';

// class Configurator {
//   private list : string[];
//   private selectedItem: string;
//   private closeOnSelect = true;
//   private header = false;
//   private footer = false;
//   private loading = false;
//   private db : string;
//   private profile: Profile;

//   public view(vnode: any) {
//     this.profile = vnode.attrs.profile;

//     if(this.profile.db != this.db) {
//       this.selectedItem = null;
//       this.profile.reset();
//     }
//     this.db = this.profile.db;
//     this.list = Dept.getlist(this.db);

    
//     if(this.list == null) {
//       this.list = [];
//       this.selectedItem = "";
//       this.loading = true;
//     } else {
//       this.loading = false;
//     }
  
//     return m(QList, {
//           closeOnSelect: this.closeOnSelect,
//           items: this.list,
//           itemRender: this.renderItem,
//           itemPredicate: this.itemPredicate,
//           onSelect: this.handleSelect,
//           loading: this.loading,
//           popoverAttrs: {
//             hasArrow: true,
//             position: "auto"
//           },
//           trigger: m(Button, {
//             size: "xl",
//             iconRight: Icons.CHEVRON_DOWN,
//             sublabel: this.profile.type,
//             label: this.profile.id && this.profile.id.substring(0,20),
//           })
//       })
//   }

//   private renderItem = (item: string) => m(ListItem, {
//     label: item,
//     selected: this.profile.id === item,
//   })

//   private itemPredicate(query: string, item: string) {
//     return item.toLowerCase().includes(query.toLowerCase());
//   }

//   private handleSelect = (item: string) => {
//     this.selectedItem = item;
//     this.profile.id = item;
//     this.profile.load();
//     m.route.set("icras/tab/"+this.profile.type+"/"+this.profile.id)
//     m.redraw();
//   }

// }
class Home {
  view(vnode: any) {
    return m("p.text-justify", [
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

  
    return m(".profile",[
      m(".profile-top", [
        m("button", {profile: this}),
        m("button", {label: "Add", onclick: ()=>this.openadd(), size: "xl"}),
        m("button", {label: "Remove", onclick: ()=>this.remove(), size: "xl"}),
        m("button", {label: "Create", onclick: ()=>this.opencreate(), size: "xl"}),
        m("button", {label: "Delete", onclick: ()=>this.delete(), size: "xl"}),
        m("button", {label: "Save", onclick: ()=>this.save(), class: "profile-top-right", size: "xl"})
      ]),
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
      DB.saveCached(()=>{
        //pstate.changed = false;
      });
    
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
  new Tab('ICRAS', Home, {type: "home", href: "icras/home/"}),
  new Tab('Instructors',Profile, {type:"instructor", db: "instructors", href: "icras/tab/instructor/"}),
  new Tab('Courses',Profile, {type:"course", db: "courses", href: "icras/tab/course/"}),
  new Tab('Rooms', Profile, {type:"room", db: "rooms", href: "icras/tab/room/"}),
  new Tab('Build', Profile, {href: "icras/build/"}),
  new Tab('Configure', Profile, {href: "icras/configure/"}),
  new Tab('Logout', Profile, {href: "icras/logout"})
];

var Body = tabs[0]
class Header {
  private active: string | any[] = 'ICRAS';
  private isLoading: boolean = false;

  view(vnode: any) {
    this.active = m.route.param("page");
    return m('nav.UnderlineNav', m('.UnderlineNav-body',
        tabs.map(item => m("a", {
            label: item.tabobj,
            active: this.active === item.tabobj,
            loading: item.tabobj === 'Projects' && this.isLoading,
            onclick: m.route.link,
            align: "center",
            class: this.active === item.tabobj? "UnderlineNav-item selected" : "UnderlineNav-item",
            href: item.attrs.href,
            oncreate: m.route.link
          }, item.tabobj)))
    );
  }
};



class ConfigureParams {
  typesEditor : any;

  oncreate(vnode:any) {
    if(!Dept.types) {
      return ""
    }
    this.typesEditor = new JSE.default(vnode.dom, {mode: 'code', enableSort: false, sortObjectKeys: false})
    this.typesEditor.set(Dept.types)
  }
  onupdate(vnode) {
    if(!this.typesEditor && Dept.types) {
      this.typesEditor = new JSE.default(vnode.dom, {mode: 'code', enableSort: false, sortObjectKeys: false})
      this.typesEditor.set(Dept.types)
    }
  }
  view(vnode : any) {
    if(!Dept.types) {
      return ""
    }
    return m(".profile",[
      m(".profile-top", [
        m("button", {label:"Save", size:"xl", onclick: ()=>this.save()})
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
      case "build":
        body = m(BuildTabBody)
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
    return m("div", [m(Header), m('.container', body) 
    //m(SaveDialog)
  ]);
  }

  
}


m.route(document.getElementById("root"), "icras/home", {
  "icras/:page": App,
  "icras/:page/:type": App,
  "icras/:page/:type/:id": App
})

