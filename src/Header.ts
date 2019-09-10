import m, { Vnode } from 'mithril';
import { Tabs, TabItem } from 'construct-ui';

class Tab {
    constructor(public tabobj : any, public attrs: any){}
  }
  
  const tabs = [
    new Tab('ICRAS', {type: "home", href: "icras/home/"}),
    new Tab('Instructors', {type:"instructor", db: "instructors", href: "icras/tab/instructor/"}),
    new Tab('Courses', {type:"course", db: "courses", href: "icras/tab/course/"}),
    new Tab('Rooms', {type:"room", db: "rooms", href: "icras/tab/room/"}),
    new Tab('Build', {href: "icras/build/"}),
    new Tab('Configure', {href: "icras/configure/"}),
    new Tab('Logout', {href: "icras/logout"})
  ];
  
  export class Header {
    private active: string | any[] = 'ICRAS';
    private isLoading: boolean = false;
  
    view(vnode: any) {
    this.active = m.route.param("tab");
      return m('.topnav', {}, [
        m(Tabs, {
          align: "left",
          //fluid: true,
          //bordered: true,
          size: "lg",
          //class: "topnav"
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
  