import m, { Vnode } from 'mithril';
import {FString} from './components/FString';
import { FInt } from './components/FInt';

class UnsupportedType {
    view(vnode:any) {
        return "Unsupported Component Type.";
    }
}

export function getComponent(type) {
    switch(type) {
        case "int":
            return FInt;
        break;
        case "string":
            return FString;
        break;
        case "bool":
            //return FBool;
        break;
        case "time":
            //return FTime;
        break;
        default:
            var lchar = type[type.length-1];
            if( lchar == "]" || lchar == "*") {
                if(lchar == "]") {
                    //return FArray;
                } else {
                    //return FPointer;
                }
            }
        break;
    }

    return UnsupportedType;
}