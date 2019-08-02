import m from 'mithril';
import { Button } from "construct-ui";


export class TimetableBody {

    view(vnode : any) {
      
      var b = m(Button,{
        label: "Build Timetable",
        size: "xl",
        onclick: ()=>{this.generateTT()}
      })
  
      return m(
        ".profile", 
        m(".profile-top", [b])
      )
    }
  
    generateTT() {
        var ws = new WebSocket("ws://" + location.host +"/icras/build")
        ws.onmessage = (msg) => {
            var url = window.URL.createObjectURL(msg.data);
            var a : any= document.createElement("a");
            a.style = "display: none";
            document.body.appendChild(a);
            a.href = url;
            a.download = "timetable.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
        }
    }
  }