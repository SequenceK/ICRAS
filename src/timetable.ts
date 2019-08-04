import { Button } from "construct-ui";
import m, { Vnode } from 'mithril';
import { Dept } from './util';
import { saveAs } from 'file-saver';


export class TimetableBody {
  log: any[] = [];

  view(vnode: any) {

    var b = m(Button, {
      label: "Build",
      size: "xl",
      onclick: () => { this.build() }
    })
    var d = m(Button, {
      label: "Download XLSX File",
      size: "xl",
      onclick: () => { this.download() }
    })

    return m(
      ".profile",
      [
        m(".profile-top", [b, d]),
        m(".console-like", this.log.map((str)=>{
            return m.trust(str)
        }))
      ]
    )
  }

  build() {
    this.log = [];
    var ws = new WebSocket("ws://" + location.host + "/icras/build")
    ws.onopen = () => {
      ws.send(Dept.obj["_id"])
    }

    ws.onmessage = (msg) => {
      if (typeof msg.data == "object") {
        saveAs(msg.data, "timetable.xlsx")
      }
      else {
        this.log.push(msg.data);
        m.redraw();
      }
    }
  }

  download() {
    m.request({
      url: "icras/download/"+Dept.obj["_id"],
      method: "GET"
    }).then((data)=>{
      
    }).catch((error)=>{
      console.error(error);
    })
  }
}