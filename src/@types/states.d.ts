type ContextPropsType<T> = {
    [K in keyof T]: T[K]
  }
  
type ContextProps<T> = keyof T