import 'construct-ui/lib/index.css'
import './scss/custom.scss'
import m, { Vnode } from 'mithril';
import { DB, Dept, getCookie, eraseCookie, OverlayWindow } from './util';
import { BuildTabBody } from './buildtab';
import readme from './readme.md';
import { LoginForm } from './LoginForm';
import { Profile } from "./Profile";
import { Header } from './Header';

class Home {
  view(vnode: any) {
    return m(".container.content", [
      m.trust(readme)
    ])
  }
}


class ConfigureParams {
  typesEditor : any;

  view(vnode : any) {
    if(!Dept.types) {
      return ""
    }
    return m(".profile",[
      m(".profile-top", [
        m("button", {onclick: ()=>this.save()}, "Save")
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
  
    return m("div", [m(Header), m('.container-fluid', body), 
    m(OverlayWindow, {isOpen: !Dept.isLoggedIn, content:m(LoginForm), title:m("h4","Login")}),
  ]);
  }

  
}


m.route(document.getElementById("root"), "icras/home", {
  "icras/:page": App,
  "icras/:page/:type": App,
  "icras/:page/:type/:id": App
})

