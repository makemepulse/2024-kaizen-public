import Input from "nanogl-pbr/Input";

const input: Input = new Input("ScreenSize", 2)
const uniform = input.attachUniform('uscreensize')

const ScreenSize = {

  setSize(w: number, h: number) {
    uniform.set(w, h)
  },

  get input() {
    return input
  }

}

export default ScreenSize