import m from 'mithril';
import { Toaster, Icons } from 'construct-ui';

export interface IListLabel {
    _id : string;
}


export const AppToaster = new Toaster();
export class DBUtil {
    lists : any = {};
    items : any = {};
    loading : any = {};
    constructor() {
    }

    loadList(db : string) {
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
            m.redraw();
        }).catch((error) => {
            console.error(error);
            this.loading[url] = false;
        })

        this.loading[url] = true;
    }

    getList(db : string) {
        if(!this.lists[db]) {
            this.loadList(db);
        }
        return this.lists[db];
    }

    loadItem(db: string, id: string) {
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
            m.redraw();
        }).catch((error) => {
            console.error(error);
            this.loading[url] = false;
        })

        this.loading[url] = true;
    }

    getItem(db: string, id: string) {
        if(id == null) {
            return null;
        }
        if(!this.items[db]) {
            this.items[db] = {};
        }
        if(!this.items[db][id]) {
            this.loadItem(db, id);
        }
        return this.items[db][id];
    }

    putitem(db: string, item: any) {
        var url = "/db/" + db +"/"+item._id;
        m.request({
            method: "PUT",
            url: url,
            data: item,
        }).then((done)=>{
            AppToaster.show({
                message: `Save Successful`,
                icon: Icons.SAVE,
                timeout: 1000,
              });
        }).catch((error) => {
            console.error(error);
            this.loading[url] = false;
        })
    }
}

export var DB = new DBUtil()