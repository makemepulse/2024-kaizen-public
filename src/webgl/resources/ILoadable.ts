

export default interface ILoadable<T=unknown> {
  getLoadables() : Promise<T>[]
}