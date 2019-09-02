import m from 'mithril';

export interface IListLabel {
    _id : string;
}


export function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
export function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
export function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}

export class DBUtil {
    lists : any = {};
    items : any = {};
    loading : any = {};
    constructor() {
    }

    update() {
        this.lists = {};
    }

    loadList(db : string, callback : any = null) {
        var url = "/db/all/" + db;
        if(this.loading[url]) {
            return;
        }

        m.request({
            method: "GET",
            url: "/db/all/" + db,
        }).then((result)=> {
            this.lists[db] = result;
            this.loading[url] = false;
            if(callback)
                callback(this.lists[db])
            m.redraw();
        }).catch((error) => {
            console.error(error);
            this.loading[url] = false;
        })

        this.loading[url] = true;
    }

    getList(db : string, callback : any = null) {
        if(!this.lists[db]) {
            this.loadList(db, callback);
        } else if(callback) {
            callback(this.lists[db]);
        } else {
            return this.lists[db];
        }
    }

    loadItem(db: string, id: string, callback: any = null) {
        var url = "/db/" + db +"/"+id;
        if(this.loading[url]) {
            return;
        }

        m.request({
            method: "GET",
            url: url,
        }).then((result)=> {
            if(!this.items[db]){
                this.items[db] = {}
            }
            this.items[db][id] = result;
            this.loading[url] = false;
            if(callback)
                callback(this.items[db][id])
            m.redraw();
        }).catch((error) => {
            console.error(error);
            this.loading[url] = false;
        })

        this.loading[url] = true;
    }

    getItem(db: string, id: string, callback : any = null) {
        if(id == null) {
            return null;
        }
        if(!this.items[db]) {
            this.items[db] = {};
        }
        if(!this.items[db][id]) {
            this.loadItem(db, id, callback);
        }
        else if(callback) callback(this.items[db][id])
        else return this.items[db][id]
    }

    putitem(db: string, item: any, callback : any = null) {
        var url = "/db/" + db +"/"+item._id;
        m.request({
            method: "PUT",
            url: url,
            data: item,
        }).then((obj)=>{
            if(callback)
              callback()
        }).catch((error) => {
            console.error(error);
        })
    }

    saveCached(callback: any = null) {
        var count = 0;
        for(var i in this.items) {
            var its = this.items[i]
            for(var j in its) {
                count++;
                this.putitem(i, its[j], ()=>{
                    count--;
                    if(count == 0 && callback) {
                        callback();
                    }
                })
            }
        }
    }
}

class Department {
    isLoggedIn = false;
    obj : any = {};
    types : any;
    constraints: any;

    instructors = []
    courses = []
    rooms = []

    constructor(){
    }

    login(depID, callback=null) {
        DB.getItem("departments", depID, (dep)=>{
            this.obj = dep;
            this.isLoggedIn = true;
            if(!this.obj["db"]) this.obj["db"] = {}
            if(!this.obj["db"]["instructors"]) this.obj["db"]["instructors"] = []
            if(!this.obj["db"]["courses"]) this.obj["db"]["courses"] = []
            if(!this.obj["db"]["rooms"]) this.obj["db"]["rooms"] = []
            this.instructors = this.obj["db"]["instructors"]
            this.courses = this.obj["db"]["courses"]
            this.rooms = this.obj["db"]["rooms"]
            setCookie("department", depID, 1);

            if(!this.types) {
                DB.getItem("icras", "types", (types)=>{
                    this.types = types;
                    if(!this.constraints) {
                        DB.getItem("icras", "constraints", (constraints)=>{
                            this.constraints = constraints;
                            if(callback)
                                callback();
                        })
                    }
                })
            }

            
        })
    }

    getlist(db:string) {
        if(!this.obj["db"]) this.obj["db"] = {}
        if(!this.obj["db"][db]) this.obj["db"][db] = []
        return this.obj["db"][db];
    }

    create(db:string, id:string, callback=null) {
        var objdb = this.obj["db"][db] as string[]
        var found = objdb.find((value, index, obj)=>{return id==value})
        if(found) return;

        objdb.push(id);

        DB.putitem("departments", this.obj, ()=>{
            var obj = {_id: id}
            obj["_"+this.obj["_id"]] = true;
            DB.putitem(db, obj, ()=>{
                if(callback)
                    callback();
            })
        })
        
    }
    remove(db:string, id:string, callback = null) {
        var objdb = this.obj["db"][db] as string[]
        for(var i = 0; i < objdb.length; i++){
            if(id==objdb[i]) {
                objdb.splice(i, 1)
                i--;
            }
        }
        
        DB.putitem("departments", this.obj, ()=>{
                if(callback)
                 callback();
        })
    }
    delete(db:string, item:any, callback = null) {
        item["_deleted"] = true;
        var objdb = this.obj["db"][db] as string[]
        for(var i = 0; i < objdb.length; i++){
            if(item["_id"]==objdb[i]) {
                objdb.splice(i, 1)
                i--;
            }
        }
        
        DB.putitem("departments", this.obj, ()=>{
            DB.putitem(db, item, ()=>{
                if(callback)
                callback();
            })      
        })
    }
}

export var DB = new DBUtil();
export var Dept = new Department();