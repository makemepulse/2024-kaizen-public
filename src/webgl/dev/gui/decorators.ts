/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NumberInputParams } from "tweakpane";
import gui from "."
import { Control, Gui as GuiApi } from "./api";


type GuiOpts = {
  label?:string
  folder?:string
}

type PropertyDecoratorFunction = (target:any, propertyKey:string, opts?:GuiOpts)=>void
type MethodDecoratorFunction = (target:any, propertyKey:string, descriptor:any, opts?:GuiOpts)=>void

type GuiCreationFunction = (target:any, propertyKey:string, opts?:GuiOpts)=>Control<any>

type GuiCreationCommand = {
  propertyKey:string
  creationFunction: GuiCreationFunction
}



/// #if DEBUG

import "reflect-metadata"

/**
 * store all gui configured for given class properties (using @Gui )
 */
const guisMetadataKey = Symbol("guis");

/**
 * store the folder name configured for a given class (using @GuiFolder )
 */
const guisFolderKey = Symbol("guis-foldername");

/**
 * property added to instance to strore all Gui Controls created for an instance
 */
const guisTargetKey = Symbol("tguis");

/**
 * add gui creation command to a class proptotype metadatas
 */
function addGui(target:any, propertyKey:string, creationFunction: GuiCreationFunction ): void {
  const guis: GuiCreationCommand[] = Reflect.getOwnMetadata(guisMetadataKey, target) || [];
  guis.push({propertyKey, creationFunction});
  Reflect.defineMetadata( guisMetadataKey, guis, target);
}

/// #endif



function getFolder( targetInst : any, opts?:GuiOpts ): GuiApi {
    /// #if DEBUG
  let id = Reflect.getOwnMetadata(guisFolderKey, targetInst.constructor) || '';
  if( opts && opts.folder){
    if( id !== '' ) id += '/'
    id += opts.folder
  }
  return gui.folder( id )
  /// #else
  return gui
  /// #endif
}


function createDecoratorWithInitFunction( fn: GuiCreationFunction ){
  /// #if DEBUG
  return (target:any, propertyKey:string):void=>{
    addGui( target, propertyKey, fn )
  }
  /// #else
  return ()=>{0}
  /// #endif
}




function ArglessPropertyDecorator(fn: GuiCreationFunction, targetOrOpts?:any, name?:any): PropertyDecoratorFunction|void {
  const f = createDecoratorWithInitFunction( (_target:any, _propertyKey:string):Control<any>=>{
    return fn(_target, _propertyKey, targetOrOpts )
  })

  if( targetOrOpts !== undefined && name !== undefined )
    f(targetOrOpts, name)
  else 
    return f
}



export function RangeGui( min:number, max: number, opts?:GuiOpts & NumberInputParams ){
  return createDecoratorWithInitFunction( (target:any, propertyKey:string)=>{
    const ctrl = getFolder(target, opts).add(target, propertyKey, {min, max , ...opts} )
    if( opts?.label ) ctrl.setLabel( opts.label )
    return ctrl
  })
}



export function ColorGui(target:any, name:any):void;
export function ColorGui(opts?:GuiOpts): PropertyDecoratorFunction;

export function ColorGui(target?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts)=>{
    const ctrl = getFolder(_target, opts).addColor(_target, _propertyKey )
    if( opts?.label ) ctrl.setLabel( opts.label )
    return ctrl
  }, target, name )
}


export function Monitor(target:any, name:any):void;
export function Monitor(opts?:GuiOpts): PropertyDecoratorFunction;

export function Monitor(target?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts)=>{
    const ctrl = getFolder(_target, opts).monitor(_target, _propertyKey )
    if( opts?.label ) ctrl.setLabel( opts.label )
    return ctrl
  }, target, name )
}



export function Gui(target:any, name:any):void;
export function Gui(opts?:GuiOpts): PropertyDecoratorFunction;

export function Gui(targetOrOpts?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts)=>{
    return getFolder(_target, opts).add(_target, _propertyKey, opts )
  }, targetOrOpts, name )
}



export function GuiBtn(target:any, name:any, descriptor:any):void;
export function GuiBtn(opts?:GuiOpts): MethodDecoratorFunction;

export function GuiBtn(targetOrOpts?:any, name?:any){

  const f = createDecoratorWithInitFunction((_target:any, _name:any):Control<any>=>{
    let opts : GuiOpts
    if( targetOrOpts !== _target ){
      opts = targetOrOpts
    }
    let name = _name
    if( opts?.label ) name = opts.label
    return getFolder(_target, opts).btn( name, ()=>{
      _target[_name]()
    })
  })

  if( targetOrOpts !== undefined && name !== undefined )
    f(targetOrOpts, name)
  else 
    return f

}




export function GuiFolder(name:string) {
  /// #if DEBUG
  return Reflect.metadata( guisFolderKey, name )
  /// #endif
}


  /// #if DEBUG
  
  export function CreateGui(target:any):GuiApi {
    const guis: GuiCreationCommand[] =  Reflect.getMetadata(guisMetadataKey, target);
    target[guisTargetKey] = guis.map( cmd => cmd.creationFunction(target, cmd.propertyKey) )
    return getFolder(target)
  }
  
  export function DeleteGui(target:any):void {
    const controls: Control<any>[] = target[guisTargetKey]
    if( !controls ) {
      console.warn('[DeleteGui] No gui created for the given target: ', target)
      return
    }
    controls.forEach( ctrl => ctrl.remove() )
  }
  /// #else
  /// #code export function CreateGui(target:any):void {target;}
  /// #code export function DeleteGui(target:any):void {target;}

  /// #endif
