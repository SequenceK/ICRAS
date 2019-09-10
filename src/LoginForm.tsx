import m, { Vnode } from 'mithril';
import { Dept, DB, getCookie } from './util';
import { FDBPointer } from './Component';
import { Form, FormGroup, FormLabel, Button } from 'construct-ui';
export class LoginForm {
    departments : string[] = [];
    selectedDept : string = "";

    view(vnode:any) {
        var dep = getCookie("department")
        if(dep) {
        Dept.login(dep)
        }
        return m(".field", [
            m("p.control", [
                (<label class="label">Select Department:</label>),
                m(FDBPointer, {ptype:"departments", class: "button is-secondary is-fullwidth", vupdate:(v)=>this.selectedDept=v, value: this.selectedDept, pid: this.selectedDept,})
            ]),
            m("p.control", [
            m("button", {type:"submit", onclick:()=>{this.login()}, class: "button is-primary"}, "Login"),
            ])
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