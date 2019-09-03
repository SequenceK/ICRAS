import m, { Vnode } from 'mithril';
import { Dept, DB } from './util';
import {FDeptPointer } from './Component';
import { PForm } from './Form';
import { Button, Form, FormGroup } from 'construct-ui';

var type_map = {
    "instructor": "instructors",
    "course": "courses",
    "room": "rooms"
  }
  
  var last_selected_id = {
}
export class Profile {
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
          this.type = m.route.param("type");
          
          var tdb = type_map[this.type];
          var id = m.route.param("id")
          if(this.db != tdb && this.id != id) {
            this.id = id;
            this.db = tdb;
            this.item = null;
            last_selected_id[this.type] = id;
            this.load();
          }
          this.db = tdb;
          this.id = id;
          
          if(!this.id && last_selected_id[this.type]){
            this.id = last_selected_id[this.type];
            m.route.set("icras/tab/"+this.type+"/"+this.id)
      
          }
          if(this.id) {
            last_selected_id[this.type] = this.id;
          }
          return m("div", [
              m('.btn-group',{role:"group"},[
                  m(FDeptPointer, {ptype:this.getDB(), pid:this.id, value:this.id, vupdate:this.onselect}),
                  m("button", { onclick: ()=>this.openadd(), class:'btn btn-secondary'}, "Add"),
                    m("button", { onclick: ()=>this.remove(), class:'btn btn-secondary'}, "Remove"),
                    m("button", { onclick: ()=>this.opencreate(), class:'btn btn-secondary'}, "Create"),
                    m("button", { onclick: ()=>this.delete(), class:'btn btn-secondary'}, "Delete"),
                    m("button", { onclick: ()=>this.save(), class: "btn btn-primary"}, "Save")
              ]),
              m(PForm,{type:this.type, object:this.item})
          ])


    }
    onselect = (v)=>{
        if(v) {
            this.id=v;
            m.route.set("icras/tab/"+this.type+"/"+this.id);
            this.load();
        }
    }
    load() {
        DB.getItem(this.db, this.id, (obj)=>{
          this.item = obj;
          m.redraw();
        });
      }
    
      reset() {
        
        m.redraw();
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

      getDB() {
          return this.db;
      }
}