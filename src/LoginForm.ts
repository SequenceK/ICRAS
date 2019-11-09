import m, { Vnode } from 'mithril';
import { Dept, DB, getCookie } from './util';
import { FDBPointer } from './Component';
import { Form, FormGroup, FormLabel, Button } from 'construct-ui';
export class LoginForm {
    departments : string[] = [];
    selectedDept : string = "";

    view(vnode:any) {
        var dep = getCookie("department")
        console.log(dep)
        if(dep) {
        Dept.login(dep)
        }
        return m("form", [
            m(".form-group", [
                m(FormLabel, "Select Department:"),
                m(FDBPointer, {ptype:"departments", class: "btn btn-outline-secondary btn-sm btn-block", vupdate:(v)=>this.selectedDept=v, value: this.selectedDept, pid: this.selectedDept,})
            ]),
            m(Button, {type:"submit", onclick:()=>{this.login()}, label:"Login"}),
        ]);
    }

    select(e: any) {
        this.selectedDept = e.target.value;
    }

    login() {
        Dept.login(this.selectedDept, ()=>{
            m.redraw();
        });
    }
}