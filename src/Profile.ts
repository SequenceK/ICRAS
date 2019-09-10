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

          if(this.db != tdb || this.id != id) {
            this.id = id;
            this.db = tdb;
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
          if(!this.item) {
            this.load();
          }

          return m(".profile", [
              m('.profile-top',{role:"group"},[
                  m(FDeptPointer, {ptype:this.getDB(), pid:this.id, value:this.id, vupdate:this.onselect, class:"btn btn-outline-secondary bg-white"}),
                  m("button", { onclick: ()=>this.openadd(), class:'btn btn-secondary btn-sm'}, "Add"),
                    m("button", { onclick: ()=>this.remove(), class:'btn btn-secondary btn-sm'}, "Remove"),
                    m("button", { onclick: ()=>this.opencreate(), class:'btn btn-secondary btn-sm'}, "Create"),
                    m("button", { onclick: ()=>this.delete(), class:'btn btn-secondary btn-sm'}, "Delete"),
                    m("button", { onclick: ()=>this.save(), class: "btn btn-primary btn-large"}, "Save")
              ]),
              m(PForm,{type:this.type, object:this.item})
          ])


    }
    onselect = (v)=>{
        if(v) {
            m.route.set("icras/tab/"+this.type+"/"+v);
            this.item = DB.getItem(this.db, v);
        }
    }
    load() {
      this.item = DB.getItem(this.db, this.id);
    }
    
      reset() {
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