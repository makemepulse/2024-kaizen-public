import { Activity } from "@webgl/activities/Activity";
import { ActivityFactory, ActivityId } from "@webgl/activities/ActivityRegistry";
import Renderer from "@webgl/Renderer";

export default class SceneActivityManager {

  activities: Map<ActivityId, Activity> = new Map<ActivityId, Activity>();
  _activeList: ActivityId[] = [];

  get active(): Activity[] {
    return this._activeList.map(id => this.activities.get(id));
  }

  constructor(
    public renderer: Renderer
  ) {

  }


  private _assertActivityDoesNotExist(id: ActivityId) {
    if (this.activities.has(id)) {
      throw new Error(`Activity ${id} already exists`);
    }
  }

  private _assertActivityExists(id: ActivityId) {
    if (!this.activities.has(id)) {
      throw new Error(`Activity ${id} does not exist`);
    }
  }

  private _assetNotActive(id: ActivityId) {
    if (this._activeList.includes(id)) {
      throw new Error(`Activity ${id} is already active`);
    }
  }

  async createActivity(id: ActivityId) {
    this._assertActivityDoesNotExist(id);
    const activity = await ActivityFactory.create(id, this.renderer);
    this.activities.set(id, activity);
    return activity;
  }


  loadActivity(id: ActivityId): Promise<void> {
    if (!this.activities.has(id)) {
      this.createActivity(id);
    }
    return this.activities.get(id).load();
  }


  startActivity(id: ActivityId) {
    this._assertActivityExists(id);
    this._assetNotActive(id);

    this._activeList.push(id);

    if (id === "archives") {
      const brushIndex = this._activeList.indexOf("brushes");
      if (brushIndex !== -1) {
        this._activeList.reverse();
      }
    }

    this.activities.get(id).start();
  }

  stopActivity(id: ActivityId) {
    this._assertActivityExists(id);
    this.activities.get(id).stop();
    this._activeList.splice(this._activeList.indexOf(id), 1);
  }

  unloadActivity(id: ActivityId) {
    this._assertActivityExists(id);
    this.activities.get(id).unload();
    this.activities.delete(id);
  }

  getActivity<T extends Activity>(id: ActivityId): T {
    return this.activities.get(id) as T;
  }

}