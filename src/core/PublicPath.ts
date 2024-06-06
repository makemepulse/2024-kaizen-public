
export default function PublicPath( path:string ):string{
  if( path.startsWith("/") ){
    path = path.substring(1);
  }
  return __webpack_public_path__ + path;
}

export function AssetsPath( path:string ):string {
  return PublicPath( "assets/" + path );
}