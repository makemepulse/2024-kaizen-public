const PARAMS_LIST = <const>[
  "enable-coming-soon",
]

class UrlParams {

  searchParams: URLSearchParams;

  private params: Map<string, string> = new Map<string, string>();

  constructor() {

    this.searchParams = new URLSearchParams(window.location.search);

    for (const param of PARAMS_LIST) {
      this.params.set(param, this.searchParams.get(param));
    }

  }

  getBool(name: typeof PARAMS_LIST[number]): boolean {
    return this.params.get(name) == "true" || this.params.get(name) == "1";
  }

  getString(name: typeof PARAMS_LIST[number]): string {
    return this.params.get(name);
  }

  getNumber(name: typeof PARAMS_LIST[number]): number {
    return parseFloat(this.params.get(name)) || null;
  }

}

export default new UrlParams();