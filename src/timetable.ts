import { Button } from "construct-ui";
import m, { Vnode } from 'mithril';
import { Dept } from './util';
import { saveAs } from 'file-saver';


export class TimetableBody {
  log: string = "";

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
        m(".console-like", m.trust(this.log))
      ]
    )
  }

  build() {
    this.log = "";
    var ws = new WebSocket("ws://" + location.host + "/icras/build")
    ws.onopen = () => {
      ws.send(Dept.obj["_id"])
    }

    ws.onmessage = (msg) => {
        this.log += msg.data;
        m.redraw();
    }
  }

  download() {
    m.request({
      url: "db/timetables/"+Dept.obj["_id"],
      method: "GET"
    }).then((data)=>{
      var byteCharacters = atob(data["blob"]);
      var byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      var myblob = new Blob([byteArray]);
      saveAs(myblob, "timetable.xlsx")
    }).catch((error)=>{
      console.error(error);
    })
  }
}